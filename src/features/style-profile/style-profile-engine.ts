import type { WardrobeItem } from '@/features/wardrobe/types';

import { STYLE_PREFERENCES } from './types';
import type {
  StylePreference,
  StyleProfileSummary,
  StyleQuestionnaire,
  WardrobeStyleSignals,
} from './types';

export const STYLE_LABELS: Record<StylePreference, string> = {
  minimal: 'Minimal',
  classic: 'Klassisch',
  'smart-casual': 'Smart Casual',
  streetwear: 'Streetwear',
  sporty: 'Sportlich',
  vintage: 'Vintage',
  y2k: 'Y2K',
  'dark-academia': 'Dark Academia',
  romantic: 'Romantisch',
  edgy: 'Edgy',
};

const STYLE_KEYWORDS: Record<StylePreference, readonly string[]> = {
  minimal: ['minimal', 'minimalistisch', 'clean', 'zeitlos', 'monochrom'],
  classic: ['klassisch', 'classic', 'elegant', 'timeless', 'preppy'],
  'smart-casual': [
    'smart casual',
    'business casual',
    'tailoring',
    'business',
    'smart',
  ],
  streetwear: ['streetwear', 'street', 'urban', 'oversized', 'skater'],
  sporty: ['sportlich', 'sporty', 'athleisure', 'active', 'performance'],
  vintage: ['vintage', 'retro', 'heritage'],
  y2k: ['y2k', '2000er', '2000s'],
  'dark-academia': ['dark academia', 'academia', 'scholar', 'preppy'],
  romantic: ['romantisch', 'romantic', 'feminin', 'soft', 'delicate'],
  edgy: ['edgy', 'biker', 'punk', 'grunge', 'rebellisch', 'rebel'],
};

const SUMMARY_BY_STYLE: Record<
  StylePreference,
  { title: string; archetype: string; description: string }
> = {
  minimal: {
    title: 'Urban Minimalist',
    archetype: 'The Editor',
    description:
      'Du bevorzugst klare Kombinationen, ruhige Farben und Teile, die sich vielseitig miteinander tragen lassen.',
  },
  classic: {
    title: 'Modern Classic',
    archetype: 'The Timeless',
    description:
      'Dein Stil lebt von verlässlichen Silhouetten, hochwertigen Basics und Looks, die nicht von kurzen Trends abhängig sind.',
  },
  'smart-casual': {
    title: 'Refined Everyday',
    archetype: 'The Polished',
    description:
      'Du verbindest Alltagstauglichkeit mit einem gepflegten Look und magst Outfits, die entspannt und trotzdem angezogen wirken.',
  },
  streetwear: {
    title: 'Urban Street',
    archetype: 'The Culture Mix',
    description:
      'Deine Style-DNA setzt auf urbane Silhouetten, starke Einzelteile und lässige Kombinationen mit klarer Haltung.',
  },
  sporty: {
    title: 'Active Utility',
    archetype: 'The Mover',
    description:
      'Komfort, Funktion und Bewegung sind für dich wichtig. Sportliche Elemente dürfen selbstverständlich Teil des Alltagslooks sein.',
  },
  vintage: {
    title: 'Modern Vintage',
    archetype: 'The Curator',
    description:
      'Du magst charaktervolle Teile mit Retro-Einfluss und kombinierst sie lieber individuell als komplett trendgetrieben.',
  },
  y2k: {
    title: 'Y2K Remix',
    archetype: 'The Revivalist',
    description:
      'Du greifst bewusst Einflüsse der 2000er auf und kombinierst auffällige Proportionen und nostalgische Details modern.',
  },
  'dark-academia': {
    title: 'Modern Academia',
    archetype: 'The Scholar',
    description:
      'Strukturierte, gedeckte und leicht nostalgische Looks passen zu dir. Layering und klassische Details spielen eine wichtige Rolle.',
  },
  romantic: {
    title: 'Soft Tailoring',
    archetype: 'The Romantic',
    description:
      'Du bevorzugst weichere Linien, harmonische Farben und Details, die einen Look bewusst leichter und persönlicher machen.',
  },
  edgy: {
    title: 'Modern Rebel',
    archetype: 'The Disruptor',
    description:
      'Kontraste, markante Teile und eine etwas härtere Ästhetik geben deinen Outfits Charakter und Wiedererkennungswert.',
  },
};

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase('de-DE');
}

