export const GARMENT_ANALYSIS_SCHEMA_VERSION = 1 as const;
export const GARMENT_ANALYSIS_MODEL = 'gemini-3.6-flash' as const;
export const GARMENT_ANALYSIS_PROMPT_VERSION = 'garment-v1' as const;

export const WARDROBE_CATEGORIES = [
  'Top',
  'Bottom',
  'Shoes',
  'Accessory',
  'Outerwear',
  'Other',
] as const;

export const WARDROBE_SEASONS = [
  'Spring',
  'Summer',
  'Autumn',
  'Winter',
  'All',
] as const;

export type WardrobeCategory = (typeof WARDROBE_CATEGORIES)[number];
export type WardrobeSeason = (typeof WARDROBE_SEASONS)[number];

export interface GarmentFieldConfidence {
  category: number;
  subcategory: number;
  color: number;
  brand: number;
  material: number;
  season: number;
  styleTags: number;
}

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

export interface GarmentVisionInput {
  imageBase64: string;
  mimeType: string;
}

export interface GarmentVisionProvider {
  analyze(input: GarmentVisionInput): Promise<GarmentAnalysisResult>;
}
