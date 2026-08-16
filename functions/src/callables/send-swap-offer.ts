import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

const FUNCTIONS_REGION = 'europe-west1';
const OFFER_SCHEMA_VERSION = 1;

interface SendSwapOfferInput {
  requestedListingId: string;
  offeredWardrobeItemId: string;
}

function ensureAdminInitialized(): void {
  if (getApps().length === 0) {
    initializeApp();
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseId(value: unknown, field: string): string {
  if (
    typeof value !== 'string' ||
    !value.trim() ||
    value.length > 180 ||
    value.includes('/')
  ) {
    throw new HttpsError('invalid-argument', `${field} ist ungültig.`);
  }
  return value.trim();
}

function parseRequest(data: unknown): SendSwapOfferInput {
  if (!isRecord(data)) {
    throw new HttpsError('invalid-argument', 'Ungültiges Tauschangebot.');
  }

  return {
    requestedListingId: parseId(data.requestedListingId, 'requestedListingId'),
    offeredWardrobeItemId: parseId(
      data.offeredWardrobeItemId,
      'offeredWardrobeItemId',
    ),
  };
}

function requiredString(
  record: Record<string, unknown>,
  field: string,
): string {
  const value = record[field];
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpsError(
      'failed-precondition',
      `Benötigtes Feld ${field} fehlt.`,
    );
  }
  return value.trim();
}

function nullableString(
  record: Record<string, unknown>,
  field: string,
): string | null {
  const value = record[field];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function snapshotFromWardrobe(
  itemId: string,
  item: Record<string, unknown>,
) {
  return {
    wardrobeItemId: itemId,
    title: requiredString(item, 'name'),
    category: requiredString(item, 'category'),
    subcategory: nullableString(item, 'subcategory'),
    color: requiredString(item, 'color'),
    brand: nullableString(item, 'brand'),
    size: nullableString(item, 'size'),
    condition: requiredString(item, 'condition'),
  };
}

function snapshotFromListing(listing: Record<string, unknown>) {
  return {
    wardrobeItemId: requiredString(listing, 'wardrobeItemId'),
    title: requiredString(listing, 'title'),
    category: requiredString(listing, 'category'),
    subcategory: nullableString(listing, 'subcategory'),
    color: requiredString(listing, 'color'),
    brand: nullableString(listing, 'brand'),
    size: nullableString(listing, 'size'),
    condition: requiredString(listing, 'condition'),
  };
}

function offerKeyId(listingId: string, requesterId: string): string {
  return `${listingId}_${requesterId}`;
}

export const sendSwapOffer = onCall(
  {
    region: FUNCTIONS_REGION,
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (request) => {
    const requesterId = request.auth?.uid;
    if (!requesterId) {
      throw new HttpsError('unauthenticated', 'Anmeldung erforderlich.');
    }

    const input = parseRequest(request.data);
    ensureAdminInitialized();

    const db = getFirestore();
    const offerRef = db.collection('swapOffers').doc();
    const listingRef = db.collection('swapListings').doc(input.requestedListingId);
    const offeredItemRef = db
      .collection('wardrobeItems')
      .doc(input.offeredWardrobeItemId);
    const itemLockRef = db
      .collection('swapLocks')
      .doc(input.offeredWardrobeItemId);
    const offerKeyRef = db
      .collection('swapOfferKeys')
      .doc(offerKeyId(input.requestedListingId, requesterId));

    await db.runTransaction(async (transaction) => {
      const [listingSnapshot, offeredSnapshot, lockSnapshot, keySnapshot] =
        await Promise.all([
          transaction.get(listingRef),
          transaction.get(offeredItemRef),
          transaction.get(itemLockRef),
          transaction.get(offerKeyRef),
        ]);

      if (!listingSnapshot.exists) {
        throw new HttpsError('not-found', 'Listing wurde nicht gefunden.');
      }
      if (!offeredSnapshot.exists) {
        throw new HttpsError(
          'not-found',
          'Dein angebotenes Kleidungsstück wurde nicht gefunden.',
        );
      }
      if (lockSnapshot.exists) {
        throw new HttpsError(
          'failed-precondition',
          'Dieses Kleidungsstück steckt bereits in einem aktiven Tauschangebot.',
        );
      }
      if (keySnapshot.exists) {
        throw new HttpsError(
          'already-exists',
          'Du hast für dieses Listing bereits ein aktives Angebot.',
        );
      }

      const listing = listingSnapshot.data();
      const offeredItem = offeredSnapshot.data();
      if (!listing || !offeredItem) {
        throw new HttpsError('internal', 'Tauschdaten konnten nicht gelesen werden.');
      }

      const listingOwnerId = requiredString(listing, 'ownerId');
      if (listingOwnerId === requesterId) {
        throw new HttpsError(
          'failed-precondition',
          'Du kannst dein eigenes Listing nicht ertauschen.',
        );
      }
      if (listing.status !== 'active') {
        throw new HttpsError(
          'failed-precondition',
          'Dieses Listing ist nicht mehr verfügbar.',
        );
      }
      if (offeredItem.ownerId !== requesterId) {
        throw new HttpsError(
          'permission-denied',
          'Das angebotene Kleidungsstück gehört nicht zu deinem Schrank.',
        );
      }
      if (offeredItem.isListedForSwap === true || offeredItem.swapListingId) {
        throw new HttpsError(
          'failed-precondition',
          'Ein bereits gelistetes Kleidungsstück kann nicht gleichzeitig angeboten werden.',
        );
      }

      const requestedWardrobeItemId = requiredString(
        listing,
        'wardrobeItemId',
      );
      if (requestedWardrobeItemId === input.offeredWardrobeItemId) {
        throw new HttpsError('failed-precondition', 'Ungültiger Eigentausch.');
      }

      const now = FieldValue.serverTimestamp();
      transaction.set(offerRef, {
        requesterId,
        listingOwnerId,
        requestedListingId: input.requestedListingId,
        requestedWardrobeItemId,
        offeredWardrobeItemId: input.offeredWardrobeItemId,
        requestedSnapshot: snapshotFromListing(listing),
        offeredSnapshot: snapshotFromWardrobe(
          input.offeredWardrobeItemId,
          offeredItem,
        ),
        status: 'sent',
        transactionId: null,
        createdAt: now,
        updatedAt: now,
        schemaVersion: OFFER_SCHEMA_VERSION,
      });
      transaction.set(itemLockRef, {
        ownerId: requesterId,
        offerId: offerRef.id,
        listingId: input.requestedListingId,
        createdAt: now,
      });
      transaction.set(offerKeyRef, {
        requesterId,
        listingId: input.requestedListingId,
        offerId: offerRef.id,
        createdAt: now,
      });
    });

    return {
      offerId: offerRef.id,
      status: 'sent' as const,
    };
  },
);
