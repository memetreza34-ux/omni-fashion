import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

const FUNCTIONS_REGION = 'europe-west1';
const TRUST_SAFETY_SCHEMA_VERSION = 1;

function ensureAdminInitialized(): void {
  if (getApps().length === 0) initializeApp();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseRequest(data: unknown): {
  targetUserId: string;
  action: 'block' | 'unblock';
} {
  if (!isRecord(data)) {
    throw new HttpsError('invalid-argument', 'Ungültige Block-Aktion.');
  }
  const targetUserId = data.targetUserId;
  const action = data.action;
  if (
    typeof targetUserId !== 'string' ||
    !targetUserId.trim() ||
    targetUserId.length > 180 ||
    targetUserId.includes('/') ||
    (action !== 'block' && action !== 'unblock')
  ) {
    throw new HttpsError('invalid-argument', 'Ungültige Block-Aktion.');
  }
  return { targetUserId: targetUserId.trim(), action };
}

export const setUserBlock = onCall(
  { region: FUNCTIONS_REGION, timeoutSeconds: 30, memory: '256MiB' },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
      throw new HttpsError('unauthenticated', 'Anmeldung erforderlich.');

    const input = parseRequest(request.data);
    if (input.targetUserId === uid) {
      throw new HttpsError(
        'failed-precondition',
        'Du kannst dich nicht selbst blockieren.',
      );
    }

    ensureAdminInitialized();
    const db = getFirestore();
    const targetRef = db.collection('users').doc(input.targetUserId);
    const blockRef = db
      .collection('blocks')
      .doc(`${uid}_${input.targetUserId}`);

    if (input.action === 'unblock') {
      await blockRef.delete();
      return { targetUserId: input.targetUserId, blocked: false };
    }

    const targetSnapshot = await targetRef.get();
    if (!targetSnapshot.exists) {
      throw new HttpsError('not-found', 'Nutzerkonto wurde nicht gefunden.');
    }

    await blockRef.set({
      blockerId: uid,
      blockedId: input.targetUserId,
      createdAt: FieldValue.serverTimestamp(),
      schemaVersion: TRUST_SAFETY_SCHEMA_VERSION,
    });

    return { targetUserId: input.targetUserId, blocked: true };
  },
);
