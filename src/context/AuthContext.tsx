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
  subscribeToAuthUser,
} from '@/features/auth/services/auth-service';
import type { AuthUser, LoginCredentials } from '@/features/auth/types';
import { isFirebaseConfigured } from '@/services/firebase/app';

const DEVELOPMENT_DEMO_USER_KEY = '@omni_fashion_dev_user';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isBackendConfigured: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isFirebaseConfigured) {
      const unsubscribe = subscribeToAuthUser((nextUser) => {
        setUser(nextUser);
        setIsLoading(false);
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
