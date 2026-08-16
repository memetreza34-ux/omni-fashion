import type {
  StylePreference,
  StyleProfile,
} from '@/features/style-profile/types';
import type {
  WardrobeCategory,
  WardrobeItem,
  WardrobeSeason,
} from '@/features/wardrobe/types';

import type {
  OutfitGenerationInput,
  OutfitGenerationResult,
  OutfitOccasion,
  OutfitRecommendation,
  OutfitScoreBreakdown,
} from './types';

const MAX_ITEMS_PER_CATEGORY = 10;

const STYLE_KEYWORDS: Record<StylePreference, readonly string[]> = {
  minimal: ['minimal', 'minimalistisch', 'clean', 'zeitlos', 'monochrom'],
  classic: ['klassisch', 'classic', 'elegant', 'timeless', 'preppy'],
  'smart-casual': ['smart casual', 'business casual', 'tailoring', 'business', 'smart'],
  streetwear: ['streetwear', 'street', 'urban', 'oversized', 'skater'],
  sporty: ['sportlich', 'sporty', 'athleisure', 'active', 'performance'],
  vintage: ['vintage', 'retro', 'heritage'],
  y2k: ['y2k', '2000er', '2000s'],
  'dark-academia': ['dark academia', 'academia', 'scholar', 'preppy'],
  romantic: ['romantisch', 'romantic', 'feminin', 'soft', 'delicate'],
  edgy: ['edgy', 'biker', 'punk', 'grunge', 'rebellisch', 'rebel'],
};

const OCCASION_KEYWORDS: Record<OutfitOccasion, readonly string[]> = {
  everyday: ['casual', 'alltag', 'basic', 'minimal', 'streetwear', 'classic'],
  office: ['business', 'smart', 'classic', 'klassisch', 'elegant', 'tailoring', 'formal'],
  date: ['romantic', 'romantisch', 'elegant', 'smart', 'minimal', 'soft'],
  sport: ['sporty', 'sportlich', 'athleisure', 'active', 'performance', 'training'],
  party: ['party', 'bold', 'edgy', 'y2k', 'glam', 'statement', 'streetwear'],
};

const NEUTRAL_COLORS = new Set([
  'schwarz',
  'weiß',
  'weiss',
  'grau',
  'beige',
  'braun',
  'navy',
  'dunkelblau',
]);

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase('de-DE');
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function itemText(item: WardrobeItem): string {
  return [
    item.name,
    item.subcategory ?? '',
    item.color,
    item.brand ?? '',
    item.material ?? '',
    ...item.styleTags,
  ]
    .join(' ')
    .toLocaleLowerCase('de-DE');
}

function styleScore(item: WardrobeItem, profile: StyleProfile | null): number {
  if (!profile) {
    return 50;
  }

  const text = itemText(item);
  let score = 45;

  for (const style of profile.questionnaire.preferredStyles) {
    const matches = STYLE_KEYWORDS[style].some((keyword) =>
      text.includes(normalize(keyword)),
    );
    if (matches) {
      score += 12;
    }
  }

  for (const style of profile.summary.topStyles) {
    const matches = STYLE_KEYWORDS[style].some((keyword) =>
      text.includes(normalize(keyword)),
    );
    if (matches) {
      score += 7;
    }
  }

  return clampScore(score);
}

function colorPreferenceScore(
  item: WardrobeItem,
  profile: StyleProfile | null,
): number {
  if (!profile) {
    return 60;
  }

  const color = normalize(item.color);
  const preferred = profile.questionnaire.preferredColors.map(normalize);
  const avoided = profile.questionnaire.avoidedColors.map(normalize);

  if (avoided.includes(color)) {
    return 15;
  }
  if (preferred.includes(color)) {
    return 95;
  }
  if (NEUTRAL_COLORS.has(color)) {
    return 80;
  }
  return 60;
}

function occasionScore(item: WardrobeItem, occasion: OutfitOccasion): number {
  if (occasion === 'everyday') {
    return 75;
  }

  const text = itemText(item);
  const keywordMatches = OCCASION_KEYWORDS[occasion].filter((keyword) =>
    text.includes(normalize(keyword)),
  ).length;

  let score = 50 + keywordMatches * 15;

  if (occasion === 'sport' && item.category === 'Dress') {
    score -= 20;
  }
  if (occasion === 'office' && item.category === 'Shoes' && text.includes('sneaker')) {
    score -= 5;
  }

  return clampScore(score);
}

