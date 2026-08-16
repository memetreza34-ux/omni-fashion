import { HttpsError } from 'firebase-functions/v2/https';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function requireModerator(auth: {
  uid: string;
  token: unknown;
} | undefined): string {
  if (!auth?.uid) {
    throw new HttpsError('unauthenticated', 'Anmeldung erforderlich.');
  }

  const token = auth.token;
  if (
    !isRecord(token) ||
    (token.admin !== true && token.moderator !== true)
  ) {
    throw new HttpsError(
      'permission-denied',
      'Für diese Aktion ist eine Moderationsrolle erforderlich.',
    );
  }

  return auth.uid;
}
