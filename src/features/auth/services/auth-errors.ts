import type { AuthActionError, AuthErrorCode } from '../types';

function readErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
}

function mapFirebaseCode(code: string | null): AuthErrorCode {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'INVALID_CREDENTIALS';
    case 'auth/email-already-in-use':
      return 'EMAIL_ALREADY_IN_USE';
    case 'auth/invalid-email':
      return 'INVALID_EMAIL';
    case 'auth/weak-password':
      return 'WEAK_PASSWORD';
    case 'auth/too-many-requests':
      return 'TOO_MANY_ATTEMPTS';
    case 'auth/network-request-failed':
      return 'NETWORK_UNAVAILABLE';
    case 'auth/user-disabled':
      return 'USER_DISABLED';
    default:
      if (code === 'FIREBASE_NOT_CONFIGURED') {
        return 'BACKEND_NOT_CONFIGURED';
      }
      return 'UNKNOWN';
  }
}

function messageForCode(code: AuthErrorCode): string {
  switch (code) {
    case 'INVALID_CREDENTIALS':
      return 'E-Mail oder Passwort sind nicht korrekt.';
    case 'EMAIL_ALREADY_IN_USE':
      return 'Für diese E-Mail existiert bereits ein Konto.';
    case 'INVALID_EMAIL':
      return 'Bitte eine gültige E-Mail-Adresse eingeben.';
    case 'WEAK_PASSWORD':
      return 'Das Passwort erfüllt die Sicherheitsanforderungen noch nicht.';
    case 'TOO_MANY_ATTEMPTS':
      return 'Zu viele Versuche. Bitte später erneut versuchen.';
    case 'NETWORK_UNAVAILABLE':
      return 'Keine stabile Verbindung. Bitte Netzwerk prüfen und erneut versuchen.';
    case 'USER_DISABLED':
      return 'Dieses Konto ist derzeit deaktiviert.';
    case 'BACKEND_NOT_CONFIGURED':
      return 'Die Authentifizierung ist für diese Umgebung noch nicht eingerichtet.';
    case 'UNKNOWN':
      return 'Die Aktion konnte nicht abgeschlossen werden. Bitte erneut versuchen.';
  }
}

export function normalizeAuthError(error: unknown): AuthActionError {
  const rawCode = readErrorCode(error);
  const code = mapFirebaseCode(rawCode);

  return {
    code,
    message: messageForCode(code),
  };
}
