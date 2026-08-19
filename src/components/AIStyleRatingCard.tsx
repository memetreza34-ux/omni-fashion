import React from 'react';
import { View, Text } from 'react-native';

interface Props {
  mood: string;
  weatherTemp: string;
}

interface RatingDetails {
  score: number;
  grade: string;
  colorScore: number;
  silhouetteScore: number;
  versatilityScore: number;
  whyItFits: string;
  bodyMatchReason: string;
  tuningTip: string;
}

const MOOD_RATINGS: Record<string, RatingDetails> = {
  Alltag: {
    score: 9.4,
    grade: 'Elite Match (94%)',
    colorScore: 9.6,
    silhouetteScore: 9.3,
    versatilityScore: 9.5,
    whyItFits:
      'Perfekt ausbalanciertes Alltags-Setup. Das reduzierte Farbspektrum (Weiß & Denim) wirkt mühelos und hochwertig.',
    bodyMatchReason:
      'Der leicht lockere Schnitt des T-Shirts harmonisiert mit der geraden Hosenlinie und streckt optisch deine Beine.',
    tuningTip:
      'Tipp: Krempel den Hosensaum 1-mal leicht hoch, um die Sneaker noch cleaner in Szene zu setzen.',
  },
  Büro: {
    score: 9.1,
    grade: 'Smart Casual (91%)',
    colorScore: 9.4,
    silhouetteScore: 9.0,
    versatilityScore: 8.9,
    whyItFits:
      'Kombiniert formelle Struktur mit modernem Komfort. Schafft sofortige professionelle Ausstrahlung ohne Spießigkeit.',
    bodyMatchReason:
      'Die Schulterpartie verleiht eine aufrechte, selbstbewusste Haltung und betont die V-Silhouette.',
    tuningTip:
      'Tipp: Ein dezenter Ledergürtel oder eine minimalistische Armbanduhr vollendet das Smart-Casual Finish.',
  },
  'Date Night': {
    score: 9.7,
    grade: 'Showstopper (97%)',
    colorScore: 9.8,
    silhouetteScore: 9.6,
    versatilityScore: 9.2,
    whyItFits:
      'Monochromer Kontrast und subtile Texturen erzeugen sofortigen Wow-Effekt und hohe visuelle Tiefe.',
    bodyMatchReason:
      'Perfekte Betonung der Taille und fließender Übergang zu den Schuhen für eine elegante Silhouette.',
    tuningTip:
      'Tipp: Trage einen warmen Duft (z. B. Amber oder Sandelholz) und lass den Kragen lässig offen.',
  },
  Sport: {
    score: 8.9,
    grade: 'Performance Match (89%)',
    colorScore: 9.0,
    silhouetteScore: 8.8,
    versatilityScore: 9.3,
    whyItFits:
      'Atmungsaktive Layer und maximale Bewegungsfreiheit mit sportlich-cleanem Streetwear-Touch.',
    bodyMatchReason:
      'Athletischer Schnitt betont die Schultermuskulatur und bietet volle Flexibilität im Schritt.',
    tuningTip:
      'Tipp: Setze auf weiße Crew-Socks für den authentischen Athletic-Chic Look.',
  },
  Party: {
    score: 9.5,
    grade: 'High Energy (95%)',
    colorScore: 9.5,
    silhouetteScore: 9.6,
    versatilityScore: 8.7,
    whyItFits:
      'Mutige Schnittkombination mit auffälligem Schuhwerk – ideal für dynamische Lichtverhältnisse und Nachtleben.',
    bodyMatchReason:
      'Die Proportionen wirken dynamisch in Bewegung und fangen den Raum optimal ein.',
    tuningTip:
      'Tipp: Eine silberne Gliederkette als Eyecatcher bricht die dunklen Töne perfekt auf.',
  },
};

export function AIStyleRatingCard({ mood, weatherTemp }: Props) {
  const rating = MOOD_RATINGS[mood] || MOOD_RATINGS.Alltag;

  return (
    <View className="bg-white dark:bg-zinc-900 rounded-[32px] p-6 border border-zinc-200 dark:border-zinc-800 shadow-xl mb-6">
      <View className="flex-row justify-between items-center mb-5">
        <View className="flex-1 pr-3">
          <View className="flex-row items-center mb-1">
            <Text className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mr-2">
              KI-Style & Fit Audit
            </Text>
            <View className="bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
              <Text className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                Verifiziert
              </Text>
            </View>
          </View>
          <Text className="text-2xl font-bold text-black dark:text-white">
            {rating.grade}
          </Text>
          <Text className="text-zinc-500 text-xs mt-1">{weatherTemp}</Text>
        </View>

        <View className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 items-center justify-center shadow-lg shadow-blue-500/30">
          <Text className="text-white font-extrabold text-xl">{rating.score}</Text>
          <Text className="text-blue-200 text-[10px] font-semibold">/ 10</Text>
        </View>
      </View>

      <View className="space-y-3 mb-5 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
        <View>
          <View className="flex-row justify-between items-center mb-1.5">
            <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              🎨 Farbharmonie & Kontrast
            </Text>
            <Text className="text-xs font-bold text-black dark:text-white">
              {rating.colorScore} / 10
            </Text>
          </View>
          <View className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <View
              className="h-full bg-blue-600 rounded-full"
              style={{ width: `${(rating.colorScore / 10) * 100}%` }}
            />
          </View>
        </View>

        <View className="mt-2.5">
          <View className="flex-row justify-between items-center mb-1.5">
            <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              📐 Silhouette & Figur-Fit
            </Text>
            <Text className="text-xs font-bold text-black dark:text-white">
              {rating.silhouetteScore} / 10
            </Text>
          </View>
          <View className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <View
              className="h-full bg-purple-600 rounded-full"
              style={{ width: `${(rating.silhouetteScore / 10) * 100}%` }}
            />
          </View>
        </View>

        <View className="mt-2.5">
          <View className="flex-row justify-between items-center mb-1.5">
            <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              🎯 Anlass-Match ({mood})
            </Text>
            <Text className="text-xs font-bold text-black dark:text-white">
              {rating.versatilityScore} / 10
            </Text>
          </View>
          <View className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <View
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${(rating.versatilityScore / 10) * 100}%` }}
            />
          </View>
        </View>
      </View>

      <View className="mb-4">
        <Text className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
          🧠 Warum es zu deiner Figur passt
        </Text>
        <Text className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed mb-2">
          {rating.bodyMatchReason}
        </Text>
        <Text className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed">
          {rating.whyItFits}
        </Text>
      </View>

      <View className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl flex-row items-start">
        <Text className="text-base mr-2.5 mt-0.5">💡</Text>
        <View className="flex-1">
          <Text className="text-amber-800 dark:text-amber-300 text-xs font-bold mb-0.5">
            KI-Tuning-Tipp
          </Text>
          <Text className="text-amber-900/90 dark:text-amber-200/90 text-xs leading-5">
            {rating.tuningTip}
          </Text>
        </View>
      </View>
    </View>
  );
}
