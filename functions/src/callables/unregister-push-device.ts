import { createHash } from 'node:crypto';

import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

const FUNCTIONS_REGION = 'europe-west1';

function ensureAdminInitialized(): void {
  if (getApps().length === 0) {
    initializeApp();
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isExpoPushToken(value: string): boolean {
  return /^(ExponentPushToken|ExpoPushToken)\[[^\]\s]{8,512}\]$/.test(value);
}

function parseToken(data: unknown): string {
  if (!isRecord(data) || typeof data.expoPushToken !== 'string') {
    throw new HttpsError('invalid-argument', 'Ungültiges Push-Gerät.');
  }

  const token = data.expoPushToken.trim();
  if (!isExpoPushToken(token)) {
    throw new HttpsError('invalid-argument', 'Ungültiges Push-Gerät.');
  }
  return token;
}

function deviceIdForToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export const unregisterPushDevice = onCall(
  {
    region: FUNCTIONS_REGION,
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Anmeldung erforderlich.');
    }

    const token = parseToken(request.data);
    ensureAdminInitialized();

    const db = getFirestore();
    const deviceId = deviceIdForToken(token);
    const deviceRef = db.collection('pushDevices').doc(deviceId);
    const snapshot = await deviceRef.get();

    if (!snapshot.exists) {
      return { removed: true as const };
    }

    const data = snapshot.data();
    if (!data || data.userId !== uid || data.expoPushToken !== token) {
      throw new HttpsError(
        'permission-denied',
        'Dieses Push-Gerät gehört nicht zum angemeldeten Konto.',
      );
    }

    await deviceRef.delete();
    return { removed: true as const };
  },
);
