import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
const FUNCTIONS_REGION = 'europe-west1';
function ensureAdminInitialized() {
    if (getApps().length === 0) {
        initializeApp();
    }
}
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
function parseOfferId(data) {
    if (!isRecord(data)) {
        throw new HttpsError('invalid-argument', 'Ungültige Stornierung.');
    }
    const offerId = data.offerId;
    if (typeof offerId !== 'string' ||
        !offerId.trim() ||
        offerId.length > 180 ||
        offerId.includes('/')) {
        throw new HttpsError('invalid-argument', 'Ungültige Stornierung.');
    }
    return offerId.trim();
}
function requiredString(record, field) {
    const value = record[field];
    if (typeof value !== 'string' || !value.trim()) {
        throw new HttpsError('failed-precondition', `Feld ${field} fehlt.`);
    }
    return value.trim();
}
export const cancelSwapOffer = onCall({
    region: FUNCTIONS_REGION,
    timeoutSeconds: 30,
    memory: '256MiB',
}, async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new HttpsError('unauthenticated', 'Anmeldung erforderlich.');
    }
    const offerId = parseOfferId(request.data);
    ensureAdminInitialized();
    const db = getFirestore();
    const offerRef = db.collection('swapOffers').doc(offerId);
    await db.runTransaction(async (transaction) => {
        const offerSnapshot = await transaction.get(offerRef);
        if (!offerSnapshot.exists) {
            throw new HttpsError('not-found', 'Tauschangebot wurde nicht gefunden.');
        }
        const offer = offerSnapshot.data();
        if (!offer) {
            throw new HttpsError('internal', 'Tauschangebot konnte nicht gelesen werden.');
        }
        const requesterId = requiredString(offer, 'requesterId');
        const listingId = requiredString(offer, 'requestedListingId');
        const offeredWardrobeItemId = requiredString(offer, 'offeredWardrobeItemId');
        if (requesterId !== uid) {
            throw new HttpsError('permission-denied', 'Nur die anfragende Person kann dieses Angebot zurückziehen.');
        }
        if (offer.status !== 'sent') {
            throw new HttpsError('failed-precondition', 'Nur offene Angebote können zurückgezogen werden.');
        }
        const lockRef = db.collection('swapLocks').doc(offeredWardrobeItemId);
        const keyRef = db
            .collection('swapOfferKeys')
            .doc(`${listingId}_${requesterId}`);
        const [lockSnapshot, keySnapshot] = await Promise.all([
            transaction.get(lockRef),
            transaction.get(keyRef),
        ]);
        if (!lockSnapshot.exists ||
            lockSnapshot.data()?.offerId !== offerId ||
            !keySnapshot.exists ||
            keySnapshot.data()?.offerId !== offerId) {
            throw new HttpsError('failed-precondition', 'Der Reservierungs-Lock dieses Angebots ist inkonsistent.');
        }
        transaction.update(offerRef, {
            status: 'cancelled',
            updatedAt: FieldValue.serverTimestamp(),
        });
        transaction.delete(lockRef);
        transaction.delete(keyRef);
    });
    return { offerId, status: 'cancelled' };
});
//# sourceMappingURL=cancel-swap-offer.js.map