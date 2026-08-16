import React, { useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import { SwapItem } from '../../types/swap';

export interface SwapDeckCardProps {
  item: SwapItem;
  onSwipeLeft?: (item: SwapItem) => void;
  onSwipeRight?: (item: SwapItem) => void;
  onOpenTradeStudio?: (item: SwapItem) => void;
  onToggleSave?: (item: SwapItem) => void;
  isSaved?: boolean;
  isTopCard?: boolean;
}

export const SwapDeckCard: React.FC<SwapDeckCardProps> = ({
  item,
  onSwipeLeft,
  onSwipeRight,
  onOpenTradeStudio,
  onToggleSave,
  isSaved = false,
  isTopCard = true,
}) => {
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isTopCard,
      onMoveShouldSetPanResponder: (_, gestureState: PanResponderGestureState) =>
        isTopCard && (Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10),
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        if (gestureState.dx > 120) {
          Animated.timing(pan, {
            toValue: { x: 500, y: gestureState.dy },
            duration: 250,
            useNativeDriver: false,
          }).start(() => {
            onSwipeRight?.(item);
            pan.setValue({ x: 0, y: 0 });
          });
        } else if (gestureState.dx < -120) {
          Animated.timing(pan, {
            toValue: { x: -500, y: gestureState.dy },
            duration: 250,
            useNativeDriver: false,
          }).start(() => {
            onSwipeLeft?.(item);
            pan.setValue({ x: 0, y: 0 });
          });
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const rotate = pan.x.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ['-15deg', '0deg', '15deg'],
    extrapolate: 'clamp',
  });

  const swapOpacity = pan.x.interpolate({
    inputRange: [20, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const passOpacity = pan.x.interpolate({
    inputRange: [-100, -20],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

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

  const handlePass = (): void => {
    if (!isTopCard) return;
    Animated.timing(pan, {
      toValue: { x: -500, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      onSwipeLeft?.(item);
      pan.setValue({ x: 0, y: 0 });
    });
  };

  const handleSwap = (): void => {
    if (!isTopCard) return;
    Animated.timing(pan, {
      toValue: { x: 500, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      onSwipeRight?.(item);
      pan.setValue({ x: 0, y: 0 });
    });
  };

  return (
    <Animated.View
      {...(isTopCard ? panResponder.panHandlers : {})}
      style={[
        isTopCard
          ? {
              transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }],
            }
          : {},
      ]}
      className="w-full max-w-sm aspect-[3/4] rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-700 shadow-2xl relative select-none"
    >
      {/* Background Image */}
      <Image
        source={{ uri: item.imageUrl }}
        className="absolute inset-0 w-full h-full"
        resizeMode="cover"
      />

      {/* Dark Overlay Gradient simulation */}
      <View className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20 justify-between p-4">
        {/* Top Badges */}
        <View className="flex-row items-center justify-between w-full">
          <View className="flex-row items-center space-x-2 gap-2">
            <View
              className={`px-3 py-1 rounded-full text-xs font-bold ${getConditionBadgeStyle(
                item.condition
              )}`}
            >
              <Text className="text-xs font-bold text-white">{item.condition}</Text>
            </View>
            <View className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30">
              <Text className="text-xs font-semibold text-white">{item.aestheticTag}</Text>
            </View>
          </View>
          <View className="bg-black/60 px-3 py-1 rounded-full border border-emerald-500/40">
            <Text className="text-xs font-bold text-emerald-400">
              Est. ${item.estimatedValue}
            </Text>
          </View>
        </View>

        {/* Swipe Feedback Stamp Overlays */}
        {isTopCard && (
          <>
            <Animated.View
              style={[{ opacity: swapOpacity }]}
              className="absolute top-16 left-6 border-4 border-emerald-400 rounded-xl px-4 py-1 rotate-[-12deg] bg-emerald-950/60 z-20 pointer-events-none"
            >
              <Text className="text-emerald-400 font-black text-3xl tracking-widest">
                SWAP
              </Text>
            </Animated.View>

            <Animated.View
              style={[{ opacity: passOpacity }]}
              className="absolute top-16 right-6 border-4 border-rose-500 rounded-xl px-4 py-1 rotate-[12deg] bg-rose-950/60 z-20 pointer-events-none"
            >
              <Text className="text-rose-500 font-black text-3xl tracking-widest">
                PASS
              </Text>
            </Animated.View>
          </>
        )}

        {/* Bottom Details Section */}
        <View className="w-full space-y-3 gap-2 mt-auto">
          {/* Eco Impact Pills */}
          <View className="flex-row flex-wrap items-center gap-2">
            <View className="bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-full flex-row items-center">
              <Text className="text-xs font-medium text-emerald-300">
                🌿 {item.co2SavedKg} kg CO₂
              </Text>
            </View>
            <View className="bg-sky-950/80 border border-sky-500/40 px-2.5 py-1 rounded-full flex-row items-center">
              <Text className="text-xs font-medium text-sky-300">
                💧 {item.waterSavedLiters.toLocaleString()} L H₂O
              </Text>
            </View>
          </View>

          {/* Garment Title & Brand */}
          <View>
            <View className="flex-row items-center space-x-2 gap-2">
              <Text className="text-xs font-bold text-indigo-300 tracking-wider uppercase">
                {item.brand}
              </Text>
              <View className="bg-white/20 px-2 py-0.5 rounded">
                <Text className="text-[10px] font-mono font-bold text-white">
                  {item.size}
                </Text>
              </View>
            </View>
            <Text className="text-2xl font-black text-white leading-tight mt-0.5">
              {item.title}
            </Text>
          </View>

          {/* Owner Details */}
          <View className="flex-row items-center justify-between border-t border-white/10 pt-2.5">
            <View className="flex-row items-center space-x-2 gap-2">
              <Image
                source={{ uri: item.ownerAvatar }}
                className="w-9 h-9 rounded-full border border-white/40 bg-zinc-700"
              />
              <View>
                <Text className="text-xs font-semibold text-white">
                  {item.ownerName}
                </Text>
                <Text className="text-[10px] text-zinc-300">
                  📍 {item.ownerLocation}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons Bar */}
          {isTopCard && (
            <View className="flex-row items-center justify-between pt-1">
              {/* Pass Button */}
              <TouchableOpacity
                onPress={handlePass}
                activeOpacity={0.8}
                className="w-13 h-13 rounded-full bg-rose-500/20 border border-rose-500/50 items-center justify-center p-3"
              >
                <Text className="text-rose-400 font-bold text-xl">✕</Text>
              </TouchableOpacity>

              {/* Bookmark / Save Button */}
              <TouchableOpacity
                onPress={() => onToggleSave?.(item)}
                activeOpacity={0.8}
                className={`w-12 h-12 rounded-full border items-center justify-center p-2.5 ${
                  isSaved
                    ? 'bg-rose-500/30 border-rose-400'
                    : 'bg-white/15 border-white/30 backdrop-blur-md'
                }`}
              >
                <Text className="text-lg">{isSaved ? '❤️' : '🤍'}</Text>
              </TouchableOpacity>

              {/* Direct Trade Studio Button */}
              <TouchableOpacity
                onPress={() => onOpenTradeStudio?.(item)}
                activeOpacity={0.8}
                className="px-4 py-2.5 bg-indigo-600 border border-indigo-400 rounded-full flex-row items-center space-x-1 gap-1 shadow-lg"
              >
                <Text className="text-white font-black text-xs tracking-wide">
                  ⚡ TRADE
                </Text>
              </TouchableOpacity>

              {/* Swap Request Button */}
              <TouchableOpacity
                onPress={handleSwap}
                activeOpacity={0.8}
                className="w-13 h-13 rounded-full bg-emerald-500 border border-emerald-400 items-center justify-center p-3 shadow-lg"
              >
                <Text className="text-white font-bold text-xl">🔄</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};
