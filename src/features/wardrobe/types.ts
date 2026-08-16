export const WARDROBE_SCHEMA_VERSION = 1;

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

export const WARDROBE_CONDITIONS = [
  'new_with_tags',
  'like_new',
  'good',
  'worn',
] as const;

export const WARDROBE_SOURCES = [
  'camera',
  'library',
  'migration',
  'manual',
] as const;

export const WARDROBE_AI_STATUSES = [
  'not_requested',
  'pending',
  'completed',
  'failed',
] as const;

export type WardrobeCategory = (typeof WARDROBE_CATEGORIES)[number];
export type WardrobeSeason = (typeof WARDROBE_SEASONS)[number];
export type WardrobeCondition = (typeof WARDROBE_CONDITIONS)[number];
export type WardrobeSource = (typeof WARDROBE_SOURCES)[number];
export type WardrobeAiStatus = (typeof WARDROBE_AI_STATUSES)[number];

/**
 * Canonical garment object for Omni Fashion.
 *
 * `imageUrl` is runtime-only and must never be persisted as the source of truth.
 * `imagePath` is the canonical Firebase Storage reference for cloud items.
 */
export interface WardrobeItem {
  id: string;
  ownerId: string;
  imageUrl: string | null;
  imagePath: string | null;
  name: string;
  category: WardrobeCategory;
  subcategory: string | null;
  color: string;
  secondaryColors: string[];
  brand: string | null;
  material: string | null;
  size: string | null;
  season: WardrobeSeason;
  condition: WardrobeCondition;
  styleTags: string[];
  source: WardrobeSource;
  aiStatus: WardrobeAiStatus;
  aiConfidence: number | null;
  aiModelVersion: string | null;
  aiPromptVersion: string | null;
  aiAnalyzedAt: string | null;
  aiErrorCode: string | null;
  isListedForSwap: boolean;
  swapListingId: string | null;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}

export interface CreateWardrobeItemInput {
  localImageUri: string;
  source: Extract<WardrobeSource, 'camera' | 'library'>;
  name?: string;
  category?: WardrobeCategory;
  color?: string;
  season?: WardrobeSeason;
}

export interface UpdateWardrobeItemInput {
  name?: string;
  category?: WardrobeCategory;
  subcategory?: string | null;
  color?: string;
  secondaryColors?: string[];
  brand?: string | null;
  material?: string | null;
  size?: string | null;
  season?: WardrobeSeason;
  condition?: WardrobeCondition;
  styleTags?: string[];
}

export interface PersistedWardrobeItem {
  ownerId: string;
  imagePath: string | null;
  name: string;
  category: WardrobeCategory;
  subcategory: string | null;
  color: string;
  secondaryColors: string[];
  brand: string | null;
  material: string | null;
  size: string | null;
  season: WardrobeSeason;
  condition: WardrobeCondition;
  styleTags: string[];
  source: WardrobeSource;
  aiStatus: WardrobeAiStatus;
  aiConfidence: number | null;
  aiModelVersion: string | null;
  aiPromptVersion: string | null;
  aiAnalyzedAt: string | null;
  aiErrorCode: string | null;
  isListedForSwap: boolean;
  swapListingId: string | null;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}
