import assert from 'node:assert/strict';
import test from 'node:test';

import { parseRemoteFeatureFlags } from '../lib/callables/get-public-feature-flags.js';

test('feature flags accept only known boolean keys', () => {
  assert.deepEqual(
    parseRemoteFeatureFlags({
      schemaVersion: 1,
      flags: {
        nativePushRegistration: true,
        internalModeratorUi: false,
        shopPartnerFeed: true,
        photorealisticTryOn: false,
        unknownDangerousFlag: true,
      },
    }),
    {
      nativePushRegistration: true,
      internalModeratorUi: false,
      shopPartnerFeed: true,
      photorealisticTryOn: false,
    },
  );
});

test('missing known keys fall back to disabled', () => {
  assert.deepEqual(
    parseRemoteFeatureFlags({
      schemaVersion: 1,
      flags: { shopPartnerFeed: true },
    }),
    {
      nativePushRegistration: false,
      internalModeratorUi: false,
      shopPartnerFeed: true,
      photorealisticTryOn: false,
    },
  );
});

test('invalid schema fails closed', () => {
  assert.equal(
    parseRemoteFeatureFlags({
      schemaVersion: 2,
      flags: { internalModeratorUi: true },
    }),
    null,
  );
});
