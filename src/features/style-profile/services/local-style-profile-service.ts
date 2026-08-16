import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  STYLE_PROFILE_SCHEMA_VERSION,
  STYLE_QUESTIONNAIRE_VERSION,
} from '../types';
import type {
  SaveStyleProfileInput,
  StyleProfile,
} from '../types';

const STORAGE_KEY = '@omni_fashion_style_profile_v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function loadLocalStyleProfile(
  userId: string,
): Promise<StyleProfile | null> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return null;
  }

  const parsed: unknown = JSON.parse(stored);
  if (!isRecord(parsed) || parsed.userId !== userId) {
    return null;
  }

  const questionnaire = parsed.questionnaire;
  const wardrobeSignals = parsed.wardrobeSignals;
  const summary = parsed.summary;

  if (
    !isRecord(questionnaire) ||
    !isRecord(wardrobeSignals) ||
    !isRecord(summary) ||
    questionnaire.questionnaireVersion !== STYLE_QUESTIONNAIRE_VERSION ||
    parsed.schemaVersion !== STYLE_PROFILE_SCHEMA_VERSION
  ) {
    return null;
  }

  // Local storage is development-only. Runtime correctness is enforced when
  // saving through typed app data; malformed old data is ignored rather than
  // being treated as a valid production profile.
  return parsed as unknown as StyleProfile;
}

export async function saveLocalStyleProfile(
  userId: string,
  input: SaveStyleProfileInput,
): Promise<StyleProfile> {
  const now = new Date().toISOString();
  const existing = await loadLocalStyleProfile(userId);

  const profile: StyleProfile = {
    userId,
    questionnaire: input.questionnaire,
    wardrobeSignals: input.wardrobeSignals,
    summary: input.summary,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    schemaVersion: STYLE_PROFILE_SCHEMA_VERSION,
  };

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  return profile;
}
