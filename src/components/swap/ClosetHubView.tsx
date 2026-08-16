import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SwapItem } from '../../types/swap';

export interface ClosetHubViewProps {
  items: SwapItem[];
  onSelectItem?: (item: SwapItem) => void;
  onOpenTradeStudio: (item: SwapItem) => void;
  savedItemIds?: string[];
  onToggleSave?: (item: SwapItem) => void;
}

const ARCHETYPES = [
  'All',
  'Avant-Garde',
  'Streetwear',
  'Parisian Chic',
  'Minimalist',
  'Luxury Techwear',
  'Darkwear',
  'Modern Future',
];

const SIZES = ['All Sizes', 'XS', 'S', 'M', 'L', 'XL', 'EU 41', 'EU 42', 'One Size'];

export const ClosetHubView: React.FC<ClosetHubViewProps> = ({
  items,
  onSelectItem,
  onOpenTradeStudio,
  savedItemIds = [],
  onToggleSave,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArchetype, setSelectedArchetype] = useState('All');
  const [selectedSize, setSelectedSize] = useState('All Sizes');

  const filteredItems = items.filter((item) => {
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${item.title} ${item.brand} ${item.description} ${item.ownerName} ${item.ownerLocation}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    // Archetype match
    if (
      selectedArchetype !== 'All' &&
      item.aestheticTag.toLowerCase() !== selectedArchetype.toLowerCase()
    ) {
      return false;
    }

    // Size match
    if (
      selectedSize !== 'All Sizes' &&
      item.size.toLowerCase() !== selectedSize.toLowerCase()
    ) {
      return false;
    }

    return true;
  });

  const clearFilters = (): void => {
    setSearchQuery('');
    setSelectedArchetype('All');
    setSelectedSize('All Sizes');
  };

  const getConditionBadgeStyle = (condition: SwapItem['condition']): string => {
    switch (condition) {
      case 'Like New':
        return 'bg-emerald-500 text-white';
      case 'Excellent':
        return 'bg-sky-500 text-white';
      case 'Good':
        return 'bg-amber-500 text-white';
      case 'Upcycled':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-zinc-500 text-white';
    }
  };

  return (
    <View className="flex-1 space-y-4 gap-3">
      {/* Search Input Bar */}
      <View className="flex-row items-center bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 shadow-sm">
        <Text className="text-zinc-400 mr-2 text-base">🔍</Text>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search brand, item name, location..."
          placeholderTextColor="#71717a"
          className="flex-1 text-sm text-white py-1 outline-none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text className="text-zinc-400 text-xs font-bold px-2 py-1">✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Style Archetype Category Filters */}
      <View>
        <Text className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 px-1">
          Style Archetype
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row space-x-2 gap-2"
        >
          {ARCHETYPES.map((arch) => {
            const isActive = selectedArchetype === arch;
            return (
              <TouchableOpacity
                key={arch}
                onPress={() => setSelectedArchetype(arch)}
                className={`px-3.5 py-1.5 rounded-full border ${
                  isActive
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    isActive ? 'text-white font-bold' : 'text-zinc-300'
                  }`}
                >
                  {arch}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Size Filters */}
      <View>
        <Text className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 px-1">
          Garment Size
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row space-x-2 gap-2"
        >
          {SIZES.map((sz) => {
            const isActive = selectedSize === sz;
            return (
              <TouchableOpacity
                key={sz}
                onPress={() => setSelectedSize(sz)}
                className={`px-3 py-1 rounded-lg border ${
                  isActive
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                <Text
                  className={`text-xs font-mono ${
                    isActive ? 'text-white font-bold' : 'text-zinc-300'
                  }`}
                >
                  {sz}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Peer Wardrobe Items Grid */}
      {filteredItems.length === 0 ? (
        <View className="py-12 items-center justify-center bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6">
          <Text className="text-4xl mb-2">👗</Text>
          <Text className="text-base font-bold text-white text-center mb-1">
            No Wardrobe Items Found
          </Text>
          <Text className="text-xs text-zinc-400 text-center mb-4 max-w-xs">
            No items matched your current filter criteria. Try adjusting or clearing your filters.
          </Text>
          <TouchableOpacity
            onPress={clearFilters}
            className="px-4 py-2 bg-indigo-600 rounded-full"
          >
            <Text className="text-xs font-bold text-white">Reset All Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="flex-row flex-wrap justify-between -mx-1">
          {filteredItems.map((item) => {
            const isSaved = savedItemIds.includes(item.id);
            return (
              <View key={item.id} className="w-1/2 p-1.5">
                <View className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
                  {/* Image container */}
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => onSelectItem?.(item)}
                    className="relative aspect-square w-full bg-zinc-800"
                  >
                    <Image
                      source={{ uri: item.imageUrl }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />

                    {/* Condition badge top-left */}
                    <View className="absolute top-2 left-2">
                      <View
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getConditionBadgeStyle(
                          item.condition
                        )}`}
                      >
                        <Text className="text-[10px] font-bold text-white">
                          {item.condition}
                        </Text>
                      </View>
                    </View>

                    {/* Save heart icon top-right */}
                    <TouchableOpacity
                      onPress={() => onToggleSave?.(item)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-md items-center justify-center"
                    >
                      <Text className="text-xs">{isSaved ? '❤️' : '🤍'}</Text>
                    </TouchableOpacity>

                    {/* Aesthetic tag bottom-left */}
                    <View className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded-md">
                      <Text className="text-[10px] font-semibold text-white">
                        {item.aestheticTag}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Garment Metadata */}
                  <View className="p-3 space-y-1.5 gap-1">
                    <Text className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      {item.brand}
                    </Text>
                    <Text
                      numberOfLines={1}
                      className="text-xs font-bold text-white leading-tight truncate"
                    >
                      {item.title}
                    </Text>

                    <View className="flex-row items-center justify-between pt-0.5">
                      <Text className="text-[10px] font-mono text-zinc-400">
                        {item.size}
                      </Text>
                      <Text className="text-xs font-bold text-emerald-400">
                        ${item.estimatedValue}
                      </Text>
                    </View>

                    <View className="bg-emerald-950/50 border border-emerald-500/20 px-2 py-0.5 rounded flex-row items-center justify-between">
                      <Text className="text-[10px] text-emerald-300">
                        🌿 {item.co2SavedKg}kg CO₂
                      </Text>
                    </View>

                    {/* Owner snippet */}
                    <View className="flex-row items-center space-x-1.5 gap-1.5 pt-1 border-t border-zinc-800">
                      <Image
                        source={{ uri: item.ownerAvatar }}
                        className="w-5 h-5 rounded-full border border-white/20"
                      />
                      <Text
                        numberOfLines={1}
                        className="text-[10px] text-zinc-300 truncate flex-1"
                      >
                        {item.ownerName}
                      </Text>
                    </View>

                    {/* Trade Trigger Button */}
                    <TouchableOpacity
                      onPress={() => onOpenTradeStudio(item)}
                      activeOpacity={0.8}
                      className="mt-1 bg-indigo-600 active:bg-indigo-500 py-1.5 rounded-xl items-center justify-center shadow"
                    >
                      <Text className="text-[11px] font-bold text-white">
                        ⚡ Trade Now
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};
