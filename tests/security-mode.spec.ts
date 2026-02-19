import assert from 'node:assert/strict';
import { ChildProcess, spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const USERS_DB_PATH = path.resolve(PROJECT_ROOT, 'db/users.json');

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function startServer(params: { port: number; securityMode: 'secured' | 'open' }): Promise<ChildProcess> {
  const child = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
    cwd: PROJECT_ROOT,
    env: {
      ...process.env,
      PORT: String(params.port),
      SECURITY_MODE: params.securityMode,
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

  await waitForHealth(params.port);
  return child;
}

async function stopServer(child: ChildProcess | undefined): Promise<void> {
  if (!child) {
    return;
  }

  if (child.exitCode !== null) {
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

test('secured mode requires token for protected endpoints', async () => {
  const port = 3110;
  let server: ChildProcess | undefined;

  try {
    server = await startServer({ port, securityMode: 'secured' });
    const response = await fetch(`http://127.0.0.1:${port}/bookings`);

    assert.equal(response.status, 401);
    const body = (await response.json()) as { message?: string };
    assert.equal(typeof body.message, 'string');
  } finally {
    await stopServer(server);
  }
});

test('open mode allows protected endpoint without token', async () => {
  const port = 3111;
  let server: ChildProcess | undefined;

  try {
    server = await startServer({ port, securityMode: 'open' });
    const response = await fetch(`http://127.0.0.1:${port}/bookings`);

    assert.equal(response.status, 200);
    const body = (await response.json()) as unknown;
    assert.equal(Array.isArray(body), true);
  } finally {
    await stopServer(server);
  }
});

test('open mode startup fails when users store is empty', async () => {
  const originalUsers = await readFile(USERS_DB_PATH, 'utf-8');

  try {
    await writeFile(USERS_DB_PATH, '[]\n', 'utf-8');

    const child = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
      cwd: PROJECT_ROOT,
      env: {
        ...process.env,
        PORT: '3112',
        SECURITY_MODE: 'open',
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

    const exitCode = await new Promise<number | null>((resolve) => {
      let settled = false;
      let timeoutId: NodeJS.Timeout;
      const settle = (value: number | null) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeoutId);
        resolve(value);
      };

      child.once('exit', (code) => settle(code));

      timeoutId = setTimeout(() => {
        if (child.exitCode === null) {
          child.kill('SIGTERM');
          child.kill('SIGKILL');
        }
        settle(child.exitCode);
      }, 5000);
    });

    assert.notEqual(exitCode, 0);
  } finally {
    await writeFile(USERS_DB_PATH, originalUsers, 'utf-8');
  }
});
