import type { StyleProfile } from '@/features/style-profile/types';
import type {
  WardrobeCategory,
  WardrobeItem,
  WardrobeSeason,
} from '@/features/wardrobe/types';

export const OUTFIT_OCCASIONS = [
  'everyday',
  'office',
  'date',
  'sport',
  'party',
] as const;

export type OutfitOccasion = (typeof OUTFIT_OCCASIONS)[number];

export interface OutfitGenerationInput {
  occasion: OutfitOccasion;
  season?: WardrobeSeason | null;
  maxResults?: number;
}

export interface OutfitScoreBreakdown {
  styleMatch: number;
  colorHarmony: number;
  occasionFit: number;
  seasonFit: number;
  dataQuality: number;
}

export interface OutfitRecommendation {
  id: string;
  itemIds: string[];
  items: WardrobeItem[];
  occasion: OutfitOccasion;
  score: number;
  scoreBreakdown: OutfitScoreBreakdown;
  reasons: string[];
  usesDress: boolean;
}

export interface OutfitGenerationResult {
  recommendations: OutfitRecommendation[];
  missingCategories: WardrobeCategory[];
  wardrobeItemCount: number;
  styleProfile: StyleProfile | null;
}
