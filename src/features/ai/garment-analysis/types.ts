import type {
  WardrobeAiFieldConfidence,
  WardrobeCategory,
  WardrobeSeason,
} from '@/features/wardrobe/types';

export const GARMENT_ANALYSIS_SCHEMA_VERSION = 1;

export interface GarmentAnalysisRequest {
  wardrobeItemId: string;
  schemaVersion: typeof GARMENT_ANALYSIS_SCHEMA_VERSION;
}

export type GarmentFieldConfidence = WardrobeAiFieldConfidence;

export interface GarmentAnalysisResult {
  category: WardrobeCategory;
  subcategory: string | null;
  color: string;
  secondaryColors: string[];
  brand: string | null;
  material: string | null;
  season: WardrobeSeason;
  styleTags: string[];
  confidence: number;
  fieldConfidence: GarmentFieldConfidence;
  modelVersion: string;
  promptVersion: string;
  schemaVersion: typeof GARMENT_ANALYSIS_SCHEMA_VERSION;
}

export interface GarmentAnalysisResponse {
  wardrobeItemId: string;
  status: 'completed';
  result: GarmentAnalysisResult;
  processedAt: string;
}
