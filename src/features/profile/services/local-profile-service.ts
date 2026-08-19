import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  USER_PROFILE_SCHEMA_VERSION,
  type UpdateUserProfileInput,
  type UserProfile,
} from '../types';

const LOCAL_PROFILE_PREFIX = '@omni_fashion_user_profile:';

function storageKey(userId: string): string {
  return `${LOCAL_PROFILE_PREFIX}${userId}`;
}

function isStoredProfile(value: unknown): value is UserProfile {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<UserProfile>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.displayName === 'string' &&
    (typeof candidate.avatarUrl === 'string' || candidate.avatarUrl === null) &&
    typeof candidate.locale === 'string' &&
    (typeof candidate.country === 'string' || candidate.country === null) &&
    (typeof candidate.city === 'string' || candidate.city === null) &&
    typeof candidate.onboardingCompleted === 'boolean' &&
    (typeof candidate.createdAt === 'string' || candidate.createdAt === null) &&
    (typeof candidate.updatedAt === 'string' || candidate.updatedAt === null)
  );
}

export async function loadOrCreateLocalUserProfile(input: {
  userId: string;
  displayName: string;
  locale: string;
}): Promise<UserProfile> {
  const key = storageKey(input.userId);
  const stored = await AsyncStorage.getItem(key);

  if (stored) {
    try {
      const parsed: unknown = JSON.parse(stored);
      if (isStoredProfile(parsed)) {
        return {
          ...parsed,
          schemaVersion: USER_PROFILE_SCHEMA_VERSION,
        };
      }
    } catch (error: unknown) {
      console.error('Failed to parse local UserProfile', error);
    }
  }

  const now = new Date().toISOString();
  const profile: UserProfile = {
    id: input.userId,
    displayName: input.displayName,
    avatarUrl: null,
    locale: input.locale,
    country: null,
    city: null,
    onboardingCompleted: false,
    createdAt: now,
    updatedAt: now,
    schemaVersion: USER_PROFILE_SCHEMA_VERSION,
  };

  await AsyncStorage.setItem(key, JSON.stringify(profile));
  return profile;
}

export async function updateLocalUserProfile(
  profile: UserProfile,
  input: UpdateUserProfileInput,
): Promise<UserProfile> {
  const nextProfile: UserProfile = {
    ...profile,
    ...input,
    updatedAt: new Date().toISOString(),
    schemaVersion: USER_PROFILE_SCHEMA_VERSION,
  };

  await AsyncStorage.setItem(
    storageKey(profile.id),
    JSON.stringify(nextProfile),
  );
  return nextProfile;
}
