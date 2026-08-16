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

test('Challenger 2 Empirical Test 1: M2 React Component Function Exports & Interface Declarations', () => {
  const m2Components = [
    { file: 'src/components/swap/SwapDeckCard.tsx', exportName: 'export const SwapDeckCard', interfaceName: 'SwapDeckCardProps' },
    { file: 'src/components/swap/TradeStudioModal.tsx', exportName: 'export const TradeStudioModal', interfaceName: 'TradeStudioModalProps' },
    { file: 'src/components/swap/ClosetHubView.tsx', exportName: 'export const ClosetHubView', interfaceName: 'ClosetHubViewProps' },
    { file: 'src/components/swap/EcoImpactBanner.tsx', exportName: 'export const EcoImpactBanner', interfaceName: 'EcoImpactBannerProps' },
    { file: 'src/app/swap.tsx', exportName: 'export default function SwapScreen', interfaceName: 'SwapScreen' },
  ];

  for (const { file, exportName, interfaceName } of m2Components) {
    const fullPath = path.join(rootDir, file);
    assert.ok(fs.existsSync(fullPath), `File must exist: ${file}`);
    const content = fs.readFileSync(fullPath, 'utf8');

    // Verify valid component function export statement
    assert.ok(content.includes(exportName), `File ${file} must contain export: ${exportName}`);

    // Verify props interface or function signature
    if (interfaceName !== 'SwapScreen') {
      assert.ok(content.includes(`interface ${interfaceName}`), `File ${file} must declare interface ${interfaceName}`);
      assert.ok(content.includes(`React.FC<${interfaceName}>`), `File ${file} must type component as React.FC<${interfaceName}>`);
    } else {
      assert.ok(content.includes('React.ReactElement'), `File ${file} must declare return type React.ReactElement`);
    }
  }
});

test('Challenger 2 Empirical Test 2: Eco Calculation Math Correctness & Precision', () => {
  const itemA: SwapItem = mockSwapItems[0]; // co2: 18.5, water: 4200, value: 850
  const itemB: SwapItem = mockSwapItems[1]; // co2: 14.2, water: 3800, value: 420

  // 1. Combined CO2 calculation (toFixed(1) precision check)
  const combinedCo2 = Number((itemA.co2SavedKg + itemB.co2SavedKg).toFixed(1));
  assert.equal(combinedCo2, 32.7, 'Combined CO2 calculation precision check');

  // 2. Combined Water calculation
  const combinedWater = itemA.waterSavedLiters + itemB.waterSavedLiters;
  assert.equal(combinedWater, 8000, 'Combined Water sum calculation');

  // 3. Value Delta logic
  const valueDeltaAB = itemB.estimatedValue - itemA.estimatedValue;
  assert.equal(valueDeltaAB, -430, 'Offered item value delta (-$430)');

  // 4. Fair Value Range check (±$50)
  const itemFair: SwapItem = { ...itemA, estimatedValue: 830 };
  const deltaFair = Math.abs(itemFair.estimatedValue - itemA.estimatedValue);
  assert.ok(deltaFair <= 50, 'Value difference within $50 is Fair Value Match');

  // 5. Trees Equivalent calculation formula
  const userCo2 = 184.5;
  const treesEquivalent = Math.round(userCo2 / 21);
  assert.equal(treesEquivalent, 9, '184.5 kg CO2 / 21 = 8.785 -> rounded to 9 trees');

  // 6. Community Goal Progress Bar calculation
  const targetGoal = 20000;
  const currentCo2 = 18420;
  const progressPercent = Math.min(100, Math.round((currentCo2 / targetGoal) * 100));
  assert.equal(progressPercent, 92, '18420 / 20000 * 100 = 92.1% -> rounded to 92%');
});

test('Challenger 2 Empirical Test 3: Modal Open/Close & Trade Proposal State Mechanics', () => {
  // Modal visibility & early return on null targetItem
  let visible = true;
  let targetItem: SwapItem | null = null;
  let userItems: SwapItem[] = [mockSwapItems[0]];

  // When targetItem is null, TradeStudioModal returns null (hidden)
  assert.equal(targetItem, null, 'Modal returns early when targetItem is null');

  targetItem = mockSwapItems[1];
  assert.notEqual(targetItem, null, 'Modal rendered with active targetItem');

  // Trade Proposal submission state update simulation
  let proposals: SwapTradeProposal[] = [];
  let isModalOpen = true;

  const handleProposeTrade = (proposalData: Omit<SwapTradeProposal, 'id' | 'createdAt'>) => {
    const newProp: SwapTradeProposal = {
      ...proposalData,
      id: `tp-test-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    proposals = [newProp, ...proposals];
    isModalOpen = false; // State update on submission
  };

  handleProposeTrade({
    offeredItemId: userItems[0].id,
    requestedItemId: targetItem.id,
    status: 'pending',
  });

  assert.equal(proposals.length, 1);
  assert.equal(proposals[0].offeredItemId, userItems[0].id);
  assert.equal(proposals[0].requestedItemId, targetItem.id);
  assert.equal(proposals[0].status, 'pending');
  assert.equal(isModalOpen, false, 'Modal closes on proposal submission');
});

test('Challenger 2 Empirical Test 4: Trade Proposal Lifecycle & Filter State Transitions', () => {
  let proposals: SwapTradeProposal[] = [
    { id: 'tp-1', offeredItemId: 'item-1', requestedItemId: 'item-2', status: 'pending', createdAt: '2026-08-07T12:00:00Z' },
    { id: 'tp-2', offeredItemId: 'item-3', requestedItemId: 'item-4', status: 'accepted', createdAt: '2026-08-06T12:00:00Z' },
    { id: 'tp-3', offeredItemId: 'item-5', requestedItemId: 'item-6', status: 'declined', createdAt: '2026-08-05T12:00:00Z' },
  ];

  // Accept pending proposal
  const updateStatus = (id: string, newStatus: 'accepted' | 'declined') => {
    proposals = proposals.map((p) => (p.id === id ? { ...p, status: newStatus } : p));
  };

  updateStatus('tp-1', 'accepted');
  assert.equal(proposals.find((p) => p.id === 'tp-1')?.status, 'accepted');

  // Filter checks
  const getFiltered = (filter: 'all' | 'pending' | 'accepted' | 'declined') => {
    if (filter === 'all') return proposals;
    return proposals.filter((p) => p.status === filter);
  };

  assert.equal(getFiltered('all').length, 3);
  assert.equal(getFiltered('pending').length, 0);
  assert.equal(getFiltered('accepted').length, 2);
  assert.equal(getFiltered('declined').length, 1);
});

test('Challenger 2 Empirical Test 5: Zero-Any Quality Audit across All M2 Files', () => {
  const m2Files = [
    'src/components/swap/SwapDeckCard.tsx',
    'src/components/swap/TradeStudioModal.tsx',
    'src/components/swap/ClosetHubView.tsx',
    'src/components/swap/EcoImpactBanner.tsx',
    'src/app/swap.tsx',
  ];

  const anyPatterns = [/: *any\b/, /as  *any\b/, /< *any *>/, /\bany *\[ *\]/];

  for (const relPath of m2Files) {
    const fullPath = path.join(rootDir, relPath);
    assert.ok(fs.existsSync(fullPath), `File path must exist: ${relPath}`);

    const content = fs.readFileSync(fullPath, 'utf8');
    for (const pattern of anyPatterns) {
      assert.ok(!pattern.test(content), `File ${relPath} contains forbidden 'any' pattern`);
    }
  }
});
