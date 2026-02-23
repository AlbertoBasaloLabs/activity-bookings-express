import assert from 'node:assert/strict';
import { ChildProcess, spawn } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';

const PROJECT_ROOT = path.resolve(__dirname, '..');

type AuthResponse = {
  user: {
    id: number;
    username: string;
    email: string;
    terms: boolean;
  };
  accessToken: string;
};

type ActivityResponse = {
  id: number;
  name: string;
  slug: string;
  price: number;
  date: string;
  duration: number;
  location: string;
  minParticipants: number;
  maxParticipants: number;
  status: string;
  userId: number;
};

type ValidationResponse = {
  message: string;
  errors: Array<{ field: string; message: string }>;
};

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth(port: number, timeoutMs = 10000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // server not ready yet
    }
    await sleep(200);
  }

  throw new Error(`Server did not become healthy on port ${port}`);
}

async function startServer(port: number): Promise<ChildProcess> {
  const child = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
    cwd: PROJECT_ROOT,
    env: {
      ...process.env,
      PORT: String(port),
      SECURITY_MODE: 'secured',
    },
    shell: false,
    stdio: 'pipe',
  });

  child.stdout?.on('data', () => {
    // keep stream consumed
  });
  child.stderr?.on('data', () => {
    // keep stream consumed
  });

  await waitForHealth(port);
  return child;
}

async function stopServer(child: ChildProcess | undefined): Promise<void> {
  if (!child || child.exitCode !== null) {
    return;
  }

  child.kill('SIGTERM');

  await new Promise<void>((resolve) => {
    let resolved = false;
    let timeoutId: NodeJS.Timeout;

    const resolveOnce = () => {
      if (resolved) {
        return;
      }
      resolved = true;
      clearTimeout(timeoutId);
      resolve();
    };

    child.once('exit', () => resolveOnce());

    timeoutId = setTimeout(() => {
      if (child.exitCode === null) {
        child.kill('SIGKILL');
      }
      resolveOnce();
    }, 3000);
  });
}

async function assertStatus(response: Response, expected: number, context: string): Promise<void> {
  if (response.status === expected) {
    return;
  }

  const responseBody = await response.clone().text();
  assert.fail(`${context}: expected ${expected}, got ${response.status}. Body: ${responseBody}`);
}

function authHeaders(token?: string): Record<string, string> {
  return token
    ? { 'content-type': 'application/json', authorization: `Bearer ${token}` }
    : { 'content-type': 'application/json' };
}

async function registerUser(port: number, suffix: string): Promise<AuthResponse> {
  const registerResponse = await fetch(`http://127.0.0.1:${port}/users`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      username: `put-user-${suffix}`,
      email: `put-user-${suffix}@example.com`,
      password: 'abc12345',
      terms: true,
    }),
  });

  await assertStatus(registerResponse, 201, 'POST /users');
  return (await registerResponse.json()) as AuthResponse;
}

async function createActivity(port: number, token: string, suffix: string): Promise<ActivityResponse> {
  const createActivityResponse = await fetch(`http://127.0.0.1:${port}/activities`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      name: `PUT Compatibility Activity ${suffix}`,
      price: 55,
      date: '2030-01-20T10:00:00.000Z',
      duration: 75,
      location: `Compatibility Location ${suffix}`,
      minParticipants: 2,
      maxParticipants: 8,
      status: 'draft',
    }),
  });

  await assertStatus(createActivityResponse, 201, 'POST /activities');
  return (await createActivityResponse.json()) as ActivityResponse;
}

async function setupUserAndActivity(port: number, suffix: string): Promise<{
  user: AuthResponse;
  activity: ActivityResponse;
}> {
  const user = await registerUser(port, suffix);
  const activity = await createActivity(port, user.accessToken, suffix);
  return { user, activity };
}

