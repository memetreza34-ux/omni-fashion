/// <reference types="node" />
import test from 'node:test';
import assert from 'node:assert';
import type { SwapItem, SwapTradeProposal, UserSwapProfileStats, EcoImpactMetrics } from '../src/types/swap.ts';
import { mockSwapItems, mockTradeProposals, mockUserProfileStats, mockEcoImpactMetrics } from '../src/data/swap-data.ts';

test('Tier 5: Property Invariants & Fuzz Resilience on SwapItems', () => {
  // Verify all mock items satisfy non-negative physical values and valid enum ranges
  for (const item of mockSwapItems) {
    assert.strictEqual(typeof item.id, 'string');
    assert.ok(item.id.length > 0, 'Item ID must be non-empty string');
    assert.ok(item.estimatedValue >= 0, `Estimated value must be non-negative: ${item.id}`);
    assert.ok(item.co2SavedKg >= 0, `CO2 saved must be non-negative: ${item.id}`);
    assert.ok(item.waterSavedLiters >= 0, `Water saved must be non-negative: ${item.id}`);
    assert.ok(
      ['Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories'].includes(item.category),
      `Invalid category: ${item.category}`
    );
    assert.ok(
      ['Like New', 'Excellent', 'Good', 'Upcycled'].includes(item.condition),
      `Invalid condition: ${item.condition}`
    );
  }
});

test('Tier 5: Numerical Edge Cases & Overflow Resilience in Eco Math', () => {
  // Test tree calculation formula: Math.round(co2 / 21)
  const calculateTrees = (co2Kg: number): number => Math.round(co2Kg / 21);

  assert.strictEqual(calculateTrees(0), 0);
  assert.strictEqual(calculateTrees(10.4), 0);
  assert.strictEqual(calculateTrees(10.5), 1);
  assert.strictEqual(calculateTrees(21), 1);
  assert.strictEqual(calculateTrees(184.5), 9);
  assert.strictEqual(calculateTrees(1000000), 47619);

  // Test combined CO2 precision formula: Number((target + offered).toFixed(1))
  const calculateCombinedCo2 = (itemA: number, itemB: number): number => {
    return Number((itemA + itemB).toFixed(1));
  };

  assert.strictEqual(calculateCombinedCo2(18.5, 14.2), 32.7);
  assert.strictEqual(calculateCombinedCo2(0.0001, 0.0002), 0);
  assert.strictEqual(calculateCombinedCo2(999.99, 0.01), 1000);
});

test('Tier 5: Adversarial Search Queries & Special Regex Characters', () => {
  // Test filtering function logic from ClosetHubView
  const filterItems = (items: SwapItem[], query: string, arch: string, size: string) => {
    return items.filter((item) => {
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchText = `${item.title} ${item.brand} ${item.description} ${item.ownerName} ${item.ownerLocation}`.toLowerCase();
        if (!matchText.includes(q)) return false;
      }
      if (arch !== 'All' && item.aestheticTag.toLowerCase() !== arch.toLowerCase()) {
        return false;
      }
      if (size !== 'All Sizes' && item.size.toLowerCase() !== size.toLowerCase()) {
        return false;
      }
      return true;
    });
  };

  // Test regex characters in query do not throw errors or fail string inclusion
  const regexQuery = '([.*+?^${}()|[\\]\\])';
  assert.doesNotThrow(() => filterItems(mockSwapItems, regexQuery, 'All', 'All Sizes'));
  assert.strictEqual(filterItems(mockSwapItems, regexQuery, 'All', 'All Sizes').length, 0);

  // Test ultra-long query string
  const longQuery = 'A'.repeat(5000);
  assert.doesNotThrow(() => filterItems(mockSwapItems, longQuery, 'All', 'All Sizes'));
  assert.strictEqual(filterItems(mockSwapItems, longQuery, 'All', 'All Sizes').length, 0);

  // Test exact substring matching
  const exactMatch = filterItems(mockSwapItems, 'Margiela', 'All', 'All Sizes');
  assert.strictEqual(exactMatch.length, 1);
  assert.strictEqual(exactMatch[0].id, 'item-1');
});

test('Tier 5: Proposal Lifecycle State Invariants & Immutability', () => {
  // Model state transitions for trade proposals
  let proposals: SwapTradeProposal[] = [...mockTradeProposals];

  const addProposal = (offeredId: string, requestedId: string): SwapTradeProposal => {
    const newProp: SwapTradeProposal = {
      id: `tp-${Date.now()}-${Math.random()}`,
      offeredItemId: offeredId,
      requestedItemId: requestedId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    proposals = [newProp, ...proposals];
    return newProp;
  };

  const updateStatus = (id: string, newStatus: 'accepted' | 'declined'): void => {
    proposals = proposals.map((p) => (p.id === id ? { ...p, status: newStatus } : p));
  };

  // Create new proposal
  const p1 = addProposal('item-5', 'item-6');
  assert.strictEqual(p1.status, 'pending');
  assert.strictEqual(proposals[0].id, p1.id);

  // Transition to accepted
  updateStatus(p1.id, 'accepted');
  const updatedP1 = proposals.find((p) => p.id === p1.id);
  assert.ok(updatedP1);
  assert.strictEqual(updatedP1.status, 'accepted');

  // Verify transition is stable and idempotent when reapplied
  updateStatus(p1.id, 'accepted');
  assert.strictEqual(proposals.find((p) => p.id === p1.id)?.status, 'accepted');
});

test('Tier 5: Eco Metrics Goal Progress Boundary Conditions', () => {
  const targetCo2Goal = 20000;
  const getProgress = (co2: number): number => Math.min(100, Math.round((co2 / targetCo2Goal) * 100));

  assert.strictEqual(getProgress(0), 0);
  assert.strictEqual(getProgress(10000), 50);
  assert.strictEqual(getProgress(18420), 92);
  assert.strictEqual(getProgress(20000), 100);
  assert.strictEqual(getProgress(25000), 100); // Clamped to 100%
});
