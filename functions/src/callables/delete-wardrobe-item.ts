import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import {
  isActiveSwapTransactionStatus,
  isSafeWardrobeImagePath,
  wardrobeDeleteBlockers,
} from '../wardrobe/delete-policy.js';

const FUNCTIONS_REGION = 'europe-west1';
const CLEANUP_SCHEMA_VERSION = 1;

function ensureAdminInitialized(): void {
  if (getApps().length === 0) {
    initializeApp();
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseItemId(data: unknown): string {
  if (!isRecord(data)) {
    throw new HttpsError('invalid-argument', 'Ungültige Löschanfrage.');
  }

  const itemId = data.itemId;
  if (
    typeof itemId !== 'string' ||
    !itemId.trim() ||
    itemId.length > 180 ||
    itemId.includes('/')
  ) {
    throw new HttpsError('invalid-argument', 'Ungültige Kleidungsstück-ID.');
  }

  return itemId.trim();
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

async function activeSwapTransactionCount(itemId: string): Promise<number> {
  const db = getFirestore();
  const [requestedSnapshot, offeredSnapshot] = await Promise.all([
    db
      .collection('swapTransactions')
      .where('requestedWardrobeItemId', '==', itemId)
      .get(),
    db
      .collection('swapTransactions')
      .where('offeredWardrobeItemId', '==', itemId)
      .get(),
  ]);

  const transactions = new Map<string, unknown>();
  for (const document of [
    ...requestedSnapshot.docs,
    ...offeredSnapshot.docs,
  ]) {
    transactions.set(document.id, document.data().status);
  }

  return [...transactions.values()].filter(isActiveSwapTransactionStatus).length;
}

async function cleanPrivateWardrobeImage(
  ownerId: string,
  itemId: string,
  imagePath: string,
): Promise<boolean> {
  const db = getFirestore();
  const cleanupRef = db
    .collection('wardrobeStorageCleanupTasks')
    .doc(`${ownerId}_${itemId}`);

  if (!isSafeWardrobeImagePath(ownerId, itemId, imagePath)) {
    await cleanupRef.set(
      {
        status: 'needs_review',
        errorCode: 'UNSAFE_IMAGE_PATH',
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return true;
  }

  try {
    await getStorage()
      .bucket()
      .file(imagePath)
      .delete({ ignoreNotFound: true });
    await cleanupRef.delete();
    return false;
  } catch (error: unknown) {
    logger.error('Wardrobe image cleanup failed after item deletion', {
      ownerId,
      itemId,
      imagePath,
      error,
    });
    await cleanupRef.set(
      {
        status: 'retry',
        errorCode: 'STORAGE_DELETE_FAILED',
        attempts: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return true;
  }
}

export const deleteWardrobeItem = onCall(
  {
    region: FUNCTIONS_REGION,
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Anmeldung erforderlich.');
    }

    const itemId = parseItemId(request.data);
    ensureAdminInitialized();

    const db = getFirestore();
    const itemRef = db.collection('wardrobeItems').doc(itemId);
    const lockRef = db.collection('swapLocks').doc(itemId);
    const cleanupRef = db
      .collection('wardrobeStorageCleanupTasks')
      .doc(`${uid}_${itemId}`);
    const activeTransactions = await activeSwapTransactionCount(itemId);

    const deletion = await db.runTransaction(async (transaction) => {
      const [itemSnapshot, lockSnapshot] = await Promise.all([
        transaction.get(itemRef),
        transaction.get(lockRef),
      ]);

      if (!itemSnapshot.exists) {
        return null;
      }

      const item = itemSnapshot.data();
      if (!item) {
        throw new HttpsError(
          'internal',
          'Kleidungsstück konnte nicht gelesen werden.',
        );
      }

      const ownerId = optionalString(item.ownerId);
      const imagePath = optionalString(item.imagePath);
      const swapListingId = optionalString(item.swapListingId);
      if (!ownerId) {
        throw new HttpsError(
          'failed-precondition',
          'Kleidungsstück besitzt keinen gültigen Eigentümer.',
        );
      }

      const blockers = wardrobeDeleteBlockers({
        requesterId: uid,
        ownerId,
        itemId,
        imagePath,
        isListedForSwap: item.isListedForSwap === true,
        swapListingId,
        hasSwapLock: lockSnapshot.exists,
        activeSwapTransactionCount: activeTransactions,
      });

      if (blockers.includes('NOT_OWNER')) {
        throw new HttpsError(
          'permission-denied',
          'Du kannst nur eigene Kleidungsstücke löschen.',
        );
      }

      if (blockers.includes('UNSAFE_IMAGE_PATH') || !imagePath) {
        throw new HttpsError(
          'failed-precondition',
          'Der private Bildpfad dieses Kleidungsstücks ist inkonsistent.',
          { blockers },
        );
      }

      if (blockers.length > 0) {
        throw new HttpsError(
          'failed-precondition',
          'Das Kleidungsstück kann während eines aktiven OmniSwap-Vorgangs nicht gelöscht werden.',
          { blockers },
        );
      }

      const now = FieldValue.serverTimestamp();
      transaction.set(cleanupRef, {
        ownerId: uid,
        itemId,
        imagePath,
        status: 'pending',
        errorCode: null,
        attempts: 0,
        createdAt: now,
        updatedAt: now,
        schemaVersion: CLEANUP_SCHEMA_VERSION,
      });
      transaction.delete(itemRef);

      return { ownerId: uid, imagePath };
    });

    if (!deletion) {
      const cleanupSnapshot = await cleanupRef.get();
      const cleanup = cleanupSnapshot.data();
      const imagePath = cleanup ? optionalString(cleanup.imagePath) : null;
      const ownerId = cleanup ? optionalString(cleanup.ownerId) : null;

      if (imagePath && ownerId === uid) {
        const cleanupPending = await cleanPrivateWardrobeImage(
          uid,
          itemId,
          imagePath,
        );
        return {
          itemId,
          deleted: true as const,
          alreadyDeleted: true as const,
          cleanupPending,
        };
      }

      return {
        itemId,
        deleted: false as const,
        alreadyDeleted: true as const,
        cleanupPending: false as const,
      };
    }

    const cleanupPending = await cleanPrivateWardrobeImage(
      deletion.ownerId,
      itemId,
      deletion.imagePath,
    );

    return {
      itemId,
      deleted: true as const,
      alreadyDeleted: false as const,
      cleanupPending,
    };
  },
);
