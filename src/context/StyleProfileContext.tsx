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

interface StyleProfileSnapshot {
  ownerId: string;
  profile: StyleProfile | null;
  error: string | null;
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
  const [snapshot, setSnapshot] = useState<StyleProfileSnapshot | null>(null);
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

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const ownerId = user.id;
    let active = true;
    const load = isCloudBacked
      ? getStyleProfile(ownerId)
      : loadLocalStyleProfile(ownerId);

    void load
      .then((nextProfile) => {
        if (active) {
          setSnapshot({ ownerId, profile: nextProfile, error: null });
        }
      })
      .catch((loadError: unknown) => {
        console.error('Failed to load StyleProfile', loadError);
        if (active) {
          setSnapshot({
            ownerId,
            profile: null,
            error: 'Deine Style-DNA konnte nicht geladen werden.',
          });
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

    const ownerId = user.id;
    const draft = buildStyleProfileDraft(questionnaire, items);
    const now = new Date().toISOString();

    if (isCloudBacked) {
      await saveStyleProfile(ownerId, {
        questionnaire,
        ...draft,
      });

      setSnapshot({
        ownerId,
        profile: {
          userId: ownerId,
          questionnaire,
          ...draft,
          createdAt: profile?.createdAt ?? now,
          updatedAt: now,
          schemaVersion: STYLE_PROFILE_SCHEMA_VERSION,
        },
        error: null,
      });
      return;
    }

    const saved = await saveLocalStyleProfile(ownerId, {
      questionnaire,
      ...draft,
    });
    setSnapshot({ ownerId, profile: saved, error: null });
  };

  const setCurrentError = (nextError: string | null) => {
    if (!user) {
      return;
    }

    setSnapshot((current) =>
      current?.ownerId === user.id
        ? { ...current, error: nextError }
        : { ownerId: user.id, profile: null, error: nextError },
    );
  };

  const saveQuestionnaire = async (
    questionnaire: StyleQuestionnaire,
  ): Promise<void> => {
    setIsSaving(true);
    setCurrentError(null);

    try {
      await persistProfile(questionnaire);
    } catch (saveError: unknown) {
      console.error('Failed to save StyleProfile', saveError);
      setCurrentError('Deine Style-DNA konnte nicht gespeichert werden.');
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
    setCurrentError(null);

    try {
      await persistProfile(profile.questionnaire);
    } catch (refreshError: unknown) {
      console.error('Failed to refresh StyleProfile', refreshError);
      setCurrentError('Dein Kleiderschrank konnte nicht neu ausgewertet werden.');
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
