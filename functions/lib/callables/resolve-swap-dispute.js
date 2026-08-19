import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { requireModerator } from '../moderation/auth.js';
const FUNCTIONS_REGION = 'europe-west1';
const AUDIT_SCHEMA_VERSION = 1;
function ensureAdminInitialized() {
    if (getApps().length === 0) {
        initializeApp();
    }
}
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
function parseRequest(data) {
    if (!isRecord(data)) {
        throw new HttpsError('invalid-argument', 'Ungültige Streitfallentscheidung.');
    }
    const transactionId = data.transactionId;
    const resolution = data.resolution;
    const note = data.note;
    if (typeof transactionId !== 'string' ||
        !transactionId.trim() ||
        transactionId.length > 180 ||
        transactionId.includes('/') ||
        (resolution !== 'resume_trade' && resolution !== 'manual_recovery') ||
        typeof note !== 'string' ||
        note.trim().length > 1500) {
        throw new HttpsError('invalid-argument', 'Ungültige Streitfallentscheidung.');
    }
    return {
        transactionId: transactionId.trim(),
        resolution,
        note: note.trim(),
    };
}
function resumableStatus(value) {
    if (value === 'accepted' ||
        value === 'address_or_meetup' ||
        value === 'shipped' ||
        value === 'received') {
        return value;
    }
    throw new HttpsError('failed-precondition', 'Der gespeicherte Trade-Zustand kann nicht sicher wiederhergestellt werden.');
}
export const resolveSwapDispute = onCall({
    region: FUNCTIONS_REGION,
    timeoutSeconds: 30,
    memory: '256MiB',
}, async (request) => {
    const moderatorId = requireModerator(request.auth);
    const input = parseRequest(request.data);
    ensureAdminInitialized();
    const db = getFirestore();
    const disputeRef = db.collection('swapDisputes').doc(input.transactionId);
    const swapRef = db.collection('swapTransactions').doc(input.transactionId);
    const auditRef = db.collection('moderationAudit').doc();
    await db.runTransaction(async (transaction) => {
        const [disputeSnapshot, swapSnapshot] = await Promise.all([
            transaction.get(disputeRef),
            transaction.get(swapRef),
        ]);
        if (!disputeSnapshot.exists || !swapSnapshot.exists) {
            throw new HttpsError('not-found', 'Streitfall oder Trade wurde nicht gefunden.');
        }
        const dispute = disputeSnapshot.data();
        const swap = swapSnapshot.data();
        if (!dispute || !swap) {
            throw new HttpsError('internal', 'Streitfalldaten konnten nicht gelesen werden.');
        }
        if (dispute.status !== 'open' || swap.status !== 'disputed') {
            throw new HttpsError('failed-precondition', 'Dieser Streitfall ist nicht mehr offen.');
        }
        if (swap.finalizationState === 'processing' ||
            swap.finalizationState === 'completed') {
            throw new HttpsError('failed-precondition', 'Der Trade befindet sich bereits in einer nicht sicher rücksetzbaren Finalisierung.');
        }
        const now = FieldValue.serverTimestamp();
        let restoredStatus = null;
        if (input.resolution === 'resume_trade') {
            restoredStatus = resumableStatus(dispute.previousTransactionStatus);
            transaction.update(swapRef, {
                status: restoredStatus,
                updatedAt: now,
            });
        }
        transaction.update(disputeRef, {
            status: 'resolved',
            resolution: input.resolution,
            resolutionNote: input.note,
            resolvedById: moderatorId,
            resolvedAt: now,
            updatedAt: now,
        });
        transaction.set(auditRef, {
            actorId: moderatorId,
            action: 'resolve_swap_dispute',
            targetType: 'swapTransaction',
            targetId: input.transactionId,
            outcome: input.resolution,
            restoredStatus,
            note: input.note,
            createdAt: now,
            schemaVersion: AUDIT_SCHEMA_VERSION,
        });
    });
    return {
        transactionId: input.transactionId,
        status: 'resolved',
        resolution: input.resolution,
    };
});
//# sourceMappingURL=resolve-swap-dispute.js.map