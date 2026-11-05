import test from 'node:test';
import assert from 'node:assert/strict';

import { createApp } from '../src/http/app.js';

let server;
let baseUrl;

test.before(async () => {
  server = createApp();

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
});

test('GET /health returns a successful health response', async () => {
  const response = await fetch(`${baseUrl}/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('malformed JSON returns a 400 INVALID_JSON response', async () => {
  const response = await fetch(`${baseUrl}/api/test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: '{"name":',
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: {
      code: 'INVALID_JSON',
      message: 'Request body must contain valid JSON.',
    },
  });
});

test('unknown API routes return a 404 NOT_FOUND response', async () => {
  const response = await fetch(`${baseUrl}/api/unknown`);

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    error: {
      code: 'NOT_FOUND',
      message: 'API route not found.',
    },
  });
});