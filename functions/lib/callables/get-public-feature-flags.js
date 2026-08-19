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
];
const DEFAULT_FEATURE_FLAGS = {
    nativePushRegistration: false,
    internalModeratorUi: false,
    shopPartnerFeed: false,
    photorealisticTryOn: false,
};
function ensureAdminInitialized() {
    if (getApps().length === 0) {
        initializeApp();
    }
}
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
export function parseRemoteFeatureFlags(value) {
    if (!isRecord(value) || value.schemaVersion !== FEATURE_FLAG_SCHEMA_VERSION) {
        return null;
    }
    const rawFlags = value.flags;
    if (!isRecord(rawFlags)) {
        return null;
    }
    const flags = { ...DEFAULT_FEATURE_FLAGS };
    for (const key of FEATURE_FLAG_KEYS) {
        const remoteValue = rawFlags[key];
        if (typeof remoteValue === 'boolean') {
            flags[key] = remoteValue;
        }
    }
    return flags;
}
function defaultResponse() {
    return {
        flags: { ...DEFAULT_FEATURE_FLAGS },
        source: 'defaults',
        schemaVersion: FEATURE_FLAG_SCHEMA_VERSION,
    };
}
export const getPublicFeatureFlags = onCall({
    region: FUNCTIONS_REGION,
    timeoutSeconds: 15,
    memory: '256MiB',
}, async (request) => {
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
});
//# sourceMappingURL=get-public-feature-flags.js.map