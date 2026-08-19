import { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppButton } from '@/design-system/AppButton';
import { StatusBanner } from '@/design-system/StatusBanner';
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
  const [selectedItemOverrideId, setSelectedItemOverrideId] = useState<
    string | null
  >(null);
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('Berlin');
  const [shippingEnabled, setShippingEnabled] = useState(true);
  const [meetupEnabled, setMeetupEnabled] = useState(false);
  const [estimatedValue, setEstimatedValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedItemId =
    selectedItemOverrideId &&
    items.some((item) => item.id === selectedItemOverrideId)
      ? selectedItemOverrideId
      : (items[0]?.id ?? null);
  const selectedItem =
    items.find((item) => item.id === selectedItemId) ?? null;

  const close = () => {
    if (isSubmitting) {
      return;
    }

    setSelectedItemOverrideId(null);
    onClose();
  };

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
      setSelectedItemOverrideId(null);
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
      onRequestClose={close}
    >
      <View className="flex-1 justify-end bg-black/60">
        <View
          accessibilityViewIsModal
          className="bg-white dark:bg-zinc-950 rounded-t-3xl max-h-[92%] p-5"
        >
          <View className="flex-row justify-between items-center mb-5">
            <View className="flex-1 pr-3">
              <Text className="text-black dark:text-white text-xl font-extrabold">
                Für OmniSwap listen
              </Text>
              <Text className="text-zinc-500 text-xs mt-1">
                Das Listing bleibt mit deinem echten WardrobeItem verknüpft.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Listing-Dialog schließen"
              disabled={isSubmitting}
              hitSlop={8}
              onPress={close}
              className="min-h-12 px-3 items-center justify-center"
            >
              <Text className="text-zinc-500 font-bold">Schließen</Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {items.length === 0 ? (
              <StatusBanner
                tone="neutral"
                title="Kein verfügbares Kleidungsstück"
                message="Nur noch nicht gelistete Cloud-WardrobeItems mit gespeichertem Bild können angeboten werden."
              />
            ) : (
              <>
                <Text className="text-zinc-500 text-xs font-bold uppercase mb-2">
                  Kleidungsstück
                </Text>
                <ScrollView
                  accessibilityRole="radiogroup"
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-5"
                >
                  {items.map((item) => {
                    const selected = item.id === selectedItemId;
                    return (
                      <Pressable
                        key={item.id}
                        accessibilityRole="radio"
                        accessibilityLabel={`${item.name}, ${item.category}, Zustand ${item.condition}`}
                        accessibilityState={{ selected }}
                        onPress={() => setSelectedItemOverrideId(item.id)}
                        className={`w-32 mr-3 rounded-2xl border overflow-hidden ${
                          selected
                            ? 'border-indigo-500 bg-indigo-500/10'
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900'
                        }`}
                      >
                        <View className="h-28 items-center justify-center bg-zinc-100 dark:bg-zinc-800">
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
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <Text className="text-zinc-500 text-xs font-bold uppercase mb-2">
                  Beschreibung
                </Text>
                <TextInput
                  accessibilityLabel="Beschreibung des OmniSwap Listings"
                  value={description}
                  onChangeText={setDescription}
                  editable={!isSubmitting}
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
                  accessibilityLabel="Stadt für das OmniSwap Listing"
                  value={city}
                  onChangeText={setCity}
                  editable={!isSubmitting}
                  maxLength={80}
                  placeholder="z. B. Berlin"
                  placeholderTextColor="#a1a1aa"
                  className="bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white rounded-xl px-4 py-3 mb-4 min-h-12"
                />

                <Text className="text-zinc-500 text-xs font-bold uppercase mb-2">
                  Optionaler Schätzwert in Euro
                </Text>
                <TextInput
                  accessibilityLabel="Optionaler Schätzwert des Kleidungsstücks in Euro"
                  value={estimatedValue}
                  onChangeText={setEstimatedValue}
                  editable={!isSubmitting}
                  keyboardType="decimal-pad"
                  placeholder="z. B. 45"
                  placeholderTextColor="#a1a1aa"
                  className="bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white rounded-xl px-4 py-3 mb-5 min-h-12"
                />

                <Text className="text-zinc-500 text-xs font-bold uppercase mb-2">
                  Tauschweg
                </Text>
                <View className="flex-row mb-5">
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityLabel="Versand erlauben"
                    accessibilityState={{ checked: shippingEnabled }}
                    disabled={isSubmitting}
                    onPress={() => setShippingEnabled((current) => !current)}
                    className={`flex-1 mr-2 min-h-12 rounded-xl px-3 items-center justify-center border ${
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
                  </Pressable>
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityLabel="Persönliche Übergabe erlauben"
                    accessibilityState={{ checked: meetupEnabled }}
                    disabled={isSubmitting}
                    onPress={() => setMeetupEnabled((current) => !current)}
                    className={`flex-1 min-h-12 rounded-xl px-3 items-center justify-center border ${
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
                  </Pressable>
                </View>

                <View className="mb-4">
                  <AppButton
                    label="Listing veröffentlichen"
                    accessibilityLabel={
                      selectedItem
                        ? `Listing veröffentlichen: ${selectedItem.name}`
                        : 'Listing veröffentlichen'
                    }
                    loading={isSubmitting}
                    disabled={!selectedItem}
                    onPress={() => void submit()}
                  />
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
