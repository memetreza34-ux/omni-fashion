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
      waterSavedLiters: Math.round(acc.waterSavedLiters + (item.waterSavedLiters || 0))
    }),
    { co2SavedKg: 0, waterSavedLiters: 0 }
  );
}

function createTradeProposal(offeredItemId: string, requestedItemId: string): SwapTradeProposal {
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
    createdAt: new Date().toISOString()
  };
}

export class OmniSwapWorkflowEngine {
  private userStats: UserSwapProfileStats;
  private userCloset: SwapItem[];
  private deckItems: SwapItem[];
  private proposals: SwapTradeProposal[];

  constructor(initialStats: UserSwapProfileStats, userCloset: SwapItem[], deckItems: SwapItem[]) {
    this.userStats = { ...initialStats };
    this.userCloset = [...userCloset];
    this.deckItems = [...deckItems];
    this.proposals = [];
  }

  public getStats(): UserSwapProfileStats {
    return { ...this.userStats };
  }

  public getProposals(): SwapTradeProposal[] {
    return [...this.proposals];
  }

  // Step 1: Select target item from deck
  public selectDeckItem(itemId: string): SwapItem {
    const item = this.deckItems.find(i => i.id === itemId);
    if (!item) {
      throw new Error(`Deck item '${itemId}' not found.`);
    }
    return item;
  }

  // Step 2: Select item from personal closet
  public selectClosetItem(itemId: string): SwapItem {
    const item = this.userCloset.find(i => i.id === itemId);
    if (!item) {
      throw new Error(`Closet item '${itemId}' not found in user closet.`);
    }
    return item;
  }

  // Step 3: Calculate instant eco savings for proposed swap
  public calculateProposedEcoSavings(offeredItemId: string, requestedItemId: string): EcoImpactMetrics {
    const offered = this.selectClosetItem(offeredItemId);
    const requested = this.selectDeckItem(requestedItemId);
    return calculateEcoImpact([offered, requested]);
  }

  // Step 4: Submit trade proposal
  public submitTradeProposal(offeredItemId: string, requestedItemId: string): SwapTradeProposal {
    if (this.userCloset.length === 0) {
      throw new Error('Cannot submit trade proposal with an empty closet.');
    }
    const offered = this.selectClosetItem(offeredItemId);
    const requested = this.selectDeckItem(requestedItemId);

    const proposal = createTradeProposal(offered.id, requested.id);
    this.proposals.push(proposal);
    return proposal;
  }

  // Step 5: Peer accepts proposal and updates stats
  public acceptProposal(proposalId: string): { proposal: SwapTradeProposal; stats: UserSwapProfileStats } {
    const idx = this.proposals.findIndex(p => p.id === proposalId);
    if (idx === -1) {
      throw new Error(`Proposal '${proposalId}' not found.`);
    }
    const current = this.proposals[idx];
    if (current.status !== 'pending') {
      throw new Error(`Cannot accept proposal in '${current.status}' status.`);
    }

    const offered = this.selectClosetItem(current.offeredItemId);
    const requested = this.selectDeckItem(current.requestedItemId);
    const ecoSavings = calculateEcoImpact([offered, requested]);

    const updatedProposal: SwapTradeProposal = {
      ...current,
      status: 'accepted'
    };
    this.proposals[idx] = updatedProposal;

    // Remove traded item from user closet
    this.userCloset = this.userCloset.filter(i => i.id !== offered.id);

    // Update user profile stats
    this.userStats = {
      totalSwaps: this.userStats.totalSwaps + 1,
      totalCo2SavedKg: Number((this.userStats.totalCo2SavedKg + ecoSavings.co2SavedKg).toFixed(2)),
      totalWaterSavedLiters: this.userStats.totalWaterSavedLiters + ecoSavings.waterSavedLiters,
      reputationScore: Math.min(100, this.userStats.reputationScore + 5)
    };

    return { proposal: updatedProposal, stats: { ...this.userStats } };
  }
}

