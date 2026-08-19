import AsyncStorage from '@react-native-async-storage/async-storage';

import { WARDROBE_SEASONS } from '@/features/wardrobe/types';
import type { WardrobeSeason } from '@/features/wardrobe/types';

import {
  OUTFIT_FEEDBACK_VALUES,
  SAVED_OUTFIT_SCHEMA_VERSION,
} from './saved-outfit-types';
import type {
  OutfitFeedback,
  SaveOutfitInput,
  SavedOutfit,
} from './saved-outfit-types';
import { OUTFIT_OCCASIONS } from './types';
import type { OutfitOccasion, OutfitScoreBreakdown } from './types';

const STORAGE_KEY = '@omni_fashion_saved_outfits_v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | null {
  return typeof value === 'string' && allowed.includes(value as T)
    ? (value as T)
    : null;
}

function readScore(value: unknown): number | null {
  return typeof value === 'number' && value >= 0 && value <= 100 ? value : null;
}

function readStringArray(
  value: unknown,
  minItems: number,
  maxItems: number,
): string[] | null {
  if (
    !Array.isArray(value) ||
    value.length < minItems ||
    value.length > maxItems
  ) {
    return null;
  }

  const result = value.filter(
    (entry): entry is string =>
      typeof entry === 'string' && entry.trim().length > 0,
  );
  return result.length === value.length ? result : null;
}

function readBreakdown(value: unknown): OutfitScoreBreakdown | null {
  if (!isRecord(value)) {
    return null;
  }

  const styleMatch = readScore(value.styleMatch);
  const colorHarmony = readScore(value.colorHarmony);
  const occasionFit = readScore(value.occasionFit);
  const seasonFit = readScore(value.seasonFit);
  const dataQuality = readScore(value.dataQuality);

  if (
    styleMatch === null ||
    colorHarmony === null ||
    occasionFit === null ||
    seasonFit === null ||
    dataQuality === null
  ) {
    return null;
  }

  return {
    styleMatch,
    colorHarmony,
    occasionFit,
    seasonFit,
    dataQuality,
  };
}

function parseLocalOutfit(value: unknown, ownerId: string): SavedOutfit | null {
  if (!isRecord(value) || value.ownerId !== ownerId) {
    return null;
  }

  const id = typeof value.id === 'string' ? value.id : null;
  const itemIds = readStringArray(value.itemIds, 2, 5);
  const occasion = readEnum<OutfitOccasion>(value.occasion, OUTFIT_OCCASIONS);
  const season = readEnum<WardrobeSeason>(value.season, WARDROBE_SEASONS);
  const score = readScore(value.score);
  const scoreBreakdown = readBreakdown(value.scoreBreakdown);
  const reasons = readStringArray(value.reasons, 1, 3);
  const feedback = readEnum<OutfitFeedback>(
    value.feedback,
    OUTFIT_FEEDBACK_VALUES,
  );
  const createdAt =
    typeof value.createdAt === 'string' &&
    !Number.isNaN(Date.parse(value.createdAt))
      ? value.createdAt
      : null;
  const updatedAt =
    typeof value.updatedAt === 'string' &&
    !Number.isNaN(Date.parse(value.updatedAt))
      ? value.updatedAt
      : null;

  if (
    !id ||
    !itemIds ||
    !occasion ||
    !season ||
    score === null ||
    !scoreBreakdown ||
    !reasons ||
    !feedback ||
    !createdAt ||
    !updatedAt ||
    value.schemaVersion !== SAVED_OUTFIT_SCHEMA_VERSION
  ) {
    return null;
  }

  return {
    id,
    ownerId,
    itemIds,
    occasion,
    season,
    score,
    scoreBreakdown,
    reasons,
    feedback,
    createdAt,
    updatedAt,
    schemaVersion: SAVED_OUTFIT_SCHEMA_VERSION,
  };
}

async function write(outfits: SavedOutfit[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(outfits));
}

export async function loadLocalSavedOutfits(
  ownerId: string,
): Promise<SavedOutfit[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((entry) => parseLocalOutfit(entry, ownerId))
      .filter((outfit): outfit is SavedOutfit => outfit !== null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export async function saveLocalOutfit(
  ownerId: string,
  input: SaveOutfitInput,
): Promise<SavedOutfit> {
  const outfits = await loadLocalSavedOutfits(ownerId);
  const now = new Date().toISOString();
  const outfit: SavedOutfit = {
    id: `local-outfit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ownerId,
    itemIds: input.recommendation.itemIds,
    occasion: input.recommendation.occasion,
    season: input.season,
    score: input.recommendation.score,
    scoreBreakdown: input.recommendation.scoreBreakdown,
    reasons: input.recommendation.reasons,
    feedback: 'none',
    createdAt: now,
    updatedAt: now,
    schemaVersion: SAVED_OUTFIT_SCHEMA_VERSION,
  };

  await write([outfit, ...outfits]);
  return outfit;
}

export async function updateLocalOutfitFeedback(
  ownerId: string,
  outfitId: string,
  feedback: OutfitFeedback,
): Promise<void> {
  const outfits = await loadLocalSavedOutfits(ownerId);
  const now = new Date().toISOString();
  await write(
    outfits.map((outfit) =>
      outfit.id === outfitId ? { ...outfit, feedback, updatedAt: now } : outfit,
    ),
  );
}

export async function deleteLocalOutfit(
  ownerId: string,
  outfitId: string,
): Promise<void> {
  const outfits = await loadLocalSavedOutfits(ownerId);
  await write(outfits.filter((outfit) => outfit.id !== outfitId));
}
