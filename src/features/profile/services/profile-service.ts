import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

import { getFirebaseServices } from '@/services/firebase/app';

import type {
  CreateUserProfileInput,
  UpdateUserProfileInput,
  UserProfile,
} from '../types';

const USER_PROFILE_SCHEMA_VERSION = 1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readNullableString(
  record: Record<string, unknown>,
  key: string,
): string | null {
  const value = record[key];
  return typeof value === 'string' ? value : null;
}

function readString(
  record: Record<string, unknown>,
  key: string,
  fallback: string,
): string {
  const value = record[key];
  return typeof value === 'string' ? value : fallback;
}

function readBoolean(
  record: Record<string, unknown>,
  key: string,
  fallback: boolean,
): boolean {
  const value = record[key];
  return typeof value === 'boolean' ? value : fallback;
}

function readNumber(
  record: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const value = record[key];
  return typeof value === 'number' ? value : fallback;
}

function timestampToIso(value: unknown): string | null {
  return value instanceof Timestamp ? value.toDate().toISOString() : null;
}

function mapProfileDocument(
  id: string,
  rawData: unknown,
): UserProfile | null {
  if (!isRecord(rawData)) {
    return null;
  }

  return {
    id,
    displayName: readString(rawData, 'displayName', ''),
    avatarUrl: readNullableString(rawData, 'avatarUrl'),
    locale: readString(rawData, 'locale', 'de-DE'),
    country: readNullableString(rawData, 'country'),
    city: readNullableString(rawData, 'city'),
    onboardingCompleted: readBoolean(
      rawData,
      'onboardingCompleted',
      false,
    ),
    createdAt: timestampToIso(rawData.createdAt),
    updatedAt: timestampToIso(rawData.updatedAt),
    schemaVersion: readNumber(
      rawData,
      'schemaVersion',
      USER_PROFILE_SCHEMA_VERSION,
    ),
  };
}

export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  const { db } = getFirebaseServices();
  const profileRef = doc(db, 'users', userId);
  const snapshot = await getDoc(profileRef);

  if (!snapshot.exists()) {
    return null;
  }

  return mapProfileDocument(snapshot.id, snapshot.data());
}

export async function createUserProfileIfMissing(
  input: CreateUserProfileInput,
): Promise<void> {
  const { db } = getFirebaseServices();
  const profileRef = doc(db, 'users', input.userId);
  const snapshot = await getDoc(profileRef);

  if (snapshot.exists()) {
    const existingProfile = mapProfileDocument(snapshot.id, snapshot.data());
    const desiredDisplayName = input.displayName?.trim() ?? '';

    if (
      existingProfile &&
      existingProfile.displayName.trim().length === 0 &&
      desiredDisplayName.length > 0
    ) {
      await updateDoc(profileRef, {
        displayName: desiredDisplayName,
        updatedAt: serverTimestamp(),
        schemaVersion: USER_PROFILE_SCHEMA_VERSION,
      });
    }

    return;
  }

  await setDoc(profileRef, {
    displayName: input.displayName?.trim() ?? '',
    avatarUrl: null,
    locale: input.locale,
    country: null,
    city: null,
    onboardingCompleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    schemaVersion: USER_PROFILE_SCHEMA_VERSION,
  });
}

export async function updateUserProfile(
  userId: string,
  input: UpdateUserProfileInput,
): Promise<void> {
  const { db } = getFirebaseServices();
  const profileRef = doc(db, 'users', userId);

  const updatePayload: Record<string, unknown> = {
    ...input,
    updatedAt: serverTimestamp(),
    schemaVersion: USER_PROFILE_SCHEMA_VERSION,
  };

  await updateDoc(profileRef, updatePayload);
}
