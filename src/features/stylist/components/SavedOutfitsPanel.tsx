import {
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type { WardrobeItem } from '@/features/wardrobe/types';

import type {
  OutfitFeedback,
  SavedOutfit,
} from '../saved-outfit-types';

const FEEDBACK_ACTIONS: readonly {
  value: OutfitFeedback;
  label: string;
}[] = [
  { value: 'liked', label: 'Gefällt mir' },
  { value: 'disliked', label: 'Nicht meins' },
  { value: 'worn', label: 'Getragen' },
];

function itemForId(
  wardrobeItems: WardrobeItem[],
  itemId: string,
): WardrobeItem | null {
  return wardrobeItems.find((item) => item.id === itemId) ?? null;
}

export function SavedOutfitsPanel({
  outfits,
  wardrobeItems,
  onFeedback,
  onDelete,
}: {
  outfits: SavedOutfit[];
  wardrobeItems: WardrobeItem[];
  onFeedback: (outfitId: string, feedback: OutfitFeedback) => Promise<void>;
  onDelete: (outfitId: string) => Promise<void>;
}) {
  if (outfits.length === 0) {
    return null;
  }

  const confirmDelete = (outfitId: string) => {
    Alert.alert(
      'Outfit entfernen?',
      'Nur die gespeicherte Kombination wird gelöscht. Deine Kleidungsstücke bleiben im Schrank.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Entfernen',
          style: 'destructive',
          onPress: () => {
            void onDelete(outfitId).catch((error: unknown) => {
              console.error('Failed to delete saved outfit', error);
              Alert.alert(
                'Löschen fehlgeschlagen',
                'Das gespeicherte Outfit konnte nicht entfernt werden.',
              );
            });
          },
        },
      ],
    );
  };

  return (
    <View className="mt-8">
      <View className="flex-row justify-between items-end mb-4">
        <View>
          <Text className="text-2xl font-extrabold text-black dark:text-white">
            Gespeicherte Outfits
          </Text>
          <Text className="text-zinc-500 text-xs mt-1">
            Feedback verbessert später deine persönlichen Rankings.
          </Text>
        </View>
        <View className="bg-zinc-200 dark:bg-zinc-800 rounded-full px-3 py-1.5">
          <Text className="text-zinc-700 dark:text-zinc-200 text-xs font-bold">
            {outfits.length}
          </Text>
        </View>
      </View>

      {outfits.map((outfit) => {
        const resolvedItems = outfit.itemIds
          .map((itemId) => itemForId(wardrobeItems, itemId))
          .filter((item): item is WardrobeItem => item !== null);

        return (
          <View
            key={outfit.id}
            className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-4 mb-4"
          >
            <View className="flex-row justify-between items-start mb-3">
              <View>
                <Text className="text-black dark:text-white font-bold text-lg">
                  {outfit.score}% Match
                </Text>
                <Text className="text-zinc-500 text-xs">
                  {outfit.occasion} · {outfit.season}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => confirmDelete(outfit.id)}
                className="px-3 py-2 rounded-xl bg-red-500/10"
              >
                <Text className="text-red-500 text-xs font-bold">Entfernen</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row mb-4">
              {outfit.itemIds.slice(0, 5).map((itemId) => {
                const item = itemForId(wardrobeItems, itemId);
                return (
                  <View
                    key={itemId}
                    className="w-14 h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 mr-2 overflow-hidden items-center justify-center"
                  >
                    {item?.imageUrl ? (
                      <Image
                        source={{ uri: item.imageUrl }}
                        className="w-full h-full"
                        resizeMode="contain"
                      />
                    ) : (
                      <Text className="text-zinc-400 text-[9px] text-center px-1">
                        {item?.name ?? 'Teil entfernt'}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>

            {resolvedItems.length < outfit.itemIds.length ? (
              <Text className="text-amber-600 dark:text-amber-400 text-xs mb-3">
                Mindestens ein Kleidungsstück dieses Outfits ist nicht mehr im Schrank.
              </Text>
            ) : null}

            <View className="flex-row flex-wrap">
              {FEEDBACK_ACTIONS.map((action) => {
                const selected = outfit.feedback === action.value;
                return (
                  <TouchableOpacity
                    key={action.value}
                    onPress={() =>
                      void onFeedback(
                        outfit.id,
                        selected ? 'none' : action.value,
                      ).catch((error: unknown) => {
                        console.error('Failed to update outfit feedback', error);
                        Alert.alert(
                          'Feedback nicht gespeichert',
                          'Bitte versuche es erneut.',
                        );
                      })
                    }
                    className={`px-3 py-2 rounded-full mr-2 mb-2 border ${
                      selected
                        ? 'bg-black dark:bg-white border-black dark:border-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    <Text
                      className={
                        selected
                          ? 'text-white dark:text-black text-xs font-bold'
                          : 'text-zinc-600 dark:text-zinc-300 text-xs font-medium'
                      }
                    >
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}
