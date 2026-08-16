import {
  collection,
  onSnapshot,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import type { QueryDocumentSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getDownloadURL, ref } from 'firebase/storage';

import { getFirebaseServices } from '@/services/firebase/app';
import {
  WARDROBE_CATEGORIES,
  WARDROBE_CONDITIONS,
} from '@/features/wardrobe/types';
import type {
  WardrobeCategory,
  WardrobeCondition,
} from '@/features/wardrobe/types';

import {
  SWAP_LISTING_SCHEMA_VERSION,
  SWAP_LISTING_STATUSES,
} from './types';
import type {
  CreateSwapListingInput,
  CreateSwapListingResponse,
  SwapListing,
  SwapListingStatus,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(
  record: Record<string, unknown>,
  key: string,
): string | null {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readNullableString(
  record: Record<string, unknown>,
  key: string,
): string | null {
  const value = record[key];
  return value === null || typeof value === 'string' ? value : null;
}

function readBoolean(
  record: Record<string, unknown>,
  key: string,
): boolean | null {
  const value = record[key];
  return typeof value === 'boolean' ? value : null;
}

function readEnum<T extends string>(
  record: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
): T | null {
  const value = record[key];
  return typeof value === 'string' && allowed.includes(value as T)
    ? (value as T)
    : null;
}

function readNullableInteger(
  record: Record<string, unknown>,
  key: string,
): number | null | undefined {
  const value = record[key];
  if (value === null) {
    return null;
  }
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
    return value;
  }
  return undefined;
}

function timestampToIso(value: unknown): string | null {
  return value instanceof Timestamp ? value.toDate().toISOString() : null;
}

function mapListing(snapshot: QueryDocumentSnapshot<unknown>): SwapListing | null {
  const raw = snapshot.data();
  if (!isRecord(raw)) {
    return null;
  }

  const ownerId = readString(raw, 'ownerId');
  const wardrobeItemId = readString(raw, 'wardrobeItemId');
  const title = readString(raw, 'title');
  const description = typeof raw.description === 'string' ? raw.description : null;
  const category = readEnum<WardrobeCategory>(
    raw,
    'category',
    WARDROBE_CATEGORIES,
  );
  const subcategory = readNullableString(raw, 'subcategory');
  const color = readString(raw, 'color');
  const brand = readNullableString(raw, 'brand');
  const size = readNullableString(raw, 'size');
  const condition = readEnum<WardrobeCondition>(
    raw,
    'condition',
    WARDROBE_CONDITIONS,
  );
  const publicImagePath = readString(raw, 'publicImagePath');
  const city = readString(raw, 'city');
  const shippingEnabled = readBoolean(raw, 'shippingEnabled');
  const meetupEnabled = readBoolean(raw, 'meetupEnabled');
  const estimatedValueCents = readNullableInteger(raw, 'estimatedValueCents');
  const status = readEnum<SwapListingStatus>(
    raw,
    'status',
    SWAP_LISTING_STATUSES,
  );
  const createdAt = timestampToIso(raw.createdAt);
  const updatedAt = timestampToIso(raw.updatedAt);

  if (
    !ownerId ||
    !wardrobeItemId ||
    !title ||
    description === null ||
    !category ||
    !color ||
    !condition ||
    !publicImagePath ||
    !city ||
    shippingEnabled === null ||
    meetupEnabled === null ||
    estimatedValueCents === undefined ||
    !status ||
    !createdAt ||
    !updatedAt ||
    raw.schemaVersion !== SWAP_LISTING_SCHEMA_VERSION
  ) {
    console.warn(`Skipping invalid OmniSwap listing ${snapshot.id}.`);
    return null;
  }

  return {
    id: snapshot.id,
    ownerId,
    wardrobeItemId,
    title,
    description,
    category,
    subcategory,
    color,
    brand,
    size,
    condition,
    publicImagePath,
    publicImageUrl: null,
    city,
    shippingEnabled,
    meetupEnabled,
    estimatedValueCents,
    status,
    createdAt,
    updatedAt,
    schemaVersion: SWAP_LISTING_SCHEMA_VERSION,
  };
}

async function hydrateListingImage(listing: SwapListing): Promise<SwapListing> {
  try {
    const { storage } = getFirebaseServices();
    return {
      ...listing,
      publicImageUrl: await getDownloadURL(ref(storage, listing.publicImagePath)),
    };
  } catch (error: unknown) {
    console.error(`Failed to resolve listing image ${listing.id}`, error);
    return listing;
  }
}

async function hydrateListings(listings: SwapListing[]): Promise<SwapListing[]> {
  return Promise.all(listings.map(hydrateListingImage));
}

export async function createSwapListing(
  input: CreateSwapListingInput,
): Promise<CreateSwapListingResponse> {
  const { functions } = getFirebaseServices();
  const callable = httpsCallable<
    CreateSwapListingInput,
    CreateSwapListingResponse
  >(functions, 'createSwapListing');
  const response = await callable(input);

  if (
    !isRecord(response.data) ||
    typeof response.data.listingId !== 'string' ||
    !response.data.listingId ||
    response.data.status !== 'active'
  ) {
    throw new Error('SWAP_INVALID_CREATE_RESPONSE');
  }

  return {
    listingId: response.data.listingId,
    status: 'active',
  };
}

function subscribeListings(
  listingQuery: ReturnType<typeof query>,
  onChange: (listings: SwapListing[]) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    listingQuery,
    (snapshot) => {
      const mapped = snapshot.docs
        .map(mapListing)
        .filter((listing): listing is SwapListing => listing !== null)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      void hydrateListings(mapped).then(onChange).catch(onError);
    },
    (error) => onError(error),
  );
}

export function subscribeToActiveSwapListings(
  onChange: (listings: SwapListing[]) => void,
  onError: (error: Error) => void,
): () => void {
  const { db } = getFirebaseServices();
  return subscribeListings(
    query(collection(db, 'swapListings'), where('status', '==', 'active')),
    onChange,
    onError,
  );
}

export function subscribeToOwnSwapListings(
  ownerId: string,
  onChange: (listings: SwapListing[]) => void,
  onError: (error: Error) => void,
): () => void {
  const { db } = getFirebaseServices();
  return subscribeListings(
    query(collection(db, 'swapListings'), where('ownerId', '==', ownerId)),
    onChange,
    onError,
  );
}
