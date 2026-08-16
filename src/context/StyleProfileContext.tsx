import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '@/context/AuthContext';
import { useWardrobe } from '@/context/WardrobeContext';
import {
  buildStyleProfileDraft,
  deriveWardrobeStyleSignals,
} from '@/features/style-profile/style-profile-engine';
import {
  loadLocalStyleProfile,
  saveLocalStyleProfile,
} from '@/features/style-profile/services/local-style-profile-service';
import {
  getStyleProfile,
  saveStyleProfile,
} from '@/features/style-profile/services/style-profile-service';
import { STYLE_PROFILE_SCHEMA_VERSION } from '@/features/style-profile/types';
import type {
  StyleProfile,
  StyleQuestionnaire,
} from '@/features/style-profile/types';

interface StyleProfileContextType {
  profile: StyleProfile | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  isCloudBacked: boolean;
  wardrobeNeedsRefresh: boolean;
  saveQuestionnaire: (questionnaire: StyleQuestionnaire) => Promise<void>;
  refreshFromWardrobe: () => Promise<void>;
}

const StyleProfileContext = createContext<StyleProfileContextType | undefined>(
  undefined,
);

export function StyleProfileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isBackendConfigured } = useAuth();
  const { items } = useWardrobe();
  const [profile, setProfile] = useState<StyleProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCloudBacked = Boolean(
    user && isBackendConfigured && !user.isDevelopmentDemo,
  );

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return () => {
        active = false;
      };
    }

    const load = isCloudBacked
      ? getStyleProfile(user.id)
      : loadLocalStyleProfile(user.id);

    void load
      .then((nextProfile) => {
        if (active) {
          setProfile(nextProfile);
        }
      })
      .catch((loadError: unknown) => {
        console.error('Failed to load StyleProfile', loadError);
        if (active) {
          setError('Deine Style-DNA konnte nicht geladen werden.');
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
  }, [isCloudBacked, user]);

  const currentSignals = useMemo(
    () => deriveWardrobeStyleSignals(items),
    [items],
  );

  const wardrobeNeedsRefresh = Boolean(
    profile &&
      (profile.wardrobeSignals.totalItemCount !== currentSignals.totalItemCount ||
        profile.wardrobeSignals.analyzedItemCount !==
          currentSignals.analyzedItemCount ||
        profile.wardrobeSignals.dominantColors.join('|') !==
          currentSignals.dominantColors.join('|') ||
        profile.wardrobeSignals.dominantStyleTags.join('|') !==
          currentSignals.dominantStyleTags.join('|')),
  );

  const persistProfile = async (
    questionnaire: StyleQuestionnaire,
  ): Promise<void> => {
    if (!user) {
      throw new Error('STYLE_PROFILE_AUTH_REQUIRED');
    }

    const draft = buildStyleProfileDraft(questionnaire, items);
    const now = new Date().toISOString();

    if (isCloudBacked) {
      await saveStyleProfile(user.id, {
        questionnaire,
        ...draft,
      });

      setProfile({
        userId: user.id,
        questionnaire,
        ...draft,
        createdAt: profile?.createdAt ?? now,
        updatedAt: now,
        schemaVersion: STYLE_PROFILE_SCHEMA_VERSION,
      });
      return;
    }

    const saved = await saveLocalStyleProfile(user.id, {
      questionnaire,
      ...draft,
    });
    setProfile(saved);
  };

  const saveQuestionnaire = async (
    questionnaire: StyleQuestionnaire,
  ): Promise<void> => {
    setIsSaving(true);
    setError(null);

    try {
      await persistProfile(questionnaire);
    } catch (saveError: unknown) {
      console.error('Failed to save StyleProfile', saveError);
      setError('Deine Style-DNA konnte nicht gespeichert werden.');
      throw saveError;
    } finally {
      setIsSaving(false);
    }
  };

  const refreshFromWardrobe = async (): Promise<void> => {
    if (!profile) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await persistProfile(profile.questionnaire);
    } catch (refreshError: unknown) {
      console.error('Failed to refresh StyleProfile', refreshError);
      setError('Dein Kleiderschrank konnte nicht neu ausgewertet werden.');
      throw refreshError;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <StyleProfileContext.Provider
      value={{
        profile,
        isLoading,
        isSaving,
        error,
        isCloudBacked,
        wardrobeNeedsRefresh,
        saveQuestionnaire,
        refreshFromWardrobe,
      }}
    >
      {children}
    </StyleProfileContext.Provider>
  );
}

export function useStyleProfile(): StyleProfileContextType {
  const context = useContext(StyleProfileContext);
  if (!context) {
    throw new Error(
      'useStyleProfile must be used inside StyleProfileProvider.',
    );
  }
  return context;
}
