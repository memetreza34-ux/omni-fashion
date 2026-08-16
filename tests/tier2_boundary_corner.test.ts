/// <reference types="node" />
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import type { SwapItem, SwapTradeProposal, UserSwapProfileStats, EcoImpactMetrics } from './tier1_feature_coverage.test.ts';

// Helper function to compute total eco savings safely
export function calculateEcoImpact(items: SwapItem[]): EcoImpactMetrics {
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

// Helper function to validate condition rating
export function isValidCondition(condition: string): boolean {
  const validConditions = ['Like New', 'Excellent', 'Good', 'Upcycled'];
  return validConditions.includes(condition);
}

// Helper function to create trade proposal safely
export function createTradeProposal(offeredItemId: string, requestedItemId: string): SwapTradeProposal {
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

test('Tier 2: Boundary Value — Zero Eco Savings Items', () => {
  const zeroEcoItem: SwapItem = {
    id: 'item-zero',
    title: 'Digital Accessory Pass',
    brand: 'OmniBrand',
    category: 'Accessories',
    size: 'One Size',
    condition: 'Like New',
    estimatedValue: 10,
    co2SavedKg: 0,
    waterSavedLiters: 0,
    imageUrl: 'https://example.com/zero.png',
    ownerName: 'Alex Doe',
    ownerAvatar: 'https://example.com/avatar.png',
    ownerLocation: 'Munich, DE',
    aestheticTag: 'Minimalist',
    description: 'Digital gift item with zero physical manufacturing cost.'
  };

  const impact = calculateEcoImpact([zeroEcoItem]);
  assert.strictEqual(impact.co2SavedKg, 0);
  assert.strictEqual(impact.waterSavedLiters, 0);
  assert.strictEqual(typeof impact.co2SavedKg, 'number');
  assert.ok(!isNaN(impact.co2SavedKg));
  assert.ok(!isNaN(impact.waterSavedLiters));
});

test('Tier 2: Boundary Value — Extreme Value & Eco Metric Boundaries', () => {
  const extremeItem: SwapItem = {
    id: 'item-extreme',
    title: 'Haute Couture Upcycled Coat',
    brand: 'Designer Lab',
    category: 'Outerwear',
    size: 'L',
    condition: 'Upcycled',
    estimatedValue: 1000000,
    co2SavedKg: 9999.99,
    waterSavedLiters: 500000,
    imageUrl: 'https://example.com/extreme.png',
    ownerName: 'Couture Collector',
    ownerAvatar: 'https://example.com/avatar.png',
    ownerLocation: 'Paris, FR',
    aestheticTag: 'Avant-Garde',
    description: 'High-end designer piece.'
  };

  const zeroValItem: SwapItem = {
    id: 'item-free',
    title: 'Free Swap T-Shirt',
    brand: 'Community',
    category: 'Tops',
    size: 'S',
    condition: 'Good',
    estimatedValue: 0,
    co2SavedKg: 2.1,
    waterSavedLiters: 400,
    imageUrl: 'https://example.com/free.png',
    ownerName: 'Community User',
    ownerAvatar: 'https://example.com/avatar.png',
    ownerLocation: 'Berlin, DE',
    aestheticTag: 'Casual',
    description: 'Free community swap item.'
  };

  const combinedImpact = calculateEcoImpact([extremeItem, zeroValItem]);
  assert.strictEqual(combinedImpact.co2SavedKg, 10002.09);
  assert.strictEqual(combinedImpact.waterSavedLiters, 500400);
});

test('Tier 2: Corner Case — Empty Arrays & Nullish Items List', () => {
  const emptyImpact = calculateEcoImpact([]);
  assert.strictEqual(emptyImpact.co2SavedKg, 0);
  assert.strictEqual(emptyImpact.waterSavedLiters, 0);

  // Filter edge cases
  const items: SwapItem[] = [
    {
      id: 'item-1',
      title: 'Silk Blouse',
      brand: 'Silk Co',
      category: 'Tops',
      size: 'S',
      condition: 'Like New',
      estimatedValue: 50,
      co2SavedKg: 4.5,
      waterSavedLiters: 1200,
      imageUrl: 'https://example.com/1.png',
      ownerName: 'Sarah',
      ownerAvatar: 'https://example.com/s.png',
      ownerLocation: 'Hamburg, DE',
      aestheticTag: 'Boho',
      description: 'Elegant silk blouse.'
    }
  ];

  const matchedCategory = items.filter(i => i.category === 'Tops');
  assert.strictEqual(matchedCategory.length, 1);

  const unmatchedCategory = items.filter(i => i.category === ('Formalwear' as any));
  assert.strictEqual(unmatchedCategory.length, 0);

  const unmatchedAesthetic = items.filter(i => i.aestheticTag === 'Cyberpunk');
  assert.strictEqual(unmatchedAesthetic.length, 0);
});

test('Tier 2: Edge Case — Condition Ratings & String Verification', () => {
  assert.ok(isValidCondition('Like New'));
  assert.ok(isValidCondition('Excellent'));
  assert.ok(isValidCondition('Good'));
  assert.ok(isValidCondition('Upcycled'));
  assert.strictEqual(isValidCondition('Destroyed'), false);
  assert.strictEqual(isValidCondition(''), false);
});

test('Tier 2: Corner Case — Invalid & Self Trade Proposals', () => {
  assert.throws(() => {
    createTradeProposal('item-1', 'item-1');
  }, /Cannot propose a trade with the same item/);

  assert.throws(() => {
    createTradeProposal('', 'item-2');
  }, /Item IDs cannot be empty/);

  assert.throws(() => {
    createTradeProposal('item-1', '   ');
  }, /Item IDs cannot be empty/);

  const validProposal = createTradeProposal('item-1', 'item-2');
  assert.strictEqual(validProposal.status, 'pending');
  assert.notStrictEqual(validProposal.offeredItemId, validProposal.requestedItemId);
});