function seasonScore(
  item: WardrobeItem,
  requestedSeason: WardrobeSeason | null | undefined,
): number {
  if (!requestedSeason || requestedSeason === 'All') {
    return 75;
  }
  if (item.season === 'All' || item.season === requestedSeason) {
    return 100;
  }
  return 25;
}

function dataQualityScore(item: WardrobeItem): number {
  let score = 45;
  if (item.aiStatus === 'completed') {
    score += 20;
  }
  if (item.brand) {
    score += 5;
  }
  if (item.material) {
    score += 5;
  }
  if (item.styleTags.length > 0) {
    score += 15;
  }
  if (normalize(item.color) !== 'unbekannt') {
    score += 10;
  }
  return clampScore(score);
}

function average(values: number[]): number {
  return values.length === 0
    ? 0
    : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function pairColorHarmony(a: WardrobeItem, b: WardrobeItem): number {
  const first = normalize(a.color);
  const second = normalize(b.color);

  if (first === 'unbekannt' || second === 'unbekannt') {
    return 55;
  }
  if (first === second) {
    return 90;
  }
  if (NEUTRAL_COLORS.has(first) || NEUTRAL_COLORS.has(second)) {
    return 85;
  }
  return 68;
}

function outfitColorHarmony(items: WardrobeItem[]): number {
  const pairs: number[] = [];
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      pairs.push(pairColorHarmony(items[i], items[j]));
    }
  }
  return clampScore(average(pairs.length > 0 ? pairs : [70]));
}

function buildBreakdown(
  items: WardrobeItem[],
  profile: StyleProfile | null,
  input: OutfitGenerationInput,
): OutfitScoreBreakdown {
  return {
    styleMatch: clampScore(average(items.map((item) => styleScore(item, profile)))),
    colorHarmony: outfitColorHarmony(items),
    occasionFit: clampScore(
      average(items.map((item) => occasionScore(item, input.occasion))),
    ),
    seasonFit: clampScore(
      average(items.map((item) => seasonScore(item, input.season))),
    ),
    dataQuality: clampScore(average(items.map(dataQualityScore))),
  };
}

function overallScore(breakdown: OutfitScoreBreakdown): number {
  return clampScore(
    breakdown.styleMatch * 0.32 +
      breakdown.colorHarmony * 0.24 +
      breakdown.occasionFit * 0.24 +
      breakdown.seasonFit * 0.12 +
      breakdown.dataQuality * 0.08,
  );
}

function buildReasons(
  breakdown: OutfitScoreBreakdown,
  profile: StyleProfile | null,
  occasion: OutfitOccasion,
): string[] {
  const reasons: string[] = [];

  if (breakdown.styleMatch >= 70 && profile) {
    reasons.push('passt stark zu deiner Style-DNA');
  }
  if (breakdown.colorHarmony >= 80) {
    reasons.push('harmonische Farbkombination');
  }
  if (breakdown.occasionFit >= 70) {
    reasons.push(`für ${occasionLabel(occasion)} gut geeignet`);
  }
  if (breakdown.seasonFit >= 85) {
    reasons.push('passt zur gewählten Saison');
  }
  if (reasons.length === 0) {
    reasons.push('solide Kombination aus deinem vorhandenen Schrank');
  }

  return reasons.slice(0, 3);
}

function occasionLabel(occasion: OutfitOccasion): string {
  switch (occasion) {
    case 'everyday':
      return 'Alltag';
    case 'office':
      return 'Büro';
    case 'date':
      return 'Date';
    case 'sport':
      return 'Sport';
    case 'party':
      return 'Party';
  }
}

function candidatePreScore(
  item: WardrobeItem,
  profile: StyleProfile | null,
  input: OutfitGenerationInput,
): number {
  return (
    styleScore(item, profile) * 0.45 +
    colorPreferenceScore(item, profile) * 0.2 +
    occasionScore(item, input.occasion) * 0.25 +
    seasonScore(item, input.season) * 0.1
  );
}

function topCategoryItems(
  items: WardrobeItem[],
  category: WardrobeCategory,
  profile: StyleProfile | null,
  input: OutfitGenerationInput,
): WardrobeItem[] {
  return items
    .filter((item) => item.category === category)
    .sort(
      (a, b) =>
        candidatePreScore(b, profile, input) -
        candidatePreScore(a, profile, input),
    )
    .slice(0, MAX_ITEMS_PER_CATEGORY);
}