test('Tier 4: Complete Real-World User Swapping Workflow Lifecycle', () => {
  // Setup initial world state
  const initialUserStats: UserSwapProfileStats = {
    totalSwaps: 3,
    totalCo2SavedKg: 35.0,
    totalWaterSavedLiters: 5200,
    reputationScore: 88
  };

  const userClosetItems: SwapItem[] = [
    {
      id: 'my-denim-01',
      title: 'Vintage Levi\'s Denim Jacket',
      brand: 'Levi Strauss',
      category: 'Outerwear',
      size: 'M',
      condition: 'Excellent',
      estimatedValue: 130,
      co2SavedKg: 14.0,
      waterSavedLiters: 2600,
      imageUrl: 'https://example.com/my-denim.jpg',
      ownerName: 'Elena Rostova',
      ownerAvatar: 'https://example.com/elena.jpg',
      ownerLocation: 'Berlin, DE',
      aestheticTag: 'Vintage',
      description: 'Classic vintage denim coat.'
    },
    {
      id: 'my-sneakers-02',
      title: 'Retro High Top Sneakers',
      brand: 'Converse',
      category: 'Shoes',
      size: '39',
      condition: 'Like New',
      estimatedValue: 85,
      co2SavedKg: 8.0,
      waterSavedLiters: 1400,
      imageUrl: 'https://example.com/my-sneakers.jpg',
      ownerName: 'Elena Rostova',
      ownerAvatar: 'https://example.com/elena.jpg',
      ownerLocation: 'Berlin, DE',
      aestheticTag: 'Casual',
      description: 'Barely worn black high tops.'
    }
  ];

  const peerDeckItems: SwapItem[] = [
    {
      id: 'peer-leather-88',
      title: '90s Biker Leather Jacket',
      brand: 'Schott NYC',
      category: 'Outerwear',
      size: 'M',
      condition: 'Like New',
      estimatedValue: 220,
      co2SavedKg: 18.5,
      waterSavedLiters: 3400,
      imageUrl: 'https://example.com/leather.jpg',
      ownerName: 'Marco Vance',
      ownerAvatar: 'https://example.com/marco.jpg',
      ownerLocation: 'Milan, IT',
      aestheticTag: 'Grunge',
      description: 'Authentic 90s biker leather jacket in pristine condition.'
    }
  ];

  const engine = new OmniSwapWorkflowEngine(initialUserStats, userClosetItems, peerDeckItems);

  // Step 1: Browse and select target item from SwapDeck
  const selectedTarget = engine.selectDeckItem('peer-leather-88');
  assert.strictEqual(selectedTarget.title, '90s Biker Leather Jacket');
  assert.strictEqual(selectedTarget.co2SavedKg, 18.5);

  // Step 2: Select item from personal closet to offer
  const offeredItem = engine.selectClosetItem('my-denim-01');
  assert.strictEqual(offeredItem.title, 'Vintage Levi\'s Denim Jacket');

  // Step 3: Compute instant eco impact of proposed swap in TradeStudio
  const projectedEco = engine.calculateProposedEcoSavings('my-denim-01', 'peer-leather-88');
  assert.strictEqual(projectedEco.co2SavedKg, 32.5); // 14.0 + 18.5
  assert.strictEqual(projectedEco.waterSavedLiters, 6000); // 2600 + 3400

  // Step 4: Submit trade proposal object
  const proposal = engine.submitTradeProposal('my-denim-01', 'peer-leather-88');
  assert.strictEqual(proposal.status, 'pending');
  assert.strictEqual(proposal.offeredItemId, 'my-denim-01');
  assert.strictEqual(proposal.requestedItemId, 'peer-leather-88');

  // Step 5: Peer reviews and accepts trade proposal
  const { proposal: acceptedProp, stats: updatedStats } = engine.acceptProposal(proposal.id);

  // Step 6: Verify end-to-end status & stats update
  assert.strictEqual(acceptedProp.status, 'accepted');
  assert.strictEqual(updatedStats.totalSwaps, 4); // 3 -> 4
  assert.strictEqual(updatedStats.totalCo2SavedKg, 67.5); // 35.0 + 32.5
  assert.strictEqual(updatedStats.totalWaterSavedLiters, 11200); // 5200 + 6000
  assert.strictEqual(updatedStats.reputationScore, 93); // 88 -> 93
});

test('Tier 4: Real-World Workflow Error Resilience', () => {
  const emptyEngine = new OmniSwapWorkflowEngine(
    { totalSwaps: 0, totalCo2SavedKg: 0, totalWaterSavedLiters: 0, reputationScore: 50 },
    [],
    [{ id: 'item-1', title: 'Coat', brand: 'B', category: 'Outerwear', size: 'M', condition: 'Good', estimatedValue: 100, co2SavedKg: 10, waterSavedLiters: 1000, imageUrl: '', ownerName: '', ownerAvatar: '', ownerLocation: '', aestheticTag: '', description: '' }]
  );

  assert.throws(() => {
    emptyEngine.submitTradeProposal('none', 'item-1');
  }, /Cannot submit trade proposal with an empty closet/);
});
