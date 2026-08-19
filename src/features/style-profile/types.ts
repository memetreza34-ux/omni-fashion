export const STYLE_PROFILE_SCHEMA_VERSION = 1;
export const STYLE_QUESTIONNAIRE_VERSION = 1;

export const STYLE_PREFERENCES = [
  'minimal',
  'classic',
  'smart-casual',
  'streetwear',
  'sporty',
  'vintage',
  'y2k',
  'dark-academia',
  'romantic',
  'edgy',
] as const;

export const FIT_PREFERENCES = ['slim', 'regular', 'oversized'] as const;

export const STYLE_COLOR_OPTIONS = [
  'Schwarz',
  'Weiß',
  'Grau',
  'Beige',
  'Braun',
  'Blau',
  'Grün',
  'Rot',
  'Rosa',
  'Lila',
  'Gelb',
  'Orange',
] as const;

export type StylePreference = (typeof STYLE_PREFERENCES)[number];
export type FitPreference = (typeof FIT_PREFERENCES)[number];
export type StyleColorOption = (typeof STYLE_COLOR_OPTIONS)[number];

export interface StyleQuestionnaire {
  preferredStyles: StylePreference[];
  preferredColors: StyleColorOption[];
  avoidedColors: StyleColorOption[];
  fitPreferences: FitPreference[];
  /** 0 = sehr casual, 1 = sehr formal */
  formalVsCasual: number;
  /** 0 = sehr minimal, 1 = sehr auffällig */
  minimalVsBold: number;
  questionnaireVersion: typeof STYLE_QUESTIONNAIRE_VERSION;
}

export interface WardrobeStyleSignals {
  dominantCategories: string[];
  dominantColors: string[];
  dominantStyleTags: string[];
  analyzedItemCount: number;
  totalItemCount: number;
}

export interface StyleProfileSummary {
  title: string;
  archetype: string;
  description: string;
  topStyles: StylePreference[];
}

export interface StyleProfile {
  userId: string;
  questionnaire: StyleQuestionnaire;
  wardrobeSignals: WardrobeStyleSignals;
  summary: StyleProfileSummary;
  createdAt: string | null;
  updatedAt: string | null;
  schemaVersion: typeof STYLE_PROFILE_SCHEMA_VERSION;
}

export interface SaveStyleProfileInput {
  questionnaire: StyleQuestionnaire;
  wardrobeSignals: WardrobeStyleSignals;
  summary: StyleProfileSummary;
}
