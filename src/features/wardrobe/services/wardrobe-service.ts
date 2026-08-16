import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

import { getFirebaseServices } from '@/services/firebase/app';

import {
  WARDROBE_AI_STATUSES,
  WARDROBE_CATEGORIES,
  WARDROBE_CONDITIONS,
  WARDROBE_SCHEMA_VERSION,
  WARDROBE_SEASONS,
  WARDROBE_SOURCES,
} from '../types';
import type {
  UpdateWardrobeItemInput,
  WardrobeAiStatus,
  WardrobeCategory,
  WardrobeCondition,
  WardrobeItem,
  WardrobeSeason,
  WardrobeSource,
} from '../types';

interface CreateCloudWardrobeItemInput {
  id: string;
  ownerId: string;
  imagePath: string;
  name: string;
  category: WardrobeCategory;
  color: string;
  season: WardrobeSeason;
  source: Extract<WardrobeSource, 'camera' | 'library'>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' ? value : null;
}

function readNullableString(
  record: Record<string, unknown>,
  key: string,
): string | null {
  const value = record[key];
  return value === null || typeof value === 'string' ? value : null;
}

function readStringArray(
  record: Record<string, unknown>,
  key: string,
): string[] {
  const value = record[key];
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : [];
}

function readEnum<T extends string>(
  record: Record<string, unknown>,
  key: string,
  values: readonly T[],
): T | null {
  const value = record[key];
  return typeof value === 'string' && values.includes(value as T)
    ? (value as T)
    : null;
}

function readTimestampIso(
  record: Record<string, unknown>,
  key: string,
): string | null {
  const value = record[key];
  return value instanceof Timestamp ? value.toDate().toISOString() : null;
}

function readNullableNumber(
  record: Record<string, unknown>,
  key: string,
): number | null {
  const value = record[key];
  return value === null || typeof value === 'number' ? value : null;
}

function mapWardrobeDocument(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): WardrobeItem | null {
  const raw = snapshot.data();

  if (!isRecord(raw)) {
    return null;
  }

  const ownerId = readString(raw, 'ownerId');
  const imagePath = readNullableString(raw, 'imagePath');
  const name = readString(raw, 'name');
  const category = readEnum(raw, 'category', WARDROBE_CATEGORIES);
  const color = readString(raw, 'color');
  const season = readEnum(raw, 'season', WARDROBE_SEASONS);
  const condition = readEnum(raw, 'condition', WARDROBE_CONDITIONS);
  const source = readEnum(raw, 'source', WARDROBE_SOURCES);
  const aiStatus = readEnum(raw, 'aiStatus', WARDROBE_AI_STATUSES);
  const createdAt = readTimestampIso(raw, 'createdAt');
  const updatedAt = readTimestampIso(raw, 'updatedAt');
  const schemaVersion = raw.schemaVersion;
  const isListedForSwap = raw.isListedForSwap;

  if (
    !ownerId ||
    !name ||
    !category ||
    !color ||
    !season ||
    !condition ||
    !source ||
    !aiStatus ||
    !createdAt ||
    !updatedAt ||
    typeof schemaVersion !== 'number' ||
    typeof isListedForSwap !== 'boolean'
  ) {
    console.warn(`Skipping invalid wardrobe document ${snapshot.id}.`);
    return null;
  }

  return {
    id: snapshot.id,
    ownerId,
    imageUrl: null,
    imagePath,
    name,
    category,
    subcategory: readNullableString(raw, 'subcategory'),
    color,
    secondaryColors: readStringArray(raw, 'secondaryColors'),
    brand: readNullableString(raw, 'brand'),
    material: readNullableString(raw, 'material'),
    size: readNullableString(raw, 'size'),
    season,
    condition,
    styleTags: readStringArray(raw, 'styleTags'),
    source,
    aiStatus: aiStatus as WardrobeAiStatus,
    aiConfidence: readNullableNumber(raw, 'aiConfidence'),
    aiModelVersion: readNullableString(raw, 'aiModelVersion'),
    isListedForSwap,
    swapListingId: readNullableString(raw, 'swapListingId'),
    createdAt,
    updatedAt,
    schemaVersion,
  };
}

export function createWardrobeItemId(): string {
  const { db } = getFirebaseServices();
  return doc(collection(db, 'wardrobeItems')).id;
}

export function subscribeToWardrobe(
  ownerId: string,
  onChange: (items: WardrobeItem[]) => void,
  onError: (error: Error) => void,
): () => void {
  const { db } = getFirebaseServices();
  const wardrobeQuery = query(
    collection(db, 'wardrobeItems'),
    where('ownerId', '==', ownerId),
  );

  return onSnapshot(
    wardrobeQuery,
    (snapshot) => {
      const items = snapshot.docs
        .map(mapWardrobeDocument)
        .filter((item): item is WardrobeItem => item !== null)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      onChange(items);
    },
    (error) => onError(error),
  );
}

export async function createCloudWardrobeItem(
  input: CreateCloudWardrobeItemInput,
): Promise<void> {
  const { db } = getFirebaseServices();
  const itemRef = doc(db, 'wardrobeItems', input.id);

  await setDoc(itemRef, {
    ownerId: input.ownerId,
    imagePath: input.imagePath,
    name: input.name,
    category: input.category,
    subcategory: null,
    color: input.color,
    secondaryColors: [],
    brand: null,
    material: null,
    size: null,
    season: input.season,
    condition: 'good' satisfies WardrobeCondition,
    styleTags: [],
    source: input.source,
    aiStatus: 'not_requested' satisfies WardrobeAiStatus,
    aiConfidence: null,
    aiModelVersion: null,
    isListedForSwap: false,
    swapListingId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    schemaVersion: WARDROBE_SCHEMA_VERSION,
  });
}

export async function updateCloudWardrobeItem(
  ownerId: string,
  itemId: string,
  input: UpdateWardrobeItemInput,
): Promise<void> {
  const { db } = getFirebaseServices();
  const itemRef = doc(db, 'wardrobeItems', itemId);

  // The ownerId write is deliberate: Security Rules verify it is unchanged,
  // and this makes ownership intent explicit in every mutation.
  await updateDoc(itemRef, {
    ...input,
    ownerId,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCloudWardrobeItem(itemId: string): Promise<void> {
  const { db } = getFirebaseServices();
  await deleteDoc(doc(db, 'wardrobeItems', itemId));
}
