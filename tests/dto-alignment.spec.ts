import assert from 'node:assert/strict';
import { ChildProcess, spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const USERS_DB_PATH = path.resolve(PROJECT_ROOT, 'db/users.json');

type SecurityMode = 'secured' | 'open';

type PersistedUser = {
  email: string;
  password: string;
};

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

type BookingResponse = {
  id: number;
  activityId: number;
  userId: number;
  date: string;
  participants: number;
  payment?: {
    method: string;
    amount: number;
    status: string;
  };
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

async function startServer(port: number, securityMode: SecurityMode): Promise<ChildProcess> {
  const child = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
    cwd: PROJECT_ROOT,
    env: {
      ...process.env,
      PORT: String(port),
      SECURITY_MODE: securityMode,
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

async function getFirstPersistedUserCredentials(): Promise<PersistedUser> {
  const content = await readFile(USERS_DB_PATH, 'utf-8');
  const users = JSON.parse(content) as Array<{ email?: unknown; password?: unknown }>;

  if (users.length === 0) {
    throw new Error('No persisted users found in db/users.json for login test');
  }

  const firstUser = users[0];
  if (typeof firstUser.email !== 'string' || typeof firstUser.password !== 'string') {
    throw new Error('First persisted user is missing email/password');
  }

  return {
    email: firstUser.email,
    password: firstUser.password,
  };
}

function assertAuthDtoShape(payload: AuthResponse): void {
  assert.equal(typeof payload.accessToken, 'string');
  assert.equal(typeof payload.user.id, 'number');
  assert.equal(typeof payload.user.username, 'string');
  assert.equal(typeof payload.user.email, 'string');
  assert.equal(typeof payload.user.terms, 'boolean');
}

function assertActivityDtoShape(activity: ActivityResponse): void {
  assert.equal(typeof activity.id, 'number');
  assert.equal(typeof activity.name, 'string');
  assert.equal(typeof activity.slug, 'string');
  assert.equal(typeof activity.price, 'number');
  assert.equal(typeof activity.date, 'string');
  assert.equal(typeof activity.duration, 'number');
  assert.equal(typeof activity.location, 'string');
  assert.equal(typeof activity.minParticipants, 'number');
  assert.equal(typeof activity.maxParticipants, 'number');
  assert.equal(typeof activity.status, 'string');
  assert.equal(typeof activity.userId, 'number');
}

function assertBookingDtoShape(booking: BookingResponse): void {
  assert.equal(typeof booking.id, 'number');
  assert.equal(typeof booking.activityId, 'number');
  assert.equal(typeof booking.userId, 'number');
  assert.equal(typeof booking.date, 'string');
  assert.equal(typeof booking.participants, 'number');

  assert.equal(typeof booking.payment, 'object');
  assert.notEqual(booking.payment, undefined);

  const payment = booking.payment as NonNullable<BookingResponse['payment']>;
  assert.equal(typeof payment.method, 'string');
  assert.equal(typeof payment.amount, 'number');
  assert.equal(typeof payment.status, 'string');

  const validMethods = new Set(['none', 'cash', 'creditCard', 'paypal']);
  const validStatuses = new Set(['none', 'pending', 'paid', 'refunded']);

  assert.equal(validMethods.has(payment.method), true);
  assert.equal(validStatuses.has(payment.status), true);
}

test('secured mode returns client-compatible DTOs for auth, activities, and bookings', async () => {
  const port = 3120;
  let server: ChildProcess | undefined;

  try {
    server = await startServer(port, 'secured');

    const persistedUser = await getFirstPersistedUserCredentials();

    const loginResponse = await fetch(`http://127.0.0.1:${port}/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: persistedUser.email,
        password: persistedUser.password,
      }),
    });

    await assertStatus(loginResponse, 200, 'POST /login');
    const loggedIn = (await loginResponse.json()) as AuthResponse;
    assertAuthDtoShape(loggedIn);

    const registerEmail = `dto-alignment-${Date.now()}@example.com`;
    const registerResponse = await fetch(`http://127.0.0.1:${port}/users`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        username: 'Dto Tester',
        email: registerEmail,
        password: 'abc12345',
        terms: true,
      }),
    });

    await assertStatus(registerResponse, 201, 'POST /users');
    const registered = (await registerResponse.json()) as AuthResponse;
    assertAuthDtoShape(registered);

    const token = registered.accessToken;

    const createActivityResponse = await fetch(`http://127.0.0.1:${port}/activities`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: `DTO Contract Activity ${Date.now()}`,
        price: 55,
        date: '2030-01-20T10:00:00.000Z',
        duration: 75,
        location: 'Contract Test Location',
        minParticipants: 2,
        maxParticipants: 8,
      }),
    });

    await assertStatus(createActivityResponse, 201, 'POST /activities');
    const createdActivity = (await createActivityResponse.json()) as ActivityResponse;
    assertActivityDtoShape(createdActivity);

    const listActivitiesResponse = await fetch(`http://127.0.0.1:${port}/activities`);
    await assertStatus(listActivitiesResponse, 200, 'GET /activities');

    const activities = (await listActivitiesResponse.json()) as ActivityResponse[];
    assert.equal(Array.isArray(activities), true);
    assert.notEqual(activities.length, 0);
    assertActivityDtoShape(activities[0]);

    const getActivityResponse = await fetch(
      `http://127.0.0.1:${port}/activities/${createdActivity.id}`
    );
    await assertStatus(getActivityResponse, 200, 'GET /activities/:id');

    const activityById = (await getActivityResponse.json()) as ActivityResponse;
    assertActivityDtoShape(activityById);
    assert.equal(activityById.id, createdActivity.id);

    const createBookingResponse = await fetch(`http://127.0.0.1:${port}/bookings`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        activityId: createdActivity.id,
        participants: 2,
      }),
    });

    await assertStatus(createBookingResponse, 201, 'POST /bookings');
    const createdBooking = (await createBookingResponse.json()) as BookingResponse;
    assertBookingDtoShape(createdBooking);
    assert.equal(createdBooking.activityId, createdActivity.id);

    const listBookingsResponse = await fetch(`http://127.0.0.1:${port}/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    await assertStatus(listBookingsResponse, 200, 'GET /bookings');
    const bookings = (await listBookingsResponse.json()) as BookingResponse[];
    assert.equal(Array.isArray(bookings), true);
    assert.notEqual(bookings.length, 0);
    assertBookingDtoShape(bookings[0]);

    const getBookingResponse = await fetch(
      `http://127.0.0.1:${port}/bookings/${createdBooking.id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    await assertStatus(getBookingResponse, 200, 'GET /bookings/:id');
    const bookingById = (await getBookingResponse.json()) as BookingResponse;
    assertBookingDtoShape(bookingById);
    assert.equal(bookingById.id, createdBooking.id);
  } finally {
    await stopServer(server);
  }
});

