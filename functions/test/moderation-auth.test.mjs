import assert from 'node:assert/strict';
import test from 'node:test';

import { requireModerator } from '../lib/moderation/auth.js';

test('moderation requires authentication', () => {
  assert.throws(
    () => requireModerator(undefined),
    (error) => error?.code === 'unauthenticated',
  );
});

test('normal authenticated users cannot use moderation commands', () => {
  assert.throws(
    () => requireModerator({ uid: 'user-1', token: { email: 'user@test' } }),
    (error) => error?.code === 'permission-denied',
  );
});

test('moderator custom claim grants moderation access', () => {
  assert.equal(
    requireModerator({ uid: 'mod-1', token: { moderator: true } }),
    'mod-1',
  );
});

test('admin custom claim grants moderation access', () => {
  assert.equal(
    requireModerator({ uid: 'admin-1', token: { admin: true } }),
    'admin-1',
  );
});
