import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useTrustSafety } from '@/context/TrustSafetyContext';
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
      <View className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-3">
        <Text className="text-amber-800 dark:text-amber-200 font-extrabold">
          Klärungsfall geöffnet
        </Text>
        <Text className="text-zinc-600 dark:text-zinc-400 text-xs mt-2 leading-5">
          Der normale Trade-Fortschritt ist gestoppt. Die Eigentumsübertragung wird während des offenen Klärungsfalls nicht automatisch fortgesetzt.
        </Text>
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
      <TouchableOpacity
        onPress={() => setShowReasons((current) => !current)}
        disabled={submitting}
        className="bg-amber-500/10 border border-amber-500/25 rounded-xl py-3 items-center"
      >
        {submitting ? (
          <ActivityIndicator size="small" color="#d97706" />
        ) : (
          <Text className="text-amber-700 dark:text-amber-300 font-bold text-xs">
            Problem melden / Klärungsfall öffnen
          </Text>
        )}
      </TouchableOpacity>

      {showReasons ? (
        <View className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 mt-2">
          <Text className="text-zinc-500 text-[11px] font-bold uppercase mb-2">
            Problem auswählen
          </Text>
          <View className="flex-row flex-wrap">
            {DISPUTE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => void submit(option.value)}
                disabled={submitting}
                className="bg-zinc-100 dark:bg-zinc-800 rounded-full px-3 py-2 mr-2 mb-2"
              >
                <Text className="text-black dark:text-white text-xs font-semibold">
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
