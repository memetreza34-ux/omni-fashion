import AsyncStorage from '@react-native-async-storage/async-storage';

import { STYLE_PROFILE_SCHEMA_VERSION } from '../types';
import type { SaveStyleProfileInput, StyleProfile } from '../types';
import { parseStyleProfileDocument } from './style-profile-service';

const STORAGE_KEY = '@omni_fashion_style_profile_v1';

export async function loadLocalStyleProfile(
  userId: string,
): Promise<StyleProfile | null> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(stored);
    return parseStyleProfileDocument(userId, parsed);
  } catch {
    return null;
  }
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
