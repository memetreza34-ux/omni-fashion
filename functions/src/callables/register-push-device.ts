import { createHash } from 'node:crypto';

import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

const FUNCTIONS_REGION = 'europe-west1';
const PUSH_DEVICE_SCHEMA_VERSION = 1;

type PushPlatform = 'ios' | 'android';

interface RegisterPushDeviceInput {
  expoPushToken: string;
  platform: PushPlatform;
}

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

function parseRequest(data: unknown): RegisterPushDeviceInput {
  if (!isRecord(data)) {
    throw new HttpsError('invalid-argument', 'Ungültige Push-Geräteregistrierung.');
  }

  const expoPushToken = data.expoPushToken;
  const platform = data.platform;

  if (
    typeof expoPushToken !== 'string' ||
    !isExpoPushToken(expoPushToken.trim()) ||
    (platform !== 'ios' && platform !== 'android')
  ) {
    throw new HttpsError('invalid-argument', 'Ungültige Push-Geräteregistrierung.');
  }

  return {
    expoPushToken: expoPushToken.trim(),
    platform,
  };
}

function deviceIdForToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export const registerPushDevice = onCall(
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

    const input = parseRequest(request.data);
    ensureAdminInitialized();

    const db = getFirestore();
    const deviceId = deviceIdForToken(input.expoPushToken);
    const deviceRef = db.collection('pushDevices').doc(deviceId);

    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(deviceRef);
      const now = FieldValue.serverTimestamp();

      if (!snapshot.exists) {
        transaction.create(deviceRef, {
          userId: uid,
          expoPushToken: input.expoPushToken,
          platform: input.platform,
          enabled: true,
          createdAt: now,
          updatedAt: now,
          lastDeliveryAt: null,
          lastErrorCode: null,
          schemaVersion: PUSH_DEVICE_SCHEMA_VERSION,
        });
        return;
      }

      transaction.update(deviceRef, {
        userId: uid,
        platform: input.platform,
        enabled: true,
        updatedAt: now,
        lastErrorCode: null,
        schemaVersion: PUSH_DEVICE_SCHEMA_VERSION,
      });
    });

    return {
      deviceId,
      registered: true as const,
    };
  },
);
