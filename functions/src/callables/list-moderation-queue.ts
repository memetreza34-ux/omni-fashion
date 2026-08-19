import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/v2/https';

import { requireModerator } from '../moderation/auth.js';

const FUNCTIONS_REGION = 'europe-west1';

function ensureAdminInitialized(): void {
  if (getApps().length === 0) {
    initializeApp();
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function optionalString(
  record: Record<string, unknown>,
  field: string,
): string | null {
  const value = record[field];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export const listModerationQueue = onCall(
  {
    region: FUNCTIONS_REGION,
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (request) => {
    requireModerator(request.auth);
    ensureAdminInitialized();

    const db = getFirestore();
    const [reportsSnapshot, disputesSnapshot] = await Promise.all([
      db.collection('reports').where('status', '==', 'open').limit(50).get(),
      db
        .collection('swapDisputes')
        .where('status', '==', 'open')
        .limit(50)
        .get(),
    ]);

    const reports = reportsSnapshot.docs
      .map((document) => {
        const raw: unknown = document.data();
        if (!isRecord(raw)) {
          return null;
        }
        return {
          id: document.id,
          reporterId: optionalString(raw, 'reporterId'),
          targetType: optionalString(raw, 'targetType'),
          targetId: optionalString(raw, 'targetId'),
          targetOwnerId: optionalString(raw, 'targetOwnerId'),
          reason: optionalString(raw, 'reason'),
          details: optionalString(raw, 'details') ?? '',
          createdAtMillis: document.createTime.toMillis(),
        };
      })
      .filter((value) => value !== null)
      .sort((a, b) => b.createdAtMillis - a.createdAtMillis);

    const disputes = disputesSnapshot.docs
      .map((document) => {
        const raw: unknown = document.data();
        if (!isRecord(raw)) {
          return null;
        }
        const participantIds = Array.isArray(raw.participantIds)
          ? raw.participantIds.filter(
              (value): value is string => typeof value === 'string',
            )
          : [];
        return {
          id: document.id,
          transactionId: optionalString(raw, 'transactionId') ?? document.id,
          participantIds,
          openedById: optionalString(raw, 'openedById'),
          reason: optionalString(raw, 'reason'),
          details: optionalString(raw, 'details') ?? '',
          previousTransactionStatus: optionalString(
            raw,
            'previousTransactionStatus',
          ),
          createdAtMillis: document.createTime.toMillis(),
        };
      })
      .filter((value) => value !== null)
      .sort((a, b) => b.createdAtMillis - a.createdAtMillis);

    return { reports, disputes };
  },
);
