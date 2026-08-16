import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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
        <View className="bg-white dark:bg-zinc-900 rounded-t-3xl h-[88%] overflow-hidden">
          <View className="flex-row justify-between items-center p-4 border-b border-zinc-200 dark:border-zinc-800">
            <TouchableOpacity onPress={onClose} className="p-2">
              <Text className="text-zinc-500">Abbrechen</Text>
            </TouchableOpacity>
            <Text className="font-bold text-lg dark:text-white">
              Kleidungsstück
            </Text>
            <TouchableOpacity onPress={handleSave} className="p-2">
              <Text className="text-blue-500 font-bold">Speichern</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="p-6" keyboardShouldPersistTaps="handled">
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                className="w-full h-64 rounded-2xl mb-4 bg-zinc-100 dark:bg-zinc-800"
                resizeMode="contain"
              />
            ) : (
              <View className="w-full h-64 rounded-2xl mb-4 bg-zinc-100 dark:bg-zinc-800 items-center justify-center">
                <Text className="text-zinc-400">Bild nicht verfügbar</Text>
              </View>
            )}

            <View className="bg-indigo-500/10 border border-indigo-500/25 rounded-2xl p-4 mb-6">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="font-bold text-indigo-700 dark:text-indigo-300">
                  KI-Kleidungsanalyse
                </Text>
                {analysisBusy ? <ActivityIndicator size="small" /> : null}
              </View>
              <Text className="text-zinc-600 dark:text-zinc-300 text-xs leading-5">
                {canAnalyze
                  ? analysisDescription(item)
                  : 'Echte KI-Analyse ist nur mit dem verbundenen Cloud-/Trusted-Backend aktiv.'}
              </Text>

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

              {analysisError ? (
                <Text className="text-red-500 text-xs mt-2">
                  {analysisError}
                </Text>
              ) : null}

              {showAnalyzeButton ? (
                <TouchableOpacity
                  onPress={() => void handleAnalyze()}
                  className="bg-indigo-600 rounded-xl py-3 items-center mt-3"
                >
                  <Text className="text-white font-bold text-sm">
                    {item.aiStatus === 'failed'
                      ? 'Analyse erneut versuchen'
                      : 'Jetzt analysieren'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <Text className="text-zinc-500 mb-2 uppercase text-xs font-bold">
              Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Name des Kleidungsstücks..."
              className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl mb-5 dark:text-white"
            />

            <Text className="text-zinc-500 mb-2 uppercase text-xs font-bold">
              Farbe
            </Text>
            <TextInput
              value={color}
              onChangeText={setColor}
              placeholder="z. B. Schwarz"
              className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl mb-5 dark:text-white"
            />

            <View className="flex-row gap-3 mb-5">
              <View className="flex-1">
                <Text className="text-zinc-500 mb-2 uppercase text-xs font-bold">
                  Marke
                </Text>
                <TextInput
                  value={brand}
                  onChangeText={setBrand}
                  placeholder="Optional"
                  className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl dark:text-white"
                />
              </View>
              <View className="w-28">
                <Text className="text-zinc-500 mb-2 uppercase text-xs font-bold">
                  Größe
                </Text>
                <TextInput
                  value={size}
                  onChangeText={setSize}
                  placeholder="z. B. M"
                  className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl dark:text-white"
                />
              </View>
            </View>

            <Text className="text-zinc-500 mb-2 uppercase text-xs font-bold">
              Material
            </Text>
            <TextInput
              value={material}
              onChangeText={setMaterial}
              placeholder="z. B. Baumwolle"
              className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl mb-6 dark:text-white"
            />

            <Text className="text-zinc-500 mb-2 uppercase text-xs font-bold">
              Kategorie
            </Text>
            <View className="flex-row flex-wrap mb-6">
              {CATEGORIES.map((currentCategory) => (
                <TouchableOpacity
                  key={currentCategory}
                  onPress={() => setCategory(currentCategory)}
                  className={`px-4 py-2 rounded-full mr-2 mb-2 ${
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
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-zinc-500 mb-2 uppercase text-xs font-bold">
              Saison
            </Text>
            <View className="flex-row flex-wrap mb-6">
              {SEASONS.map((currentSeason) => (
                <TouchableOpacity
                  key={currentSeason}
                  onPress={() => setSeason(currentSeason)}
                  className={`px-4 py-2 rounded-full mr-2 mb-2 ${
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
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-zinc-500 mb-2 uppercase text-xs font-bold">
              Zustand
            </Text>
            <View className="flex-row flex-wrap mb-8">
              {CONDITIONS.map((entry) => (
                <TouchableOpacity
                  key={entry.value}
                  onPress={() => setCondition(entry.value)}
                  className={`px-4 py-2 rounded-full mr-2 mb-2 ${
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
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => onDelete(item.id)}
              className="bg-red-500/10 border border-red-500 p-4 rounded-xl items-center mb-10"
            >
              <Text className="text-red-500 font-bold">
                Kleidungsstück löschen
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
