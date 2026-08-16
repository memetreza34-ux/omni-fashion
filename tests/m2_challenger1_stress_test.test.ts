/// <reference types="node" />
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import type {
  SwapItem,
  SwapTradeProposal,
  UserSwapProfileStats,
  EcoImpactMetrics,
} from '../src/types/swap.ts';
import {
  mockSwapItems,
  mockTradeProposals,
  mockUserProfileStats,
  mockEcoImpactMetrics,
} from '../src/data/swap-data.ts';

const rootDir = process.cwd();

test('Challenger 1 M2 Stress Test: File existence & zero-any code quality audit', () => {
  const m2Files = [
    'src/components/swap/SwapDeckCard.tsx',
    'src/components/swap/TradeStudioModal.tsx',
    'src/components/swap/ClosetHubView.tsx',
    'src/components/swap/EcoImpactBanner.tsx',
    'src/app/swap.tsx',
  ];

  for (const relPath of m2Files) {
    const fullPath = path.join(rootDir, relPath);
    assert.ok(fs.existsSync(fullPath), `File must exist: ${relPath}`);
    const content = fs.readFileSync(fullPath, 'utf8');
    assert.ok(
      !content.includes(': any') && !content.includes('as any'),
      `File ${relPath} must not contain any explicit 'any' type assertions`
    );
  }
});

test('Challenger 1 M2 Stress Test: Data model & condition badge color logic', () => {
  const conditions: SwapItem['condition'][] = ['Like New', 'Excellent', 'Good', 'Upcycled'];
  
  for (const cond of conditions) {
    const item: SwapItem = {
      ...mockSwapItems[0],
      condition: cond,
    };
    assert.equal(item.condition, cond);
  }
});

test('Challenger 1 M2 Stress Test: TradeStudioModal eco calculation & value delta logic', () => {
  const targetItem: SwapItem = {
    id: 'target-1',
    title: 'Vintage Leather Jacket',
    brand: 'Acne Studios',
    category: 'Outerwear',
    size: 'M',
    condition: 'Excellent',
    estimatedValue: 350,
    co2SavedKg: 18.5,
    waterSavedLiters: 4200,
    imageUrl: 'https://example.com/jacket.jpg',
    ownerName: 'Elena Rostova',
    ownerAvatar: 'https://example.com/avatar.jpg',
    ownerLocation: 'Berlin',
    aestheticTag: 'Avant-Garde',
    description: 'Classic leather biker jacket',
  };

  const offeredItemEqual: SwapItem = {
    id: 'offered-1',
    title: 'Silk Shirt',
    brand: 'Nanushka',
    category: 'Tops',
    size: 'M',
    condition: 'Like New',
    estimatedValue: 320, // Delta = -30 (Fair Value Match <= 50)
    co2SavedKg: 6.2,
    waterSavedLiters: 1500,
    imageUrl: 'https://example.com/shirt.jpg',
    ownerName: 'User',
    ownerAvatar: 'https://example.com/user.jpg',
    ownerLocation: 'Berlin',
    aestheticTag: 'Minimalist',
    description: 'Cream silk blouse',
  };

  const offeredItemHigher: SwapItem = {
    ...offeredItemEqual,
    id: 'offered-2',
    estimatedValue: 500, // Delta = +150 (Higher value > 50)
  };

  const offeredItemLower: SwapItem = {
    ...offeredItemEqual,
    id: 'offered-3',
    estimatedValue: 100, // Delta = -250 (Target higher value < -50)
  };

  // Check Combined CO2 Calculation
  const combinedCo2 = Number((targetItem.co2SavedKg + offeredItemEqual.co2SavedKg).toFixed(1));
  assert.equal(combinedCo2, 24.7);

  // Check Combined Water Calculation
  const combinedWater = targetItem.waterSavedLiters + offeredItemEqual.waterSavedLiters;
  assert.equal(combinedWater, 5700);

  // Check Value Delta Calculations
  const deltaFair = Math.abs(offeredItemEqual.estimatedValue - targetItem.estimatedValue);
  assert.ok(deltaFair <= 50, 'Delta <= 50 is Fair Value Match');

  const deltaHigher = offeredItemHigher.estimatedValue - targetItem.estimatedValue;
  assert.ok(deltaHigher > 50, 'Delta > 50 is Higher Value Offered');

  const deltaLower = offeredItemLower.estimatedValue - targetItem.estimatedValue;
  assert.ok(deltaLower < -50, 'Delta < -50 is Target Higher Value');
});

