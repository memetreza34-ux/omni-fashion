import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';

import { getFirebaseServices } from '@/services/firebase/app';

import {
  FIT_PREFERENCES,
  STYLE_COLOR_OPTIONS,
  STYLE_PREFERENCES,
  STYLE_PROFILE_SCHEMA_VERSION,
  STYLE_QUESTIONNAIRE_VERSION,
} from '../types';
import type {
  FitPreference,
  SaveStyleProfileInput,
  StyleColorOption,
  StylePreference,
  StyleProfile,
  StyleProfileSummary,
  StyleQuestionnaire,
  WardrobeStyleSignals,
} from '../types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim();
  return normalized && normalized.length <= maxLength ? normalized : null;
}

function readEnumArray<T extends string>(
  value: unknown,
  allowed: readonly T[],
  maxItems: number,
): T[] | null {
  if (!Array.isArray(value) || value.length > maxItems) {
    return null;
  }

  const result: T[] = [];
  for (const entry of value) {
    if (typeof entry !== 'string' || !allowed.includes(entry as T)) {
      return null;
    }
    if (!result.includes(entry as T)) {
      result.push(entry as T);
    }
  }
  return result;
}

function readStringArray(
  value: unknown,
  maxItems: number,
  maxLength: number,
): string[] | null {
  if (!Array.isArray(value) || value.length > maxItems) {
    return null;
  }

  const result: string[] = [];
  for (const entry of value) {
    const normalized = readString(entry, maxLength);
    if (!normalized) {
      return null;
    }
    if (!result.includes(normalized)) {
      result.push(normalized);
    }
  }
  return result;
}

function readUnitNumber(value: unknown): number | null {
  return typeof value === 'number' && value >= 0 && value <= 1 ? value : null;
}

function timestampToIso(value: unknown): string | null {
  return value instanceof Timestamp ? value.toDate().toISOString() : null;
}

function readNullableIso(value: unknown): string | null {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
    ? value
    : null;
}

function parseQuestionnaire(value: unknown): StyleQuestionnaire | null {
  if (!isRecord(value)) {
    return null;
  }

  const preferredStyles = readEnumArray<StylePreference>(
    value.preferredStyles,
    STYLE_PREFERENCES,
    5,
  );
  const preferredColors = readEnumArray<StyleColorOption>(
    value.preferredColors,
    STYLE_COLOR_OPTIONS,
    8,
  );
  const avoidedColors = readEnumArray<StyleColorOption>(
    value.avoidedColors,
    STYLE_COLOR_OPTIONS,
    8,
  );
  const fitPreferences = readEnumArray<FitPreference>(
    value.fitPreferences,
    FIT_PREFERENCES,
    3,
  );
  const formalVsCasual = readUnitNumber(value.formalVsCasual);
  const minimalVsBold = readUnitNumber(value.minimalVsBold);

  if (
    !preferredStyles ||
    preferredStyles.length === 0 ||
    !preferredColors ||
    !avoidedColors ||
    !fitPreferences ||
    fitPreferences.length === 0 ||
    formalVsCasual === null ||
    minimalVsBold === null ||
    value.questionnaireVersion !== STYLE_QUESTIONNAIRE_VERSION
  ) {
    return null;
  }

  return {
    preferredStyles,
    preferredColors,
    avoidedColors,
    fitPreferences,
    formalVsCasual,
    minimalVsBold,
    questionnaireVersion: STYLE_QUESTIONNAIRE_VERSION,
  };
}

function parseWardrobeSignals(value: unknown): WardrobeStyleSignals | null {
  if (!isRecord(value)) {
    return null;
  }

  const dominantCategories = readStringArray(value.dominantCategories, 5, 40);
  const dominantColors = readStringArray(value.dominantColors, 5, 60);
  const dominantStyleTags = readStringArray(value.dominantStyleTags, 8, 50);

  if (
    !dominantCategories ||
    !dominantColors ||
    !dominantStyleTags ||
    typeof value.analyzedItemCount !== 'number' ||
    !Number.isInteger(value.analyzedItemCount) ||
    value.analyzedItemCount < 0 ||
    typeof value.totalItemCount !== 'number' ||
    !Number.isInteger(value.totalItemCount) ||
    value.totalItemCount < 0 ||
    value.analyzedItemCount > value.totalItemCount
  ) {
    return null;
  }

  return {
    dominantCategories,
    dominantColors,
    dominantStyleTags,
    analyzedItemCount: value.analyzedItemCount,
    totalItemCount: value.totalItemCount,
  };
}

function parseSummary(value: unknown): StyleProfileSummary | null {
  if (!isRecord(value)) {
    return null;
  }

  const title = readString(value.title, 80);
  const archetype = readString(value.archetype, 80);
  const description = readString(value.description, 400);
  const topStyles = readEnumArray<StylePreference>(
    value.topStyles,
    STYLE_PREFERENCES,
    3,
  );

  if (
    !title ||
    !archetype ||
    !description ||
    !topStyles ||
    topStyles.length === 0
  ) {
    return null;
  }

  return { title, archetype, description, topStyles };
}

export function parseStyleProfileDocument(
  userId: string,
  value: unknown,
): StyleProfile | null {
  if (!isRecord(value) || value.userId !== userId) {
    return null;
  }

  const questionnaire = parseQuestionnaire(value.questionnaire);
  const wardrobeSignals = parseWardrobeSignals(value.wardrobeSignals);
  const summary = parseSummary(value.summary);

  if (
    !questionnaire ||
    !wardrobeSignals ||
    !summary ||
    value.schemaVersion !== STYLE_PROFILE_SCHEMA_VERSION
  ) {
    return null;
  }

  return {
    userId,
    questionnaire,
    wardrobeSignals,
    summary,
    createdAt:
      timestampToIso(value.createdAt) ?? readNullableIso(value.createdAt),
    updatedAt:
      timestampToIso(value.updatedAt) ?? readNullableIso(value.updatedAt),
    schemaVersion: STYLE_PROFILE_SCHEMA_VERSION,
  };
}

export async function getStyleProfile(
  userId: string,
): Promise<StyleProfile | null> {
  const { db } = getFirebaseServices();
  const snapshot = await getDoc(doc(db, 'styleProfiles', userId));

  if (!snapshot.exists()) {
    return null;
  }

  return parseStyleProfileDocument(userId, snapshot.data());
}

export async function saveStyleProfile(
  userId: string,
  input: SaveStyleProfileInput,
): Promise<void> {
  const { db } = getFirebaseServices();
  const profileRef = doc(db, 'styleProfiles', userId);
  const existing = await getDoc(profileRef);

  await setDoc(
    profileRef,
    {
      userId,
      questionnaire: input.questionnaire,
      wardrobeSignals: input.wardrobeSignals,
      summary: input.summary,
      createdAt: existing.exists()
        ? (existing.data().createdAt ?? serverTimestamp())
        : serverTimestamp(),
      updatedAt: serverTimestamp(),
      schemaVersion: STYLE_PROFILE_SCHEMA_VERSION,
    },
    { merge: false },
  );
}
