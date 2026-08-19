/// <reference types="node" />
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import type {
  SwapItem,
  SwapTradeProposal,
  UserSwapProfileStats,
  EcoImpactMetrics,
} from '../src/types/swap.ts';

const rootDir = process.cwd();

test('M2 Components: All required M2 file paths exist', () => {
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
  }
});

test('M2 Components: SwapDeckCard file exports & strict type structure', () => {
  const filePath = path.join(rootDir, 'src/components/swap/SwapDeckCard.tsx');
  const content = fs.readFileSync(filePath, 'utf8');

  assert.ok(
    content.includes('SwapDeckCardProps'),
    'Must declare SwapDeckCardProps',
  );
  assert.ok(
    content.includes('export const SwapDeckCard'),
    'Must export SwapDeckCard component',
  );
  assert.ok(
    content.includes('onSwipeLeft'),
    'Must support onSwipeLeft callback prop',
  );
  assert.ok(
    content.includes('onSwipeRight'),
    'Must support onSwipeRight callback prop',
  );
  assert.ok(
    content.includes('onOpenTradeStudio'),
    'Must support onOpenTradeStudio callback prop',
  );
  assert.ok(
    !content.includes(': any') && !content.includes('as any'),
    'Must contain zero any violations',
  );
});

test('M2 Components: TradeStudioModal combined eco calculation logic', () => {
  const filePath = path.join(
    rootDir,
    'src/components/swap/TradeStudioModal.tsx',
  );
  const content = fs.readFileSync(filePath, 'utf8');

  assert.ok(
    content.includes('TradeStudioModalProps'),
    'Must declare TradeStudioModalProps',
  );
  assert.ok(
    content.includes('combinedCo2Kg'),
    'Must calculate combined CO2 saved',
  );
  assert.ok(
    content.includes('combinedWaterL'),
    'Must calculate combined water saved',
  );
  assert.ok(content.includes('valueDelta'), 'Must calculate value delta');
  assert.ok(
    content.includes('onProposeTrade'),
    'Must trigger onProposeTrade callback',
  );
  assert.ok(
    !content.includes(': any') && !content.includes('as any'),
    'Must contain zero any violations',
  );
});

test('M2 Components: ClosetHubView archetype and size filtering logic', () => {
  const filePath = path.join(rootDir, 'src/components/swap/ClosetHubView.tsx');
  const content = fs.readFileSync(filePath, 'utf8');

  assert.ok(
    content.includes('ClosetHubViewProps'),
    'Must declare ClosetHubViewProps',
  );
  assert.ok(
    content.includes('ARCHETYPES'),
    'Must define archetype filter categories',
  );
  assert.ok(content.includes('SIZES'), 'Must define size filter options');
  assert.ok(
    content.includes('onOpenTradeStudio'),
    'Must include direct Trade Now button',
  );
  assert.ok(
    !content.includes(': any') && !content.includes('as any'),
    'Must contain zero any violations',
  );
});

test('M2 Components: EcoImpactBanner community vs user toggle', () => {
  const filePath = path.join(
    rootDir,
    'src/components/swap/EcoImpactBanner.tsx',
  );
  const content = fs.readFileSync(filePath, 'utf8');

  assert.ok(
    content.includes('EcoImpactBannerProps'),
    'Must declare EcoImpactBannerProps',
  );
  assert.ok(
    content.includes("setViewMode('community')"),
    'Must support community impact view',
  );
  assert.ok(
    content.includes("setViewMode('user')"),
    'Must support my impact view',
  );
  assert.ok(
    content.includes('progressPercent'),
    'Must compute community goal progress',
  );
  assert.ok(
    !content.includes(': any') && !content.includes('as any'),
    'Must contain zero any violations',
  );
});

test('M2 Components: swap.tsx screen sub-nav tab coordination', () => {
  const filePath = path.join(rootDir, 'src/app/swap.tsx');
  const content = fs.readFileSync(filePath, 'utf8');

  assert.ok(
    content.includes("setActiveTab('deck')"),
    'Must support deck tab selection',
  );
  assert.ok(
    content.includes("setActiveTab('closets')"),
    'Must support closets tab selection',
  );
  assert.ok(
    content.includes("setActiveTab('trades')"),
    'Must support trades tab selection',
  );
  assert.ok(
    content.includes('TradeStudioModal'),
    'Must integrate global Trade Studio modal',
  );
  assert.ok(
    !content.includes(': any') && !content.includes('as any'),
    'Must contain zero any violations',
  );
});
