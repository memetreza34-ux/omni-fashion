import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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
        Gib eine Stadt ein. Standortzugriff ist für diesen MVP-Schritt nicht nötig.
      </Text>

      <View className="flex-row gap-2">
        <TextInput
          value={city}
          onChangeText={onCityChange}
          editable={!loading}
          autoCapitalize="words"
          placeholder="z. B. Berlin"
          placeholderTextColor="#a1a1aa"
          className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-black dark:text-white"
          onSubmitEditing={onLoad}
          returnKeyType="search"
        />
        <TouchableOpacity
          onPress={onLoad}
          disabled={loading || city.trim().length < 2}
          className="bg-blue-600 rounded-xl px-4 items-center justify-center"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold">Laden</Text>
          )}
        </TouchableOpacity>
      </View>

      {error ? (
        <Text className="text-red-500 text-xs mt-3">{error}</Text>
      ) : null}

      {weather ? (
        <View className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-4">
              <Text className="text-black dark:text-white text-lg font-bold">
                {weather.city}
                {weather.countryCode ? ` · ${weather.countryCode}` : ''}
              </Text>
              <Text className="text-zinc-600 dark:text-zinc-300 mt-1">
                {temperatureLabel(weather)}
              </Text>
              <Text className="text-zinc-500 text-xs mt-1">
                {layerLabel(weather)} · Wind {Math.round(weather.windSpeedKmh)} km/h
              </Text>
              {weather.rainProtectionRecommended ? (
                <Text className="text-blue-600 dark:text-blue-400 text-xs font-semibold mt-2">
                  Regenrisiko wird im Outfit-Ranking berücksichtigt.
                </Text>
              ) : null}
            </View>
            <TouchableOpacity onPress={onClear} className="px-2 py-1">
              <Text className="text-zinc-400 text-xs font-bold">Manuell</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}
