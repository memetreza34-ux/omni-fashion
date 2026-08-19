import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '@/context/AuthContext';
import {
  loadOrCreateLocalUserProfile,
  updateLocalUserProfile,
} from '@/features/profile/services/local-profile-service';
import {
  getUserProfile,
  updateUserProfile,
} from '@/features/profile/services/profile-service';
import type {
  UpdateUserProfileInput,
  UserProfile,
} from '@/features/profile/types';

interface UserProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  isCloudBacked: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (input: UpdateUserProfileInput) => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(
  undefined,
);

function getDefaultLocale(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale || 'de-DE';
  } catch {
    return 'de-DE';
  }
}

export function UserProfileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isBackendConfigured } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCloudBacked = Boolean(
    user && isBackendConfigured && !user.isDevelopmentDemo,
  );

  const loadProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!user) {
      return null;
    }

    if (isCloudBacked) {
      const cloudProfile = await getUserProfile(user.id);
      if (!cloudProfile) {
        throw new Error('USER_PROFILE_MISSING_AFTER_AUTH_SYNC');
      }
      return cloudProfile;
    }

    return loadOrCreateLocalUserProfile({
      userId: user.id,
      displayName: user.displayName?.trim() || 'Development Demo',
      locale: getDefaultLocale(),
    });
  }, [isCloudBacked, user]);

  const refreshProfile = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      setProfile(await loadProfile());
    } catch (loadError: unknown) {
      console.error('Failed to load UserProfile', loadError);
      setProfile(null);
      setError('Dein Profil konnte nicht geladen werden. Bitte erneut versuchen.');
      throw loadError;
    } finally {
      setIsLoading(false);
    }
  }, [loadProfile]);

  useEffect(() => {
    let active = true;

    if (!user) {
      setProfile(null);
      setError(null);
      setIsLoading(false);
      return () => {
        active = false;
      };
    }

    setIsLoading(true);
    setError(null);

    void loadProfile()
      .then((nextProfile) => {
        if (active) {
          setProfile(nextProfile);
        }
      })
      .catch((loadError: unknown) => {
        console.error('Failed to load UserProfile', loadError);
        if (active) {
          setProfile(null);
          setError(
            'Dein Profil konnte nicht geladen werden. Bitte erneut versuchen.',
          );
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [loadProfile, user]);

  const updateProfile = useCallback(
    async (input: UpdateUserProfileInput): Promise<void> => {
      if (!user || !profile) {
        throw new Error('USER_PROFILE_NOT_READY');
      }

      setIsSaving(true);
      setError(null);

      try {
        if (isCloudBacked) {
          await updateUserProfile(user.id, input);
          const refreshed = await getUserProfile(user.id);
          if (!refreshed) {
            throw new Error('USER_PROFILE_MISSING_AFTER_UPDATE');
          }
          setProfile(refreshed);
          return;
        }

        const updated = await updateLocalUserProfile(profile, input);
        setProfile(updated);
      } catch (saveError: unknown) {
        console.error('Failed to update UserProfile', saveError);
        setError('Dein Profil konnte nicht gespeichert werden.');
        throw saveError;
      } finally {
        setIsSaving(false);
      }
    },
    [isCloudBacked, profile, user],
  );

  const completeOnboarding = useCallback(
    () => updateProfile({ onboardingCompleted: true }),
    [updateProfile],
  );

  const value = useMemo<UserProfileContextType>(
    () => ({
      profile,
      isLoading,
      isSaving,
      error,
      isCloudBacked,
      refreshProfile,
      updateProfile,
      completeOnboarding,
    }),
    [
      completeOnboarding,
      error,
      isCloudBacked,
      isLoading,
      isSaving,
      profile,
      refreshProfile,
      updateProfile,
    ],
  );

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile(): UserProfileContextType {
  const context = useContext(UserProfileContext);

  if (!context) {
    throw new Error('useUserProfile must be used inside UserProfileProvider.');
  }

  return context;
}