test('open mode preserves booking DTO shape without auth token', async () => {
  const port = 3121;
  let server: ChildProcess | undefined;

  try {
    server = await startServer(port, 'open');

    const listActivitiesResponse = await fetch(`http://127.0.0.1:${port}/activities`);
    await assertStatus(listActivitiesResponse, 200, 'GET /activities (open)');
    const activities = (await listActivitiesResponse.json()) as ActivityResponse[];

    assert.equal(Array.isArray(activities), true);
    assert.notEqual(activities.length, 0);

    const activity = activities[0];

    const createBookingResponse = await fetch(`http://127.0.0.1:${port}/bookings`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        activityId: activity.id,
        participants: 1,
      }),
    });

    await assertStatus(createBookingResponse, 201, 'POST /bookings (open)');
    const createdBooking = (await createBookingResponse.json()) as BookingResponse;
    assertBookingDtoShape(createdBooking);

    const getBookingResponse = await fetch(
      `http://127.0.0.1:${port}/bookings/${createdBooking.id}`
    );

    await assertStatus(getBookingResponse, 200, 'GET /bookings/:id (open)');
    const bookingById = (await getBookingResponse.json()) as BookingResponse;
    assertBookingDtoShape(bookingById);
  } finally {
    await stopServer(server);
  }
});
