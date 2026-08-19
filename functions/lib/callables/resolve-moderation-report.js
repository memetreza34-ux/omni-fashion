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
        throw new HttpsError('invalid-argument', 'Ungültige Moderationsentscheidung.');
    }
    const reportId = data.reportId;
    const resolution = data.resolution;
    const note = data.note;
    if (typeof reportId !== 'string' ||
        !reportId.trim() ||
        reportId.length > 180 ||
        reportId.includes('/') ||
        (resolution !== 'dismissed' && resolution !== 'action_required') ||
        typeof note !== 'string' ||
        note.trim().length > 1500) {
        throw new HttpsError('invalid-argument', 'Ungültige Moderationsentscheidung.');
    }
    return {
        reportId: reportId.trim(),
        resolution,
        note: note.trim(),
    };
}
export const resolveModerationReport = onCall({
    region: FUNCTIONS_REGION,
    timeoutSeconds: 30,
    memory: '256MiB',
}, async (request) => {
    const moderatorId = requireModerator(request.auth);
    const input = parseRequest(request.data);
    ensureAdminInitialized();
    const db = getFirestore();
    const reportRef = db.collection('reports').doc(input.reportId);
    const auditRef = db.collection('moderationAudit').doc();
    await db.runTransaction(async (transaction) => {
        const reportSnapshot = await transaction.get(reportRef);
        if (!reportSnapshot.exists) {
            throw new HttpsError('not-found', 'Meldung wurde nicht gefunden.');
        }
        const report = reportSnapshot.data();
        if (!report || report.status !== 'open') {
            throw new HttpsError('failed-precondition', 'Diese Meldung ist nicht mehr offen.');
        }
        const now = FieldValue.serverTimestamp();
        transaction.update(reportRef, {
            status: 'resolved',
            resolution: input.resolution,
            resolutionNote: input.note,
            resolvedById: moderatorId,
            resolvedAt: now,
            updatedAt: now,
        });
        transaction.set(auditRef, {
            actorId: moderatorId,
            action: 'resolve_report',
            targetType: 'report',
            targetId: input.reportId,
            outcome: input.resolution,
            note: input.note,
            createdAt: now,
            schemaVersion: AUDIT_SCHEMA_VERSION,
        });
    });
    return {
        reportId: input.reportId,
        status: 'resolved',
        resolution: input.resolution,
    };
});
//# sourceMappingURL=resolve-moderation-report.js.map