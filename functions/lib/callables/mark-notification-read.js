import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
const FUNCTIONS_REGION = 'europe-west1';
function ensureAdminInitialized() {
    if (getApps().length === 0)
        initializeApp();
}
function parseNotificationId(data) {
    if (typeof data !== 'object' ||
        data === null ||
        !('notificationId' in data) ||
        typeof data.notificationId !== 'string' ||
        !data.notificationId.trim() ||
        data.notificationId.length > 180 ||
        data.notificationId.includes('/')) {
        throw new HttpsError('invalid-argument', 'Ungültige Notification-ID.');
    }
    return data.notificationId.trim();
}
export const markNotificationRead = onCall({ region: FUNCTIONS_REGION, timeoutSeconds: 30, memory: '256MiB' }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new HttpsError('unauthenticated', 'Anmeldung erforderlich.');
    const notificationId = parseNotificationId(request.data);
    ensureAdminInitialized();
    const ref = getFirestore().collection('notifications').doc(notificationId);
    await getFirestore().runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists) {
            throw new HttpsError('not-found', 'Notification wurde nicht gefunden.');
        }
        const data = snapshot.data();
        if (!data || data.userId !== uid) {
            throw new HttpsError('permission-denied', 'Diese Notification gehört dir nicht.');
        }
        if (data.readAt !== null && data.readAt !== undefined) {
            return;
        }
        transaction.update(ref, { readAt: FieldValue.serverTimestamp() });
    });
    return { notificationId, read: true };
});
//# sourceMappingURL=mark-notification-read.js.map