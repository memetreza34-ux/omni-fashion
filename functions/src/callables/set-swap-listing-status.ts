import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

const FUNCTIONS_REGION = 'europe-west1';

interface SetSwapListingStatusInput {
  listingId: string;
  action: 'pause' | 'resume' | 'remove';
}

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
): string {
  const value = record[field];
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpsError('failed-precondition', `Feld ${field} fehlt.`);
  }
  return value.trim();
}

function parseRequest(data: unknown): SetSwapListingStatusInput {
  if (!isRecord(data)) {
    throw new HttpsError('invalid-argument', 'Ungültige Listing-Aktion.');
  }

  const listingId = data.listingId;
  const action = data.action;
  if (
    typeof listingId !== 'string' ||
    !listingId.trim() ||
    listingId.length > 180 ||
    listingId.includes('/') ||
    (action !== 'pause' && action !== 'resume' && action !== 'remove')
  ) {
    throw new HttpsError('invalid-argument', 'Ungültige Listing-Aktion.');
  }

  return { listingId: listingId.trim(), action };
}

function nextStatus(
  currentStatus: unknown,
  action: SetSwapListingStatusInput['action'],
): 'active' | 'paused' | 'removed' {
  if (action === 'pause' && currentStatus === 'active') {
    return 'paused';
  }
  if (action === 'resume' && currentStatus === 'paused') {
    return 'active';
  }
  if (
    action === 'remove' &&
    (currentStatus === 'active' || currentStatus === 'paused')
  ) {
    return 'removed';
  }

  throw new HttpsError(
    'failed-precondition',
    'Diese Listing-Aktion ist im aktuellen Status nicht erlaubt.',
  );
}

async function expireOpenOffers(listingId: string): Promise<void> {
  const db = getFirestore();
  const snapshot = await db
    .collection('swapOffers')
    .where('requestedListingId', '==', listingId)
    .get();
  const sentOffers = snapshot.docs.filter(
    (doc) => doc.data().status === 'sent',
  );
  if (sentOffers.length === 0) {
    return;
  }

  const batch = db.batch();
  const now = FieldValue.serverTimestamp();
  for (const doc of sentOffers.slice(0, 400)) {
    const offer = doc.data();
    const requesterId = requiredString(offer, 'requesterId');
    const offeredWardrobeItemId = requiredString(
      offer,
      'offeredWardrobeItemId',
    );
    batch.update(doc.ref, { status: 'expired', updatedAt: now });
    batch.delete(db.collection('swapLocks').doc(offeredWardrobeItemId));
    batch.delete(
      db.collection('swapOfferKeys').doc(`${listingId}_${requesterId}`),
    );
  }
  await batch.commit();
}

export const setSwapListingStatus = onCall(
  {
    region: FUNCTIONS_REGION,
    timeoutSeconds: 45,
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
    const listingRef = db.collection('swapListings').doc(input.listingId);
    const initialSnapshot = await listingRef.get();
    if (!initialSnapshot.exists) {
      throw new HttpsError('not-found', 'Listing wurde nicht gefunden.');
    }

    const initialListing = initialSnapshot.data();
    if (!initialListing || initialListing.ownerId !== uid) {
      throw new HttpsError(
        'permission-denied',
        'Dieses Listing gehört dir nicht.',
      );
    }

    const targetStatus = nextStatus(initialListing.status, input.action);
    const publicImagePath = requiredString(initialListing, 'publicImagePath');
    const wardrobeItemId = requiredString(initialListing, 'wardrobeItemId');
    const itemRef = db.collection('wardrobeItems').doc(wardrobeItemId);
    const publicFile = getStorage().bucket().file(publicImagePath);
    let deletedPublicMedia = false;

    if (targetStatus === 'removed') {
      try {
        await publicFile.delete({ ignoreNotFound: true });
        deletedPublicMedia = true;
      } catch (error: unknown) {
        logger.error('Could not remove public OmniSwap media', error);
        throw new HttpsError(
          'internal',
          'Öffentliches Listing-Bild konnte nicht sicher entfernt werden.',
        );
      }
    }

    try {
      await db.runTransaction(async (transaction) => {
        const [listingSnapshot, itemSnapshot] = await Promise.all([
          transaction.get(listingRef),
          transaction.get(itemRef),
        ]);

        if (!listingSnapshot.exists || !itemSnapshot.exists) {
          throw new HttpsError(
            'failed-precondition',
            'Listing oder Kleidungsstück ist nicht mehr verfügbar.',
          );
        }

        const listing = listingSnapshot.data();
        const item = itemSnapshot.data();
        if (
          !listing ||
          !item ||
          listing.ownerId !== uid ||
          item.ownerId !== uid
        ) {
          throw new HttpsError(
            'permission-denied',
            'Eigentümerprüfung fehlgeschlagen.',
          );
        }

        const verifiedTargetStatus = nextStatus(listing.status, input.action);
        if (verifiedTargetStatus !== targetStatus) {
          throw new HttpsError('aborted', 'Listing-Status hat sich geändert.');
        }
        if (
          item.isListedForSwap !== true ||
          item.swapListingId !== input.listingId
        ) {
          throw new HttpsError(
            'failed-precondition',
            'Wardrobe-Verknüpfung zum Listing ist inkonsistent.',
          );
        }

        const now = FieldValue.serverTimestamp();
        transaction.update(listingRef, {
          status: targetStatus,
          updatedAt: now,
        });

        if (targetStatus === 'removed') {
          transaction.update(itemRef, {
            isListedForSwap: false,
            swapListingId: null,
            updatedAt: now,
          });
        }
      });
    } catch (error: unknown) {
      if (deletedPublicMedia) {
        try {
          const latestItem = await itemRef.get();
          const imagePath = latestItem.data()?.imagePath;
          if (typeof imagePath === 'string' && imagePath) {
            await getStorage().bucket().file(imagePath).copy(publicFile);
          }
        } catch (restoreError: unknown) {
          logger.error(
            'Failed to restore public listing image after rollback',
            restoreError,
          );
        }
      }
      if (error instanceof HttpsError) {
        throw error;
      }
      logger.error('Failed to change OmniSwap listing status', error);
      throw new HttpsError(
        'internal',
        'Listing-Status konnte nicht geändert werden.',
      );
    }

    if (targetStatus === 'removed') {
      try {
        await expireOpenOffers(input.listingId);
      } catch (error: unknown) {
        logger.error('Failed to expire offers after listing removal', error);
      }
    }

    return { listingId: input.listingId, status: targetStatus };
  },
);
