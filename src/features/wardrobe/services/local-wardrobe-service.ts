import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  WARDROBE_CATEGORIES,
  WARDROBE_SCHEMA_VERSION,
  WARDROBE_SEASONS,
} from '../types';
import type {
  WardrobeAiFieldConfidence,
  WardrobeCategory,
  WardrobeItem,
  WardrobeSeason,
} from '../types';

const LEGACY_STORAGE_KEY = '@wardrobe_items';
const STORAGE_KEY = '@omni_fashion_wardrobe_v2';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readEnum<T extends string>(
  value: unknown,
  values: readonly T[],
  fallback: T,
): T {
  return typeof value === 'string' && values.includes(value as T)
    ? (value as T)
    : fallback;
}

function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function readNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : [];
}

function readAiFieldConfidence(value: unknown): WardrobeAiFieldConfidence | null {
  if (!isRecord(value)) {
    return null;
  }

  const keys: readonly (keyof WardrobeAiFieldConfidence)[] = [
    'category',
    'subcategory',
    'color',
    'brand',
    'material',
    'season',
    'styleTags',
  ];

  for (const key of keys) {
    const confidence = value[key];
    if (
      typeof confidence !== 'number' ||
      confidence < 0 ||
      confidence > 1
    ) {
      return null;
    }
  }

  return {
    category: value.category as number,
    subcategory: value.subcategory as number,
    color: value.color as number,
    brand: value.brand as number,
    material: value.material as number,
    season: value.season as number,
    styleTags: value.styleTags as number,
  };
}

function normalizeLocalItem(raw: unknown, ownerId: string): WardrobeItem | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id = readString(raw.id, '');
  if (!id) {
    return null;
  }

  const now = new Date().toISOString();
  const imageUrl = readNullableString(raw.imageUrl);
  const imagePath = readNullableString(raw.imagePath);
  const category = readEnum<WardrobeCategory>(
    raw.category,
    WARDROBE_CATEGORIES,
    'Other',
  );
  const season = readEnum<WardrobeSeason>(
    raw.season,
    WARDROBE_SEASONS,
    'All',
  );

  return {
    id,
    ownerId,
    imageUrl,
    imagePath,
    name: readString(raw.name, 'Neues Kleidungsstück'),
    category,
    subcategory: readNullableString(raw.subcategory),
    color: readString(raw.color, 'Unbekannt'),
    secondaryColors: readStringArray(raw.secondaryColors),
    brand: readNullableString(raw.brand),
    material: readNullableString(raw.material),
    size: readNullableString(raw.size),
    season,
    condition:
      raw.condition === 'new_with_tags' ||
      raw.condition === 'like_new' ||
      raw.condition === 'worn'
        ? raw.condition
        : 'good',
    styleTags: readStringArray(raw.styleTags),
    source:
      raw.source === 'camera' ||
      raw.source === 'library' ||
      raw.source === 'manual'
        ? raw.source
        : 'migration',
    aiStatus:
      raw.aiStatus === 'pending' ||
      raw.aiStatus === 'completed' ||
      raw.aiStatus === 'failed'
        ? raw.aiStatus
        : 'not_requested',
    aiConfidence:
      typeof raw.aiConfidence === 'number' ? raw.aiConfidence : null,
    aiFieldConfidence: readAiFieldConfidence(raw.aiFieldConfidence),
    aiModelVersion: readNullableString(raw.aiModelVersion),
    aiPromptVersion: readNullableString(raw.aiPromptVersion),
    aiAnalyzedAt: readNullableString(raw.aiAnalyzedAt),
    aiErrorCode: readNullableString(raw.aiErrorCode),
    isListedForSwap:
      typeof raw.isListedForSwap === 'boolean' ? raw.isListedForSwap : false,
    swapListingId: readNullableString(raw.swapListingId),
    createdAt: readString(raw.createdAt, now),
    updatedAt: readString(raw.updatedAt, readString(raw.createdAt, now)),
    schemaVersion:
      typeof raw.schemaVersion === 'number'
        ? raw.schemaVersion
        : WARDROBE_SCHEMA_VERSION,
  };
}

async function readStoredArray(key: string): Promise<unknown[]> {
  const stored = await AsyncStorage.getItem(key);
  if (!stored) {
    return [];
  }

  const parsed: unknown = JSON.parse(stored);
  return Array.isArray(parsed) ? parsed : [];
}

export async function loadLocalWardrobe(ownerId: string): Promise<WardrobeItem[]> {
  const currentItems = await readStoredArray(STORAGE_KEY);

  if (currentItems.length > 0) {
    return currentItems
      .map((item) => normalizeLocalItem(item, ownerId))
      .filter((item): item is WardrobeItem => item !== null);
  }

  const legacyItems = await readStoredArray(LEGACY_STORAGE_KEY);
  const migratedItems = legacyItems
    .map((item) => normalizeLocalItem(item, ownerId))
    .filter((item): item is WardrobeItem => item !== null);

  if (migratedItems.length > 0) {
    await saveLocalWardrobe(migratedItems);
  }

  return migratedItems;
}

export async function saveLocalWardrobe(items: WardrobeItem[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
