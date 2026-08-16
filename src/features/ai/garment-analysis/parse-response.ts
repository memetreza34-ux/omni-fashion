import {
  WARDROBE_CATEGORIES,
  WARDROBE_SEASONS,
} from '@/features/wardrobe/types';
import type {
  WardrobeCategory,
  WardrobeSeason,
} from '@/features/wardrobe/types';

import { GARMENT_ANALYSIS_SCHEMA_VERSION } from './types';
import type {
  GarmentAnalysisResponse,
  GarmentAnalysisResult,
  GarmentFieldConfidence,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(
  record: Record<string, unknown>,
  key: string,
  maxLength: number,
): string {
  const value = record[key];
  if (typeof value !== 'string') {
    throw new Error(`GARMENT_ANALYSIS_INVALID_${key.toUpperCase()}`);
  }

  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) {
    throw new Error(`GARMENT_ANALYSIS_INVALID_${key.toUpperCase()}`);
  }

  return normalized;
}

function readNullableString(
  record: Record<string, unknown>,
  key: string,
  maxLength: number,
): string | null {
  const value = record[key];
  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error(`GARMENT_ANALYSIS_INVALID_${key.toUpperCase()}`);
  }

  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new Error(`GARMENT_ANALYSIS_INVALID_${key.toUpperCase()}`);
  }

  return normalized || null;
}

function readStringArray(
  record: Record<string, unknown>,
  key: string,
  maxItems: number,
  maxItemLength: number,
): string[] {
  const value = record[key];

  if (!Array.isArray(value) || value.length > maxItems) {
    throw new Error(`GARMENT_ANALYSIS_INVALID_${key.toUpperCase()}`);
  }

  return value.map((entry) => {
    if (typeof entry !== 'string') {
      throw new Error(`GARMENT_ANALYSIS_INVALID_${key.toUpperCase()}`);
    }

    const normalized = entry.trim();
    if (!normalized || normalized.length > maxItemLength) {
      throw new Error(`GARMENT_ANALYSIS_INVALID_${key.toUpperCase()}`);
    }

    return normalized;
  });
}

function readConfidence(
  record: Record<string, unknown>,
  key: string,
): number {
  const value = record[key];

  if (typeof value !== 'number' || value < 0 || value > 1) {
    throw new Error(`GARMENT_ANALYSIS_INVALID_${key.toUpperCase()}`);
  }

  return value;
}

function readEnum<T extends string>(
  record: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
): T {
  const value = record[key];

  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new Error(`GARMENT_ANALYSIS_INVALID_${key.toUpperCase()}`);
  }

  return value as T;
}

function parseFieldConfidence(value: unknown): GarmentFieldConfidence {
  if (!isRecord(value)) {
    throw new Error('GARMENT_ANALYSIS_INVALID_FIELD_CONFIDENCE');
  }

  return {
    category: readConfidence(value, 'category'),
    subcategory: readConfidence(value, 'subcategory'),
    color: readConfidence(value, 'color'),
    brand: readConfidence(value, 'brand'),
    material: readConfidence(value, 'material'),
    season: readConfidence(value, 'season'),
    styleTags: readConfidence(value, 'styleTags'),
  };
}

function parseResult(value: unknown): GarmentAnalysisResult {
  if (!isRecord(value)) {
    throw new Error('GARMENT_ANALYSIS_INVALID_RESULT');
  }

  if (value.schemaVersion !== GARMENT_ANALYSIS_SCHEMA_VERSION) {
    throw new Error('GARMENT_ANALYSIS_UNSUPPORTED_SCHEMA');
  }

  return {
    category: readEnum<WardrobeCategory>(
      value,
      'category',
      WARDROBE_CATEGORIES,
    ),
    subcategory: readNullableString(value, 'subcategory', 80),
    color: readString(value, 'color', 60),
    secondaryColors: readStringArray(value, 'secondaryColors', 5, 60),
    brand: readNullableString(value, 'brand', 80),
    material: readNullableString(value, 'material', 100),
    season: readEnum<WardrobeSeason>(value, 'season', WARDROBE_SEASONS),
    styleTags: readStringArray(value, 'styleTags', 20, 50),
    confidence: readConfidence(value, 'confidence'),
    fieldConfidence: parseFieldConfidence(value.fieldConfidence),
    modelVersion: readString(value, 'modelVersion', 120),
    promptVersion: readString(value, 'promptVersion', 80),
    schemaVersion: GARMENT_ANALYSIS_SCHEMA_VERSION,
  };
}

export function parseGarmentAnalysisResponse(
  value: unknown,
): GarmentAnalysisResponse {
  if (!isRecord(value)) {
    throw new Error('GARMENT_ANALYSIS_INVALID_RESPONSE');
  }

  if (value.status !== 'completed') {
    throw new Error('GARMENT_ANALYSIS_INVALID_STATUS');
  }

  return {
    wardrobeItemId: readString(value, 'wardrobeItemId', 160),
    status: 'completed',
    result: parseResult(value.result),
    processedAt: readString(value, 'processedAt', 80),
  };
}
