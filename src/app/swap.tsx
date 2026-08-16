import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import {
  SwapItem,
  SwapTradeProposal,
  UserSwapProfileStats,
  EcoImpactMetrics,
} from '../types/swap';
import {
  mockSwapItems,
  mockTradeProposals,
  mockUserProfileStats,
  mockEcoImpactMetrics,
} from '../data/swap-data';
import { SwapDeckCard } from '../components/swap/SwapDeckCard';
import { TradeStudioModal } from '../components/swap/TradeStudioModal';
import { ClosetHubView } from '../components/swap/ClosetHubView';
import { EcoImpactBanner } from '../components/swap/EcoImpactBanner';

export default function SwapScreen(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'deck' | 'closets' | 'trades'>('deck');
  const [deckItems, setDeckItems] = useState<SwapItem[]>(mockSwapItems);
  const [userItems] = useState<SwapItem[]>(mockSwapItems.slice(0, 3)); // User's own items
  const [savedItemIds, setSavedItemIds] = useState<string[]>(['item-1', 'item-3']);
  const [tradeProposals, setTradeProposals] = useState<SwapTradeProposal[]>(
    mockTradeProposals
  );
  const [tradeStudioTargetItem, setTradeStudioTargetItem] = useState<SwapItem | null>(
    null
  );
  const [communityMetrics] = useState<EcoImpactMetrics>(mockEcoImpactMetrics);
  const [userStats] = useState<UserSwapProfileStats>(mockUserProfileStats);
  const [proposalStatusFilter, setProposalStatusFilter] = useState<
    'all' | 'pending' | 'accepted' | 'declined'
  >('all');

  const handleSwipeLeft = (item: SwapItem): void => {
    setDeckItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const handleSwipeRight = (item: SwapItem): void => {
    setTradeStudioTargetItem(item);
  };

  const handleToggleSave = (item: SwapItem): void => {
    setSavedItemIds((prev) =>
      prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
    );
  };

  const resetDeck = (): void => {
    setDeckItems(mockSwapItems);
  };

  const handleProposeTrade = (
    proposal: Omit<SwapTradeProposal, 'id' | 'createdAt'>
  ): void => {
    const newProposal: SwapTradeProposal = {
      ...proposal,
      id: `tp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setTradeProposals((prev) => [newProposal, ...prev]);
  };

  const handleUpdateProposalStatus = (
    id: string,
    newStatus: 'accepted' | 'declined'
  ): void => {
    setTradeProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );
  };

  const getItemById = (id: string): SwapItem | undefined => {
    return mockSwapItems.find((i) => i.id === id);
  };

  const filteredProposals = tradeProposals.filter((p) => {
    if (proposalStatusFilter === 'all') return true;
    return p.status === proposalStatusFilter;
  });

  return (
    <SafeAreaView className="flex-1 bg-zinc-950 text-white">
      <ScrollView
        className="flex-1 px-4 py-4 space-y-5 gap-4"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* OmniSwap Hub Header */}
        <View className="flex-row items-center justify-between pt-2">
          <View>
            <View className="flex-row items-center space-x-2 gap-2">
              <Text className="text-2xl font-black text-white">OmniSwap Hub</Text>
              <View className="bg-indigo-600/30 border border-indigo-500/50 px-2.5 py-0.5 rounded-full">
                <Text className="text-[10px] font-bold text-indigo-300 uppercase">
                  CIRCULAR
                </Text>
              </View>
            </View>
            <Text className="text-xs text-zinc-400">
              Cashless Peer-to-Peer Garment Exchange
            </Text>
          </View>

          <View className="bg-emerald-950/80 border border-emerald-500/40 px-3 py-1.5 rounded-full flex-row items-center space-x-1 gap-1">
            <Text className="text-xs font-bold text-emerald-300">
              🌿 {userStats.totalCo2SavedKg} kg Saved
            </Text>
          </View>
        </View>

        {/* Sub-Navigation Bar */}
        <View className="flex-row bg-zinc-900 border border-zinc-800 p-1.5 rounded-2xl">
          <TouchableOpacity
            onPress={() => setActiveTab('deck')}
            className={`flex-1 py-2.5 rounded-xl items-center flex-row justify-center space-x-1 gap-1 ${
              activeTab === 'deck' ? 'bg-indigo-600 shadow-md' : ''
            }`}
          >
            <Text className="text-sm">🃏</Text>
            <Text
              className={`text-xs font-bold ${
                activeTab === 'deck' ? 'text-white' : 'text-zinc-400'
              }`}
            >
              Swipe Deck
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('closets')}
            className={`flex-1 py-2.5 rounded-xl items-center flex-row justify-center space-x-1 gap-1 ${
              activeTab === 'closets' ? 'bg-indigo-600 shadow-md' : ''
            }`}
          >
            <Text className="text-sm">👗</Text>
            <Text
              className={`text-xs font-bold ${
                activeTab === 'closets' ? 'text-white' : 'text-zinc-400'
              }`}
            >
              Peer Closets
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('trades')}
            className={`flex-1 py-2.5 rounded-xl items-center flex-row justify-center space-x-1 gap-1 ${
              activeTab === 'trades' ? 'bg-indigo-600 shadow-md' : ''
            }`}
          >
            <Text className="text-sm">🤝</Text>
            <Text
              className={`text-xs font-bold ${
                activeTab === 'trades' ? 'text-white' : 'text-zinc-400'
              }`}
            >
              My Trades ({tradeProposals.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Swipe Deck */}
        {activeTab === 'deck' && (
          <View className="space-y-5 gap-4">
            {/* Live Eco Banner */}
            <EcoImpactBanner metrics={communityMetrics} userStats={userStats} />

            {/* Deck Card Container */}
            <View className="items-center justify-center my-2">
              {deckItems.length > 0 ? (
                <View className="w-full max-w-sm aspect-[3/4] relative items-center justify-center">
                  {/* Background Card Preview */}
                  {deckItems.length > 1 && (
                    <View className="absolute top-3 w-[92%] aspect-[3/4] rounded-3xl bg-zinc-800 border border-zinc-700 opacity-60 scale-95" />
                  )}
                  {/* Top Interactive Card */}
                  <SwapDeckCard
                    key={deckItems[0].id}
                    item={deckItems[0]}
                    onSwipeLeft={handleSwipeLeft}
                    onSwipeRight={handleSwipeRight}
                    onOpenTradeStudio={(item) => setTradeStudioTargetItem(item)}
                    onToggleSave={handleToggleSave}
                    isSaved={savedItemIds.includes(deckItems[0].id)}
                    isTopCard={true}
                  />
                </View>
              ) : (
                <View className="w-full max-w-sm p-8 bg-zinc-900 border border-zinc-800 rounded-3xl items-center justify-center text-center space-y-4 gap-3">
                  <Text className="text-5xl">🌿</Text>
                  <Text className="text-lg font-bold text-white text-center">
                    You've Swiped All Available Items!
                  </Text>
                  <Text className="text-xs text-zinc-400 text-center">
                    Great job exploring community wardrobes. You can reset the deck to review again or browse peer closets directly.
                  </Text>
                  <TouchableOpacity
                    onPress={resetDeck}
                    className="px-5 py-3 bg-indigo-600 rounded-full shadow-lg"
                  >
                    <Text className="text-xs font-bold text-white">
                      🔄 Reset Swipe Deck
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Tab 2: Peer Closets */}
        {activeTab === 'closets' && (
          <ClosetHubView
            items={mockSwapItems}
            onOpenTradeStudio={(item) => setTradeStudioTargetItem(item)}
            savedItemIds={savedItemIds}
            onToggleSave={handleToggleSave}
          />
        )}

        {/* Tab 3: Trade Proposals Dashboard */}
        {activeTab === 'trades' && (
          <View className="space-y-4 gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-white">
                Active Trade Proposals
              </Text>
              <Text className="text-xs text-zinc-400">
                {tradeProposals.length} total proposals
              </Text>
            </View>

            {/* Proposal Filter Tabs */}
            <View className="flex-row space-x-2 gap-2">
              {(['all', 'pending', 'accepted', 'declined'] as const).map((st) => (
                <TouchableOpacity
                  key={st}
                  onPress={() => setProposalStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-full border ${
                    proposalStatusFilter === st
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <Text className="text-xs font-bold capitalize text-white">
                    {st}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Trade Proposal List */}
            {filteredProposals.length === 0 ? (
              <View className="py-10 items-center justify-center bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6">
                <Text className="text-3xl mb-2">🤝</Text>
                <Text className="text-sm font-bold text-white">
                  No Proposals in '{proposalStatusFilter}' State
                </Text>
              </View>
            ) : (
              filteredProposals.map((prop) => {
                const offered = getItemById(prop.offeredItemId);
                const requested = getItemById(prop.requestedItemId);

                return (
                  <View
                    key={prop.id}
                    className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-3 gap-2 shadow-md"
                  >
                    {/* Proposal Status Header */}
                    <View className="flex-row items-center justify-between border-b border-zinc-800 pb-2">
                      <Text className="text-[10px] font-mono text-zinc-400">
                        Proposal #{prop.id} • {new Date(prop.createdAt).toLocaleDateString()}
                      </Text>
                      <View
                        className={`px-2.5 py-0.5 rounded-full ${
                          prop.status === 'accepted'
                            ? 'bg-emerald-500/20 border border-emerald-500/40'
                            : prop.status === 'declined'
                            ? 'bg-rose-500/20 border border-rose-500/40'
                            : 'bg-amber-500/20 border border-amber-500/40'
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold capitalize ${
                            prop.status === 'accepted'
                              ? 'text-emerald-400'
                              : prop.status === 'declined'
                              ? 'text-rose-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {prop.status}
                        </Text>
                      </View>
                    </View>

                    {/* Garments Comparison */}
                    <View className="flex-row items-center justify-between">
                      {/* Offered Garment */}
                      <View className="flex-1 flex-row items-center space-x-2 gap-2">
                        {offered ? (
                          <>
                            <Image
                              source={{ uri: offered.imageUrl }}
                              className="w-12 h-12 rounded-xl bg-zinc-800"
                            />
                            <View className="flex-1">
                              <Text className="text-[10px] text-zinc-400 font-bold">
                                YOU OFFER
                              </Text>
                              <Text
                                numberOfLines={1}
                                className="text-xs font-bold text-white truncate"
                              >
                                {offered.title}
                              </Text>
                              <Text className="text-[10px] text-emerald-400 font-bold">
                                ${offered.estimatedValue}
                              </Text>
                            </View>
                          </>
                        ) : (
                          <Text className="text-xs text-zinc-500">Offered Item</Text>
                        )}
                      </View>

                      {/* Swap Arrow */}
                      <View className="px-2">
                        <Text className="text-lg text-indigo-400">🔄</Text>
                      </View>

                      {/* Requested Garment */}
                      <View className="flex-1 flex-row items-center space-x-2 gap-2">
                        {requested ? (
                          <>
                            <Image
                              source={{ uri: requested.imageUrl }}
                              className="w-12 h-12 rounded-xl bg-zinc-800"
                            />
                            <View className="flex-1">
                              <Text className="text-[10px] text-indigo-400 font-bold">
                                FOR ITEM
                              </Text>
                              <Text
                                numberOfLines={1}
                                className="text-xs font-bold text-white truncate"
                              >
                                {requested.title}
                              </Text>
                              <Text className="text-[10px] text-emerald-400 font-bold">
                                ${requested.estimatedValue}
                              </Text>
                            </View>
                          </>
                        ) : (
                          <Text className="text-xs text-zinc-500">Requested Item</Text>
                        )}
                      </View>
                    </View>

                    {/* Action Controls for Pending Proposals */}
                    {prop.status === 'pending' && (
                      <View className="flex-row space-x-2 gap-2 pt-2 border-t border-zinc-800">
                        <TouchableOpacity
                          onPress={() =>
                            handleUpdateProposalStatus(prop.id, 'accepted')
                          }
                          className="flex-1 bg-emerald-600 py-2 rounded-xl items-center"
                        >
                          <Text className="text-xs font-bold text-white">
                            ✓ Accept Proposal
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            handleUpdateProposalStatus(prop.id, 'declined')
                          }
                          className="flex-1 bg-rose-600/30 border border-rose-500/40 py-2 rounded-xl items-center"
                        >
                          <Text className="text-xs font-bold text-rose-300">
                            ✕ Decline
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Global Trade Studio Modal */}
      <TradeStudioModal
        visible={tradeStudioTargetItem !== null}
        targetItem={tradeStudioTargetItem}
        userItems={userItems}
        onClose={() => setTradeStudioTargetItem(null)}
        onProposeTrade={handleProposeTrade}
      />
    </SafeAreaView>
  );
}
