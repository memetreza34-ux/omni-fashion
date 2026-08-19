import { HttpsError } from 'firebase-functions/v2/https';
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
export function requireModerator(auth) {
    if (!auth?.uid) {
        throw new HttpsError('unauthenticated', 'Anmeldung erforderlich.');
    }
    const token = auth.token;
    if (!isRecord(token) || (token.admin !== true && token.moderator !== true)) {
        throw new HttpsError('permission-denied', 'Für diese Aktion ist eine Moderationsrolle erforderlich.');
    }
    return auth.uid;
}
//# sourceMappingURL=auth.js.map