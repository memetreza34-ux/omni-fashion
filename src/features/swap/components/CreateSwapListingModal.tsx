import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import type { WardrobeItem } from '@/features/wardrobe/types';

import type { CreateSwapListingInput } from '../types';

function eurosToCents(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 50_000) {
    return null;
  }

  return Math.round(parsed * 100);
}

export function CreateSwapListingModal({
  visible,
  items,
  onClose,
  onCreate,
}: {
  visible: boolean;
  items: WardrobeItem[];
  onClose: () => void;
  onCreate: (input: CreateSwapListingInput) => Promise<string>;
}) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('Berlin');
  const [shippingEnabled, setShippingEnabled] = useState(true);
  const [meetupEnabled, setMeetupEnabled] = useState(false);
  const [estimatedValue, setEstimatedValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setSelectedItemId((current) =>
      current && items.some((item) => item.id === current)
        ? current
        : (items[0]?.id ?? null),
    );
  }, [items, visible]);

  const selectedItem =
    items.find((item) => item.id === selectedItemId) ?? null;

  const submit = async () => {
    if (!selectedItem || isSubmitting) {
      return;
    }

    const normalizedCity = city.trim();
    if (normalizedCity.length < 2) {
      Alert.alert('Stadt fehlt', 'Gib mindestens deine Stadt für das Listing an.');
      return;
    }
    if (!shippingEnabled && !meetupEnabled) {
      Alert.alert(
        'Tauschweg fehlt',
        'Aktiviere mindestens Versand oder persönliche Übergabe.',
      );
      return;
    }

    const cents = eurosToCents(estimatedValue);
    if (estimatedValue.trim() && cents === null) {
      Alert.alert(
        'Schätzwert ungültig',
        'Nutze einen Betrag zwischen 0 und 50.000 Euro oder lasse das Feld leer.',
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate({
        wardrobeItemId: selectedItem.id,
        description: description.trim(),
        city: normalizedCity,
        shippingEnabled,
        meetupEnabled,
        estimatedValueCents: cents,
      });
      setDescription('');
      setEstimatedValue('');
      onClose();
    } catch (error: unknown) {
      console.error('Failed to create OmniSwap listing', error);
      Alert.alert(
        'Listing nicht erstellt',
        'Das Kleidungsstück wurde nicht als gelistet markiert. Bitte erneut versuchen.',
      );
    } finally {
      setIsSubmitting(false);
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
        <View className="bg-white dark:bg-zinc-950 rounded-t-3xl max-h-[92%] p-5">
          <View className="flex-row justify-between items-center mb-5">
            <View>
              <Text className="text-black dark:text-white text-xl font-extrabold">
                Für OmniSwap listen
              </Text>
              <Text className="text-zinc-500 text-xs mt-1">
                Das Listing bleibt mit deinem echten WardrobeItem verknüpft.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} className="px-3 py-2">
              <Text className="text-zinc-500 font-bold">Schließen</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {items.length === 0 ? (
              <View className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-6 items-center">
                <Text className="text-black dark:text-white font-bold text-center">
                  Kein verfügbares Kleidungsstück
                </Text>
                <Text className="text-zinc-500 text-xs text-center mt-2 leading-5">
                  Nur noch nicht gelistete Cloud-WardrobeItems mit gespeichertem Bild können angeboten werden.
                </Text>
              </View>
            ) : (
              <>
                <Text className="text-zinc-500 text-xs font-bold uppercase mb-2">
                  Kleidungsstück
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-5"
                >
                  {items.map((item) => {
                    const selected = item.id === selectedItemId;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => setSelectedItemId(item.id)}
                        className={`w-32 mr-3 rounded-2xl border overflow-hidden ${
                          selected
                            ? 'border-indigo-500 bg-indigo-500/10'
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900'
                        }`}
                      >
                        <View className="h-28 items-center justify-center bg-zinc-100 dark:bg-zinc-800">
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
                        <View className="p-2">
                          <Text
                            className="text-black dark:text-white text-xs font-bold"
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

                <Text className="text-zinc-500 text-xs font-bold uppercase mb-2">
                  Beschreibung
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  maxLength={1000}
                  multiline
                  placeholder="Optional: Passform, Gebrauchsspuren, Besonderheiten …"
                  placeholderTextColor="#a1a1aa"
                  className="bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white rounded-2xl p-4 min-h-24 mb-4"
                />

                <Text className="text-zinc-500 text-xs font-bold uppercase mb-2">
                  Stadt
                </Text>
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  maxLength={80}
                  placeholder="z. B. Berlin"
                  placeholderTextColor="#a1a1aa"
                  className="bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white rounded-xl px-4 py-3 mb-4"
                />

                <Text className="text-zinc-500 text-xs font-bold uppercase mb-2">
                  Optionaler Schätzwert in Euro
                </Text>
                <TextInput
                  value={estimatedValue}
                  onChangeText={setEstimatedValue}
                  keyboardType="decimal-pad"
                  placeholder="z. B. 45"
                  placeholderTextColor="#a1a1aa"
                  className="bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white rounded-xl px-4 py-3 mb-5"
                />

                <Text className="text-zinc-500 text-xs font-bold uppercase mb-2">
                  Tauschweg
                </Text>
                <View className="flex-row mb-5">
                  <TouchableOpacity
                    onPress={() => setShippingEnabled((current) => !current)}
                    className={`flex-1 mr-2 rounded-xl p-3 border ${
                      shippingEnabled
                        ? 'bg-indigo-600 border-indigo-600'
                        : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <Text
                      className={
                        shippingEnabled
                          ? 'text-white text-center font-bold text-xs'
                          : 'text-zinc-600 dark:text-zinc-300 text-center font-bold text-xs'
                      }
                    >
                      Versand
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setMeetupEnabled((current) => !current)}
                    className={`flex-1 rounded-xl p-3 border ${
                      meetupEnabled
                        ? 'bg-indigo-600 border-indigo-600'
                        : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <Text
                      className={
                        meetupEnabled
                          ? 'text-white text-center font-bold text-xs'
                          : 'text-zinc-600 dark:text-zinc-300 text-center font-bold text-xs'
                      }
                    >
                      Übergabe
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => void submit()}
                  disabled={!selectedItem || isSubmitting}
                  className="bg-indigo-600 rounded-2xl py-4 items-center mb-4"
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-extrabold">
                      Listing veröffentlichen
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