async function putActivity(
  port: number,
  activityId: number,
  body: Record<string, unknown>,
  token?: string
): Promise<Response> {
  return fetch(`http://127.0.0.1:${port}/activities/${activityId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
}

test('PUT accepts partial fields and preserves omitted values', async () => {
  const port = 3130;
  let server: ChildProcess | undefined;

  try {
    server = await startServer(port);
    const { user, activity } = await setupUserAndActivity(port, `${Date.now()}-partial`);

    const updateResponse = await putActivity(
      port,
      activity.id,
      {
        price: 99,
      },
      user.accessToken
    );

    await assertStatus(updateResponse, 200, 'PUT /activities/:id partial');
    const updated = (await updateResponse.json()) as ActivityResponse;

    assert.equal(updated.price, 99);
    assert.equal(updated.name, activity.name);
    assert.equal(updated.location, activity.location);
    assert.equal(updated.minParticipants, activity.minParticipants);
    assert.equal(updated.maxParticipants, activity.maxParticipants);
    assert.equal(updated.status, activity.status);
  } finally {
    await stopServer(server);
  }
});

test('PUT allows valid status transition when status is provided', async () => {
  const port = 3131;
  let server: ChildProcess | undefined;

  try {
    server = await startServer(port);
    const { user, activity } = await setupUserAndActivity(port, `${Date.now()}-valid-status`);

    const updateResponse = await putActivity(
      port,
      activity.id,
      {
        status: 'published',
      },
      user.accessToken
    );

    await assertStatus(updateResponse, 200, 'PUT /activities/:id valid status transition');
    const updated = (await updateResponse.json()) as ActivityResponse;
    assert.equal(updated.status, 'published');
  } finally {
    await stopServer(server);
  }
});

test('PUT rejects invalid status transition with validation errors', async () => {
  const port = 3132;
  let server: ChildProcess | undefined;

  try {
    server = await startServer(port);
    const { user, activity } = await setupUserAndActivity(port, `${Date.now()}-invalid-status`);

    const updateResponse = await putActivity(
      port,
      activity.id,
      {
        status: 'done',
      },
      user.accessToken
    );

    await assertStatus(updateResponse, 400, 'PUT /activities/:id invalid status transition');
    const body = (await updateResponse.json()) as ValidationResponse;

    assert.equal(body.message, 'Validation failed');
    assert.equal(body.errors.some((error) => error.field === 'status'), true);
    assert.equal(
      body.errors.some((error) => error.message.includes('Invalid status transition')),
      true
    );
  } finally {
    await stopServer(server);
  }
});

test('PUT returns 400 for invalid provided fields', async () => {
  const port = 3133;
  let server: ChildProcess | undefined;

  try {
    server = await startServer(port);
    const { user, activity } = await setupUserAndActivity(port, `${Date.now()}-invalid-fields`);

    const updateResponse = await putActivity(
      port,
      activity.id,
      {
        price: -1,
      },
      user.accessToken
    );

    await assertStatus(updateResponse, 400, 'PUT /activities/:id invalid field value');
    const body = (await updateResponse.json()) as ValidationResponse;

    assert.equal(body.message, 'Validation failed');
    assert.equal(body.errors.some((error) => error.field === 'price'), true);
  } finally {
    await stopServer(server);
  }
});

test('PUT returns 400 for invalid status value', async () => {
  const port = 3135;
  let server: ChildProcess | undefined;

  try {
    server = await startServer(port);
    const { user, activity } = await setupUserAndActivity(port, `${Date.now()}-invalid-status-value`);

    const updateResponse = await putActivity(
      port,
      activity.id,
      {
        status: 'not-a-valid-status',
      },
      user.accessToken
    );

    await assertStatus(updateResponse, 400, 'PUT /activities/:id invalid status value');
    const body = (await updateResponse.json()) as ValidationResponse;

    assert.equal(body.message, 'Validation failed');
    assert.equal(body.errors.some((error) => error.field === 'status'), true);
    assert.equal(body.errors.some((error) => error.message.includes('Status must be one of:')), true);
  } finally {
    await stopServer(server);
  }
});

test('PATCH status endpoint remains available and compatible', async () => {
  const port = 3136;
  let server: ChildProcess | undefined;

  try {
    server = await startServer(port);
    const { user, activity } = await setupUserAndActivity(port, `${Date.now()}-patch-compat`);

    const patchResponse = await fetch(`http://127.0.0.1:${port}/activities/${activity.id}/status`, {
      method: 'PATCH',
      headers: authHeaders(user.accessToken),
      body: JSON.stringify({
        status: 'published',
      }),
    });

    await assertStatus(patchResponse, 200, 'PATCH /activities/:id/status remains available');
    const updated = (await patchResponse.json()) as ActivityResponse;
    assert.equal(updated.status, 'published');
  } finally {
    await stopServer(server);
  }
});

test('PUT preserves auth and not-found behavior (401/403/404)', async () => {
  const port = 3134;
  let server: ChildProcess | undefined;

  try {
    server = await startServer(port);
    const owner = await registerUser(port, `${Date.now()}-owner`);
    const otherUser = await registerUser(port, `${Date.now()}-other`);
    const created = await createActivity(port, owner.accessToken, `${Date.now()}-ownership`);

    const unauthenticatedResponse = await putActivity(port, created.id, { price: 60 });
    await assertStatus(unauthenticatedResponse, 401, 'PUT /activities/:id without token');

    const forbiddenResponse = await putActivity(port, created.id, { price: 61 }, otherUser.accessToken);
    await assertStatus(forbiddenResponse, 403, 'PUT /activities/:id from non-owner');

    const notFoundResponse = await putActivity(port, 999999, { price: 62 }, owner.accessToken);
    await assertStatus(notFoundResponse, 404, 'PUT /activities/:id non-existent');
  } finally {
    await stopServer(server);
  }
});
