import type { WardrobeSeason } from '@/features/wardrobe/types';

import type {
  OutfitOccasion,
  OutfitRecommendation,
  OutfitScoreBreakdown,
} from './types';

export const SAVED_OUTFIT_SCHEMA_VERSION = 1;

export const OUTFIT_FEEDBACK_VALUES = [
  'none',
  'liked',
  'disliked',
  'worn',
] as const;

export type OutfitFeedback = (typeof OUTFIT_FEEDBACK_VALUES)[number];

export interface SavedOutfit {
  id: string;
  ownerId: string;
  itemIds: string[];
  occasion: OutfitOccasion;
  season: WardrobeSeason;
  score: number;
  scoreBreakdown: OutfitScoreBreakdown;
  reasons: string[];
  feedback: OutfitFeedback;
  createdAt: string;
  updatedAt: string;
  schemaVersion: typeof SAVED_OUTFIT_SCHEMA_VERSION;
}

export interface SaveOutfitInput {
  recommendation: OutfitRecommendation;
  season: WardrobeSeason;
}