function bestOptionalItem(
  candidates: WardrobeItem[],
  baseItems: WardrobeItem[],
  profile: StyleProfile | null,
  input: OutfitGenerationInput,
): WardrobeItem | null {
  if (candidates.length === 0) {
    return null;
  }

  return [...candidates].sort((a, b) => {
    const scoreA =
      candidatePreScore(a, profile, input) +
      outfitColorHarmony([...baseItems, a]) * 0.3;
    const scoreB =
      candidatePreScore(b, profile, input) +
      outfitColorHarmony([...baseItems, b]) * 0.3;
    return scoreB - scoreA;
  })[0];
}

function buildRecommendation(
  baseItems: WardrobeItem[],
  outerwear: WardrobeItem[],
  accessories: WardrobeItem[],
  profile: StyleProfile | null,
  input: OutfitGenerationInput,
  usesDress: boolean,
): OutfitRecommendation {
  const items = [...baseItems];
  const optionalOuterwear = bestOptionalItem(
    outerwear,
    items,
    profile,
    input,
  );
  if (optionalOuterwear && input.occasion !== 'sport') {
    items.push(optionalOuterwear);
  }

  const optionalAccessory = bestOptionalItem(
    accessories,
    items,
    profile,
    input,
  );
  if (optionalAccessory) {
    items.push(optionalAccessory);
  }

  const breakdown = buildBreakdown(items, profile, input);
  const itemIds = items.map((item) => item.id);

  return {
    id: `${input.occasion}:${itemIds.join(':')}`,
    itemIds,
    items,
    occasion: input.occasion,
    score: overallScore(breakdown),
    scoreBreakdown: breakdown,
    reasons: buildReasons(breakdown, profile, input.occasion),
    usesDress,
  };
}

function uniqueRecommendations(
  recommendations: OutfitRecommendation[],
): OutfitRecommendation[] {
  const seen = new Set<string>();
  const unique: OutfitRecommendation[] = [];

  for (const recommendation of recommendations) {
    const key = [...recommendation.itemIds].sort().join('|');
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(recommendation);
    }
  }

  return unique;
}

function calculateMissingCategories(items: WardrobeItem[]): WardrobeCategory[] {
  const hasShoes = items.some((item) => item.category === 'Shoes');
  const hasDress = items.some((item) => item.category === 'Dress');
  const hasTop = items.some((item) => item.category === 'Top');
  const hasBottom = items.some((item) => item.category === 'Bottom');

  const missing: WardrobeCategory[] = [];
  if (!hasShoes) {
    missing.push('Shoes');
  }
  if (!hasDress && !hasTop) {
    missing.push('Top');
  }
  if (!hasDress && !hasBottom) {
    missing.push('Bottom');
  }

  return missing;
}

export function generateOutfitRecommendations(
  items: WardrobeItem[],
  profile: StyleProfile | null,
  input: OutfitGenerationInput,
): OutfitGenerationResult {
  const maxResults = Math.max(1, Math.min(input.maxResults ?? 12, 30));
  const missingCategories = calculateMissingCategories(items);

  if (missingCategories.length > 0) {
    return {
      recommendations: [],
      missingCategories,
      wardrobeItemCount: items.length,
      styleProfile: profile,
    };
  }

  const tops = topCategoryItems(items, 'Top', profile, input);
  const bottoms = topCategoryItems(items, 'Bottom', profile, input);
  const dresses = topCategoryItems(items, 'Dress', profile, input);
  const shoes = topCategoryItems(items, 'Shoes', profile, input);
  const outerwear = topCategoryItems(items, 'Outerwear', profile, input);
  const accessories = topCategoryItems(items, 'Accessory', profile, input);
  const recommendations: OutfitRecommendation[] = [];

  for (const dress of dresses) {
    for (const shoe of shoes) {
      recommendations.push(
        buildRecommendation(
          [dress, shoe],
          outerwear,
          accessories,
          profile,
          input,
          true,
        ),
      );
    }
  }

  for (const top of tops) {
    for (const bottom of bottoms) {
      for (const shoe of shoes) {
        recommendations.push(
          buildRecommendation(
            [top, bottom, shoe],
            outerwear,
            accessories,
            profile,
            input,
            false,
          ),
        );
      }
    }
  }

  return {
    recommendations: uniqueRecommendations(recommendations)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults),
    missingCategories: [],
    wardrobeItemCount: items.length,
    styleProfile: profile,
  };
}
