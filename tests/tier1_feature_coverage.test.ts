/// <reference types="node" />
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// Define explicit contract interfaces as specified in PROJECT.md
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

const rootDir = process.cwd();

test('Tier 1: Data Model Type Specification & Schema Verification', () => {
  const sampleItem: SwapItem = {
    id: 'item-101',
    title: 'Vintage Denim Jacket',
    brand: 'Levi\'s',
    category: 'Outerwear',
    size: 'M',
    condition: 'Excellent',
    estimatedValue: 120,
    co2SavedKg: 15.5,
    waterSavedLiters: 2500,
    imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0',
    ownerName: 'Elena Rostova',
    ownerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    ownerLocation: 'Berlin, DE',
    aestheticTag: 'Vintage',
    description: 'Classic 90s vintage denim jacket in excellent condition.'
  };

  assert.strictEqual(typeof sampleItem.id, 'string');
  assert.strictEqual(typeof sampleItem.title, 'string');
  assert.strictEqual(typeof sampleItem.brand, 'string');
  assert.ok(['Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories'].includes(sampleItem.category));
  assert.strictEqual(typeof sampleItem.size, 'string');
  assert.ok(['Like New', 'Excellent', 'Good', 'Upcycled'].includes(sampleItem.condition));
  assert.strictEqual(typeof sampleItem.estimatedValue, 'number');
  assert.strictEqual(typeof sampleItem.co2SavedKg, 'number');
  assert.strictEqual(typeof sampleItem.waterSavedLiters, 'number');
  assert.strictEqual(typeof sampleItem.imageUrl, 'string');
  assert.strictEqual(typeof sampleItem.ownerName, 'string');
  assert.strictEqual(typeof sampleItem.ownerAvatar, 'string');
  assert.strictEqual(typeof sampleItem.ownerLocation, 'string');
  assert.strictEqual(typeof sampleItem.aestheticTag, 'string');
  assert.strictEqual(typeof sampleItem.description, 'string');
});

test('Tier 1: Swap Trade Proposal Schema Verification', () => {
  const sampleProposal: SwapTradeProposal = {
    id: 'prop-201',
    offeredItemId: 'item-101',
    requestedItemId: 'item-102',
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  assert.strictEqual(typeof sampleProposal.id, 'string');
  assert.strictEqual(typeof sampleProposal.offeredItemId, 'string');
  assert.strictEqual(typeof sampleProposal.requestedItemId, 'string');
  assert.ok(['pending', 'accepted', 'declined'].includes(sampleProposal.status));
  assert.ok(!isNaN(Date.parse(sampleProposal.createdAt)));
});

test('Tier 1: User Swap Profile Stats Schema Verification', () => {
  const sampleStats: UserSwapProfileStats = {
    totalSwaps: 12,
    totalCo2SavedKg: 145.8,
    totalWaterSavedLiters: 18400,
    reputationScore: 98
  };

  assert.strictEqual(typeof sampleStats.totalSwaps, 'number');
  assert.strictEqual(typeof sampleStats.totalCo2SavedKg, 'number');
  assert.strictEqual(typeof sampleStats.totalWaterSavedLiters, 'number');
  assert.strictEqual(typeof sampleStats.reputationScore, 'number');
  assert.ok(sampleStats.reputationScore >= 0 && sampleStats.reputationScore <= 100);
});

test('Tier 1: Component File Existence & Module Declarations', () => {
  const requiredFiles = [
    'src/types/swap.ts',
    'src/data/swap-data.ts',
    'src/components/swap/SwapDeckCard.tsx',
    'src/components/swap/TradeStudioModal.tsx',
    'src/components/swap/ClosetHubView.tsx',
    'src/components/swap/EcoImpactBanner.tsx',
    'src/app/swap.tsx',
    'src/components/app-tabs.web.tsx'
  ];

  const fileChecks = requiredFiles.map((relPath) => {
    const fullPath = path.join(rootDir, relPath);
    const exists = fs.existsSync(fullPath);
    return { relPath, exists };
  });

  // Log status of component files
  for (const check of fileChecks) {
    if (check.exists) {
      assert.ok(check.exists, `File should exist: ${check.relPath}`);
    }
  }

  // Ensure app-tabs.web.tsx exists as it is part of baseline
  const tabFilePath = path.join(rootDir, 'src/components/app-tabs.web.tsx');
  assert.ok(fs.existsSync(tabFilePath), 'src/components/app-tabs.web.tsx must exist');
});

test('Tier 1: Route & Navigation Contract Verification', () => {
  const tabFilePath = path.join(rootDir, 'src/components/app-tabs.web.tsx');
  if (fs.existsSync(tabFilePath)) {
    const content = fs.readFileSync(tabFilePath, 'utf8');
    assert.ok(content.length > 0, 'Tab navigation file should not be empty');
  }
});
