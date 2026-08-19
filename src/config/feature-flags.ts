export const FEATURE_FLAG_KEYS = [
  'nativePushRegistration',
  'internalModeratorUi',
  'shopPartnerFeed',
  'photorealisticTryOn',
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];
export type FeatureFlags = Record<FeatureFlagKey, boolean>;

const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  nativePushRegistration: false,
  internalModeratorUi: false,
  shopPartnerFeed: false,
  photorealisticTryOn: false,
};

let runtimeOverrides: Partial<FeatureFlags> = {};

export function getDefaultFeatureFlags(): FeatureFlags {
  return { ...DEFAULT_FEATURE_FLAGS };
}

export function isFeatureEnabled(key: FeatureFlagKey): boolean {
  return runtimeOverrides[key] ?? DEFAULT_FEATURE_FLAGS[key];
}

export function getFeatureFlags(): FeatureFlags {
  return {
    ...DEFAULT_FEATURE_FLAGS,
    ...runtimeOverrides,
  };
}

/**
 * Runtime overrides are process-local. The React FeatureFlagProvider feeds this
 * boundary from the trusted backend while preserving safe local defaults.
 */
export function setFeatureFlagOverrides(
  overrides: Partial<FeatureFlags>,
): void {
  runtimeOverrides = { ...overrides };
}

export function resetFeatureFlagOverrides(): void {
  runtimeOverrides = {};
}
