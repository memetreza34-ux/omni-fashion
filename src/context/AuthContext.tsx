import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  loginWithEmail,
  logoutFirebaseUser,
  refreshCurrentAuthUser,
  registerWithEmail,
  requestPasswordReset as requestFirebasePasswordReset,
  resendCurrentUserVerification,
  subscribeToAuthUser,
} from '@/features/auth/services/auth-service';
import type {
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
} from '@/features/auth/types';
import { createUserProfileIfMissing } from '@/features/profile/services/profile-service';
import { isFirebaseConfigured } from '@/services/firebase/app';

const DEVELOPMENT_DEMO_USER_KEY = '@omni_fashion_dev_user';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isBackendConfigured: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshUser: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isStoredAuthUser(value: unknown): value is AuthUser {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<AuthUser>;

  return (
    typeof candidate.id === 'string' &&
    (typeof candidate.email === 'string' || candidate.email === null) &&
    (typeof candidate.displayName === 'string' ||
      candidate.displayName === null) &&
    typeof candidate.emailVerified === 'boolean' &&
    typeof candidate.isDevelopmentDemo === 'boolean'
  );
}

function getDefaultLocale(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale || 'de-DE';
  } catch {
    return 'de-DE';
  }
}

async function ensureOmniFashionProfile(user: AuthUser): Promise<void> {
  if (user.isDevelopmentDemo) {
    return;
  }

  await createUserProfileIfMissing({
    userId: user.id,
    displayName: user.displayName,
    locale: getDefaultLocale(),
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isFirebaseConfigured) {
      const unsubscribe = subscribeToAuthUser((nextUser) => {
        const synchronizeUser = async () => {
          try {
            if (nextUser) {
              await ensureOmniFashionProfile(nextUser);
            }
            setUser(nextUser);
          } catch (error: unknown) {
            console.error('Failed to synchronize Omni Fashion profile', error);
            setUser(nextUser);
          } finally {
            setIsLoading(false);
          }
        };

        void synchronizeUser();
      });

      return unsubscribe;
    }

    const loadDevelopmentSession = async () => {
      try {
        if (!__DEV__) {
          return;
        }

        const storedUser = await AsyncStorage.getItem(
          DEVELOPMENT_DEMO_USER_KEY,
        );

        if (!storedUser) {
          return;
        }

        const parsed: unknown = JSON.parse(storedUser);
        if (isStoredAuthUser(parsed) && parsed.isDevelopmentDemo) {
          setUser(parsed);
        }
      } catch (error: unknown) {
        console.error('Failed to load development auth session', error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadDevelopmentSession();

    return undefined;
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);

    try {
      if (isFirebaseConfigured) {
        const authenticatedUser = await loginWithEmail(credentials);
        await ensureOmniFashionProfile(authenticatedUser);
        setUser(authenticatedUser);
        return;
      }

      if (!__DEV__) {
        throw new Error(
          'AUTH_BACKEND_NOT_CONFIGURED: Firebase must be configured for release builds.',
        );
      }

      const developmentUser: AuthUser = {
        id: 'development-demo-user',
        email: credentials.email,
        displayName: 'Development Demo',
        emailVerified: true,
        isDevelopmentDemo: true,
      };

      await AsyncStorage.setItem(
        DEVELOPMENT_DEMO_USER_KEY,
        JSON.stringify(developmentUser),
      );
      setUser(developmentUser);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    if (!isFirebaseConfigured) {
      throw new Error(
        'AUTH_BACKEND_NOT_CONFIGURED: Registration requires a configured Firebase project.',
      );
    }

    setIsLoading(true);

    try {
      const registeredUser = await registerWithEmail(credentials);
      await ensureOmniFashionProfile(registeredUser);
      setUser(registeredUser);
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerification = async () => {
    if (!isFirebaseConfigured) {
      throw new Error(
        'AUTH_BACKEND_NOT_CONFIGURED: Verification requires Firebase.',
      );
    }

    await resendCurrentUserVerification();
  };

  const refreshUser = async () => {
    if (!isFirebaseConfigured || user?.isDevelopmentDemo) {
      return;
    }

    const refreshedUser = await refreshCurrentAuthUser();
    setUser(refreshedUser);
  };

  const requestPasswordReset = async (email: string) => {
    if (!isFirebaseConfigured) {
      throw new Error(
        'AUTH_BACKEND_NOT_CONFIGURED: Password reset requires Firebase.',
      );
    }

    await requestFirebasePasswordReset(email);
  };

  const logout = async () => {
    setIsLoading(true);

    try {
      if (user?.isDevelopmentDemo || !isFirebaseConfigured) {
        await AsyncStorage.removeItem(DEVELOPMENT_DEMO_USER_KEY);
        setUser(null);
        return;
      }

      await logoutFirebaseUser();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isBackendConfigured: isFirebaseConfigured,
        login,
        register,
        resendVerification,
        refreshUser,
        requestPasswordReset,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
