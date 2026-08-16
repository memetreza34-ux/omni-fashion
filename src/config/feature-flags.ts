export const FEATURE_FLAG_KEYS = [
  'nativePushRegistration',
  'internalModeratorUi',
  'shopPartnerFeed',
  'photorealisticTryOn',
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];

const DEFAULT_FEATURE_FLAGS: Record<FeatureFlagKey, boolean> = {
  nativePushRegistration: false,
  internalModeratorUi: false,
  shopPartnerFeed: false,
  photorealisticTryOn: false,
};

let runtimeOverrides: Partial<Record<FeatureFlagKey, boolean>> = {};

export function isFeatureEnabled(key: FeatureFlagKey): boolean {
  return runtimeOverrides[key] ?? DEFAULT_FEATURE_FLAGS[key];
}

export function getFeatureFlags(): Readonly<Record<FeatureFlagKey, boolean>> {
  return {
    ...DEFAULT_FEATURE_FLAGS,
    ...runtimeOverrides,
  };
}

/**
 * Runtime overrides are intentionally process-local for now. Production remote
 * config can feed this boundary later without spreading provider code through
 * screens and domains.
 */
export function setFeatureFlagOverrides(
  overrides: Partial<Record<FeatureFlagKey, boolean>>,
): void {
  runtimeOverrides = { ...overrides };
}

export function resetFeatureFlagOverrides(): void {
  runtimeOverrides = {};
}
