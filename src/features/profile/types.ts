export const USER_PROFILE_SCHEMA_VERSION = 1;

export interface UserProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  locale: string;
  country: string | null;
  city: string | null;
  onboardingCompleted: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  schemaVersion: typeof USER_PROFILE_SCHEMA_VERSION;
}

export interface CreateUserProfileInput {
  userId: string;
  displayName: string | null;
  locale: string;
}

export interface UpdateUserProfileInput {
  displayName?: string;
  avatarUrl?: string | null;
  locale?: string;
  country?: string | null;
  city?: string | null;
  onboardingCompleted?: boolean;
}
