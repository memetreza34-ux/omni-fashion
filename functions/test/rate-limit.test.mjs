import assert from 'node:assert/strict';
import test from 'node:test';

import { evaluateRateLimitWindow } from '../lib/security/rate-limit.js';

test('rate limit starts a new window', () => {
  assert.deepEqual(evaluateRateLimitWindow(null, 1_000, 3, 10_000), {
    allowed: true,
    nextState: { startedAtMs: 1_000, count: 1 },
    retryAfterSeconds: null,
  });
});

test('rate limit increments inside an active window', () => {
  assert.deepEqual(
    evaluateRateLimitWindow({ startedAtMs: 1_000, count: 1 }, 2_000, 3, 10_000),
    {
      allowed: true,
      nextState: { startedAtMs: 1_000, count: 2 },
      retryAfterSeconds: null,
    },
  );
});

test('rate limit blocks at the configured maximum', () => {
  const result = evaluateRateLimitWindow(
    { startedAtMs: 1_000, count: 3 },
    2_000,
    3,
    10_000,
  );

  assert.equal(result.allowed, false);
  assert.equal(result.retryAfterSeconds, 9);
  assert.deepEqual(result.nextState, { startedAtMs: 1_000, count: 3 });
});

test('expired or future windows reset safely', () => {
  assert.equal(
    evaluateRateLimitWindow(
      { startedAtMs: 1_000, count: 99 },
      20_000,
      3,
      10_000,
    ).nextState.count,
    1,
  );
  assert.equal(
    evaluateRateLimitWindow(
      { startedAtMs: 50_000, count: 99 },
      20_000,
      3,
      10_000,
    ).nextState.count,
    1,
  );
});
