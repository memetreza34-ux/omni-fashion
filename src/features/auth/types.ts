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
