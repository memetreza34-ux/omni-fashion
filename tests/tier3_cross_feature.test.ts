/// <reference types="node" />
import test from 'node:test';
import assert from 'node:assert';

export interface SwapItem {
  id: string;
  title: string;
  brand: string;
  category: 'Tops' | 'Bottoms' | 'Outerwear' | 'Shoes' | 'Accessories';
  size: string;
  condition: 'Like New' | 'Excellent' | 'Good' | 'Upcycled';
  estimatedValue: number;
  co2SavedKg: number;
  waterSavedLiters: number;
  imageUrl: string;
  ownerName: string;
  ownerAvatar: string;
  ownerLocation: string;
  aestheticTag: string;
  description: string;
}

export interface SwapTradeProposal {
  id: string;
  offeredItemId: string;
  requestedItemId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface UserSwapProfileStats {
  totalSwaps: number;
  totalCo2SavedKg: number;
  totalWaterSavedLiters: number;
  reputationScore: number;
}

export interface EcoImpactMetrics {
  co2SavedKg: number;
  waterSavedLiters: number;
}

function calculateEcoImpact(items: SwapItem[]): EcoImpactMetrics {
  if (!items || items.length === 0) {
    return { co2SavedKg: 0, waterSavedLiters: 0 };
  }
  return items.reduce<EcoImpactMetrics>(
    (acc, item) => ({
      co2SavedKg: Number((acc.co2SavedKg + (item.co2SavedKg || 0)).toFixed(2)),
      waterSavedLiters: Math.round(
        acc.waterSavedLiters + (item.waterSavedLiters || 0),
      ),
    }),
    { co2SavedKg: 0, waterSavedLiters: 0 },
  );
}

function createTradeProposal(
  offeredItemId: string,
  requestedItemId: string,
): SwapTradeProposal {
  if (!offeredItemId.trim() || !requestedItemId.trim()) {
    throw new Error('Item IDs cannot be empty');
  }
  if (offeredItemId === requestedItemId) {
    throw new Error('Cannot propose a trade with the same item');
  }
  return {
    id: `proposal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    offeredItemId,
    requestedItemId,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}

// Cross-feature helper: accept a trade proposal and update user profile stats
export function acceptTradeProposal(
  currentStats: UserSwapProfileStats,
  proposal: SwapTradeProposal,
  offeredItem: SwapItem,
  requestedItem: SwapItem,
): { updatedStats: UserSwapProfileStats; updatedProposal: SwapTradeProposal } {
  if (proposal.status !== 'pending') {
    throw new Error(`Cannot accept proposal with status '${proposal.status}'`);
  }

  const combinedEco = calculateEcoImpact([offeredItem, requestedItem]);
  const newProposal: SwapTradeProposal = {
    ...proposal,
    status: 'accepted',
  };

  const newStats: UserSwapProfileStats = {
    totalSwaps: currentStats.totalSwaps + 1,
    totalCo2SavedKg: Number(
      (currentStats.totalCo2SavedKg + combinedEco.co2SavedKg).toFixed(2),
    ),
    totalWaterSavedLiters:
      currentStats.totalWaterSavedLiters + combinedEco.waterSavedLiters,
    reputationScore: Math.min(100, currentStats.reputationScore + 2),
  };

  return { updatedStats: newStats, updatedProposal: newProposal };
}

// Cross-feature helper: filter closet items and stage target item for TradeStudio
export function stageTradeFromCloset(
  closetItems: SwapItem[],
  deckItems: SwapItem[],
  filterTag: string,
  targetItemId: string,
): {
  selectedOfferedItem: SwapItem;
  selectedRequestedItem: SwapItem;
  proposal: SwapTradeProposal;
} {
  const filteredCloset = closetItems.filter(
    (item) => item.aestheticTag === filterTag,
  );
  if (filteredCloset.length === 0) {
    throw new Error(`No closet items found matching tag '${filterTag}'`);
  }

  const requestedItem = deckItems.find((item) => item.id === targetItemId);
  if (!requestedItem) {
    throw new Error(`Target item '${targetItemId}' not found in SwapDeck`);
  }

  const offeredItem = filteredCloset[0];
  const proposal = createTradeProposal(offeredItem.id, requestedItem.id);

  return {
    selectedOfferedItem: offeredItem,
    selectedRequestedItem: requestedItem,
    proposal,
  };
}

test('Tier 3: SwapDeck Item to Trade Proposal Mapping', () => {
  const deckItem: SwapItem = {
    id: 'deck-item-10',
    title: 'Retro Bomber Jacket',
    brand: 'Alpha',
    category: 'Outerwear',
    size: 'L',
    condition: 'Excellent',
    estimatedValue: 180,
    co2SavedKg: 18.0,
    waterSavedLiters: 3200,
    imageUrl: 'https://example.com/bomber.jpg',
    ownerName: 'Chloe',
    ownerAvatar: 'https://example.com/chloe.jpg',
    ownerLocation: 'Berlin, DE',
    aestheticTag: 'Streetwear',
    description: 'Classic oversized streetwear bomber.',
  };

  const userItem: SwapItem = {
    id: 'user-item-05',
    title: 'Graphic Hoodie',
    brand: 'Stussy',
    category: 'Tops',
    size: 'L',
    condition: 'Like New',
    estimatedValue: 120,
    co2SavedKg: 8.5,
    waterSavedLiters: 1500,
    imageUrl: 'https://example.com/hoodie.jpg',
    ownerName: 'You',
    ownerAvatar: 'https://example.com/you.jpg',
    ownerLocation: 'Berlin, DE',
    aestheticTag: 'Streetwear',
    description: 'Pristine graphic hoodie.',
  };

  const proposal = createTradeProposal(userItem.id, deckItem.id);

  assert.strictEqual(proposal.offeredItemId, userItem.id);
  assert.strictEqual(proposal.requestedItemId, deckItem.id);
  assert.strictEqual(proposal.status, 'pending');
});

test('Tier 3: Combined Eco Impact Calculation Across Paired Trade Items', () => {
  const itemA: SwapItem = {
    id: 'item-a',
    title: 'Vintage Denim Jeans',
    brand: 'Wrangler',
    category: 'Bottoms',
    size: '32/32',
    condition: 'Good',
    estimatedValue: 70,
    co2SavedKg: 12.0,
    waterSavedLiters: 2800,
    imageUrl: 'https://example.com/jeans.jpg',
    ownerName: 'Marc',
    ownerAvatar: 'https://example.com/marc.jpg',
    ownerLocation: 'Copenhagen, DK',
    aestheticTag: 'Vintage',
    description: 'Worn vintage denim.',
  };

  const itemB: SwapItem = {
    id: 'item-b',
    title: 'Knit Sweater',
    brand: 'Uniqlo',
    category: 'Tops',
    size: 'M',
    condition: 'Excellent',
    estimatedValue: 50,
    co2SavedKg: 6.2,
    waterSavedLiters: 1100,
    imageUrl: 'https://example.com/sweater.jpg',
    ownerName: 'Sophie',
    ownerAvatar: 'https://example.com/sophie.jpg',
    ownerLocation: 'Stockholm, SE',
    aestheticTag: 'Minimalist',
    description: 'Soft merino knit.',
  };

  const combinedEco = calculateEcoImpact([itemA, itemB]);
  assert.strictEqual(combinedEco.co2SavedKg, 18.2);
  assert.strictEqual(combinedEco.waterSavedLiters, 3900);
});

test('Tier 3: Cross-Feature State Update — Trade Acceptance updates User Stats', () => {
  const initialStats: UserSwapProfileStats = {
    totalSwaps: 10,
    totalCo2SavedKg: 120.0,
    totalWaterSavedLiters: 15000,
    reputationScore: 94,
  };

  const offeredItem: SwapItem = {
    id: 'offered-1',
    title: 'Leather Boots',
    brand: 'Dr. Martens',
    category: 'Shoes',
    size: '42',
    condition: 'Excellent',
    estimatedValue: 140,
    co2SavedKg: 14.0,
    waterSavedLiters: 2200,
    imageUrl: 'https://example.com/boots.jpg',
    ownerName: 'User',
    ownerAvatar: 'https://example.com/u.jpg',
    ownerLocation: 'Berlin, DE',
    aestheticTag: 'Grunge',
    description: 'Sturdy black boots.',
  };

  const requestedItem: SwapItem = {
    id: 'requested-1',
    title: 'Trench Coat',
    brand: 'Burberry',
    category: 'Outerwear',
    size: 'M',
    condition: 'Like New',
    estimatedValue: 350,
    co2SavedKg: 25.0,
    waterSavedLiters: 4500,
    imageUrl: 'https://example.com/coat.jpg',
    ownerName: 'Peer',
    ownerAvatar: 'https://example.com/p.jpg',
    ownerLocation: 'London, UK',
    aestheticTag: 'Classic',
    description: 'Heritage trench coat.',
  };

  const proposal = createTradeProposal(offeredItem.id, requestedItem.id);

  const result = acceptTradeProposal(
    initialStats,
    proposal,
    offeredItem,
    requestedItem,
  );

  assert.strictEqual(result.updatedProposal.status, 'accepted');
  assert.strictEqual(result.updatedStats.totalSwaps, 11);
  assert.strictEqual(result.updatedStats.totalCo2SavedKg, 159.0);
  assert.strictEqual(result.updatedStats.totalWaterSavedLiters, 21700);
  assert.strictEqual(result.updatedStats.reputationScore, 96);
});

test('Tier 3: Closet Hub Filter to Staged Trade Proposal Interaction', () => {
  const closetItems: SwapItem[] = [
    {
      id: 'closet-1',
      title: 'Vintage Leather Belt',
      brand: 'Gucci',
      category: 'Accessories',
      size: '90cm',
      condition: 'Good',
      estimatedValue: 90,
      co2SavedKg: 3.0,
      waterSavedLiters: 500,
      imageUrl: 'https://example.com/belt.jpg',
      ownerName: 'Me',
      ownerAvatar: 'https://example.com/me.jpg',
      ownerLocation: 'Berlin, DE',
      aestheticTag: 'Vintage',
      description: 'Classic G logo belt.',
    },
    {
      id: 'closet-2',
      title: 'Modern Running Shoes',
      brand: 'Nike',
      category: 'Shoes',
      size: '43',
      condition: 'Like New',
      estimatedValue: 110,
      co2SavedKg: 9.0,
      waterSavedLiters: 1600,
      imageUrl: 'https://example.com/shoes.jpg',
      ownerName: 'Me',
      ownerAvatar: 'https://example.com/me.jpg',
      ownerLocation: 'Berlin, DE',
      aestheticTag: 'Athleisure',
      description: 'Air Max sneakers.',
    },
  ];

  const deckItems: SwapItem[] = [
    {
      id: 'deck-target',
      title: 'Vintage Oversized Sweater',
      brand: 'Coogi',
      category: 'Tops',
      size: 'L',
      condition: 'Excellent',
      estimatedValue: 200,
      co2SavedKg: 16.0,
      waterSavedLiters: 3000,
      imageUrl: 'https://example.com/coogi.jpg',
      ownerName: 'Alex',
      ownerAvatar: 'https://example.com/alex.jpg',
      ownerLocation: 'Amsterdam, NL',
      aestheticTag: 'Vintage',
      description: 'Iconic 3D knit sweater.',
    },
  ];

  const staged = stageTradeFromCloset(
    closetItems,
    deckItems,
    'Vintage',
    'deck-target',
  );

  assert.strictEqual(staged.selectedOfferedItem.id, 'closet-1');
  assert.strictEqual(staged.selectedRequestedItem.id, 'deck-target');
  assert.strictEqual(staged.proposal.offeredItemId, 'closet-1');
  assert.strictEqual(staged.proposal.requestedItemId, 'deck-target');
  assert.strictEqual(staged.proposal.status, 'pending');
});
