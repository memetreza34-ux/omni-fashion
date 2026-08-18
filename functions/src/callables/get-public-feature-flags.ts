import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

const FUNCTIONS_REGION = 'europe-west1';
const FEATURE_FLAG_SCHEMA_VERSION = 1;
const FEATURE_FLAG_KEYS = [
  'nativePushRegistration',
  'internalModeratorUi',
  'shopPartnerFeed',
  'photorealisticTryOn',
] as const;

type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];
type FeatureFlags = Record<FeatureFlagKey, boolean>;

const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  nativePushRegistration: false,
  internalModeratorUi: false,
  shopPartnerFeed: false,
  photorealisticTryOn: false,
};

interface FeatureFlagResponse {
  flags: FeatureFlags;
  source: 'remote' | 'defaults';
  schemaVersion: number;
}

function ensureAdminInitialized(): void {
  if (getApps().length === 0) {
    initializeApp();
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function parseRemoteFeatureFlags(value: unknown): FeatureFlags | null {
  if (!isRecord(value) || value.schemaVersion !== FEATURE_FLAG_SCHEMA_VERSION) {
    return null;
  }

  const rawFlags = value.flags;
  if (!isRecord(rawFlags)) {
    return null;
  }

  const flags: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS };
  for (const key of FEATURE_FLAG_KEYS) {
    const remoteValue = rawFlags[key];
    if (typeof remoteValue === 'boolean') {
      flags[key] = remoteValue;
    }
  }

  return flags;
}

function defaultResponse(): FeatureFlagResponse {
  return {
    flags: { ...DEFAULT_FEATURE_FLAGS },
    source: 'defaults',
    schemaVersion: FEATURE_FLAG_SCHEMA_VERSION,
  };
}

export const getPublicFeatureFlags = onCall(
  {
    region: FUNCTIONS_REGION,
    timeoutSeconds: 15,
    memory: '256MiB',
  },
  async (request): Promise<FeatureFlagResponse> => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Anmeldung erforderlich.');
    }

    ensureAdminInitialized();
    const snapshot = await getFirestore()
      .collection('runtimeConfig')
      .doc('publicFeatureFlags')
      .get();

    if (!snapshot.exists) {
      return defaultResponse();
    }

    const flags = parseRemoteFeatureFlags(snapshot.data());
    if (!flags) {
      logger.warn('Ignoring invalid public feature flag document.', {
        documentPath: snapshot.ref.path,
      });
      return defaultResponse();
    }

    return {
      flags,
      source: 'remote',
      schemaVersion: FEATURE_FLAG_SCHEMA_VERSION,
    };
  },
);
