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

function optionalString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export const listRecoveryQueue = onCall(
  {
    region: FUNCTIONS_REGION,
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (request) => {
    requireModerator(request.auth);
    ensureAdminInitialized();

    const db = getFirestore();
    const [failedTransactionsSnapshot, manualDisputesSnapshot, pushSnapshot] =
      await Promise.all([
        db
          .collection('swapTransactions')
          .where('finalizationState', '==', 'failed')
          .limit(50)
          .get(),
        db
          .collection('swapDisputes')
          .where('resolution', '==', 'manual_recovery')
          .limit(50)
          .get(),
        db
          .collection('pushDeliveries')
          .where('status', 'in', ['send_failed', 'needs_review'])
          .limit(100)
          .get(),
      ]);

    const failedTransactions = failedTransactionsSnapshot.docs
      .map((document) => {
        const raw: unknown = document.data();
        if (!isRecord(raw)) return null;
        return {
          transactionId: document.id,
          requesterId: optionalString(raw, 'requesterId'),
          listingOwnerId: optionalString(raw, 'listingOwnerId'),
          status: optionalString(raw, 'status'),
          finalizationState: optionalString(raw, 'finalizationState'),
          createdAtMillis: document.createTime.toMillis(),
        };
      })
      .filter((value) => value !== null);

    const manualDisputes = manualDisputesSnapshot.docs
      .map((document) => {
        const raw: unknown = document.data();
        if (!isRecord(raw)) return null;
        return {
          transactionId: optionalString(raw, 'transactionId') ?? document.id,
          openedById: optionalString(raw, 'openedById'),
          reason: optionalString(raw, 'reason'),
          resolutionNote: optionalString(raw, 'resolutionNote') ?? '',
          createdAtMillis: document.createTime.toMillis(),
        };
      })
      .filter((value) => value !== null);

    const pushDeliveries = pushSnapshot.docs
      .map((document) => {
        const raw: unknown = document.data();
        if (!isRecord(raw)) return null;
        return {
          deliveryId: document.id,
          userId: optionalString(raw, 'userId'),
          deviceId: optionalString(raw, 'deviceId'),
          notificationId: optionalString(raw, 'notificationId'),
          status: optionalString(raw, 'status'),
          errorCode: optionalString(raw, 'errorCode'),
          createdAtMillis: document.createTime.toMillis(),
        };
      })
      .filter((value) => value !== null);

    return {
      failedTransactions,
      manualDisputes,
      pushDeliveries,
    };
  },
);
