import { httpsCallable } from 'firebase/functions';

import {
  FEATURE_FLAG_KEYS,
  getDefaultFeatureFlags,
} from '@/config/feature-flags';
import type { FeatureFlags } from '@/config/feature-flags';
import { getFirebaseServices } from '@/services/firebase/app';

const FEATURE_FLAG_SCHEMA_VERSION = 1;

export type FeatureFlagSource = 'remote' | 'defaults';

export interface RemoteFeatureFlagResult {
  flags: FeatureFlags;
  source: FeatureFlagSource;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function loadRemoteFeatureFlags(): Promise<RemoteFeatureFlagResult> {
  const { functions } = getFirebaseServices();
  const callable = httpsCallable<Record<string, never>, unknown>(
    functions,
    'getPublicFeatureFlags',
  );
  const response = await callable({});
  const data = response.data;

  if (
    !isRecord(data) ||
    data.schemaVersion !== FEATURE_FLAG_SCHEMA_VERSION ||
    (data.source !== 'remote' && data.source !== 'defaults') ||
    !isRecord(data.flags)
  ) {
    throw new Error('FEATURE_FLAGS_INVALID_RESPONSE');
  }

  const flags = getDefaultFeatureFlags();
  for (const key of FEATURE_FLAG_KEYS) {
    const value = data.flags[key];
    if (typeof value !== 'boolean') {
      throw new Error('FEATURE_FLAGS_INVALID_RESPONSE');
    }
    flags[key] = value;
  }

  return {
    flags,
    source: data.source,
  };
}
