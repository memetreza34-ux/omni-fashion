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

interface UserProfileSnapshot {
  ownerId: string;
  profile: UserProfile | null;
  error: string | null;
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
  const [snapshot, setSnapshot] = useState<UserProfileSnapshot | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isCloudBacked = Boolean(
    user && isBackendConfigured && !user.isDevelopmentDemo,
  );
  const activeOwnerId = user?.id ?? null;
  const currentSnapshot =
    activeOwnerId && snapshot?.ownerId === activeOwnerId ? snapshot : null;
  const profile = currentSnapshot?.profile ?? null;
  const isLoading = Boolean(activeOwnerId && !currentSnapshot);
  const error = currentSnapshot?.error ?? null;

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

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const ownerId = user.id;
    let active = true;

    void loadProfile()
      .then((nextProfile) => {
        if (active) {
          setSnapshot({ ownerId, profile: nextProfile, error: null });
        }
      })
      .catch((loadError: unknown) => {
        console.error('Failed to load UserProfile', loadError);
        if (active) {
          setSnapshot({
            ownerId,
            profile: null,
            error:
              'Dein Profil konnte nicht geladen werden. Bitte erneut versuchen.',
          });
        }
      });

    return () => {
      active = false;
    };
  }, [loadProfile, user]);

  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!user) {
      return;
    }

    const ownerId = user.id;
    setSnapshot(null);

    try {
      setSnapshot({
        ownerId,
        profile: await loadProfile(),
        error: null,
      });
    } catch (loadError: unknown) {
      console.error('Failed to load UserProfile', loadError);
      setSnapshot({
        ownerId,
        profile: null,
        error:
          'Dein Profil konnte nicht geladen werden. Bitte erneut versuchen.',
      });
      throw loadError;
    }
  }, [loadProfile, user]);

  const updateProfile = useCallback(
    async (input: UpdateUserProfileInput): Promise<void> => {
      if (!user || !profile) {
        throw new Error('USER_PROFILE_NOT_READY');
      }

      const ownerId = user.id;
      setIsSaving(true);
      setSnapshot((current) =>
        current?.ownerId === ownerId ? { ...current, error: null } : current,
      );

      try {
        if (isCloudBacked) {
          await updateUserProfile(ownerId, input);
          const refreshed = await getUserProfile(ownerId);
          if (!refreshed) {
            throw new Error('USER_PROFILE_MISSING_AFTER_UPDATE');
          }
          setSnapshot({ ownerId, profile: refreshed, error: null });
          return;
        }

        const updated = await updateLocalUserProfile(profile, input);
        setSnapshot({ ownerId, profile: updated, error: null });
      } catch (saveError: unknown) {
        console.error('Failed to update UserProfile', saveError);
        setSnapshot((current) =>
          current?.ownerId === ownerId
            ? {
                ...current,
                error: 'Dein Profil konnte nicht gespeichert werden.',
              }
            : current,
        );
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
