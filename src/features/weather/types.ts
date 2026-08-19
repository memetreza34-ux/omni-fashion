export const WEATHER_CONTEXT_SCHEMA_VERSION = 1;

export const TEMPERATURE_BANDS = [
  'very-cold',
  'cold',
  'cool',
  'mild',
  'warm',
  'hot',
] as const;

export const OUTERWEAR_NEEDS = [
  'required',
  'recommended',
  'optional',
  'avoid',
] as const;

export type TemperatureBand = (typeof TEMPERATURE_BANDS)[number];
export type OuterwearNeed = (typeof OUTERWEAR_NEEDS)[number];

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
