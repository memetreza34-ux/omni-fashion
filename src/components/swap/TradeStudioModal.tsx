import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SwapItem, SwapTradeProposal } from '../../types/swap';

export interface TradeStudioModalProps {
  visible: boolean;
  targetItem: SwapItem | null;
  userItems: SwapItem[];
  onClose: () => void;
  onProposeTrade: (proposal: Omit<SwapTradeProposal, 'id' | 'createdAt'>) => void;
}

export const TradeStudioModal: React.FC<TradeStudioModalProps> = ({
  visible,
  targetItem,
  userItems,
  onClose,
  onProposeTrade,
}) => {
  const [selectedOfferedItem, setSelectedOfferedItem] = useState<SwapItem | null>(
    userItems.length > 0 ? userItems[0] : null
  );

  if (!targetItem) return null;

  const combinedCo2Kg = selectedOfferedItem
    ? Number((targetItem.co2SavedKg + selectedOfferedItem.co2SavedKg).toFixed(1))
    : targetItem.co2SavedKg;

  const combinedWaterL = selectedOfferedItem
    ? targetItem.waterSavedLiters + selectedOfferedItem.waterSavedLiters
    : targetItem.waterSavedLiters;

  const valueDelta = selectedOfferedItem
    ? selectedOfferedItem.estimatedValue - targetItem.estimatedValue
    : 0;

  const handlePropose = (): void => {
    if (!selectedOfferedItem) return;
    onProposeTrade({
      offeredItemId: selectedOfferedItem.id,
      requestedItemId: targetItem.id,
      status: 'pending',
    });
    onClose();
  };

  const renderValueDeltaBadge = (): React.ReactNode => {
    if (!selectedOfferedItem) return null;
    const absDelta = Math.abs(valueDelta);
    if (absDelta <= 50) {
      return (
        <View className="bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 rounded-full">
          <Text className="text-xs font-semibold text-emerald-400">
            ✨ Fair Value Match (±$50)
          </Text>
        </View>
      );
    }
    if (valueDelta > 50) {
      return (
        <View className="bg-indigo-500/20 border border-indigo-500/40 px-3 py-1 rounded-full">
          <Text className="text-xs font-semibold text-indigo-300">
            ➕ Your item is +${absDelta} higher value
          </Text>
        </View>
      );
    }
    return (
      <View className="bg-amber-500/20 border border-amber-500/40 px-3 py-1 rounded-full">
        <Text className="text-xs font-semibold text-amber-300">
          ⚡ Target item is +${absDelta} higher value
        </Text>
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/80 justify-center items-center p-4">
        <View className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh]">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-zinc-800">
            <View>
              <Text className="text-xl font-black text-white flex-row items-center">
                ⚡ Trade Studio
              </Text>
              <Text className="text-xs text-zinc-400">
                1-to-1 Cashless Wardrobe Exchange
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center"
            >
              <Text className="text-zinc-400 font-bold">✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="space-y-4" showsVerticalScrollIndicator={false}>
            {/* Target Item Section */}
            <View className="bg-zinc-800/80 p-3.5 rounded-2xl border border-zinc-700">
              <Text className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">
                Requested Target Item
              </Text>
              <View className="flex-row items-center space-x-3 gap-3">
                <Image
                  source={{ uri: targetItem.imageUrl }}
                  className="w-16 h-16 rounded-xl bg-zinc-700"
                  resizeMode="cover"
                />
                <View className="flex-1">
                  <Text className="text-xs text-indigo-300 font-bold">
                    {targetItem.brand}
                  </Text>
                  <Text className="text-sm font-bold text-white truncate">
                    {targetItem.title}
                  </Text>
                  <View className="flex-row items-center space-x-2 gap-2 mt-1">
                    <Text className="text-xs font-mono text-zinc-400">
                      Size: {targetItem.size}
                    </Text>
                    <Text className="text-xs font-bold text-emerald-400">
                      Est. ${targetItem.estimatedValue}
                    </Text>
                  </View>
                </View>
                <Image
                  source={{ uri: targetItem.ownerAvatar }}
                  className="w-8 h-8 rounded-full border border-white/20"
                />
              </View>
            </View>

            {/* Exchange Divider */}
            <View className="items-center my-1">
              <View className="bg-indigo-600/30 border border-indigo-500/50 px-3 py-1 rounded-full">
                <Text className="text-xs font-bold text-indigo-300">
                  🔄 Swap For Your Garment
                </Text>
              </View>
            </View>

            {/* Offered Item Selector */}
            <View className="space-y-2">
              <Text className="text-xs font-bold text-zinc-300">
                Select Your Item to Offer:
              </Text>
              {userItems.length === 0 ? (
                <View className="p-4 bg-zinc-800/50 rounded-xl items-center">
                  <Text className="text-xs text-zinc-400">
                    No items found in your closet. Add items first!
                  </Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="flex-row space-x-3 gap-3 py-1"
                >
                  {userItems.map((uItem) => {
                    const isSelected = selectedOfferedItem?.id === uItem.id;
                    return (
                      <TouchableOpacity
                        key={uItem.id}
                        onPress={() => setSelectedOfferedItem(uItem)}
                        activeOpacity={0.8}
                        className={`w-36 p-2.5 rounded-2xl border ${
                          isSelected
                            ? 'bg-indigo-950/70 border-indigo-500 shadow-md'
                            : 'bg-zinc-800/60 border-zinc-700'
                        }`}
                      >
                        <Image
                          source={{ uri: uItem.imageUrl }}
                          className="w-full h-24 rounded-xl bg-zinc-700 mb-2"
                          resizeMode="cover"
                        />
                        <Text className="text-[10px] font-bold text-indigo-300 truncate">
                          {uItem.brand}
                        </Text>
                        <Text className="text-xs font-bold text-white truncate">
                          {uItem.title}
                        </Text>
                        <View className="flex-row justify-between items-center mt-1">
                          <Text className="text-[10px] text-zinc-400 font-mono">
                            {uItem.size}
                          </Text>
                          <Text className="text-[10px] font-bold text-emerald-400">
                            ${uItem.estimatedValue}
                          </Text>
                        </View>
                        {isSelected && (
                          <View className="mt-1.5 bg-indigo-600 py-0.5 rounded items-center">
                            <Text className="text-[10px] font-bold text-white">
                              ✓ Selected
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* Combined Eco Impact & Value Delta Summary */}
            {selectedOfferedItem && (
              <View className="bg-emerald-950/40 border border-emerald-500/30 p-3.5 rounded-2xl space-y-2 gap-1.5">
                <Text className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                  Combined Circular Eco Impact
                </Text>
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-emerald-200">
                    🌿 CO₂ Prevented:
                  </Text>
                  <Text className="text-xs font-bold text-emerald-300">
                    {combinedCo2Kg} kg
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-sky-200">
                    💧 Water Saved:
                  </Text>
                  <Text className="text-xs font-bold text-sky-300">
                    {combinedWaterL.toLocaleString()} Liters
                  </Text>
                </View>
                <View className="pt-1.5 border-t border-emerald-500/20 flex-row items-center justify-between">
                  <Text className="text-xs text-zinc-300">Value Delta:</Text>
                  {renderValueDeltaBadge()}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Action Footer */}
          <TouchableOpacity
            onPress={handlePropose}
            disabled={!selectedOfferedItem}
            activeOpacity={0.8}
            className={`py-3.5 rounded-2xl items-center justify-center ${
              selectedOfferedItem
                ? 'bg-indigo-600 active:bg-indigo-500 shadow-lg'
                : 'bg-zinc-800 opacity-50'
            }`}
          >
            <Text className="text-white font-black text-sm tracking-wide">
              SUBMIT TRADE PROPOSAL ⚡
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
