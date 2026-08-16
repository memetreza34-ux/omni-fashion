import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useAuth } from '@/context/AuthContext';
import {
  loadLocalWardrobe,
  saveLocalWardrobe,
} from '@/features/wardrobe/services/local-wardrobe-service';
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
  addItem: (input: CreateWardrobeItemInput) => Promise<WardrobeItem>;
  updateItem: (item: WardrobeItem) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

const WardrobeContext = createContext<WardrobeContextType | undefined>(
  undefined,
);

async function hydrateImageUrls(items: WardrobeItem[]): Promise<WardrobeItem[]> {
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
        console.error(`Failed to resolve image for wardrobe item ${item.id}`, error);
        return item;
      }
    }),
  );
}

export function WardrobeProvider({ children }: { children: React.ReactNode }) {
  const { user, isBackendConfigured } = useAuth();
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsRef = useRef<WardrobeItem[]>([]);
  const subscriptionVersionRef = useRef(0);

  const isCloudBacked = Boolean(
    user && isBackendConfigured && !user.isDevelopmentDemo,
  );

  const replaceItems = (nextItems: WardrobeItem[]) => {
    itemsRef.current = nextItems;
    setItems(nextItems);
  };

  useEffect(() => {
    const subscriptionVersion = subscriptionVersionRef.current + 1;
    subscriptionVersionRef.current = subscriptionVersion;
    setError(null);
    setIsLoading(true);

    if (!user) {
      replaceItems([]);
      setIsLoading(false);
      return undefined;
    }

    if (!isCloudBacked) {
      void loadLocalWardrobe(user.id)
        .then((localItems) => {
          if (subscriptionVersionRef.current === subscriptionVersion) {
            replaceItems(localItems);
          }
        })
        .catch((loadError: unknown) => {
          console.error('Failed to load local wardrobe', loadError);
          if (subscriptionVersionRef.current === subscriptionVersion) {
            setError('Der lokale Kleiderschrank konnte nicht geladen werden.');
          }
        })
        .finally(() => {
          if (subscriptionVersionRef.current === subscriptionVersion) {
            setIsLoading(false);
          }
        });

      return undefined;
    }

    const unsubscribe = subscribeToWardrobe(
      user.id,
      (cloudItems) => {
        void hydrateImageUrls(cloudItems).then((hydratedItems) => {
          if (subscriptionVersionRef.current === subscriptionVersion) {
            replaceItems(hydratedItems);
            setIsLoading(false);
          }
        });
      },
      (subscriptionError) => {
        console.error('Wardrobe subscription failed', subscriptionError);
        if (subscriptionVersionRef.current === subscriptionVersion) {
          setError('Der Cloud-Kleiderschrank konnte nicht geladen werden.');
          setIsLoading(false);
        }
      },
    );

    return () => {
      unsubscribe();
    };
  }, [isCloudBacked, user]);

  const addItem = async (
    input: CreateWardrobeItemInput,
  ): Promise<WardrobeItem> => {
    if (!user) {
      throw new Error('WARDROBE_AUTH_REQUIRED: No authenticated user.');
    }

    const now = new Date().toISOString();

    if (isCloudBacked) {
      const id = createWardrobeItemId();
      const uploadedImage = await uploadWardrobeImage(
        user.id,
        id,
        input.localImageUri,
      );

      try {
        await createCloudWardrobeItem({
          id,
          ownerId: user.id,
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

      return {
        id,
        ownerId: user.id,
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
        aiModelVersion: null,
        isListedForSwap: false,
        swapListingId: null,
        createdAt: now,
        updatedAt: now,
        schemaVersion: WARDROBE_SCHEMA_VERSION,
      };
    }

    const localItem: WardrobeItem = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ownerId: user.id,
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
      aiModelVersion: null,
      isListedForSwap: false,
      swapListingId: null,
      createdAt: now,
      updatedAt: now,
      schemaVersion: WARDROBE_SCHEMA_VERSION,
    };

    const nextItems = [...itemsRef.current, localItem];
    replaceItems(nextItems);
    await saveLocalWardrobe(nextItems);
    return localItem;
  };

  const updateItem = async (updatedItem: WardrobeItem): Promise<void> => {
    if (!user) {
      throw new Error('WARDROBE_AUTH_REQUIRED: No authenticated user.');
    }

    if (updatedItem.ownerId !== user.id) {
      throw new Error('WARDROBE_OWNER_MISMATCH: Cannot edit another wardrobe.');
    }

    if (isCloudBacked) {
      await updateCloudWardrobeItem(user.id, updatedItem.id, {
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

    const nextItems = itemsRef.current.map((item) =>
      item.id === updatedItem.id
        ? { ...updatedItem, updatedAt: new Date().toISOString() }
        : item,
    );
    replaceItems(nextItems);
    await saveLocalWardrobe(nextItems);
  };

  const deleteItem = async (id: string): Promise<void> => {
    if (!user) {
      throw new Error('WARDROBE_AUTH_REQUIRED: No authenticated user.');
    }

    const item = itemsRef.current.find((candidate) => candidate.id === id);
    if (!item) {
      return;
    }

    if (item.ownerId !== user.id) {
      throw new Error('WARDROBE_OWNER_MISMATCH: Cannot delete another wardrobe.');
    }

    if (isCloudBacked) {
      await deleteCloudWardrobeItem(id);

      try {
        await deleteWardrobeImage(item.imagePath);
      } catch (cleanupError: unknown) {
        // The document deletion is the user-visible source of truth. An orphaned
        // Storage object can be cleaned by a future backend maintenance job.
        console.error('Failed to delete wardrobe image after item deletion', cleanupError);
      }
      return;
    }

    const nextItems = itemsRef.current.filter((candidate) => candidate.id !== id);
    replaceItems(nextItems);
    await saveLocalWardrobe(nextItems);
  };

  return (
    <WardrobeContext.Provider
      value={{
        items,
        isLoading,
        error,
        isCloudBacked,
        addItem,
        updateItem,
        deleteItem,
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
