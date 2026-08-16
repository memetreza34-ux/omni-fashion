import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

import { getFirebaseServices } from '@/services/firebase/app';

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
import { WARDROBE_SEASONS } from '@/features/wardrobe/types';
import type { WardrobeSeason } from '@/features/wardrobe/types';

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

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readScore(value: unknown): number | null {
  const number = readNumber(value);
  return number !== null && number >= 0 && number <= 100 ? number : null;
}

function readStringArray(
  value: unknown,
  minItems: number,
  maxItems: number,
  maxLength: number,
): string[] | null {
  if (
    !Array.isArray(value) ||
    value.length < minItems ||
    value.length > maxItems
  ) {
    return null;
  }

  const result: string[] = [];
  for (const entry of value) {
    if (typeof entry !== 'string') {
      return null;
    }
    const normalized = entry.trim();
    if (!normalized || normalized.length > maxLength) {
      return null;
    }
    if (!result.includes(normalized)) {
      result.push(normalized);
    }
  }

  return result.length >= minItems ? result : null;
}

function parseBreakdown(value: unknown): OutfitScoreBreakdown | null {
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

function timestampToIso(value: unknown): string | null {
  return value instanceof Timestamp ? value.toDate().toISOString() : null;
}

function parseSavedOutfit(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): SavedOutfit | null {
  const raw = snapshot.data();
  if (!isRecord(raw)) {
    return null;
  }

  const ownerId = typeof raw.ownerId === 'string' ? raw.ownerId : null;
  const itemIds = readStringArray(raw.itemIds, 2, 5, 160);
  const occasion = readEnum<OutfitOccasion>(raw.occasion, OUTFIT_OCCASIONS);
  const season = readEnum<WardrobeSeason>(raw.season, WARDROBE_SEASONS);
  const score = readScore(raw.score);
  const scoreBreakdown = parseBreakdown(raw.scoreBreakdown);
  const reasons = readStringArray(raw.reasons, 1, 3, 160);
  const feedback = readEnum<OutfitFeedback>(
    raw.feedback,
    OUTFIT_FEEDBACK_VALUES,
  );
  const createdAt = timestampToIso(raw.createdAt);
  const updatedAt = timestampToIso(raw.updatedAt);

  if (
    !ownerId ||
    !itemIds ||
    !occasion ||
    !season ||
    score === null ||
    !scoreBreakdown ||
    !reasons ||
    !feedback ||
    !createdAt ||
    !updatedAt ||
    raw.schemaVersion !== SAVED_OUTFIT_SCHEMA_VERSION
  ) {
    return null;
  }

  return {
    id: snapshot.id,
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

export function subscribeToSavedOutfits(
  ownerId: string,
  onChange: (outfits: SavedOutfit[]) => void,
  onError: (error: Error) => void,
): () => void {
  const { db } = getFirebaseServices();
  const outfitsQuery = query(
    collection(db, 'outfits'),
    where('ownerId', '==', ownerId),
  );

  return onSnapshot(
    outfitsQuery,
    (snapshot) => {
      const outfits = snapshot.docs
        .map(parseSavedOutfit)
        .filter((outfit): outfit is SavedOutfit => outfit !== null)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onChange(outfits);
    },
    onError,
  );
}

export async function saveCloudOutfit(
  ownerId: string,
  input: SaveOutfitInput,
): Promise<string> {
  const { db } = getFirebaseServices();
  const recommendation = input.recommendation;

  const result = await addDoc(collection(db, 'outfits'), {
    ownerId,
    itemIds: recommendation.itemIds,
    occasion: recommendation.occasion,
    season: input.season,
    score: recommendation.score,
    scoreBreakdown: recommendation.scoreBreakdown,
    reasons: recommendation.reasons,
    feedback: 'none',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    schemaVersion: SAVED_OUTFIT_SCHEMA_VERSION,
  });

  return result.id;
}

export async function updateCloudOutfitFeedback(
  outfitId: string,
  feedback: OutfitFeedback,
): Promise<void> {
  const { db } = getFirebaseServices();
  await updateDoc(doc(db, 'outfits', outfitId), {
    feedback,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCloudOutfit(outfitId: string): Promise<void> {
  const { db } = getFirebaseServices();
  await deleteDoc(doc(db, 'outfits', outfitId));
}
