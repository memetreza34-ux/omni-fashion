import React, { createContext, useContext, useEffect, useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import {
  deleteLocalOutfit,
  loadLocalSavedOutfits,
  saveLocalOutfit,
  updateLocalOutfitFeedback,
} from '@/features/stylist/local-saved-outfit-service';
import {
  deleteCloudOutfit,
  saveCloudOutfit,
  subscribeToSavedOutfits,
  updateCloudOutfitFeedback,
} from '@/features/stylist/saved-outfit-service';
import type {
  OutfitFeedback,
  SaveOutfitInput,
  SavedOutfit,
} from '@/features/stylist/saved-outfit-types';

interface SavedOutfitsContextType {
  outfits: SavedOutfit[];
  isLoading: boolean;
  error: string | null;
  isCloudBacked: boolean;
  saveOutfit: (input: SaveOutfitInput) => Promise<string>;
  setFeedback: (outfitId: string, feedback: OutfitFeedback) => Promise<void>;
  deleteOutfit: (outfitId: string) => Promise<void>;
  hasRecommendation: (itemIds: string[]) => boolean;
}

interface SavedOutfitsSnapshot {
  ownerId: string;
  outfits: SavedOutfit[];
  isLoading: boolean;
  error: string | null;
}

const SavedOutfitsContext = createContext<SavedOutfitsContextType | undefined>(
  undefined,
);

function combinationKey(itemIds: string[]): string {
  return [...itemIds].sort().join('|');
}

export function SavedOutfitsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isBackendConfigured } = useAuth();
  const [snapshot, setSnapshot] = useState<SavedOutfitsSnapshot | null>(null);

  const isCloudBacked = Boolean(
    user && isBackendConfigured && !user.isDevelopmentDemo,
  );
  const activeOwnerId = user?.id ?? null;
  const currentSnapshot =
    activeOwnerId && snapshot?.ownerId === activeOwnerId ? snapshot : null;
  const outfits = currentSnapshot?.outfits ?? [];
  const isLoading = activeOwnerId
    ? !currentSnapshot || currentSnapshot.isLoading
    : false;
  const error = currentSnapshot?.error ?? null;

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const ownerId = user.id;

    if (!isCloudBacked) {
      let active = true;
      void loadLocalSavedOutfits(ownerId)
        .then((localOutfits) => {
          if (active) {
            setSnapshot({
              ownerId,
              outfits: localOutfits,
              isLoading: false,
              error: null,
            });
          }
        })
        .catch((loadError: unknown) => {
          console.error('Failed to load local saved outfits', loadError);
          if (active) {
            setSnapshot({
              ownerId,
              outfits: [],
              isLoading: false,
              error: 'Gespeicherte Outfits konnten nicht geladen werden.',
            });
          }
        });

      return () => {
        active = false;
      };
    }

    return subscribeToSavedOutfits(
      ownerId,
      (nextOutfits) => {
        setSnapshot({
          ownerId,
          outfits: nextOutfits,
          isLoading: false,
          error: null,
        });
      },
      (subscriptionError) => {
        console.error('Saved outfit subscription failed', subscriptionError);
        setSnapshot({
          ownerId,
          outfits: [],
          isLoading: false,
          error: 'Gespeicherte Outfits konnten nicht geladen werden.',
        });
      },
    );
  }, [isCloudBacked, user]);

  const savedKeys = new Set(
    outfits.map((outfit) => combinationKey(outfit.itemIds)),
  );

  const saveOutfit = async (input: SaveOutfitInput): Promise<string> => {
    if (!user) {
      throw new Error('OUTFIT_AUTH_REQUIRED');
    }

    const key = combinationKey(input.recommendation.itemIds);
    const existing = outfits.find(
      (outfit) => combinationKey(outfit.itemIds) === key,
    );
    if (existing) {
      return existing.id;
    }

    if (isCloudBacked) {
      return saveCloudOutfit(user.id, input);
    }

    const saved = await saveLocalOutfit(user.id, input);
    setSnapshot((current) =>
      current?.ownerId === user.id
        ? { ...current, outfits: [saved, ...current.outfits] }
        : {
            ownerId: user.id,
            outfits: [saved],
            isLoading: false,
            error: null,
          },
    );
    return saved.id;
  };

  const setFeedback = async (
    outfitId: string,
    feedback: OutfitFeedback,
  ): Promise<void> => {
    if (!user) {
      throw new Error('OUTFIT_AUTH_REQUIRED');
    }

    if (isCloudBacked) {
      await updateCloudOutfitFeedback(outfitId, feedback);
      return;
    }

    await updateLocalOutfitFeedback(user.id, outfitId, feedback);
    setSnapshot((current) =>
      current?.ownerId === user.id
        ? {
            ...current,
            outfits: current.outfits.map((outfit) =>
              outfit.id === outfitId
                ? { ...outfit, feedback, updatedAt: new Date().toISOString() }
                : outfit,
            ),
          }
        : current,
    );
  };

  const deleteOutfit = async (outfitId: string): Promise<void> => {
    if (!user) {
      throw new Error('OUTFIT_AUTH_REQUIRED');
    }

    if (isCloudBacked) {
      await deleteCloudOutfit(outfitId);
      return;
    }

    await deleteLocalOutfit(user.id, outfitId);
    setSnapshot((current) =>
      current?.ownerId === user.id
        ? {
            ...current,
            outfits: current.outfits.filter((outfit) => outfit.id !== outfitId),
          }
        : current,
    );
  };

  return (
    <SavedOutfitsContext.Provider
      value={{
        outfits,
        isLoading,
        error,
        isCloudBacked,
        saveOutfit,
        setFeedback,
        deleteOutfit,
        hasRecommendation: (itemIds) => savedKeys.has(combinationKey(itemIds)),
      }}
    >
      {children}
    </SavedOutfitsContext.Provider>
  );
}

export function useSavedOutfits(): SavedOutfitsContextType {
  const context = useContext(SavedOutfitsContext);
  if (!context) {
    throw new Error(
      'useSavedOutfits must be used inside SavedOutfitsProvider.',
    );
  }
  return context;
}
