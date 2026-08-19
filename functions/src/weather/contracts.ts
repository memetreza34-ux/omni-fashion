export const WEATHER_CONTEXT_SCHEMA_VERSION = 1 as const;

export type TemperatureBand =
  'very-cold' | 'cold' | 'cool' | 'mild' | 'warm' | 'hot';

export type OuterwearNeed = 'required' | 'recommended' | 'optional' | 'avoid';

export interface OutfitWeatherContext {
  city: string;
  countryCode: string | null;
  latitude: number;
  longitude: number;
  observedAt: string;
  temperatureC: number;
  apparentTemperatureC: number;
  precipitationMm: number;
  rainMm: number;
  windSpeedKmh: number;
  weatherCode: number;
  precipitationProbabilityPercent: number | null;
  temperatureBand: TemperatureBand;
  outerwearNeed: OuterwearNeed;
  rainProtectionRecommended: boolean;
  schemaVersion: typeof WEATHER_CONTEXT_SCHEMA_VERSION;
}

export interface OutfitWeatherResponse {
  weather: OutfitWeatherContext;
}
