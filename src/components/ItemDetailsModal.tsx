import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import type { WardrobeItem } from '../types/wardrobe';

interface Props {
  visible: boolean;
  item: WardrobeItem | null;
  canAnalyze: boolean;
  onClose: () => void;
  onSave: (item: WardrobeItem) => void;
  onDelete: (id: string) => void;
  onAnalyze: (id: string) => Promise<void>;
}

const CATEGORIES: readonly WardrobeItem['category'][] = [
  'Top',
  'Bottom',
  'Dress',
  'Shoes',
  'Accessory',
  'Outerwear',
  'Other',
];

const SEASONS: readonly WardrobeItem['season'][] = [
  'Spring',
  'Summer',
  'Autumn',
  'Winter',
  'All',
];

const CONDITIONS: readonly {
  value: WardrobeItem['condition'];
  label: string;
}[] = [
  { value: 'new_with_tags', label: 'Neu mit Etikett' },
  { value: 'like_new', label: 'Wie neu' },
  { value: 'good', label: 'Gut' },
  { value: 'worn', label: 'Getragen' },
];

function analysisDescription(item: WardrobeItem): string {
  switch (item.aiStatus) {
    case 'pending':
      return 'Das Bild wird gerade sicher im Backend analysiert.';
    case 'completed': {
      const confidence =
        item.aiConfidence === null
          ? null
          : Math.round(item.aiConfidence * 100);
      return confidence === null
        ? 'Die KI-Metadaten wurden übernommen. Bitte prüfe sie.'
        : `Analyse abgeschlossen · ${confidence}% Gesamt-Confidence. Bitte prüfe die erkannten Daten.`;
    }
    case 'failed':
      return 'Die Analyse konnte nicht abgeschlossen werden. Das Kleidungsstück bleibt trotzdem gespeichert.';
    case 'not_requested':
      return 'Kategorie, Farbe, Material und Stil können automatisch aus dem Foto vorgeschlagen werden.';
  }
}

