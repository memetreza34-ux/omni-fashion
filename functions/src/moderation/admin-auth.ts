import { HttpsError } from 'firebase-functions/v2/https';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function requireAdmin(auth: {
  uid: string;
  token: unknown;
} | undefined): string {
  if (!auth?.uid) {
    throw new HttpsError('unauthenticated', 'Anmeldung erforderlich.');
  }

  if (!isRecord(auth.token) || auth.token.admin !== true) {
    throw new HttpsError(
      'permission-denied',
      'Für diese Aktion ist eine Admin-Rolle erforderlich.',
    );
  }

  return auth.uid;
}
