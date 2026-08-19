import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { useTrustSafety } from '@/context/TrustSafetyContext';
import { AppButton } from '@/design-system/AppButton';
import { StatusBanner } from '@/design-system/StatusBanner';
import type { SwapTransaction } from '@/features/swap/types';
import type { DisputeReason } from '@/features/trust-safety/types';

const DISPUTE_OPTIONS: readonly { value: DisputeReason; label: string }[] = [
  { value: 'item_not_received', label: 'Nicht erhalten' },
  { value: 'item_not_as_described', label: 'Anders als beschrieben' },
  { value: 'wrong_item', label: 'Falscher Artikel' },
  { value: 'damaged_item', label: 'Beschädigt' },
  { value: 'unsafe_interaction', label: 'Unsichere Interaktion' },
  { value: 'other', label: 'Sonstiges' },
];

export function SwapDisputeAction({
  transaction,
}: {
  transaction: SwapTransaction;
}) {
  const { openDispute } = useTrustSafety();
  const [showReasons, setShowReasons] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (transaction.status === 'disputed') {
    return (
      <View className="mb-3">
        <StatusBanner
          tone="warning"
          title="Klärungsfall geöffnet"
          message="Der normale Trade-Fortschritt ist gestoppt. Die Eigentumsübertragung wird während des offenen Klärungsfalls nicht automatisch fortgesetzt."
        />
      </View>
    );
  }

  if (
    transaction.status === 'completed' ||
    transaction.status === 'cancelled' ||
    transaction.finalizationState === 'processing' ||
    transaction.finalizationState === 'completed'
  ) {
    return null;
  }

  const submit = async (reason: DisputeReason) => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await openDispute({ transactionId: transaction.id, reason });
      setShowReasons(false);
      Alert.alert(
        'Klärungsfall geöffnet',
        'Der Trade wurde serverseitig gestoppt und als offener Klärungsfall gespeichert.',
      );
    } catch (error: unknown) {
      console.error('Failed to open OmniSwap dispute', error);
      Alert.alert(
        'Klärungsfall nicht geöffnet',
        'Der Trade-Status wurde nicht verändert. Bitte erneut versuchen.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="mb-4">
      <AppButton
        label={
          showReasons
            ? 'Klärungsfall-Auswahl schließen'
            : 'Problem melden / Klärungsfall öffnen'
        }
        accessibilityLabel={
          showReasons
            ? 'Auswahl für Klärungsgrund schließen'
            : `Problem für Trade ${transaction.id.slice(0, 6)} melden und Klärungsfall öffnen`
        }
        variant="secondary"
        loading={submitting}
        onPress={() => setShowReasons((current) => !current)}
      />

      {showReasons ? (
        <View
          accessibilityLabel="Klärungsgrund auswählen"
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 mt-2"
        >
          <Text className="text-zinc-500 text-[11px] font-bold uppercase mb-2">
            Problem auswählen
          </Text>
          <View className="flex-row flex-wrap">
            {DISPUTE_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityLabel={`Klärungsfall öffnen: ${option.label}`}
                accessibilityState={{ disabled: submitting }}
                disabled={submitting}
                hitSlop={4}
                onPress={() => void submit(option.value)}
                className={`min-h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full px-4 mr-2 mb-2 items-center justify-center ${
                  submitting ? 'opacity-50' : ''
                }`}
              >
                <Text className="text-black dark:text-white text-xs font-semibold">
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
