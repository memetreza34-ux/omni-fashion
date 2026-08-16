export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  isDevelopmentDemo: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  displayName: string;
}

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_ALREADY_IN_USE'
  | 'INVALID_EMAIL'
  | 'WEAK_PASSWORD'
  | 'TOO_MANY_ATTEMPTS'
  | 'NETWORK_UNAVAILABLE'
  | 'USER_DISABLED'
  | 'BACKEND_NOT_CONFIGURED'
  | 'UNKNOWN';

export interface AuthActionError {
  code: AuthErrorCode;
  message: string;
}
