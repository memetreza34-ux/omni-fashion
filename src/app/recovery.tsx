import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { useFeatureFlag } from '@/context/FeatureFlagContext';
import { AppButton } from '@/design-system/AppButton';
import { AppCard } from '@/design-system/AppCard';
import { StatusBanner } from '@/design-system/StatusBanner';
import { loadRecoveryQueue } from '@/features/recovery/recovery-service';
import type { RecoveryQueue } from '@/features/recovery/types';

function dateLabel(millis: number): string {
  return new Date(millis).toLocaleString('de-DE');
}

export default function RecoveryScreen() {
  const enabled = useFeatureFlag('internalModeratorUi');
  const [queue, setQueue] = useState<RecoveryQueue | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);
    try {
      setQueue(await loadRecoveryQueue());
    } catch (loadError: unknown) {
      console.error('Failed to load recovery queue', loadError);
      setError(
        'Recovery-Daten konnten nicht geladen werden. Ein serverseitiger admin/moderator Claim ist erforderlich.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [enabled]);

  if (!enabled) {
    return (
      <View className="flex-1 bg-white dark:bg-zinc-950 pt-16 px-4">
        <Text className="text-black dark:text-white text-3xl font-black mb-5">
          Interne Recovery
        </Text>
        <StatusBanner
          tone="neutral"
          title="Recovery-Oberfläche deaktiviert"
          message="internalModeratorUi ist standardmäßig false. Die Recovery Queue ist zusätzlich serverseitig durch den Moderator-Claim geschützt."
        />
      </View>
    );
  }

  const total =
    (queue?.failedTransactions.length ?? 0) +
    (queue?.manualDisputes.length ?? 0) +
    (queue?.pushDeliveries.length ?? 0);

  return (
    <ScrollView
      className="flex-1 bg-zinc-50 dark:bg-zinc-950"
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 64,
        paddingBottom: 120,
      }}
    >
      <Text className="text-black dark:text-white text-3xl font-black">
        Interne Recovery
      </Text>
      <Text className="text-zinc-500 text-sm mt-2 leading-6">
        Read-only Übersicht für technische Fälle. Diese Oberfläche führt bewusst keine automatische Trade- oder Datenreparatur aus.
      </Text>

      {error ? (
        <View className="mt-5">
          <StatusBanner
            tone="danger"
            title="Recovery Queue nicht verfügbar"
            message={error}
          />
        </View>
      ) : null}

      <View className="mt-4">
        <AppButton
          label="Recovery Queue aktualisieren"
          variant="secondary"
          loading={loading}
          onPress={() => void refresh()}
        />
      </View>

      {loading ? (
        <View
          accessibilityRole="progressbar"
          accessibilityLabel="Recovery Queue wird geladen"
          className="py-16 items-center"
        >
          <ActivityIndicator color="#4f46e5" />
        </View>
      ) : (
        <>
          {total === 0 ? (
            <View className="mt-6">
              <StatusBanner
                tone="success"
                title="Keine offenen Recovery-Fälle"
                message="Die aktuelle technische Recovery Queue ist leer."
              />
            </View>
          ) : null}

          <Text className="text-black dark:text-white text-xl font-extrabold mt-8 mb-3">
            Fehlgeschlagene Trade-Finalisierung ({queue?.failedTransactions.length ?? 0})
          </Text>
          <View className="gap-3">
            {queue?.failedTransactions.map((item) => (
              <AppCard key={item.transactionId} tone="danger">
                <Text className="text-black dark:text-white font-extrabold">
                  Trade #{item.transactionId.slice(0, 8)}
                </Text>
                <Text className="text-zinc-500 text-xs mt-1">
                  {dateLabel(item.createdAtMillis)}
                </Text>
                <Text className="text-zinc-700 dark:text-zinc-300 text-sm mt-3">
                  Status: {item.status ?? 'unbekannt'}
                </Text>
                <Text className="text-zinc-700 dark:text-zinc-300 text-sm">
                  Finalisierung: {item.finalizationState ?? 'unbekannt'}
                </Text>
                <Text className="text-zinc-500 text-xs mt-2">
                  Requester: {item.requesterId ?? 'unbekannt'}
                </Text>
                <Text className="text-zinc-500 text-xs">
                  Listing Owner: {item.listingOwnerId ?? 'unbekannt'}
                </Text>
              </AppCard>
            ))}
          </View>

          <Text className="text-black dark:text-white text-xl font-extrabold mt-8 mb-3">
            Manuelle Disputes ({queue?.manualDisputes.length ?? 0})
          </Text>
          <View className="gap-3">
            {queue?.manualDisputes.map((item) => (
              <AppCard key={item.transactionId} tone="warning">
                <Text className="text-black dark:text-white font-extrabold">
                  Trade #{item.transactionId.slice(0, 8)}
                </Text>
                <Text className="text-zinc-500 text-xs mt-1">
                  {dateLabel(item.createdAtMillis)}
                </Text>
                <Text className="text-zinc-700 dark:text-zinc-300 text-sm mt-3">
                  Grund: {item.reason ?? 'nicht angegeben'}
                </Text>
                <Text className="text-zinc-600 dark:text-zinc-400 text-sm mt-2 leading-6">
                  {item.resolutionNote || 'Keine Moderationsnotiz.'}
                </Text>
              </AppCard>
            ))}
          </View>

          <Text className="text-black dark:text-white text-xl font-extrabold mt-8 mb-3">
            Push Delivery ({queue?.pushDeliveries.length ?? 0})
          </Text>
          <View className="gap-3">
            {queue?.pushDeliveries.map((item) => (
              <AppCard key={item.deliveryId}>
                <Text className="text-black dark:text-white font-extrabold">
                  Delivery #{item.deliveryId.slice(0, 8)}
                </Text>
                <Text className="text-zinc-500 text-xs mt-1">
                  {dateLabel(item.createdAtMillis)}
                </Text>
                <Text className="text-zinc-700 dark:text-zinc-300 text-sm mt-3">
                  Status: {item.status ?? 'unbekannt'}
                </Text>
                <Text className="text-zinc-700 dark:text-zinc-300 text-sm">
                  Fehler: {item.errorCode ?? 'unbekannt'}
                </Text>
                <Text className="text-zinc-500 text-xs mt-2">
                  User: {item.userId ?? 'unbekannt'}
                </Text>
              </AppCard>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}