export function ItemDetailsModal({
  visible,
  item,
  canAnalyze,
  onClose,
  onSave,
  onDelete,
  onAnalyze,
}: Props) {
  const [name, setName] = useState(item?.name ?? '');
  const [category, setCategory] = useState<WardrobeItem['category']>(
    item?.category ?? 'Other',
  );
  const [season, setSeason] = useState<WardrobeItem['season']>(
    item?.season ?? 'All',
  );
  const [color, setColor] = useState(item?.color ?? 'Unbekannt');
  const [brand, setBrand] = useState(item?.brand ?? '');
  const [material, setMaterial] = useState(item?.material ?? '');
  const [size, setSize] = useState(item?.size ?? '');
  const [condition, setCondition] = useState<WardrobeItem['condition']>(
    item?.condition ?? 'good',
  );
  const [analysisRequesting, setAnalysisRequesting] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    if (!item) {
      return;
    }

    setName(item.name);
    setCategory(item.category);
    setSeason(item.season);
    setColor(item.color);
    setBrand(item.brand ?? '');
    setMaterial(item.material ?? '');
    setSize(item.size ?? '');
    setCondition(item.condition);
  }, [item]);

  if (!item) {
    return null;
  }

  const handleSave = () => {
    onSave({
      ...item,
      name: name.trim() || 'Neues Kleidungsstück',
      category,
      season,
      color: color.trim() || 'Unbekannt',
      brand: brand.trim() || null,
      material: material.trim() || null,
      size: size.trim() || null,
      condition,
    });
  };

  const handleAnalyze = async () => {
    if (!canAnalyze || item.aiStatus === 'pending' || analysisRequesting) {
      return;
    }

    setAnalysisError(null);
    setAnalysisRequesting(true);

    try {
      await onAnalyze(item.id);
    } catch (error: unknown) {
      console.error('Garment analysis request failed', error);
      setAnalysisError(
        'Die Analyse konnte nicht gestartet oder abgeschlossen werden. Bitte erneut versuchen.',
      );
    } finally {
      setAnalysisRequesting(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Kleidungsstück löschen?',
      'Das Kleidungsstück und sein privates Wardrobe-Bild werden aus deinem Schrank entfernt. Diese Aktion kann nicht rückgängig gemacht werden.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => onDelete(item.id),
        },
      ],
    );
  };

  const analysisBusy = item.aiStatus === 'pending' || analysisRequesting;
  const showAnalyzeButton =
    canAnalyze &&
    !analysisBusy &&
    (item.aiStatus === 'not_requested' || item.aiStatus === 'failed');

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View
          accessibilityViewIsModal
          className="bg-white dark:bg-zinc-900 rounded-t-3xl h-[88%] overflow-hidden"
        >
          <View className="flex-row justify-between items-center p-4 border-b border-zinc-200 dark:border-zinc-800">
            <View className="flex-1">
              <AppButton
                label="Abbrechen"
                variant="ghost"
                onPress={onClose}
              />
            </View>
            <Text className="font-bold text-lg dark:text-white px-3">
              Kleidungsstück
            </Text>
            <View className="flex-1">
              <AppButton
                label="Speichern"
                accessibilityLabel={`Änderungen an ${item.name} speichern`}
                onPress={handleSave}
              />
            </View>
          </View>

          <ScrollView className="p-6" keyboardShouldPersistTaps="handled">
            {item.imageUrl ? (
              <Image
                accessibilityLabel={`Bild von ${item.name}`}
                source={{ uri: item.imageUrl }}
                className="w-full h-64 rounded-2xl mb-4 bg-zinc-100 dark:bg-zinc-800"
                resizeMode="contain"
              />
            ) : (
              <View className="w-full h-64 rounded-2xl mb-4 bg-zinc-100 dark:bg-zinc-800 items-center justify-center">
                <Text className="text-zinc-400">Bild nicht verfügbar</Text>
              </View>
            )}

            <View className="mb-6">
              <StatusBanner
                tone={item.aiStatus === 'failed' || analysisError ? 'danger' : 'neutral'}
                title="KI-Kleidungsanalyse"
                message={
                  analysisError ??
                  (canAnalyze
                    ? analysisDescription(item)
                    : 'Echte KI-Analyse ist nur mit dem verbundenen Cloud-/Trusted-Backend aktiv.')
                }
              />

              {analysisBusy ? (
                <View
                  accessibilityRole="progressbar"
                  accessibilityLabel="Kleidungsanalyse läuft"
                  className="flex-row items-center mt-3"
                >
                  <ActivityIndicator size="small" />
                  <Text className="text-zinc-500 text-xs ml-2">
                    Analyse läuft…
                  </Text>
                </View>
              ) : null}

              {item.aiStatus === 'completed' && item.styleTags.length > 0 ? (
                <Text className="text-indigo-600 dark:text-indigo-300 text-xs mt-2">
                  Stil: {item.styleTags.join(' · ')}
                </Text>
              ) : null}

              {item.aiStatus === 'failed' && item.aiErrorCode ? (
                <Text className="text-red-500 text-xs mt-2">
                  Fehlercode: {item.aiErrorCode}
                </Text>
              ) : null}

              {showAnalyzeButton ? (
                <View className="mt-3">
                  <AppButton
                    label={
                      item.aiStatus === 'failed'
                        ? 'Analyse erneut versuchen'
                        : 'Jetzt analysieren'
                    }
                    accessibilityLabel={`${item.name} ${item.aiStatus === 'failed' ? 'erneut analysieren' : 'analysieren'}`}
                    onPress={() => void handleAnalyze()}
                  />
                </View>
              ) : null}
            </View>

            <Text className="text-zinc-500 mb-2 uppercase text-xs font-bold">
              Name
            </Text>
            <TextInput
              accessibilityLabel="Name des Kleidungsstücks"
              value={name}
              onChangeText={setName}
              placeholder="Name des Kleidungsstücks..."
              className="min-h-12 bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl mb-5 dark:text-white"
            />

            <Text className="text-zinc-500 mb-2 uppercase text-xs font-bold">
              Farbe
            </Text>
            <TextInput
              accessibilityLabel="Farbe des Kleidungsstücks"
              value={color}
              onChangeText={setColor}
              placeholder="z. B. Schwarz"
              className="min-h-12 bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl mb-5 dark:text-white"
            />

            <View className="flex-row gap-3 mb-5">
              <View className="flex-1">
                <Text className="text-zinc-500 mb-2 uppercase text-xs font-bold">
                  Marke
                </Text>
                <TextInput
                  accessibilityLabel="Marke des Kleidungsstücks"
                  value={brand}
                  onChangeText={setBrand}
                  placeholder="Optional"
                  className="min-h-12 bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl dark:text-white"
                />
              </View>
              <View className="w-28">
                <Text className="text-zinc-500 mb-2 uppercase text-xs font-bold">
                  Größe
                </Text>
                <TextInput
                  accessibilityLabel="Größe des Kleidungsstücks"
                  value={size}
                  onChangeText={setSize}
                  placeholder="z. B. M"
                  className="min-h-12 bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl dark:text-white"
                />
              </View>
            </View>

            <Text className="text-zinc-500 mb-2 uppercase text-xs font-bold">
              Material
            </Text>
            <TextInput
              accessibilityLabel="Material des Kleidungsstücks"
              value={material}
              onChangeText={setMaterial}
              placeholder="z. B. Baumwolle"
              className="min-h-12 bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl mb-6 dark:text-white"
            />

            <Text className="text-zinc-500 mb-2 uppercase text-xs font-bold">
              Kategorie
            </Text>
            <View accessibilityRole="radiogroup" className="flex-row flex-wrap mb-6">
              {CATEGORIES.map((currentCategory) => (
                <Pressable
                  key={currentCategory}
                  accessibilityRole="radio"
                  accessibilityLabel={`Kategorie ${currentCategory}`}
                  accessibilityState={{ selected: category === currentCategory }}
                  onPress={() => setCategory(currentCategory)}
                  className={`min-h-12 px-4 rounded-full mr-2 mb-2 items-center justify-center ${
                    category === currentCategory
                      ? 'bg-black dark:bg-white'
                      : 'bg-zinc-100 dark:bg-zinc-800'
                  }`}
                >
                  <Text
                    className={
                      category === currentCategory
                        ? 'text-white dark:text-black font-bold'
                        : 'text-black dark:text-white'
                    }
                  >
                    {currentCategory}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text className="text-zinc-500 mb-2 uppercase text-xs font-bold">
              Saison
            </Text>
            <View accessibilityRole="radiogroup" className="flex-row flex-wrap mb-6">
              {SEASONS.map((currentSeason) => (
                <Pressable
                  key={currentSeason}
                  accessibilityRole="radio"
                  accessibilityLabel={`Saison ${currentSeason}`}
                  accessibilityState={{ selected: season === currentSeason }}
                  onPress={() => setSeason(currentSeason)}
                  className={`min-h-12 px-4 rounded-full mr-2 mb-2 items-center justify-center ${
                    season === currentSeason
                      ? 'bg-black dark:bg-white'
                      : 'bg-zinc-100 dark:bg-zinc-800'
                  }`}
                >
                  <Text
                    className={
                      season === currentSeason
                        ? 'text-white dark:text-black font-bold'
                        : 'text-black dark:text-white'
                    }
                  >
                    {currentSeason}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text className="text-zinc-500 mb-2 uppercase text-xs font-bold">
              Zustand
            </Text>
            <View accessibilityRole="radiogroup" className="flex-row flex-wrap mb-8">
              {CONDITIONS.map((entry) => (
                <Pressable
                  key={entry.value}
                  accessibilityRole="radio"
                  accessibilityLabel={`Zustand ${entry.label}`}
                  accessibilityState={{ selected: condition === entry.value }}
                  onPress={() => setCondition(entry.value)}
                  className={`min-h-12 px-4 rounded-full mr-2 mb-2 items-center justify-center ${
                    condition === entry.value
                      ? 'bg-black dark:bg-white'
                      : 'bg-zinc-100 dark:bg-zinc-800'
                  }`}
                >
                  <Text
                    className={
                      condition === entry.value
                        ? 'text-white dark:text-black font-bold'
                        : 'text-black dark:text-white'
                    }
                  >
                    {entry.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View className="mb-10">
              <AppButton
                label="Kleidungsstück löschen"
                accessibilityLabel={`${item.name} aus dem Kleiderschrank löschen`}
                variant="danger"
                onPress={confirmDelete}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
