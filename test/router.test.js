
import test from 'node:test';
import assert from 'node:assert/strict';

import { createRouter } from '../src/http/router.js';

test('matches a GET route', () => {
  const router = createRouter();
  const handler = () => {};

  router.get('/health', handler);

  const result = router.match('GET', '/health');

  assert.ok(result);
  assert.equal(result.handler, handler);
  assert.deepEqual(result.params, {});
});

test('matches a route with a path parameter', () => {
  const router = createRouter();
  const handler = () => {};

  router.get('/api/events/:id', handler);

  const result = router.match('GET', '/api/events/event-123');

  assert.ok(result);
  assert.equal(result.handler, handler);
  assert.deepEqual(result.params, { id: 'event-123' });
});

test('does not match a different HTTP method', () => {
  const router = createRouter();

  router.get('/health', () => {});

  assert.equal(router.match('POST', '/health'), null);
});

test('does not match an unknown path', () => {
  const router = createRouter();

  router.get('/health', () => {});

  assert.equal(router.match('GET', '/unknown'), null);
});

test('matches a route with an optional trailing slash', () => {
  const router = createRouter();

  router.get('/health', () => {});

  assert.ok(router.match('GET', '/health/'));
});
