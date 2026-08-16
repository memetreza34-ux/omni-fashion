import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

const FUNCTIONS_REGION = 'europe-west1';
const TRANSACTION_SCHEMA_VERSION = 2;

interface RespondSwapOfferInput {
  offerId: string;
  decision: 'accept' | 'decline';
}

function ensureAdminInitialized(): void {
  if (getApps().length === 0) {
    initializeApp();
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseRequest(data: unknown): RespondSwapOfferInput {
  if (!isRecord(data)) {
    throw new HttpsError('invalid-argument', 'Ungültige Angebotsantwort.');
  }

  const offerId = data.offerId;
  const decision = data.decision;
  if (
    typeof offerId !== 'string' ||
    !offerId.trim() ||
    offerId.length > 180 ||
    offerId.includes('/') ||
    (decision !== 'accept' && decision !== 'decline')
  ) {
    throw new HttpsError('invalid-argument', 'Ungültige Angebotsantwort.');
  }

  return { offerId: offerId.trim(), decision };
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

function offerKeyId(listingId: string, requesterId: string): string {
  return `${listingId}_${requesterId}`;
}

async function expireCompetingOffers(
  acceptedOfferId: string,
  listingId: string,
): Promise<void> {
  const db = getFirestore();
  const snapshot = await db
    .collection('swapOffers')
    .where('requestedListingId', '==', listingId)
    .get();

  const competing = snapshot.docs.filter(
    (doc) => doc.id !== acceptedOfferId && doc.data().status === 'sent',
  );
  if (competing.length === 0) {
    return;
  }

  const batch = db.batch();
  const now = FieldValue.serverTimestamp();

  for (const doc of competing.slice(0, 400)) {
    const data = doc.data();
    const requesterId = requiredString(data, 'requesterId');
    const offeredWardrobeItemId = requiredString(
      data,
      'offeredWardrobeItemId',
    );

    batch.update(doc.ref, {
      status: 'expired',
      updatedAt: now,
    });
    batch.delete(db.collection('swapLocks').doc(offeredWardrobeItemId));
    batch.delete(
      db.collection('swapOfferKeys').doc(offerKeyId(listingId, requesterId)),
    );
  }

  await batch.commit();
}

export const respondSwapOffer = onCall(
  {
    region: FUNCTIONS_REGION,
    timeoutSeconds: 30,
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
    const offerRef = db.collection('swapOffers').doc(input.offerId);
    const transactionRef = db.collection('swapTransactions').doc();

    let acceptedListingId: string | null = null;
    let transactionId: string | null = null;

    await db.runTransaction(async (transaction) => {
      const offerSnapshot = await transaction.get(offerRef);
      if (!offerSnapshot.exists) {
        throw new HttpsError('not-found', 'Tauschangebot wurde nicht gefunden.');
      }

      const offer = offerSnapshot.data();
      if (!offer) {
        throw new HttpsError('internal', 'Tauschangebot konnte nicht gelesen werden.');
      }

      const listingOwnerId = requiredString(offer, 'listingOwnerId');
      const requesterId = requiredString(offer, 'requesterId');
      const listingId = requiredString(offer, 'requestedListingId');
      const offeredWardrobeItemId = requiredString(
        offer,
        'offeredWardrobeItemId',
      );
      const requestedWardrobeItemId = requiredString(
        offer,
        'requestedWardrobeItemId',
      );

      if (listingOwnerId !== uid) {
        throw new HttpsError(
          'permission-denied',
          'Nur die Listing-Eigentümerin oder der Listing-Eigentümer kann antworten.',
        );
      }
      if (offer.status !== 'sent') {
        throw new HttpsError(
          'failed-precondition',
          'Dieses Angebot ist nicht mehr offen.',
        );
      }

      const itemLockRef = db.collection('swapLocks').doc(offeredWardrobeItemId);
      const offerKeyRef = db
        .collection('swapOfferKeys')
        .doc(offerKeyId(listingId, requesterId));

      if (input.decision === 'decline') {
        transaction.update(offerRef, {
          status: 'declined',
          updatedAt: FieldValue.serverTimestamp(),
        });
        transaction.delete(itemLockRef);
        transaction.delete(offerKeyRef);
        return;
      }

      const listingRef = db.collection('swapListings').doc(listingId);
      const offeredItemRef = db
        .collection('wardrobeItems')
        .doc(offeredWardrobeItemId);
      const [listingSnapshot, offeredItemSnapshot, lockSnapshot, keySnapshot] =
        await Promise.all([
          transaction.get(listingRef),
          transaction.get(offeredItemRef),
          transaction.get(itemLockRef),
          transaction.get(offerKeyRef),
        ]);

      if (!listingSnapshot.exists || !offeredItemSnapshot.exists) {
        throw new HttpsError(
          'failed-precondition',
          'Mindestens ein Kleidungsstück ist nicht mehr verfügbar.',
        );
      }

      const listing = listingSnapshot.data();
      const offeredItem = offeredItemSnapshot.data();
      const lock = lockSnapshot.data();
      const key = keySnapshot.data();
      if (!listing || !offeredItem || !lock || !key) {
        throw new HttpsError(
          'failed-precondition',
          'Das Tauschangebot besitzt keinen gültigen Reservierungs-Lock.',
        );
      }
      if (listing.status !== 'active') {
        throw new HttpsError(
          'failed-precondition',
          'Das Listing ist nicht mehr verfügbar.',
        );
      }
      if (listing.ownerId !== uid) {
        throw new HttpsError(
          'permission-denied',
          'Listing-Eigentümerprüfung fehlgeschlagen.',
        );
      }
      if (offeredItem.ownerId !== requesterId) {
        throw new HttpsError(
          'failed-precondition',
          'Das angebotene Kleidungsstück gehört nicht mehr zum anfragenden Konto.',
        );
      }
      if (offeredItem.isListedForSwap === true || offeredItem.swapListingId) {
        throw new HttpsError(
          'failed-precondition',
          'Das angebotene Kleidungsstück wurde zwischenzeitlich anderweitig gelistet.',
        );
      }
      if (lock.offerId !== input.offerId || key.offerId !== input.offerId) {
        throw new HttpsError(
          'failed-precondition',
          'Der Reservierungs-Lock gehört nicht mehr zu diesem Angebot.',
        );
      }

      const now = FieldValue.serverTimestamp();
      transaction.update(listingRef, {
        status: 'reserved',
        updatedAt: now,
      });
      transaction.update(offerRef, {
        status: 'accepted',
        transactionId: transactionRef.id,
        updatedAt: now,
      });
      transaction.set(transactionRef, {
        offerId: input.offerId,
        listingId,
        participantIds: [requesterId, listingOwnerId],
        requesterId,
        listingOwnerId,
        requestedWardrobeItemId,
        offeredWardrobeItemId,
        status: 'accepted',
        fulfilmentMode: null,
        modeConfirmedByIds: [],
        shippedByIds: [],
        receivedByIds: [],
        finalizationState: 'pending',
        finalizationErrorCode: null,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        schemaVersion: TRANSACTION_SCHEMA_VERSION,
      });

      acceptedListingId = listingId;
      transactionId = transactionRef.id;
    });

    if (input.decision === 'accept' && acceptedListingId) {
      try {
        await expireCompetingOffers(input.offerId, acceptedListingId);
      } catch (error: unknown) {
        logger.error('Failed to expire competing OmniSwap offers', error);
      }
    }

    return {
      offerId: input.offerId,
      status:
        input.decision === 'accept'
          ? ('accepted' as const)
          : ('declined' as const),
      transactionId,
    };
  },
);
