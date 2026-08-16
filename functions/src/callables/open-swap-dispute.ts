import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

const FUNCTIONS_REGION = 'europe-west1';
const TRUST_SAFETY_SCHEMA_VERSION = 1;
const DISPUTE_REASONS = [
  'item_not_received',
  'item_not_as_described',
  'wrong_item',
  'damaged_item',
  'unsafe_interaction',
  'other',
] as const;

type DisputeReason = (typeof DISPUTE_REASONS)[number];

function ensureAdminInitialized(): void {
  if (getApps().length === 0) initializeApp();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseRequest(data: unknown): {
  transactionId: string;
  reason: DisputeReason;
  details: string;
} {
  if (!isRecord(data)) {
    throw new HttpsError('invalid-argument', 'Ungültiger Klärungsfall.');
  }
  const transactionId = data.transactionId;
  const reason = data.reason;
  const details = data.details;
  if (
    typeof transactionId !== 'string' ||
    !transactionId.trim() ||
    transactionId.length > 180 ||
    transactionId.includes('/') ||
    typeof reason !== 'string' ||
    !DISPUTE_REASONS.includes(reason as DisputeReason) ||
    typeof details !== 'string' ||
    details.trim().length > 1500
  ) {
    throw new HttpsError('invalid-argument', 'Ungültiger Klärungsfall.');
  }
  return {
    transactionId: transactionId.trim(),
    reason: reason as DisputeReason,
    details: details.trim(),
  };
}

function readParticipants(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : [];
}

export const openSwapDispute = onCall(
  { region: FUNCTIONS_REGION, timeoutSeconds: 30, memory: '256MiB' },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Anmeldung erforderlich.');

    const input = parseRequest(request.data);
    ensureAdminInitialized();
    const db = getFirestore();
    const transactionRef = db
      .collection('swapTransactions')
      .doc(input.transactionId);
    const disputeRef = db.collection('swapDisputes').doc(input.transactionId);

    await db.runTransaction(async (transaction) => {
      const [swapSnapshot, disputeSnapshot] = await Promise.all([
        transaction.get(transactionRef),
        transaction.get(disputeRef),
      ]);
      if (!swapSnapshot.exists) {
        throw new HttpsError('not-found', 'Trade wurde nicht gefunden.');
      }
      if (disputeSnapshot.exists) {
        throw new HttpsError(
          'already-exists',
          'Für diesen Trade existiert bereits ein Klärungsfall.',
        );
      }

      const swap = swapSnapshot.data();
      if (!swap) {
        throw new HttpsError('internal', 'Trade konnte nicht gelesen werden.');
      }
      const participants = readParticipants(swap.participantIds);
      if (!participants.includes(uid)) {
        throw new HttpsError(
          'permission-denied',
          'Du bist kein Teilnehmer dieses Trades.',
        );
      }
      if (
        swap.status === 'completed' ||
        swap.status === 'cancelled' ||
        swap.status === 'disputed' ||
        swap.finalizationState === 'processing' ||
        swap.finalizationState === 'completed'
      ) {
        throw new HttpsError(
          'failed-precondition',
          'Dieser Trade kann im aktuellen Zustand nicht in einen Klärungsfall überführt werden.',
        );
      }

      const now = FieldValue.serverTimestamp();
      transaction.set(disputeRef, {
        transactionId: input.transactionId,
        participantIds: participants,
        openedById: uid,
        reason: input.reason,
        details: input.details,
        status: 'open',
        createdAt: now,
        updatedAt: now,
        schemaVersion: TRUST_SAFETY_SCHEMA_VERSION,
      });
      transaction.update(transactionRef, {
        status: 'disputed',
        updatedAt: now,
      });
    });

    return {
      transactionId: input.transactionId,
      disputeId: input.transactionId,
      status: 'disputed' as const,
    };
  },
);
