import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
const FUNCTIONS_REGION = 'europe-west1';
const REVIEW_SCHEMA_VERSION = 1;
function ensureAdminInitialized() {
    if (getApps().length === 0)
        initializeApp();
}
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
function parseRequest(data) {
    if (!isRecord(data)) {
        throw new HttpsError('invalid-argument', 'Ungültige Bewertung.');
    }
    const transactionId = data.transactionId;
    const rating = data.rating;
    const comment = data.comment;
    if (typeof transactionId !== 'string' ||
        !transactionId.trim() ||
        transactionId.length > 180 ||
        transactionId.includes('/') ||
        typeof rating !== 'number' ||
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5 ||
        typeof comment !== 'string' ||
        comment.trim().length > 500) {
        throw new HttpsError('invalid-argument', 'Ungültige Bewertung.');
    }
    return {
        transactionId: transactionId.trim(),
        rating: rating,
        comment: comment.trim(),
    };
}
function participants(value) {
    if (!Array.isArray(value) ||
        value.length !== 2 ||
        typeof value[0] !== 'string' ||
        typeof value[1] !== 'string' ||
        !value[0] ||
        !value[1] ||
        value[0] === value[1]) {
        throw new HttpsError('failed-precondition', 'Trade-Teilnehmer sind ungültig.');
    }
    return [value[0], value[1]];
}
export const submitSwapReview = onCall({ region: FUNCTIONS_REGION, timeoutSeconds: 30, memory: '256MiB' }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new HttpsError('unauthenticated', 'Anmeldung erforderlich.');
    const input = parseRequest(request.data);
    ensureAdminInitialized();
    const db = getFirestore();
    const transactionRef = db
        .collection('swapTransactions')
        .doc(input.transactionId);
    const reviewId = `${input.transactionId}_${uid}`;
    const reviewRef = db.collection('reviews').doc(reviewId);
    await db.runTransaction(async (transaction) => {
        const [swapSnapshot, reviewSnapshot] = await Promise.all([
            transaction.get(transactionRef),
            transaction.get(reviewRef),
        ]);
        if (!swapSnapshot.exists) {
            throw new HttpsError('not-found', 'Trade wurde nicht gefunden.');
        }
        if (reviewSnapshot.exists) {
            throw new HttpsError('already-exists', 'Du hast diesen Trade bereits bewertet.');
        }
        const swap = swapSnapshot.data();
        if (!swap) {
            throw new HttpsError('internal', 'Trade konnte nicht gelesen werden.');
        }
        const participantIds = participants(swap.participantIds);
        if (!participantIds.includes(uid)) {
            throw new HttpsError('permission-denied', 'Du bist kein Teilnehmer dieses Trades.');
        }
        if (swap.status !== 'completed' ||
            swap.finalizationState !== 'completed') {
            throw new HttpsError('failed-precondition', 'Bewertungen sind erst nach vollständig abgeschlossenem Tausch möglich.');
        }
        const revieweeId = participantIds.find((id) => id !== uid);
        if (!revieweeId) {
            throw new HttpsError('failed-precondition', 'Gegenpartei fehlt.');
        }
        transaction.set(reviewRef, {
            transactionId: input.transactionId,
            reviewerId: uid,
            revieweeId,
            rating: input.rating,
            comment: input.comment,
            createdAt: FieldValue.serverTimestamp(),
            schemaVersion: REVIEW_SCHEMA_VERSION,
        });
    });
    return { reviewId, created: true };
});
//# sourceMappingURL=submit-swap-review.js.map