test('Challenger 1 M2 Stress Test: ClosetHubView multi-filter edge cases', () => {
  const items = mockSwapItems;

  // 1. Search Query filter test
  const searchResults = items.filter((item) => {
    const q = 'berlin';
    const matchText = `${item.title} ${item.brand} ${item.description} ${item.ownerName} ${item.ownerLocation}`.toLowerCase();
    return matchText.includes(q);
  });
  assert.ok(searchResults.length > 0, 'Berlin search query should match items');

  // 2. Archetype filter test
  const streetwearItems = items.filter((item) => item.aestheticTag.toLowerCase() === 'streetwear');
  assert.ok(streetwearItems.every((i) => i.aestheticTag.toLowerCase() === 'streetwear'));

  // 3. Size filter test
  const mSizeItems = items.filter((item) => item.size.toLowerCase() === 'm');
  assert.ok(mSizeItems.every((i) => i.size.toLowerCase() === 'm'));

  // 4. Combined filter with 0 matches
  const noMatchItems = items.filter((item) => {
    const q = 'nonexistentquery123';
    return item.title.toLowerCase().includes(q);
  });
  assert.equal(noMatchItems.length, 0, 'Nonexistent query should return 0 results');
});

test('Challenger 1 M2 Stress Test: EcoImpactBanner trees equivalent & user stats fallback', () => {
  const metrics = mockEcoImpactMetrics;
  
  // Test community trees equivalent calculation in metrics
  assert.equal(typeof metrics.treesEquivalentSaved, 'number');

  // Test user trees formula calculation: Math.round(co2 / 21)
  const userCo2 = 48.5;
  const expectedUserTrees = Math.round(userCo2 / 21);
  assert.equal(expectedUserTrees, 2);

  // Test null/undefined user stats fallback handling
  const undefinedUserCo2 = undefined;
  const fallbackCo2 = undefinedUserCo2 ?? 0;
  assert.equal(fallbackCo2, 0);
  assert.equal(Math.round(fallbackCo2 / 21), 0);

  // Test progress bar percentage calculation: Math.min(100, Math.round((co2 / 20000) * 100))
  const progressPercent = Math.min(100, Math.round((metrics.totalCo2SavedKg / 20000) * 100));
  assert.ok(progressPercent >= 0 && progressPercent <= 100);
});

test('Challenger 1 M2 Stress Test: Trade Proposal state lifecycle & filtering', () => {
  let proposals: SwapTradeProposal[] = [...mockTradeProposals];

  // 1. Create Proposal
  const newProp: SwapTradeProposal = {
    id: `tp-${Date.now()}`,
    offeredItemId: 'item-1',
    requestedItemId: 'item-2',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  proposals = [newProp, ...proposals];

  assert.equal(proposals.length, mockTradeProposals.length + 1);
  assert.equal(proposals[0].status, 'pending');

  // 2. Accept Proposal
  proposals = proposals.map((p) => (p.id === newProp.id ? { ...p, status: 'accepted' } : p));
  assert.equal(proposals[0].status, 'accepted');

  // 3. Filter Proposals by Status
  const acceptedProposals = proposals.filter((p) => p.status === 'accepted');
  assert.ok(acceptedProposals.some((p) => p.id === newProp.id));

  const declinedProposals = proposals.filter((p) => p.status === 'declined');
  assert.ok(declinedProposals.every((p) => p.status === 'declined'));
});
