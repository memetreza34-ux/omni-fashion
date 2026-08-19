import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { WEATHER_CONTEXT_SCHEMA_VERSION } from '../weather/contracts.js';
import type { OutfitWeatherResponse } from '../weather/contracts.js';
import {
  outerwearNeedFor,
  rainProtectionRecommended,
  temperatureBandFor,
} from '../weather/weather-normalization.js';

const FUNCTIONS_REGION = 'europe-west1';
const WEATHER_TIMEOUT_MS = 10_000;
const GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

interface WeatherRequest {
  city: string;
}

interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  countryCode: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseRequest(data: unknown): WeatherRequest {
  if (!isRecord(data) || typeof data.city !== 'string') {
    throw new HttpsError('invalid-argument', 'Bitte gib eine Stadt ein.');
  }

  const city = data.city.trim();
  if (city.length < 2 || city.length > 80) {
    throw new HttpsError('invalid-argument', 'Ungültiger Stadtname.');
  }

  return { city };
}

async function fetchJson(url: URL): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(WEATHER_TIMEOUT_MS),
    });
  } catch (error: unknown) {
    logger.warn('Weather provider request failed.', {
      errorName: error instanceof Error ? error.name : typeof error,
    });
    throw new HttpsError(
      'unavailable',
      'Wetterdaten sind vorübergehend nicht verfügbar.',
    );
  }

  if (!response.ok) {
    logger.warn('Weather provider returned non-success status.', {
      status: response.status,
    });
    throw new HttpsError(
      'unavailable',
      'Wetterdaten sind vorübergehend nicht verfügbar.',
    );
  }

  try {
    return await response.json();
  } catch {
    throw new HttpsError(
      'internal',
      'Wetterdaten konnten nicht verarbeitet werden.',
    );
  }
}

async function geocodeCity(city: string): Promise<GeocodingResult> {
  const url = new URL(GEOCODING_BASE_URL);
  url.searchParams.set('name', city);
  url.searchParams.set('count', '1');
  url.searchParams.set('language', 'de');
  url.searchParams.set('format', 'json');

  const raw = await fetchJson(url);
  if (
    !isRecord(raw) ||
    !Array.isArray(raw.results) ||
    raw.results.length === 0
  ) {
    throw new HttpsError(
      'not-found',
      'Diese Stadt konnte nicht eindeutig gefunden werden.',
    );
  }

  const first: unknown = raw.results[0];
  if (!isRecord(first)) {
    throw new HttpsError('internal', 'Ungültige Standortdaten erhalten.');
  }

  const name = first.name;
  const latitude = first.latitude;
  const longitude = first.longitude;
  const countryCode = first.country_code;

  if (
    typeof name !== 'string' ||
    typeof latitude !== 'number' ||
    typeof longitude !== 'number'
  ) {
    throw new HttpsError('internal', 'Ungültige Standortdaten erhalten.');
  }

  return {
    name,
    latitude,
    longitude,
    countryCode: typeof countryCode === 'string' ? countryCode : null,
  };
}

function readNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new HttpsError('internal', `Ungültiges Wetterfeld: ${key}`);
  }
  return value;
}

function readNullableProbability(value: unknown): number | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const first: unknown = value[0];
  return typeof first === 'number' && first >= 0 && first <= 100 ? first : null;
}

async function loadWeather(
  location: GeocodingResult,
): Promise<OutfitWeatherResponse> {
  const url = new URL(FORECAST_BASE_URL);
  url.searchParams.set('latitude', String(location.latitude));
  url.searchParams.set('longitude', String(location.longitude));
  url.searchParams.set(
    'current',
    [
      'temperature_2m',
      'apparent_temperature',
      'precipitation',
      'rain',
      'weather_code',
      'wind_speed_10m',
    ].join(','),
  );
  url.searchParams.set('daily', 'precipitation_probability_max');
  url.searchParams.set('forecast_days', '1');
  url.searchParams.set('timezone', 'auto');

  const raw = await fetchJson(url);
  if (!isRecord(raw) || !isRecord(raw.current) || !isRecord(raw.daily)) {
    throw new HttpsError('internal', 'Unvollständige Wetterdaten erhalten.');
  }

  const temperatureC = readNumber(raw.current, 'temperature_2m');
  const apparentTemperatureC = readNumber(raw.current, 'apparent_temperature');
  const precipitationMm = readNumber(raw.current, 'precipitation');
  const rainMm = readNumber(raw.current, 'rain');
  const windSpeedKmh = readNumber(raw.current, 'wind_speed_10m');
  const weatherCode = readNumber(raw.current, 'weather_code');
  const observedAt = raw.current.time;
  const probability = readNullableProbability(
    raw.daily.precipitation_probability_max,
  );

  if (typeof observedAt !== 'string' || Number.isNaN(Date.parse(observedAt))) {
    throw new HttpsError('internal', 'Ungültiger Wetterzeitpunkt erhalten.');
  }

  return {
    weather: {
      city: location.name,
      countryCode: location.countryCode,
      latitude: location.latitude,
      longitude: location.longitude,
      observedAt,
      temperatureC,
      apparentTemperatureC,
      precipitationMm,
      rainMm,
      windSpeedKmh,
      weatherCode,
      precipitationProbabilityPercent: probability,
      temperatureBand: temperatureBandFor(apparentTemperatureC),
      outerwearNeed: outerwearNeedFor(
        apparentTemperatureC,
        precipitationMm,
        windSpeedKmh,
      ),
      rainProtectionRecommended: rainProtectionRecommended(
        precipitationMm,
        rainMm,
        probability,
      ),
      schemaVersion: WEATHER_CONTEXT_SCHEMA_VERSION,
    },
  };
}

export const getOutfitWeather = onCall(
  {
    region: FUNCTIONS_REGION,
    timeoutSeconds: 15,
    memory: '256MiB',
    maxInstances: 20,
  },
  async (request): Promise<OutfitWeatherResponse> => {
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'Du musst angemeldet sein, um Wetterdaten zu laden.',
      );
    }

    const input = parseRequest(request.data);
    const location = await geocodeCity(input.city);
    return loadWeather(location);
  },
);
