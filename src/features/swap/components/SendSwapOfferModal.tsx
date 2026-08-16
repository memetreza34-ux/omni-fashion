import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedItemId(eligibleItems[0]?.id ?? null);
    }
  }, [eligibleItems, visible]);

  if (!listing) {
    return null;
  }

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
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-white dark:bg-zinc-950 rounded-t-3xl max-h-[90%] p-5">
          <View className="flex-row justify-between items-center mb-5">
            <View className="flex-1 pr-3">
              <Text className="text-black dark:text-white text-xl font-extrabold">
                Tauschangebot
              </Text>
              <Text className="text-zinc-500 text-xs mt-1">
                Für {listing.title}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} className="px-3 py-2">
              <Text className="text-zinc-500 font-bold">Schließen</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4 mb-5 flex-row items-center">
            <View className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 mr-3 items-center justify-center">
              {listing.publicImageUrl ? (
                <Image
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
            onBlocked={onClose}
          />

          <Text className="text-zinc-500 text-xs font-bold uppercase mb-2">
            Dein Angebot
          </Text>

          {eligibleItems.length === 0 ? (
            <View className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5">
              <Text className="text-amber-700 dark:text-amber-300 font-bold">
                Kein verfügbares Tauschstück
              </Text>
              <Text className="text-zinc-600 dark:text-zinc-400 text-xs mt-2 leading-5">
                Bereits gelistete oder in einem offenen Angebot reservierte Teile können nicht erneut angeboten werden.
              </Text>
            </View>
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {eligibleItems.map((item) => {
                  const selected = selectedItemId === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setSelectedItemId(item.id)}
                      className={`w-36 mr-3 rounded-2xl overflow-hidden border ${
                        selected
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900'
                      }`}
                    >
                      <View className="h-28 bg-zinc-100 dark:bg-zinc-800 items-center justify-center">
                        {item.imageUrl ? (
                          <Image
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
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 mt-5 mb-4">
                <Text className="text-indigo-700 dark:text-indigo-300 text-xs leading-5">
                  Während das Angebot offen ist, blockiert OmniSwap dieses Kleidungsstück serverseitig für weitere aktive Angebote.
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => void submit()}
                disabled={!selectedItemId || sending}
                className="bg-indigo-600 rounded-2xl py-4 items-center"
              >
                {sending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-extrabold">
                    Tauschangebot senden
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
