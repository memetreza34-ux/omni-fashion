import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

const FUNCTIONS_REGION = 'europe-west1';
const TRUST_SAFETY_SCHEMA_VERSION = 1;
const REPORT_REASONS = [
  'spam',
  'fraud',
  'counterfeit',
  'prohibited_item',
  'harassment',
  'unsafe_meetup',
  'other',
] as const;

type ReportReason = (typeof REPORT_REASONS)[number];
type ReportTargetType = 'listing' | 'user' | 'transaction';

interface SubmitReportInput {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details: string;
}

function ensureAdminInitialized(): void {
  if (getApps().length === 0) initializeApp();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseRequest(data: unknown): SubmitReportInput {
  if (!isRecord(data)) {
    throw new HttpsError('invalid-argument', 'Ungültige Meldung.');
  }
  const { targetType, targetId, reason, details } = data;
  if (
    (targetType !== 'listing' && targetType !== 'user' && targetType !== 'transaction') ||
    typeof targetId !== 'string' ||
    !targetId.trim() ||
    targetId.length > 180 ||
    targetId.includes('/') ||
    typeof reason !== 'string' ||
    !REPORT_REASONS.includes(reason as ReportReason) ||
    typeof details !== 'string' ||
    details.trim().length > 1500
  ) {
    throw new HttpsError('invalid-argument', 'Ungültige Meldung.');
  }
  return {
    targetType,
    targetId: targetId.trim(),
    reason: reason as ReportReason,
    details: details.trim(),
  };
}

function participantIds(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : [];
}

export const submitReport = onCall(
  { region: FUNCTIONS_REGION, timeoutSeconds: 30, memory: '256MiB' },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Anmeldung erforderlich.');

    const input = parseRequest(request.data);
    ensureAdminInitialized();
    const db = getFirestore();
    let targetOwnerId: string | null = null;

    if (input.targetType === 'listing') {
      const snapshot = await db.collection('swapListings').doc(input.targetId).get();
      const data = snapshot.data();
      if (!snapshot.exists || !data) {
        throw new HttpsError('not-found', 'Listing wurde nicht gefunden.');
      }
      if (data.ownerId === uid) {
        throw new HttpsError('failed-precondition', 'Du kannst dein eigenes Listing nicht melden.');
      }
      targetOwnerId = typeof data.ownerId === 'string' ? data.ownerId : null;
    } else if (input.targetType === 'user') {
      if (input.targetId === uid) {
        throw new HttpsError('failed-precondition', 'Du kannst dich nicht selbst melden.');
      }
      const snapshot = await db.collection('users').doc(input.targetId).get();
      if (!snapshot.exists) {
        throw new HttpsError('not-found', 'Nutzerkonto wurde nicht gefunden.');
      }
      targetOwnerId = input.targetId;
    } else {
      const snapshot = await db
        .collection('swapTransactions')
        .doc(input.targetId)
        .get();
      const data = snapshot.data();
      if (!snapshot.exists || !data || !participantIds(data.participantIds).includes(uid)) {
        throw new HttpsError(
          'permission-denied',
          'Du bist kein Teilnehmer dieses Trades.',
        );
      }
    }

    const reportRef = db.collection('reports').doc();
    const now = FieldValue.serverTimestamp();
    await reportRef.set({
      reporterId: uid,
      targetType: input.targetType,
      targetId: input.targetId,
      targetOwnerId,
      reason: input.reason,
      details: input.details,
      status: 'open',
      createdAt: now,
      updatedAt: now,
      schemaVersion: TRUST_SAFETY_SCHEMA_VERSION,
    });

    return { reportId: reportRef.id, status: 'open' as const };
  },
);
