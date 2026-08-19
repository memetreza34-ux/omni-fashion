import type { StyleProfile } from '@/features/style-profile/types';
import type { OutfitWeatherContext } from '@/features/weather/types';
import type { WardrobeItem, WardrobeSeason } from '@/features/wardrobe/types';

import { generateOutfitRecommendations } from './outfit-engine';
import type {
  OutfitGenerationResult,
  OutfitOccasion,
  OutfitRecommendation,
} from './types';

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function seasonFromWeather(
  weather: OutfitWeatherContext,
): WardrobeSeason {
  switch (weather.temperatureBand) {
    case 'very-cold':
    case 'cold':
      return 'Winter';
    case 'cool':
      return 'Autumn';
    case 'mild':
      return 'Spring';
    case 'warm':
    case 'hot':
      return 'Summer';
  }
}

function hasOuterwear(outfit: OutfitRecommendation): boolean {
  return outfit.items.some((item) => item.category === 'Outerwear');
}

function weatherSeasonAdjustment(
  outfit: OutfitRecommendation,
  weather: OutfitWeatherContext,
): number {
  const outfitHasOuterwear = hasOuterwear(outfit);

  switch (weather.outerwearNeed) {
    case 'required':
      return outfitHasOuterwear ? 8 : -28;
    case 'recommended':
      return outfitHasOuterwear ? 6 : -10;
    case 'optional':
      return 0;
    case 'avoid':
      return outfitHasOuterwear ? -18 : 7;
  }
}

function rainAdjustment(
  outfit: OutfitRecommendation,
  weather: OutfitWeatherContext,
): number {
  if (!weather.rainProtectionRecommended) {
    return 0;
  }

  const protective = outfit.items.some((item) => {
    const text = [
      item.name,
      item.subcategory ?? '',
      item.material ?? '',
      ...item.styleTags,
    ]
      .join(' ')
      .toLocaleLowerCase('de-DE');

    return [
      'regen',
      'rain',
      'wasserfest',
      'wasserdicht',
      'waterproof',
      'shell',
      'trench',
    ].some((keyword) => text.includes(keyword));
  });

  return protective ? 6 : -5;
}

function addWeatherReason(
  reasons: string[],
  weather: OutfitWeatherContext,
  outfitHasOuterwear: boolean,
): string[] {
  const next = [...reasons];

  if (
    weather.outerwearNeed === 'required' &&
    outfitHasOuterwear &&
    !next.some((reason) => reason.includes('Wetter'))
  ) {
    next.push('mit Außenschicht passend zum aktuellen Wetter');
  } else if (
    weather.outerwearNeed === 'avoid' &&
    !outfitHasOuterwear &&
    !next.some((reason) => reason.includes('warm'))
  ) {
    next.push('ohne unnötige Außenschicht für warmes Wetter');
  }

  if (
    weather.rainProtectionRecommended &&
    !next.some((reason) => reason.includes('Regen'))
  ) {
    next.push('Regenrisiko wurde im Ranking berücksichtigt');
  }

  return next.slice(0, 4);
}

function applyWeather(
  outfit: OutfitRecommendation,
  weather: OutfitWeatherContext,
): OutfitRecommendation {
  const seasonDelta = weatherSeasonAdjustment(outfit, weather);
  const rainDelta = rainAdjustment(outfit, weather);
  const adjustedSeasonFit = clamp(
    outfit.scoreBreakdown.seasonFit + seasonDelta + rainDelta,
  );
  const adjustedScore = clamp(
    outfit.score + (adjustedSeasonFit - outfit.scoreBreakdown.seasonFit) * 0.12,
  );

  return {
    ...outfit,
    score: adjustedScore,
    scoreBreakdown: {
      ...outfit.scoreBreakdown,
      seasonFit: adjustedSeasonFit,
    },
    reasons: addWeatherReason(outfit.reasons, weather, hasOuterwear(outfit)),
  };
}

export function generateWeatherAwareOutfits(
  items: WardrobeItem[],
  profile: StyleProfile | null,
  occasion: OutfitOccasion,
  weather: OutfitWeatherContext,
  maxResults = 12,
): OutfitGenerationResult {
  const result = generateOutfitRecommendations(items, profile, {
    occasion,
    season: seasonFromWeather(weather),
    maxResults: Math.max(maxResults, 20),
  });

  return {
    ...result,
    recommendations: result.recommendations
      .map((outfit) => applyWeather(outfit, weather))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults),
  };
}
