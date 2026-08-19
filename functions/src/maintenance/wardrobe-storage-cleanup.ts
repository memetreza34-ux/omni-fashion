import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { logger } from 'firebase-functions';
import { onSchedule } from 'firebase-functions/v2/scheduler';

import { isSafeWardrobeImagePath } from '../wardrobe/delete-policy.js';

const FUNCTIONS_REGION = 'europe-west1';

function ensureAdminInitialized(): void {
  if (getApps().length === 0) {
    initializeApp();
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function requiredString(
  record: Record<string, unknown>,
  field: string,
): string | null {
  const value = record[field];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export const cleanupWardrobeStorageTasks = onSchedule(
  {
    schedule: 'every 60 minutes',
    region: FUNCTIONS_REGION,
    timeoutSeconds: 300,
    memory: '256MiB',
  },
  async () => {
    ensureAdminInitialized();
    const db = getFirestore();
    const bucket = getStorage().bucket();
    const snapshot = await db
      .collection('wardrobeStorageCleanupTasks')
      .where('status', 'in', ['pending', 'retry'])
      .limit(100)
      .get();

    for (const document of snapshot.docs) {
      const raw: unknown = document.data();
      if (!isRecord(raw)) {
        await document.ref.set(
          {
            status: 'needs_review',
            errorCode: 'INVALID_TASK_SHAPE',
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        continue;
      }

      const ownerId = requiredString(raw, 'ownerId');
      const itemId = requiredString(raw, 'itemId');
      const imagePath = requiredString(raw, 'imagePath');
      if (
        !ownerId ||
        !itemId ||
        !imagePath ||
        !isSafeWardrobeImagePath(ownerId, itemId, imagePath)
      ) {
        await document.ref.set(
          {
            status: 'needs_review',
            errorCode: 'UNSAFE_OR_INVALID_PATH',
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        continue;
      }

      try {
        await bucket.file(imagePath).delete({ ignoreNotFound: true });
        await document.ref.delete();
      } catch (error: unknown) {
        logger.error('Scheduled wardrobe storage cleanup failed', {
          taskId: document.id,
          ownerId,
          itemId,
          imagePath,
          error,
        });
        await document.ref.set(
          {
            status: 'retry',
            errorCode: 'STORAGE_DELETE_FAILED',
            attempts: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }
    }
  },
);
