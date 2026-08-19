import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useAuth } from '@/context/AuthContext';
import { requestGarmentAnalysis } from '@/features/ai/garment-analysis/garment-analysis-service';
import {
  loadLocalWardrobe,
  saveLocalWardrobe,
} from '@/features/wardrobe/services/local-wardrobe-service';
import { prepareWardrobeImageForUpload } from '@/features/wardrobe/services/wardrobe-image-preparation-service';
import {
  createCloudWardrobeItem,
  createWardrobeItemId,
  deleteCloudWardrobeItem,
  subscribeToWardrobe,
  updateCloudWardrobeItem,
} from '@/features/wardrobe/services/wardrobe-service';
import {
  deleteWardrobeImage,
  getWardrobeImageUrl,
  uploadWardrobeImage,
} from '@/features/wardrobe/services/wardrobe-storage-service';
import { WARDROBE_SCHEMA_VERSION } from '@/features/wardrobe/types';
import type {
  CreateWardrobeItemInput,
  WardrobeItem,
} from '@/features/wardrobe/types';

interface WardrobeContextType {
  items: WardrobeItem[];
  isLoading: boolean;
  error: string | null;
  isCloudBacked: boolean;
  uploadProgress: number | null;
  addItem: (input: CreateWardrobeItemInput) => Promise<WardrobeItem>;
  updateItem: (item: WardrobeItem) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  analyzeItem: (id: string) => Promise<void>;
  cancelUpload: () => void;
}

interface WardrobeSnapshot {
  ownerId: string;
  items: WardrobeItem[];
  error: string | null;
}

interface WardrobeRefState {
  ownerId: string | null;
  items: WardrobeItem[];
}

const WardrobeContext = createContext<WardrobeContextType | undefined>(
  undefined,
);

async function hydrateImageUrls(
  items: WardrobeItem[],
): Promise<WardrobeItem[]> {
  return Promise.all(
    items.map(async (item) => {
      if (!item.imagePath) {
        return item;
      }

      try {
        return {
          ...item,
          imageUrl: await getWardrobeImageUrl(item.imagePath),
        };
      } catch (error: unknown) {
        console.error(
          `Failed to resolve image for wardrobe item ${item.id}`,
          error,
        );
        return item;
      }
    }),
  );
}

