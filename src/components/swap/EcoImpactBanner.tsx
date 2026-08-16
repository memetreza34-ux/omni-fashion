import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { EcoImpactMetrics, UserSwapProfileStats } from '../../types/swap';

export interface EcoImpactBannerProps {
  metrics: EcoImpactMetrics;
  userStats?: UserSwapProfileStats;
}

export const EcoImpactBanner: React.FC<EcoImpactBannerProps> = ({
  metrics,
  userStats,
}) => {
  const [viewMode, setViewMode] = useState<'community' | 'user'>('community');

  const activeSwaps =
    viewMode === 'community'
      ? metrics.totalCommunitySwaps
      : userStats?.totalSwaps ?? 0;

  const activeCo2 =
    viewMode === 'community'
      ? metrics.totalCo2SavedKg
      : userStats?.totalCo2SavedKg ?? 0;

  const activeWater =
    viewMode === 'community'
      ? metrics.totalWaterSavedLiters
      : userStats?.totalWaterSavedLiters ?? 0;

  const activeTrees =
    viewMode === 'community'
      ? metrics.treesEquivalentSaved
      : Math.round((userStats?.totalCo2SavedKg ?? 0) / 21);

  // Goal calculation for community (e.g. 20,000 kg CO2 target)
  const targetCo2Goal = 20000;
  const progressPercent = Math.min(
    100,
    Math.round((activeCo2 / targetCo2Goal) * 100)
  );

  return (
    <View className="w-full rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 p-5 shadow-xl text-white border border-white/20 space-y-4 gap-3 relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <View className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
      <View className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-xl pointer-events-none" />

      {/* Top Banner Header & Toggle */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center space-x-2 gap-2">
          <Text className="text-2xl">🌱</Text>
          <View>
            <Text className="text-lg font-black text-white leading-none">
              Circular Eco Impact
            </Text>
            <Text className="text-[10px] text-emerald-100 font-medium mt-0.5">
              Live Environmental Savings Counter
            </Text>
          </View>
        </View>

        {/* View Toggle */}
        <View className="flex-row bg-black/25 p-1 rounded-full border border-white/20">
          <TouchableOpacity
            onPress={() => setViewMode('community')}
            className={`px-3 py-1 rounded-full ${
              viewMode === 'community' ? 'bg-white text-emerald-900 shadow' : ''
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                viewMode === 'community' ? 'text-emerald-900' : 'text-white/80'
              }`}
            >
              Community
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('user')}
            className={`px-3 py-1 rounded-full ${
              viewMode === 'user' ? 'bg-white text-emerald-900 shadow' : ''
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                viewMode === 'user' ? 'text-emerald-900' : 'text-white/80'
              }`}
            >
              My Impact
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 4 Metric Cards Grid */}
      <View className="flex-row flex-wrap -mx-1">
        {/* Metric 1: Swaps */}
        <View className="w-1/2 p-1">
          <View className="bg-black/30 backdrop-blur-md border border-white/15 p-3 rounded-2xl">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-white/80 font-medium">Swaps Completed</Text>
              <Text className="text-base">🔄</Text>
            </View>
            <Text className="text-xl font-black text-white mt-1">
              {activeSwaps.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Metric 2: CO2 Saved */}
        <View className="w-1/2 p-1">
          <View className="bg-black/30 backdrop-blur-md border border-white/15 p-3 rounded-2xl">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-white/80 font-medium">CO₂ Saved</Text>
              <Text className="text-base">🌿</Text>
            </View>
            <Text className="text-xl font-black text-emerald-300 mt-1">
              {activeCo2.toLocaleString()} <Text className="text-xs font-normal">kg</Text>
            </Text>
          </View>
        </View>

        {/* Metric 3: Water Saved */}
        <View className="w-1/2 p-1">
          <View className="bg-black/30 backdrop-blur-md border border-white/15 p-3 rounded-2xl">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-white/80 font-medium">H₂O Saved</Text>
              <Text className="text-base">💧</Text>
            </View>
            <Text className="text-xl font-black text-sky-300 mt-1">
              {activeWater.toLocaleString()} <Text className="text-xs font-normal">L</Text>
            </Text>
          </View>
        </View>

        {/* Metric 4: Trees Equivalent */}
        <View className="w-1/2 p-1">
          <View className="bg-black/30 backdrop-blur-md border border-white/15 p-3 rounded-2xl">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-white/80 font-medium">Trees Equivalent</Text>
              <Text className="text-base">🌳</Text>
            </View>
            <Text className="text-xl font-black text-amber-300 mt-1">
              {activeTrees.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Milestone Progress Bar */}
      {viewMode === 'community' && (
        <View className="bg-black/30 backdrop-blur-md border border-white/15 p-3 rounded-2xl space-y-1.5 gap-1">
          <View className="flex-row justify-between items-center">
            <Text className="text-xs font-semibold text-white/90">
              🎯 Next Goal: 20,000 kg CO₂
            </Text>
            <Text className="text-xs font-bold text-emerald-300">
              {progressPercent}% Achieved
            </Text>
          </View>
          <View className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
            <View
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-emerald-400 rounded-full"
            />
          </View>
        </View>
      )}
    </View>
  );
};