function topEntries(counts: Map<string, number>, maxItems: number): string[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'de'))
    .slice(0, maxItems)
    .map(([value]) => value);
}

export function deriveWardrobeStyleSignals(
  items: WardrobeItem[],
): WardrobeStyleSignals {
  const categoryCounts = new Map<string, number>();
  const colorCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();
  let analyzedItemCount = 0;

  for (const item of items) {
    categoryCounts.set(
      item.category,
      (categoryCounts.get(item.category) ?? 0) + 1,
    );

    const color = item.color.trim();
    if (color && normalize(color) !== 'unbekannt') {
      colorCounts.set(color, (colorCounts.get(color) ?? 0) + 1);
    }

    if (item.aiStatus === 'completed') {
      analyzedItemCount += 1;
    }

    for (const tag of item.styleTags) {
      const normalizedTag = normalize(tag);
      if (normalizedTag) {
        tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) ?? 0) + 1);
      }
    }
  }

  return {
    dominantCategories: topEntries(categoryCounts, 5),
    dominantColors: topEntries(colorCounts, 5),
    dominantStyleTags: topEntries(tagCounts, 8),
    analyzedItemCount,
    totalItemCount: items.length,
  };
}

function styleScores(
  questionnaire: StyleQuestionnaire,
  signals: WardrobeStyleSignals,
): Map<StylePreference, number> {
  const scores = new Map<StylePreference, number>(
    STYLE_PREFERENCES.map((style) => [style, 0]),
  );

  for (const style of questionnaire.preferredStyles) {
    scores.set(style, (scores.get(style) ?? 0) + 3);
  }

  for (const tag of signals.dominantStyleTags) {
    const normalizedTag = normalize(tag);

    for (const style of STYLE_PREFERENCES) {
      if (
        STYLE_KEYWORDS[style].some((keyword) =>
          normalizedTag.includes(normalize(keyword)),
        )
      ) {
        scores.set(style, (scores.get(style) ?? 0) + 1);
      }
    }
  }

  if (questionnaire.minimalVsBold <= 0.35) {
    scores.set('minimal', (scores.get('minimal') ?? 0) + 1);
    scores.set('classic', (scores.get('classic') ?? 0) + 0.5);
  } else if (questionnaire.minimalVsBold >= 0.65) {
    scores.set('edgy', (scores.get('edgy') ?? 0) + 0.75);
    scores.set('streetwear', (scores.get('streetwear') ?? 0) + 0.5);
    scores.set('y2k', (scores.get('y2k') ?? 0) + 0.5);
  }

  if (questionnaire.formalVsCasual >= 0.65) {
    scores.set('classic', (scores.get('classic') ?? 0) + 0.75);
    scores.set('smart-casual', (scores.get('smart-casual') ?? 0) + 1);
  } else if (questionnaire.formalVsCasual <= 0.35) {
    scores.set('streetwear', (scores.get('streetwear') ?? 0) + 0.5);
    scores.set('sporty', (scores.get('sporty') ?? 0) + 0.5);
  }

  return scores;
}

export function deriveStyleProfileSummary(
  questionnaire: StyleQuestionnaire,
  signals: WardrobeStyleSignals,
): StyleProfileSummary {
  const scores = styleScores(questionnaire, signals);
  const ranked = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([style]) => style);

  const preferredFallback = questionnaire.preferredStyles[0] ?? 'minimal';
  const primary =
    ranked.find((style) => (scores.get(style) ?? 0) > 0) ?? preferredFallback;
  const summary = SUMMARY_BY_STYLE[primary];

  return {
    ...summary,
    topStyles: ranked.slice(0, 3),
  };
}

export function buildStyleProfileDraft(
  questionnaire: StyleQuestionnaire,
  items: WardrobeItem[],
): {
  wardrobeSignals: WardrobeStyleSignals;
  summary: StyleProfileSummary;
} {
  const wardrobeSignals = deriveWardrobeStyleSignals(items);

  return {
    wardrobeSignals,
    summary: deriveStyleProfileSummary(questionnaire, wardrobeSignals),
  };
}
