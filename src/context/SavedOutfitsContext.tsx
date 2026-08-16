import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

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
  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isCloudBacked = Boolean(
    user && isBackendConfigured && !user.isDevelopmentDemo,
  );

  useEffect(() => {
    setError(null);
    setIsLoading(true);

    if (!user) {
      setOutfits([]);
      setIsLoading(false);
      return undefined;
    }

    if (!isCloudBacked) {
      let active = true;
      void loadLocalSavedOutfits(user.id)
        .then((localOutfits) => {
          if (active) {
            setOutfits(localOutfits);
          }
        })
        .catch((loadError: unknown) => {
          console.error('Failed to load local saved outfits', loadError);
          if (active) {
            setError('Gespeicherte Outfits konnten nicht geladen werden.');
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
    }

    return subscribeToSavedOutfits(
      user.id,
      (nextOutfits) => {
        setOutfits(nextOutfits);
        setIsLoading(false);
      },
      (subscriptionError) => {
        console.error('Saved outfit subscription failed', subscriptionError);
        setError('Gespeicherte Outfits konnten nicht geladen werden.');
        setIsLoading(false);
      },
    );
  }, [isCloudBacked, user]);

  const savedKeys = useMemo(
    () => new Set(outfits.map((outfit) => combinationKey(outfit.itemIds))),
    [outfits],
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
    setOutfits((current) => [saved, ...current]);
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
    setOutfits((current) =>
      current.map((outfit) =>
        outfit.id === outfitId
          ? { ...outfit, feedback, updatedAt: new Date().toISOString() }
          : outfit,
      ),
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
    setOutfits((current) => current.filter((outfit) => outfit.id !== outfitId));
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
