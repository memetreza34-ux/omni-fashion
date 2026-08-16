import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { logger } from 'firebase-functions';

function ensureAdminInitialized(): void {
  if (getApps().length === 0) {
    initializeApp();
  }
}

function requiredString(
  record: Record<string, unknown>,
  field: string,
): string {
  const value = record[field];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`MISSING_${field.toUpperCase()}`);
  }
  return value.trim();
}

function stringArray(record: Record<string, unknown>, field: string): string[] {
  const value = record[field];
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
    throw new Error(`INVALID_${field.toUpperCase()}`);
  }
  return value;
}

function extensionFromPath(path: string): string {
  const fileName = path.split('/').pop() ?? '';
  const match = fileName.match(/\.([a-zA-Z0-9]{2,8})$/);
  return match?.[1]?.toLowerCase() ?? 'jpg';
}

function ownerWardrobePath(
  ownerId: string,
  itemId: string,
  sourcePath: string,
): string {
  return `users/${ownerId}/wardrobe/${itemId}/original.${extensionFromPath(sourcePath)}`;
}

async function markFinalizationFailed(
  transactionId: string,
  errorCode: string,
): Promise<void> {
  const db = getFirestore();
  const transactionRef = db.collection('swapTransactions').doc(transactionId);

  try {
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(transactionRef);
      if (!snapshot.exists) {
        return;
      }
      const data = snapshot.data();
      if (!data || data.finalizationState !== 'processing') {
        return;
      }

      transaction.update(transactionRef, {
        finalizationState: 'failed',
        finalizationErrorCode: errorCode,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  } catch (error: unknown) {
    logger.error('Failed to persist OmniSwap finalization failure', error);
  }
}

export async function finalizeSwapTransaction(
  transactionId: string,
): Promise<'completed' | 'not-ready' | 'processing'> {
  ensureAdminInitialized();
  const db = getFirestore();
  const bucket = getStorage().bucket();
  const transactionRef = db.collection('swapTransactions').doc(transactionId);

  const claim = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(transactionRef);
    if (!snapshot.exists) {
      throw new Error('TRANSACTION_NOT_FOUND');
    }

    const data = snapshot.data();
    if (!data) {
      throw new Error('TRANSACTION_UNREADABLE');
    }
    if (data.status === 'completed' && data.finalizationState === 'completed') {
      return 'completed' as const;
    }
    if (data.finalizationState === 'processing') {
      return 'processing' as const;
    }
    if (data.status !== 'received' || data.finalizationState !== 'ready') {
      return 'not-ready' as const;
    }

    transaction.update(transactionRef, {
      finalizationState: 'processing',
      finalizationErrorCode: null,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return 'claimed' as const;
  });

  if (claim !== 'claimed') {
    return claim;
  }

  let requestedTargetPath: string | null = null;
  let offeredTargetPath: string | null = null;

  try {
    const transactionSnapshot = await transactionRef.get();
    const swap = transactionSnapshot.data();
    if (!swap) {
      throw new Error('TRANSACTION_UNREADABLE');
    }

    const requesterId = requiredString(swap, 'requesterId');
    const listingOwnerId = requiredString(swap, 'listingOwnerId');
    const listingId = requiredString(swap, 'listingId');
    const requestedWardrobeItemId = requiredString(
      swap,
      'requestedWardrobeItemId',
    );
    const offeredWardrobeItemId = requiredString(
      swap,
      'offeredWardrobeItemId',
    );
    const participantIds = stringArray(swap, 'participantIds');
    const receivedByIds = stringArray(swap, 'receivedByIds');

    if (
      participantIds.length !== 2 ||
      !participantIds.includes(requesterId) ||
      !participantIds.includes(listingOwnerId) ||
      !participantIds.every((id) => receivedByIds.includes(id))
    ) {
      throw new Error('RECEIPTS_NOT_CONFIRMED');
    }

    const listingRef = db.collection('swapListings').doc(listingId);
    const requestedItemRef = db
      .collection('wardrobeItems')
      .doc(requestedWardrobeItemId);
    const offeredItemRef = db
      .collection('wardrobeItems')
      .doc(offeredWardrobeItemId);

    const [listingSnapshot, requestedSnapshot, offeredSnapshot] =
      await Promise.all([
        listingRef.get(),
        requestedItemRef.get(),
        offeredItemRef.get(),
      ]);

    const listing = listingSnapshot.data();
    const requestedItem = requestedSnapshot.data();
    const offeredItem = offeredSnapshot.data();
    if (!listing || !requestedItem || !offeredItem) {
      throw new Error('SWAP_ITEMS_NOT_FOUND');
    }
    if (listing.status !== 'reserved' || listing.ownerId !== listingOwnerId) {
      throw new Error('LISTING_NOT_RESERVED');
    }
    if (
      requestedItem.ownerId !== listingOwnerId ||
      requestedItem.isListedForSwap !== true ||
      requestedItem.swapListingId !== listingId
    ) {
      throw new Error('REQUESTED_ITEM_STATE_INVALID');
    }
    if (
      offeredItem.ownerId !== requesterId ||
      offeredItem.isListedForSwap === true ||
      offeredItem.swapListingId
    ) {
      throw new Error('OFFERED_ITEM_STATE_INVALID');
    }

    const requestedSourcePath = requiredString(requestedItem, 'imagePath');
    const offeredSourcePath = requiredString(offeredItem, 'imagePath');
    requestedTargetPath = ownerWardrobePath(
      requesterId,
      requestedWardrobeItemId,
      requestedSourcePath,
    );
    offeredTargetPath = ownerWardrobePath(
      listingOwnerId,
      offeredWardrobeItemId,
      offeredSourcePath,
    );

    const requestedSourceFile = bucket.file(requestedSourcePath);
    const offeredSourceFile = bucket.file(offeredSourcePath);
    const requestedTargetFile = bucket.file(requestedTargetPath);
    const offeredTargetFile = bucket.file(offeredTargetPath);

    const [[requestedExists], [offeredExists]] = await Promise.all([
      requestedSourceFile.exists(),
      offeredSourceFile.exists(),
    ]);
    if (!requestedExists || !offeredExists) {
      throw new Error('PRIVATE_SOURCE_MEDIA_MISSING');
    }

    await Promise.all([
      requestedSourceFile.copy(requestedTargetFile),
      offeredSourceFile.copy(offeredTargetFile),
    ]);

    const [[requestedCopyExists], [offeredCopyExists]] = await Promise.all([
      requestedTargetFile.exists(),
      offeredTargetFile.exists(),
    ]);
    if (!requestedCopyExists || !offeredCopyExists) {
      throw new Error('PRIVATE_TARGET_MEDIA_MISSING');
    }

    await db.runTransaction(async (transaction) => {
      const [
        latestTransactionSnapshot,
        latestListingSnapshot,
        latestRequestedSnapshot,
        latestOfferedSnapshot,
      ] = await Promise.all([
        transaction.get(transactionRef),
        transaction.get(listingRef),
        transaction.get(requestedItemRef),
        transaction.get(offeredItemRef),
      ]);

      const latestSwap = latestTransactionSnapshot.data();
      const latestListing = latestListingSnapshot.data();
      const latestRequested = latestRequestedSnapshot.data();
      const latestOffered = latestOfferedSnapshot.data();
      if (!latestSwap || !latestListing || !latestRequested || !latestOffered) {
        throw new Error('FINALIZATION_DOCUMENT_MISSING');
      }
      if (
        latestSwap.status !== 'received' ||
        latestSwap.finalizationState !== 'processing'
      ) {
        throw new Error('FINALIZATION_CLAIM_LOST');
      }
      const latestReceived = stringArray(latestSwap, 'receivedByIds');
      if (!participantIds.every((id) => latestReceived.includes(id))) {
        throw new Error('FINAL_RECEIPT_CHECK_FAILED');
      }
      if (
        latestListing.status !== 'reserved' ||
        latestListing.ownerId !== listingOwnerId ||
        latestRequested.ownerId !== listingOwnerId ||
        latestRequested.swapListingId !== listingId ||
        latestOffered.ownerId !== requesterId
      ) {
        throw new Error('FINAL_OWNERSHIP_CHECK_FAILED');
      }

      const now = FieldValue.serverTimestamp();
      transaction.update(requestedItemRef, {
        ownerId: requesterId,
        imagePath: requestedTargetPath,
        isListedForSwap: false,
        swapListingId: null,
        updatedAt: now,
      });
      transaction.update(offeredItemRef, {
        ownerId: listingOwnerId,
        imagePath: offeredTargetPath,
        isListedForSwap: false,
        swapListingId: null,
        updatedAt: now,
      });
      transaction.update(listingRef, {
        status: 'traded',
        updatedAt: now,
      });
      transaction.update(transactionRef, {
        status: 'completed',
        finalizationState: 'completed',
        finalizationErrorCode: null,
        completedAt: now,
        updatedAt: now,
      });
      transaction.delete(
        db.collection('swapLocks').doc(offeredWardrobeItemId),
      );
      transaction.delete(
        db.collection('swapOfferKeys').doc(`${listingId}_${requesterId}`),
      );
    });

    const publicImagePath = requiredString(listing, 'publicImagePath');
    const cleanupResults = await Promise.allSettled([
      requestedSourceFile.delete({ ignoreNotFound: true }),
      offeredSourceFile.delete({ ignoreNotFound: true }),
      bucket.file(publicImagePath).delete({ ignoreNotFound: true }),
    ]);
    for (const result of cleanupResults) {
      if (result.status === 'rejected') {
        logger.error('OmniSwap post-finalization media cleanup failed', result.reason);
      }
    }

    return 'completed';
  } catch (error: unknown) {
    logger.error('OmniSwap finalization failed', error);

    try {
      const latest = await transactionRef.get();
      if (latest.data()?.status === 'completed') {
        return 'completed';
      }
    } catch (statusError: unknown) {
      logger.error('Could not verify finalization status after failure', statusError);
    }

    const cleanupTargets = [requestedTargetPath, offeredTargetPath].filter(
      (path): path is string => typeof path === 'string',
    );
    await Promise.allSettled(
      cleanupTargets.map((path) =>
        bucket.file(path).delete({ ignoreNotFound: true }),
      ),
    );
    await markFinalizationFailed(transactionId, 'FINALIZATION_FAILED');
    throw error;
  }
}
