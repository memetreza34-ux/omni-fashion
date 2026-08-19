import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

function subscribeToHydration() {
  return () => undefined;
}

/**
 * Static web rendering must return a deterministic scheme until the client has hydrated.
 * useSyncExternalStore gives React separate server and client snapshots without an effect-setState cycle.
 */
export function useColorScheme() {
  const hasHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const colorScheme = useRNColorScheme();

  return hasHydrated ? colorScheme : 'light';
}
