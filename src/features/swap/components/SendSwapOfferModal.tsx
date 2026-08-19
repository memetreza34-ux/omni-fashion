import { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { AppButton } from '@/design-system/AppButton';
import { StatusBanner } from '@/design-system/StatusBanner';
import { MarketplaceSafetyActions } from '@/features/trust-safety/components/MarketplaceSafetyActions';
import type { WardrobeItem } from '@/features/wardrobe/types';

import type { SwapListing } from '../types';

export function SendSwapOfferModal({
  visible,
  listing,
  eligibleItems,
  onClose,
  onSend,
}: {
  visible: boolean;
  listing: SwapListing | null;
  eligibleItems: WardrobeItem[];
  onClose: () => void;
  onSend: (listingId: string, wardrobeItemId: string) => Promise<string>;
}) {
  const [selectedItemOverrideId, setSelectedItemOverrideId] = useState<
    string | null
  >(null);
  const [sending, setSending] = useState(false);

  if (!listing) {
    return null;
  }

  const selectedItemId =
    selectedItemOverrideId &&
    eligibleItems.some((item) => item.id === selectedItemOverrideId)
      ? selectedItemOverrideId
      : (eligibleItems[0]?.id ?? null);
  const selectedItem =
    eligibleItems.find((item) => item.id === selectedItemId) ?? null;

  const close = () => {
    if (sending) {
      return;
    }

    setSelectedItemOverrideId(null);
    onClose();
  };

  const submit = async () => {
    if (!selectedItemId || sending) {
      return;
    }

    setSending(true);
    try {
      await onSend(listing.id, selectedItemId);
      Alert.alert(
        'Angebot gesendet',
        'Das angebotene Kleidungsstück ist jetzt für dieses offene Tauschangebot reserviert.',
      );
      setSelectedItemOverrideId(null);
      onClose();
    } catch (error: unknown) {
      console.error('Failed to send OmniSwap offer', error);
      Alert.alert(
        'Angebot nicht gesendet',
        'Das Tauschangebot konnte nicht sicher angelegt werden. Bitte erneut versuchen.',
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={close}
    >
      <View className="flex-1 justify-end bg-black/60">
        <View
          accessibilityViewIsModal
          className="bg-white dark:bg-zinc-950 rounded-t-3xl max-h-[90%] p-5"
        >
          <View className="flex-row justify-between items-center mb-5">
            <View className="flex-1 pr-3">
              <Text className="text-black dark:text-white text-xl font-extrabold">
                Tauschangebot
              </Text>
              <Text className="text-zinc-500 text-xs mt-1">
                Für {listing.title}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tauschangebot-Dialog schließen"
              disabled={sending}
              hitSlop={8}
              onPress={close}
              className="min-h-12 px-3 items-center justify-center"
            >
              <Text className="text-zinc-500 font-bold">Schließen</Text>
            </Pressable>
          </View>

          <View
            accessibilityLabel={`Gewünschtes Kleidungsstück: ${listing.title}, ${listing.category}, ${listing.color}, ${listing.city}`}
            className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4 mb-5 flex-row items-center"
          >
            <View className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 mr-3 items-center justify-center">
              {listing.publicImageUrl ? (
                <Image
                  accessibilityLabel={`Bild von ${listing.title}`}
                  source={{ uri: listing.publicImageUrl }}
                  className="w-full h-full"
                  resizeMode="contain"
                />
              ) : (
                <Text className="text-zinc-400 text-xs">Kein Bild</Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-black dark:text-white font-bold">
                {listing.title}
              </Text>
              <Text className="text-zinc-500 text-xs mt-1">
                {listing.category} · {listing.color} · {listing.city}
              </Text>
            </View>
          </View>

          <MarketplaceSafetyActions
            listingId={listing.id}
            ownerId={listing.ownerId}
            onBlocked={close}
          />

          <Text className="text-zinc-500 text-xs font-bold uppercase mb-2">
            Dein Angebot
          </Text>

          {eligibleItems.length === 0 ? (
            <StatusBanner
              tone="warning"
              title="Kein verfügbares Tauschstück"
              message="Bereits gelistete oder in einem offenen Angebot reservierte Teile können nicht erneut angeboten werden."
            />
          ) : (
            <>
              <ScrollView
                accessibilityRole="radiogroup"
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                {eligibleItems.map((item) => {
                  const selected = selectedItemId === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      accessibilityRole="radio"
                      accessibilityLabel={`${item.name}, ${item.category}, Zustand ${item.condition}`}
                      accessibilityState={{ selected }}
                      disabled={sending}
                      onPress={() => setSelectedItemOverrideId(item.id)}
                      className={`w-36 mr-3 rounded-2xl overflow-hidden border ${
                        selected
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900'
                      }`}
                    >
                      <View className="h-28 bg-zinc-100 dark:bg-zinc-800 items-center justify-center">
                        {item.imageUrl ? (
                          <Image
                            accessibilityLabel={`Bild von ${item.name}`}
                            source={{ uri: item.imageUrl }}
                            className="w-full h-full"
                            resizeMode="contain"
                          />
                        ) : (
                          <Text className="text-zinc-400 text-xs">Kein Bild</Text>
                        )}
                      </View>
                      <View className="p-3">
                        <Text
                          className="text-black dark:text-white font-bold text-xs"
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <Text className="text-zinc-500 text-[10px] mt-1">
                          {item.category} · {item.condition}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View className="mt-5 mb-4">
                <StatusBanner
                  tone="neutral"
                  title="Reservierung während des Angebots"
                  message="Während das Angebot offen ist, blockiert OmniSwap dieses Kleidungsstück serverseitig für weitere aktive Angebote."
                />
              </View>

              <AppButton
                label="Tauschangebot senden"
                accessibilityLabel={
                  selectedItem
                    ? `Tauschangebot senden: ${selectedItem.name} gegen ${listing.title}`
                    : `Tauschangebot für ${listing.title} senden`
                }
                loading={sending}
                disabled={!selectedItemId}
                onPress={() => void submit()}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
