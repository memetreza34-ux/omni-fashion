import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { logger } from 'firebase-functions';
import { onSchedule } from 'firebase-functions/v2/scheduler';

const FUNCTIONS_REGION = 'europe-west1';
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function ensureAdminInitialized(): void {
  if (getApps().length === 0) {
    initializeApp();
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function stringValue(record: Record<string, unknown>, field: string): string | null {
  const value = record[field];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export const cleanupInactiveSwapListingMedia = onSchedule(
  {
    schedule: 'every day 03:00',
    timeZone: 'Europe/Berlin',
    region: FUNCTIONS_REGION,
    timeoutSeconds: 300,
    memory: '256MiB',
  },
  async () => {
    ensureAdminInitialized();
    const db = getFirestore();
    const bucket = getStorage().bucket();
    const cutoff = Date.now() - DAY_MS;

    const snapshot = await db
      .collection('swapListings')
      .where('status', 'in', ['removed', 'traded'])
      .limit(100)
      .get();

    for (const document of snapshot.docs) {
      const raw: unknown = document.data();
      if (!isRecord(raw) || document.updateTime.toMillis() > cutoff) {
        continue;
      }
      if (raw.publicMediaCleanedAt) {
        continue;
      }

      const publicImagePath = stringValue(raw, 'publicImagePath');
      if (!publicImagePath || !publicImagePath.startsWith('public/listings/')) {
        logger.warn('Skipping unsafe listing cleanup path', {
          listingId: document.id,
          publicImagePath,
        });
        continue;
      }

      try {
        await bucket.file(publicImagePath).delete({ ignoreNotFound: true });
        await document.ref.set(
          {
            publicMediaCleanedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      } catch (error: unknown) {
        logger.error('Failed to clean inactive public listing media', {
          listingId: document.id,
          error,
        });
      }
    }
  },
);

export const flagStalePushDeliveryClaims = onSchedule(
  {
    schedule: 'every 60 minutes',
    region: FUNCTIONS_REGION,
    timeoutSeconds: 120,
    memory: '256MiB',
  },
  async () => {
    ensureAdminInitialized();
    const db = getFirestore();
    const cutoff = Date.now() - HOUR_MS;
    const snapshot = await db
      .collection('pushDeliveries')
      .where('status', '==', 'claimed')
      .limit(200)
      .get();

    const stale = snapshot.docs.filter(
      (document) => document.createTime.toMillis() <= cutoff,
    );
    if (stale.length === 0) {
      return;
    }

    const batch = db.batch();
    for (const document of stale) {
      batch.set(
        document.ref,
        {
          status: 'needs_review',
          errorCode: 'STALE_CLAIM',
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }
    await batch.commit();
  },
);
