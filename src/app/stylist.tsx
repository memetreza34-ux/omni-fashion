import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useSavedOutfits } from '@/context/SavedOutfitsContext';
import { useStyleProfile } from '@/context/StyleProfileContext';
import { useWardrobe } from '@/context/WardrobeContext';
import { SavedOutfitsPanel } from '@/features/stylist/components/SavedOutfitsPanel';
import { generateOutfitRecommendations } from '@/features/stylist/outfit-engine';
import { generateWeatherAwareOutfits, seasonFromWeather } from '@/features/stylist/weather-outfit-engine';
import type { OutfitOccasion, OutfitRecommendation } from '@/features/stylist/types';
import { StylistWeatherPanel } from '@/features/weather/components/StylistWeatherPanel';
import { getOutfitWeather } from '@/features/weather/weather-service';
import type { OutfitWeatherContext } from '@/features/weather/types';
import type { WardrobeSeason } from '@/features/wardrobe/types';

const OCCASIONS: readonly { value: OutfitOccasion; label: string }[] = [
  { value: 'everyday', label: 'Alltag' },
  { value: 'office', label: 'Büro' },
  { value: 'date', label: 'Date' },
  { value: 'sport', label: 'Sport' },
  { value: 'party', label: 'Party' },
];

const SEASONS: readonly { value: WardrobeSeason; label: string }[] = [
  { value: 'Spring', label: 'Frühling' },
  { value: 'Summer', label: 'Sommer' },
  { value: 'Autumn', label: 'Herbst' },
  { value: 'Winter', label: 'Winter' },
  { value: 'All', label: 'Ganzjährig' },
];

const CATEGORY_LABELS: Record<string, string> = {
  Top: 'Oberteil',
  Bottom: 'Unterteil',
  Dress: 'Kleid',
  Shoes: 'Schuhe',
  Accessory: 'Accessoire',
  Outerwear: 'Außenschicht',
  Other: 'Sonstiges',
};

function breakdownRows(recommendation: OutfitRecommendation) {
  return [
    ['Style-DNA', recommendation.scoreBreakdown.styleMatch],
    ['Farben', recommendation.scoreBreakdown.colorHarmony],
    ['Anlass', recommendation.scoreBreakdown.occasionFit],
    ['Saison/Wetter', recommendation.scoreBreakdown.seasonFit],
    ['Datenqualität', recommendation.scoreBreakdown.dataQuality],
  ] as const;
}

