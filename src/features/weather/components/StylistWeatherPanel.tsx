import { Text, TextInput, View } from 'react-native';

import { AppButton } from '@/design-system/AppButton';
import { StatusBanner } from '@/design-system/StatusBanner';

import type { OutfitWeatherContext } from '../types';

function temperatureLabel(weather: OutfitWeatherContext): string {
  return `${Math.round(weather.temperatureC)} °C · gefühlt ${Math.round(
    weather.apparentTemperatureC,
  )} °C`;
}

function layerLabel(weather: OutfitWeatherContext): string {
  switch (weather.outerwearNeed) {
    case 'required':
      return 'Außenschicht nötig';
    case 'recommended':
      return 'Außenschicht empfohlen';
    case 'optional':
      return 'Außenschicht optional';
    case 'avoid':
      return 'Keine schwere Außenschicht';
  }
}

export function StylistWeatherPanel({
  city,
  weather,
  loading,
  error,
  onCityChange,
  onLoad,
  onClear,
}: {
  city: string;
  weather: OutfitWeatherContext | null;
  loading: boolean;
  error: string | null;
  onCityChange: (city: string) => void;
  onLoad: () => void;
  onClear: () => void;
}) {
  return (
    <View className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
      <Text className="text-black dark:text-white font-bold mb-1">
        Echtes Wetter
      </Text>
      <Text className="text-zinc-500 text-xs leading-5 mb-3">
        Gib eine Stadt ein. Standortzugriff ist für diesen MVP-Schritt nicht
        nötig.
      </Text>

      <View className="flex-row gap-2 items-end">
        <TextInput
          accessibilityLabel="Stadt für Wetterdaten"
          accessibilityHint="Gib eine Stadt ein, zum Beispiel Berlin"
          value={city}
          onChangeText={onCityChange}
          editable={!loading}
          autoCapitalize="words"
          placeholder="z. B. Berlin"
          placeholderTextColor="#a1a1aa"
          className="flex-1 min-h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-black dark:text-white"
          onSubmitEditing={onLoad}
          returnKeyType="search"
        />
        <View>
          <AppButton
            label="Laden"
            accessibilityLabel={`Wetter für ${city.trim() || 'eingegebene Stadt'} laden`}
            loading={loading}
            disabled={city.trim().length < 2}
            onPress={onLoad}
          />
        </View>
      </View>

      {error ? (
        <View className="mt-3">
          <StatusBanner
            tone="warning"
            title="Wetter nicht verfügbar"
            message={error}
          />
        </View>
      ) : null}

      {weather ? (
        <View className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <View className="flex-row justify-between items-start">
            <View
              accessibilityLabel={`${weather.city}, ${temperatureLabel(weather)}, ${layerLabel(weather)}, Wind ${Math.round(weather.windSpeedKmh)} Kilometer pro Stunde`}
              className="flex-1 pr-4"
            >
              <Text className="text-black dark:text-white text-lg font-bold">
                {weather.city}
                {weather.countryCode ? ` · ${weather.countryCode}` : ''}
              </Text>
              <Text className="text-zinc-600 dark:text-zinc-300 mt-1">
                {temperatureLabel(weather)}
              </Text>
              <Text className="text-zinc-500 text-xs mt-1">
                {layerLabel(weather)} · Wind {Math.round(weather.windSpeedKmh)}{' '}
                km/h
              </Text>
              {weather.rainProtectionRecommended ? (
                <Text className="text-blue-600 dark:text-blue-400 text-xs font-semibold mt-2">
                  Regenrisiko wird im Outfit-Ranking berücksichtigt.
                </Text>
              ) : null}
            </View>
            <View>
              <AppButton
                label="Manuell"
                accessibilityLabel="Wetter entfernen und manuelle Saison verwenden"
                variant="ghost"
                onPress={onClear}
              />
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
