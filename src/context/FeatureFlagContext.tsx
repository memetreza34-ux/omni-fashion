import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AppState } from 'react-native';

import {
  getDefaultFeatureFlags,
  resetFeatureFlagOverrides,
  setFeatureFlagOverrides,
} from '@/config/feature-flags';
import type { FeatureFlagKey, FeatureFlags } from '@/config/feature-flags';
import { useAuth } from '@/context/AuthContext';
import {
  loadRemoteFeatureFlags,
  type FeatureFlagSource,
} from '@/services/feature-flags/remote-feature-flags';

interface FeatureFlagContextValue {
  flags: FeatureFlags;
  source: FeatureFlagSource;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue | null>(null);

function safeDefaults(): FeatureFlags {
  resetFeatureFlagOverrides();
  return getDefaultFeatureFlags();
}

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const { user, isBackendConfigured } = useAuth();
  const [flags, setFlags] = useState<FeatureFlags>(() => getDefaultFeatureFlags());
  const [source, setSource] = useState<FeatureFlagSource>('defaults');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id ?? null;
  const developmentDemo = user?.isDevelopmentDemo ?? false;

  const refresh = useCallback(async () => {
    if (!userId || developmentDemo || !isBackendConfigured) {
      setFlags(safeDefaults());
      setSource('defaults');
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await loadRemoteFeatureFlags();
      setFeatureFlagOverrides(result.flags);
      setFlags({ ...result.flags });
      setSource(result.source);
    } catch (loadError: unknown) {
      console.error('Failed to load remote feature flags', loadError);
      setFlags(safeDefaults());
      setSource('defaults');
      setError('Remote-Konfiguration konnte nicht geladen werden. Sichere Standardwerte sind aktiv.');
    } finally {
      setIsLoading(false);
    }
  }, [developmentDemo, isBackendConfigured, userId]);

  useEffect(() => {
    let active = true;

    void Promise.resolve().then(() => {
      if (active) {
        return refresh();
      }
      return undefined;
    });

    return () => {
      active = false;
    };
  }, [refresh]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refresh();
      }
    });

    return () => subscription.remove();
  }, [refresh]);

  const value = useMemo<FeatureFlagContextValue>(
    () => ({ flags, source, isLoading, error, refresh }),
    [error, flags, isLoading, refresh, source],
  );

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags(): FeatureFlagContextValue {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used inside FeatureFlagProvider.');
  }
  return context;
}

export function useFeatureFlag(key: FeatureFlagKey): boolean {
  return useFeatureFlags().flags[key];
}