export default function StylistScreen() {
  const { items, isLoading: wardrobeLoading } = useWardrobe();
  const {
    profile,
    isLoading: profileLoading,
    isCloudBacked,
    wardrobeNeedsRefresh,
  } = useStyleProfile();
  const {
    outfits: savedOutfits,
    isLoading: savedOutfitsLoading,
    saveOutfit,
    setFeedback,
    deleteOutfit,
    hasRecommendation,
  } = useSavedOutfits();

  const [occasion, setOccasion] = useState<OutfitOccasion>('everyday');
  const [manualSeason, setManualSeason] = useState<WardrobeSeason>('All');
  const [recommendationIndex, setRecommendationIndex] = useState(0);
  const [city, setCity] = useState('Berlin');
  const [weather, setWeather] = useState<OutfitWeatherContext | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const result = useMemo(() => {
    if (weather) {
      return generateWeatherAwareOutfits(items, profile, occasion, weather, 12);
    }

    return generateOutfitRecommendations(items, profile, {
      occasion,
      season: manualSeason,
      maxResults: 12,
    });
  }, [items, manualSeason, occasion, profile, weather]);

  useEffect(() => {
    setRecommendationIndex(0);
  }, [occasion, manualSeason, weather]);

  const recommendation =
    result.recommendations.length > 0
      ? result.recommendations[
          recommendationIndex % result.recommendations.length
        ]
      : null;

  const effectiveSeason = weather ? seasonFromWeather(weather) : manualSeason;
  const recommendationSaved = recommendation
    ? hasRecommendation(recommendation.itemIds)
    : false;

  const loadWeather = async () => {
    setWeatherError(null);
    setWeatherLoading(true);

    try {
      const nextWeather = await getOutfitWeather(city);
      setWeather(nextWeather);
    } catch (error: unknown) {
      console.error('Failed to load outfit weather', error);
      setWeatherError(
        'Wetter konnte nicht geladen werden. Nutze vorerst die manuelle Saison.',
      );
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleSave = async () => {
    if (!recommendation || saving || recommendationSaved) {
      return;
    }

    setSaving(true);
    try {
      await saveOutfit({
        recommendation,
        season: effectiveSeason,
      });
    } catch (error: unknown) {
      console.error('Failed to save outfit', error);
      Alert.alert(
        'Outfit nicht gespeichert',
        'Bitte versuche es erneut. Es wurde kein Erfolg vorgetäuscht.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (wardrobeLoading || profileLoading || savedOutfitsLoading) {
    return (
      <View className="flex-1 bg-white dark:bg-zinc-950 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-zinc-950 pt-16">
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="mb-5">
          <Text className="text-3xl font-extrabold text-black dark:text-white">
            Stylist
          </Text>
          <Text className="text-zinc-500 text-sm mt-1">
            Echte Kombinationen aus deinem eigenen Kleiderschrank.
          </Text>
        </View>

        {!profile ? (
          <View className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-4">
            <Text className="text-amber-700 dark:text-amber-300 font-bold">
              Noch keine Style-DNA
            </Text>
            <Text className="text-zinc-600 dark:text-zinc-400 text-xs mt-1 leading-5">
              Der Stylist funktioniert bereits mit deinem Schrank. Mit einer Style-DNA im Profil wird die persönliche Gewichtung stärker.
            </Text>
          </View>
        ) : null}

        {wardrobeNeedsRefresh ? (
          <View className="bg-indigo-500/10 border border-indigo-500/25 rounded-2xl p-4 mb-4">
            <Text className="text-indigo-700 dark:text-indigo-300 font-bold text-sm">
              Dein Schrank hat sich seit der letzten Style-DNA-Auswertung verändert.
            </Text>
          </View>
        ) : null}

        <Text className="text-zinc-500 text-xs font-bold uppercase mb-2">
          Anlass
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-4 px-4 mb-5"
          contentContainerStyle={{ paddingRight: 32 }}
        >
          {OCCASIONS.map((entry) => {
            const selected = occasion === entry.value;
            return (
              <TouchableOpacity
                key={entry.value}
                onPress={() => setOccasion(entry.value)}
                className={`mr-2 px-4 py-2 rounded-full border ${
                  selected
                    ? 'bg-black dark:bg-white border-black dark:border-white'
                    : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <Text
                  className={
                    selected
                      ? 'text-white dark:text-black font-bold text-xs'
                      : 'text-zinc-600 dark:text-zinc-300 font-semibold text-xs'
                  }
                >
                  {entry.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {isCloudBacked ? (
          <View className="mb-5">
            <StylistWeatherPanel
              city={city}
              weather={weather}
              loading={weatherLoading}
              error={weatherError}
              onCityChange={setCity}
              onLoad={() => void loadWeather()}
              onClear={() => {
                setWeather(null);
                setWeatherError(null);
              }}
            />
          </View>
        ) : null}

        {!weather ? (
          <View className="mb-5">
            <Text className="text-zinc-500 text-xs font-bold uppercase mb-2">
              Saison
            </Text>
            <View className="flex-row flex-wrap">
              {SEASONS.map((entry) => {
                const selected = manualSeason === entry.value;
                return (
                  <TouchableOpacity
                    key={entry.value}
                    onPress={() => setManualSeason(entry.value)}
                    className={`mr-2 mb-2 px-3.5 py-2 rounded-full border ${
                      selected
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <Text
                      className={
                        selected
                          ? 'text-white text-xs font-bold'
                          : 'text-zinc-600 dark:text-zinc-300 text-xs font-semibold'
                      }
                    >
                      {entry.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

        {result.missingCategories.length > 0 ? (
          <View className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
            <Text className="text-black dark:text-white text-xl font-extrabold mb-2">
              Für ein vollständiges Outfit fehlen noch Teile
            </Text>
            <Text className="text-zinc-500 text-sm leading-6 mb-4">
              Omni Fashion erfindet keine Produkte. Ergänze mindestens die fehlenden Kategorien in deinem Schrank.
            </Text>
            <View className="flex-row flex-wrap">
              {result.missingCategories.map((category) => (
                <View
                  key={category}
                  className="bg-white dark:bg-zinc-800 rounded-full px-3 py-2 mr-2 mb-2"
                >
                  <Text className="text-black dark:text-white text-xs font-bold">
                    {CATEGORY_LABELS[category] ?? category}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : recommendation ? (
          <View>
            <View className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5">
              <View className="flex-row justify-between items-start mb-5">
                <View className="flex-1 pr-3">
                  <Text className="text-zinc-500 text-xs font-bold uppercase">
                    Empfehlung {recommendationIndex + 1} von {result.recommendations.length}
                  </Text>
                  <Text className="text-black dark:text-white text-3xl font-black mt-1">
                    {recommendation.score}% Match
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => void handleSave()}
                  disabled={saving || recommendationSaved}
                  className={`px-4 py-3 rounded-xl ${
                    recommendationSaved
                      ? 'bg-emerald-500/15'
                      : 'bg-blue-600'
                  }`}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text
                      className={
                        recommendationSaved
                          ? 'text-emerald-600 dark:text-emerald-300 font-bold text-xs'
                          : 'text-white font-bold text-xs'
                      }
                    >
                      {recommendationSaved ? 'Gespeichert' : 'Speichern'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <View className="flex-row flex-wrap -mx-1 mb-4">
                {recommendation.items.map((item) => (
                  <View key={item.id} className="w-1/2 px-1 mb-2">
                    <View className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                      <View className="h-36 items-center justify-center bg-zinc-100 dark:bg-zinc-900">
                        {item.imageUrl ? (
                          <Image
                            source={{ uri: item.imageUrl }}
                            className="w-full h-full"
                            resizeMode="contain"
                          />
                        ) : (
                          <Text className="text-zinc-400 text-xs px-3 text-center">
                            Bild nicht verfügbar
                          </Text>
                        )}
                      </View>
                      <View className="p-3">
                        <Text
                          className="text-black dark:text-white font-bold text-sm"
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <Text className="text-zinc-500 text-[11px] mt-1">
                          {CATEGORY_LABELS[item.category] ?? item.category} · {item.color}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              <View className="bg-white dark:bg-zinc-800 rounded-2xl p-4 mb-4">
                <Text className="text-black dark:text-white font-bold mb-3">
                  Warum dieses Outfit?
                </Text>
                {recommendation.reasons.map((reason) => (
                  <Text
                    key={reason}
                    className="text-zinc-600 dark:text-zinc-300 text-xs leading-5 mb-1"
                  >
                    • {reason}
                  </Text>
                ))}
              </View>

              <View className="bg-white dark:bg-zinc-800 rounded-2xl p-4">
                <Text className="text-black dark:text-white font-bold mb-3">
                  Match-Breakdown
                </Text>
                {breakdownRows(recommendation).map(([label, value]) => (
                  <View key={label} className="flex-row justify-between mb-2">
                    <Text className="text-zinc-500 text-xs">{label}</Text>
                    <Text className="text-black dark:text-white text-xs font-bold">
                      {value}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {result.recommendations.length > 1 ? (
              <TouchableOpacity
                onPress={() =>
                  setRecommendationIndex(
                    (current) => (current + 1) % result.recommendations.length,
                  )
                }
                className="bg-black dark:bg-white rounded-2xl py-4 items-center mt-4"
              >
                <Text className="text-white dark:text-black font-extrabold">
                  Nächste echte Kombination
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <View className="bg-zinc-100 dark:bg-zinc-900 rounded-3xl p-6">
            <Text className="text-black dark:text-white font-bold text-lg">
              Noch keine passende Kombination
            </Text>
            <Text className="text-zinc-500 text-sm mt-2 leading-6">
              Prüfe Kategorie- und Saisondaten deiner Kleidungsstücke oder wähle einen anderen Anlass.
            </Text>
          </View>
        )}

        <SavedOutfitsPanel
          outfits={savedOutfits}
          wardrobeItems={items}
          onFeedback={setFeedback}
          onDelete={deleteOutfit}
        />
      </ScrollView>
    </View>
  );
}