export function WardrobeProvider({ children }: { children: React.ReactNode }) {
  const { user, isBackendConfigured } = useAuth();
  const [snapshot, setSnapshot] = useState<WardrobeSnapshot | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const itemsRef = useRef<WardrobeRefState>({ ownerId: null, items: [] });
  const activeUploadControllerRef = useRef<AbortController | null>(null);

  const isCloudBacked = Boolean(
    user && isBackendConfigured && !user.isDevelopmentDemo,
  );
  const activeOwnerId = user?.id ?? null;
  const currentSnapshot =
    activeOwnerId && snapshot?.ownerId === activeOwnerId ? snapshot : null;
  const items = currentSnapshot?.items ?? [];
  const isLoading = Boolean(activeOwnerId && !currentSnapshot);
  const error = currentSnapshot?.error ?? null;

  const replaceItems = useCallback(
    (
      ownerId: string,
      nextItems: WardrobeItem[],
      nextError: string | null = null,
    ) => {
      itemsRef.current = { ownerId, items: nextItems };
      setSnapshot({ ownerId, items: nextItems, error: nextError });
    },
    [],
  );

  const currentItemsFor = useCallback(
    (ownerId: string): WardrobeItem[] =>
      itemsRef.current.ownerId === ownerId ? itemsRef.current.items : [],
    [],
  );

  const cancelUpload = useCallback(() => {
    activeUploadControllerRef.current?.abort();
  }, []);

  useEffect(() => {
    return () => {
      activeUploadControllerRef.current?.abort();
      activeUploadControllerRef.current = null;
    };
  }, [activeOwnerId]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const ownerId = user.id;
    let active = true;

    if (!isCloudBacked) {
      void loadLocalWardrobe(ownerId)
        .then((localItems) => {
          if (active) {
            replaceItems(ownerId, localItems);
          }
        })
        .catch((loadError: unknown) => {
          console.error('Failed to load local wardrobe', loadError);
          if (active) {
            replaceItems(
              ownerId,
              [],
              'Der lokale Kleiderschrank konnte nicht geladen werden.',
            );
          }
        });

      return () => {
        active = false;
      };
    }

    const unsubscribe = subscribeToWardrobe(
      ownerId,
      (cloudItems) => {
        void hydrateImageUrls(cloudItems).then((hydratedItems) => {
          if (active) {
            replaceItems(ownerId, hydratedItems);
          }
        });
      },
      (subscriptionError) => {
        console.error('Wardrobe subscription failed', subscriptionError);
        if (active) {
          replaceItems(
            ownerId,
            [],
            'Der Cloud-Kleiderschrank konnte nicht geladen werden.',
          );
        }
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [isCloudBacked, replaceItems, user]);

  const addItem = async (
    input: CreateWardrobeItemInput,
  ): Promise<WardrobeItem> => {
    if (!user) {
      throw new Error('WARDROBE_AUTH_REQUIRED: No authenticated user.');
    }

    const ownerId = user.id;
    const now = new Date().toISOString();

    if (isCloudBacked) {
      if (activeUploadControllerRef.current) {
        throw new Error(
          'WARDROBE_UPLOAD_ALREADY_ACTIVE: Another wardrobe upload is still running.',
        );
      }

      const id = createWardrobeItemId();
      const uploadController = new AbortController();
      activeUploadControllerRef.current = uploadController;
      setUploadProgress(0);

      let uploadedImage: Awaited<ReturnType<typeof uploadWardrobeImage>>;
      try {
        const preparedImage = await prepareWardrobeImageForUpload(
          input.localImageUri,
          input.imageWidth,
          input.imageHeight,
          uploadController.signal,
        );

        uploadedImage = await uploadWardrobeImage(
          ownerId,
          id,
          preparedImage.uri,
          {
            signal: uploadController.signal,
            onProgress: ({ fraction }) => {
              if (activeUploadControllerRef.current === uploadController) {
                setUploadProgress(fraction);
              }
            },
          },
        );
      } finally {
        if (activeUploadControllerRef.current === uploadController) {
          activeUploadControllerRef.current = null;
          setUploadProgress(null);
        }
      }

      try {
        await createCloudWardrobeItem({
          id,
          ownerId,
          imagePath: uploadedImage.path,
          name: input.name ?? 'Neues Kleidungsstück',
          category: input.category ?? 'Other',
          color: input.color ?? 'Unbekannt',
          season: input.season ?? 'All',
          source: input.source,
        });
      } catch (createError: unknown) {
        try {
          await deleteWardrobeImage(uploadedImage.path);
        } catch (cleanupError: unknown) {
          console.error('Failed to clean up wardrobe image', cleanupError);
        }
        throw createError;
      }

      const createdItem: WardrobeItem = {
        id,
        ownerId,
        imageUrl: uploadedImage.downloadUrl,
        imagePath: uploadedImage.path,
        name: input.name ?? 'Neues Kleidungsstück',
        category: input.category ?? 'Other',
        subcategory: null,
        color: input.color ?? 'Unbekannt',
        secondaryColors: [],
        brand: null,
        material: null,
        size: null,
        season: input.season ?? 'All',
        condition: 'good',
        styleTags: [],
        source: input.source,
        aiStatus: 'not_requested',
        aiConfidence: null,
        aiFieldConfidence: null,
        aiModelVersion: null,
        aiPromptVersion: null,
        aiAnalyzedAt: null,
        aiErrorCode: null,
        isListedForSwap: false,
        swapListingId: null,
        createdAt: now,
        updatedAt: now,
        schemaVersion: WARDROBE_SCHEMA_VERSION,
      };

      replaceItems(ownerId, [...currentItemsFor(ownerId), createdItem]);
      return createdItem;
    }

    const localItem: WardrobeItem = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ownerId,
      imageUrl: input.localImageUri,
      imagePath: null,
      name: input.name ?? 'Neues Kleidungsstück',
      category: input.category ?? 'Other',
      subcategory: null,
      color: input.color ?? 'Unbekannt',
      secondaryColors: [],
      brand: null,
      material: null,
      size: null,
      season: input.season ?? 'All',
      condition: 'good',
      styleTags: [],
      source: input.source,
      aiStatus: 'not_requested',
      aiConfidence: null,
      aiFieldConfidence: null,
      aiModelVersion: null,
      aiPromptVersion: null,
      aiAnalyzedAt: null,
      aiErrorCode: null,
      isListedForSwap: false,
      swapListingId: null,
      createdAt: now,
      updatedAt: now,
      schemaVersion: WARDROBE_SCHEMA_VERSION,
    };

    const nextItems = [...currentItemsFor(ownerId), localItem];
    replaceItems(ownerId, nextItems);
    await saveLocalWardrobe(nextItems);
    return localItem;
  };

  const updateItem = async (updatedItem: WardrobeItem): Promise<void> => {
    if (!user) {
      throw new Error('WARDROBE_AUTH_REQUIRED: No authenticated user.');
    }

    const ownerId = user.id;
    if (updatedItem.ownerId !== ownerId) {
      throw new Error('WARDROBE_OWNER_MISMATCH: Cannot edit another wardrobe.');
    }

    if (isCloudBacked) {
      await updateCloudWardrobeItem(ownerId, updatedItem.id, {
        name: updatedItem.name,
        category: updatedItem.category,
        subcategory: updatedItem.subcategory,
        color: updatedItem.color,
        secondaryColors: updatedItem.secondaryColors,
        brand: updatedItem.brand,
        material: updatedItem.material,
        size: updatedItem.size,
        season: updatedItem.season,
        condition: updatedItem.condition,
        styleTags: updatedItem.styleTags,
      });
      return;
    }

    const nextItems = currentItemsFor(ownerId).map((item) =>
      item.id === updatedItem.id
        ? { ...updatedItem, updatedAt: new Date().toISOString() }
        : item,
    );
    replaceItems(ownerId, nextItems);
    await saveLocalWardrobe(nextItems);
  };

  const deleteItem = async (id: string): Promise<void> => {
    if (!user) {
      throw new Error('WARDROBE_AUTH_REQUIRED: No authenticated user.');
    }

    const ownerId = user.id;
    const currentItems = currentItemsFor(ownerId);
    const item = currentItems.find((candidate) => candidate.id === id);
    if (!item) {
      return;
    }

    if (item.ownerId !== ownerId) {
      throw new Error(
        'WARDROBE_OWNER_MISMATCH: Cannot delete another wardrobe.',
      );
    }

    if (isCloudBacked) {
      await deleteCloudWardrobeItem(id);
      return;
    }

    const nextItems = currentItems.filter((candidate) => candidate.id !== id);
    replaceItems(ownerId, nextItems);
    await saveLocalWardrobe(nextItems);
  };

  const analyzeItem = async (id: string): Promise<void> => {
    if (!user) {
      throw new Error('WARDROBE_AUTH_REQUIRED: No authenticated user.');
    }

    if (!isCloudBacked) {
      throw new Error(
        'WARDROBE_AI_REQUIRES_CLOUD: Garment analysis requires a real Firebase user and trusted backend.',
      );
    }

    const item = currentItemsFor(user.id).find(
      (candidate) => candidate.id === id,
    );
    if (item && item.ownerId !== user.id) {
      throw new Error(
        'WARDROBE_OWNER_MISMATCH: Cannot analyze another wardrobe.',
      );
    }

    await requestGarmentAnalysis(id);
  };

  return (
    <WardrobeContext.Provider
      value={{
        items,
        isLoading,
        error,
        isCloudBacked,
        uploadProgress,
        addItem,
        updateItem,
        deleteItem,
        analyzeItem,
        cancelUpload,
      }}
    >
      {children}
    </WardrobeContext.Provider>
  );
}

export function useWardrobe(): WardrobeContextType {
  const context = useContext(WardrobeContext);

  if (context === undefined) {
    throw new Error('useWardrobe must be used within a WardrobeProvider');
  }

  return context;
}
