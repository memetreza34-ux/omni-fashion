import { httpsCallable } from 'firebase/functions';

import { getFirebaseServices } from '@/services/firebase/app';

import {
  OUTERWEAR_NEEDS,
  TEMPERATURE_BANDS,
  WEATHER_CONTEXT_SCHEMA_VERSION,
} from './types';
import type {
  OutfitWeatherContext,
  OutfitWeatherResponse,
  OuterwearNeed,
  TemperatureBand,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(
  record: Record<string, unknown>,
  key: string,
): string | null {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readNullableString(
  record: Record<string, unknown>,
  key: string,
): string | null {
  const value = record[key];
  return value === null || typeof value === 'string' ? value : null;
}

function readNumber(
  record: Record<string, unknown>,
  key: string,
): number | null {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readEnum<T extends string>(
  record: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
): T | null {
  const value = record[key];
  return typeof value === 'string' && allowed.includes(value as T)
    ? (value as T)
    : null;
}

function parseWeather(value: unknown): OutfitWeatherContext {
  if (!isRecord(value)) {
    throw new Error('WEATHER_INVALID_RESPONSE');
  }

  const city = readString(value, 'city');
  const countryCode = readNullableString(value, 'countryCode');
  const latitude = readNumber(value, 'latitude');
  const longitude = readNumber(value, 'longitude');
  const observedAt = readString(value, 'observedAt');
  const temperatureC = readNumber(value, 'temperatureC');
  const apparentTemperatureC = readNumber(value, 'apparentTemperatureC');
  const precipitationMm = readNumber(value, 'precipitationMm');
  const rainMm = readNumber(value, 'rainMm');
  const windSpeedKmh = readNumber(value, 'windSpeedKmh');
  const weatherCode = readNumber(value, 'weatherCode');
  const precipitationProbabilityPercent = value.precipitationProbabilityPercent;
  const temperatureBand = readEnum<TemperatureBand>(
    value,
    'temperatureBand',
    TEMPERATURE_BANDS,
  );
  const outerwearNeed = readEnum<OuterwearNeed>(
    value,
    'outerwearNeed',
    OUTERWEAR_NEEDS,
  );

  if (
    !city ||
    latitude === null ||
    longitude === null ||
    !observedAt ||
    Number.isNaN(Date.parse(observedAt)) ||
    temperatureC === null ||
    apparentTemperatureC === null ||
    precipitationMm === null ||
    rainMm === null ||
    windSpeedKmh === null ||
    weatherCode === null ||
    !temperatureBand ||
    !outerwearNeed ||
    typeof value.rainProtectionRecommended !== 'boolean' ||
    value.schemaVersion !== WEATHER_CONTEXT_SCHEMA_VERSION ||
    !(
      precipitationProbabilityPercent === null ||
      (typeof precipitationProbabilityPercent === 'number' &&
        precipitationProbabilityPercent >= 0 &&
        precipitationProbabilityPercent <= 100)
    )
  ) {
    throw new Error('WEATHER_INVALID_RESPONSE');
  }

  return {
    city,
    countryCode,
    latitude,
    longitude,
    observedAt,
    temperatureC,
    apparentTemperatureC,
    precipitationMm,
    rainMm,
    windSpeedKmh,
    weatherCode,
    precipitationProbabilityPercent,
    temperatureBand,
    outerwearNeed,
    rainProtectionRecommended: value.rainProtectionRecommended,
    schemaVersion: WEATHER_CONTEXT_SCHEMA_VERSION,
  };
}

export async function getOutfitWeather(
  city: string,
): Promise<OutfitWeatherContext> {
  const normalizedCity = city.trim();
  if (normalizedCity.length < 2 || normalizedCity.length > 80) {
    throw new Error('WEATHER_INVALID_CITY');
  }

  const { functions } = getFirebaseServices();
  const callable = httpsCallable<{ city: string }, OutfitWeatherResponse>(
    functions,
    'getOutfitWeather',
  );
  const response = await callable({ city: normalizedCity });

  if (!isRecord(response.data)) {
    throw new Error('WEATHER_INVALID_RESPONSE');
  }

  return parseWeather(response.data.weather);
}
