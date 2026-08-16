import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useTrustSafety } from '@/context/TrustSafetyContext';
import type { ReportReason } from '@/features/trust-safety/types';

const REPORT_OPTIONS: readonly { value: ReportReason; label: string }[] = [
  { value: 'fraud', label: 'Betrug' },
  { value: 'counterfeit', label: 'Fälschung' },
  { value: 'prohibited_item', label: 'Verbotener Artikel' },
  { value: 'harassment', label: 'Belästigung' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Sonstiges' },
];

export function MarketplaceSafetyActions({
  listingId,
  ownerId,
}: {
  listingId: string;
  ownerId: string;
}) {
  const { blockUser, report } = useTrustSafety();
  const [showReasons, setShowReasons] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const submitReport = async (reason: ReportReason) => {
    if (reporting) {
      return;
    }

    setReporting(true);
    try {
      await report({
        targetType: 'listing',
        targetId: listingId,
        reason,
      });
      setShowReasons(false);
      Alert.alert(
        'Meldung gesendet',
        'Die Meldung wurde als privater Moderationsfall gespeichert.',
      );
    } catch (error: unknown) {
      console.error('Failed to submit marketplace report', error);
      Alert.alert(
        'Meldung nicht gesendet',
        'Es wurde kein Moderationsfall als erfolgreich markiert. Bitte erneut versuchen.',
      );
    } finally {
      setReporting(false);
    }
  };

  const confirmBlock = () => {
    Alert.alert(
      'Konto blockieren?',
      'Listings dieses Kontos werden aus deinem OmniSwap-Feed ausgeblendet. Zwischen euch können keine neuen Tauschangebote erstellt werden.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Blockieren',
          style: 'destructive',
          onPress: () => void runBlock(),
        },
      ],
    );
  };

  const runBlock = async () => {
    if (blocking) {
      return;
    }

    setBlocking(true);
    try {
      await blockUser(ownerId);
    } catch (error: unknown) {
      console.error('Failed to block marketplace user', error);
      Alert.alert(
        'Blockierung fehlgeschlagen',
        'Das Konto wurde nicht als blockiert markiert. Bitte erneut versuchen.',
      );
    } finally {
      setBlocking(false);
    }
  };

  return (
    <View className="mb-4 -mt-1 px-1">
      <View className="flex-row">
        <TouchableOpacity
          onPress={() => setShowReasons((current) => !current)}
          disabled={reporting}
          className="flex-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 items-center mr-2"
        >
          {reporting ? (
            <ActivityIndicator size="small" color="#71717a" />
          ) : (
            <Text className="text-zinc-600 dark:text-zinc-300 font-bold text-xs">
              Melden
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={confirmBlock}
          disabled={blocking}
          className="flex-1 bg-red-500/10 border border-red-500/25 rounded-xl py-3 items-center"
        >
          {blocking ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <Text className="text-red-500 font-bold text-xs">Blockieren</Text>
          )}
        </TouchableOpacity>
      </View>

      {showReasons ? (
        <View className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 mt-2">
          <Text className="text-zinc-500 text-[11px] font-bold uppercase mb-2">
            Grund auswählen
          </Text>
          <View className="flex-row flex-wrap">
            {REPORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => void submitReport(option.value)}
                disabled={reporting}
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
