import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { useTrustSafety } from '@/context/TrustSafetyContext';
import { AppButton } from '@/design-system/AppButton';
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
  onBlocked,
}: {
  listingId: string;
  ownerId: string;
  onBlocked?: () => void;
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

  const runBlock = async () => {
    if (blocking) {
      return;
    }

    setBlocking(true);
    try {
      await blockUser(ownerId);
      onBlocked?.();
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

  return (
    <View className="mb-4 -mt-1 px-1">
      <View className="flex-row">
        <View className="flex-1 mr-2">
          <AppButton
            label={showReasons ? 'Meldung schließen' : 'Melden'}
            accessibilityLabel={
              showReasons
                ? 'Auswahl für Meldungsgrund schließen'
                : 'Dieses OmniSwap Listing melden'
            }
            variant="secondary"
            loading={reporting}
            disabled={blocking}
            onPress={() => setShowReasons((current) => !current)}
          />
        </View>
        <View className="flex-1">
          <AppButton
            label="Blockieren"
            accessibilityLabel="Konto des Listing-Eigentümers blockieren"
            variant="danger"
            loading={blocking}
            disabled={reporting}
            onPress={confirmBlock}
          />
        </View>
      </View>

      {showReasons ? (
        <View
          accessibilityLabel="Meldungsgrund auswählen"
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 mt-2"
        >
          <Text className="text-zinc-500 text-[11px] font-bold uppercase mb-2">
            Grund auswählen
          </Text>
          <View className="flex-row flex-wrap">
            {REPORT_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityLabel={`Listing melden wegen ${option.label}`}
                accessibilityState={{ disabled: reporting }}
                disabled={reporting}
                hitSlop={4}
                onPress={() => void submitReport(option.value)}
                className={`min-h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full px-4 mr-2 mb-2 items-center justify-center ${
                  reporting ? 'opacity-50' : ''
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
