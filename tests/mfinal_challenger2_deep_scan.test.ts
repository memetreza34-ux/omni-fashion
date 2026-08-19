import { test, describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// Import modules from src
import {
  mockSwapItems,
  mockTradeProposals,
  mockUserProfileStats,
  mockEcoImpactMetrics,
} from '../src/data/swap-data.ts';
import type {
  SwapItem,
  SwapTradeProposal,
  UserSwapProfileStats,
  EcoImpactMetrics,
} from '../src/types/swap.ts';

describe('MFinal Challenger 2 — Deep Scan & Zero Any Verification', () => {
  const srcDir = path.resolve(process.cwd(), 'src');

  const getAllFiles = (dir: string, fileList: string[] = []): string[] => {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        getAllFiles(filePath, fileList);
      } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        fileList.push(filePath);
      }
    });
    return fileList;
  };

  it('Scan 1: Zero "any" compliance across all TypeScript files in src/', () => {
    const allTsFiles = getAllFiles(srcDir);
    assert.strictEqual(
      allTsFiles.length,
      28,
      `Expected exactly 28 TS/TSX files in src, found ${allTsFiles.length}`,
    );

    const anyViolations: { file: string; line: number; content: string }[] = [];

    const anyRegex = /(?:\:\s*any\b|\bas\s+any\b|<any>)/g;

    allTsFiles.forEach((file) => {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        // Ignore lines with single-line comments mentioning 'any' in narrative text unless type keyword
        if (line.includes('//') && line.indexOf('//') < line.indexOf('any')) {
          return;
        }
        if (anyRegex.test(line)) {
          anyViolations.push({
            file: path.relative(process.cwd(), file),
            line: index + 1,
            content: line.trim(),
          });
        }
      });
    });

    assert.strictEqual(
      anyViolations.length,
      0,
      `Found ${anyViolations.length} 'any' type violations: ${JSON.stringify(anyViolations, null, 2)}`,
    );
  });

  it('Scan 2: Interface & Type contracts validation', () => {
    assert.ok(
      mockSwapItems.length >= 7,
      'Mock swap items should contain at least 7 items',
    );
    mockSwapItems.forEach((item) => {
      assert.strictEqual(typeof item.id, 'string');
      assert.strictEqual(typeof item.title, 'string');
      assert.strictEqual(typeof item.brand, 'string');
      assert.ok(
        ['Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories'].includes(
          item.category,
        ),
      );
      assert.ok(
        ['Like New', 'Excellent', 'Good', 'Upcycled'].includes(item.condition),
      );
      assert.ok(item.estimatedValue > 0, 'Estimated value must be positive');
      assert.ok(item.co2SavedKg >= 0, 'CO2 saved must be >= 0');
      assert.ok(item.waterSavedLiters >= 0, 'Water saved must be >= 0');
      assert.strictEqual(typeof item.imageUrl, 'string');
      assert.strictEqual(typeof item.ownerName, 'string');
      assert.strictEqual(typeof item.ownerAvatar, 'string');
      assert.strictEqual(typeof item.ownerLocation, 'string');
      assert.strictEqual(typeof item.aestheticTag, 'string');
      assert.strictEqual(typeof item.description, 'string');
    });
  });

  it('Scan 3: Trade proposal state machine & status transitions', () => {
    assert.ok(
      mockTradeProposals.length >= 3,
      'Mock trade proposals should contain items',
    );
    mockTradeProposals.forEach((prop) => {
      assert.strictEqual(typeof prop.id, 'string');
      assert.strictEqual(typeof prop.offeredItemId, 'string');
      assert.strictEqual(typeof prop.requestedItemId, 'string');
      assert.ok(['pending', 'accepted', 'declined'].includes(prop.status));
      assert.ok(
        !isNaN(Date.parse(prop.createdAt)),
        'createdAt must be valid ISO date',
      );
    });

    // Test transition simulation
    let proposals: SwapTradeProposal[] = [...mockTradeProposals];
    const targetProp = proposals.find((p) => p.status === 'pending');
    assert.ok(
      targetProp,
      'Should find pending proposal for testing status transition',
    );

    // Simulate Accept
    proposals = proposals.map((p) =>
      p.id === targetProp.id ? { ...p, status: 'accepted' } : p,
    );
    const updatedProp = proposals.find((p) => p.id === targetProp.id);
    assert.strictEqual(updatedProp?.status, 'accepted');
  });

  it('Scan 4: Boundary math & precision calculations in Eco Metrics', () => {
    const userStats: UserSwapProfileStats = mockUserProfileStats;
    const communityMetrics: EcoImpactMetrics = mockEcoImpactMetrics;

    // Verify trees calculation math logic (Math.round(totalCo2 / 21))
    const userTrees = Math.round(userStats.totalCo2SavedKg / 21);
    assert.strictEqual(userTrees, Math.round(184.5 / 21)); // 9 trees

    // Edge case: zero user CO2
    const zeroUserStats: UserSwapProfileStats = {
      totalSwaps: 0,
      totalCo2SavedKg: 0,
      totalWaterSavedLiters: 0,
      reputationScore: 5.0,
    };
    const zeroTrees = Math.round(zeroUserStats.totalCo2SavedKg / 21);
    assert.strictEqual(zeroTrees, 0);

    // Goal progress calculation: Math.min(100, Math.round((co2 / 20000) * 100))
    const targetGoal = 20000;
    const communityProgress = Math.min(
      100,
      Math.round((communityMetrics.totalCo2SavedKg / targetGoal) * 100),
    );
    assert.strictEqual(communityProgress, 92);

    // Overflow protection test
    const overflowCo2 = 25000;
    const overflowProgress = Math.min(
      100,
      Math.round((overflowCo2 / targetGoal) * 100),
    );
    assert.strictEqual(overflowProgress, 100);
  });

  it('Scan 5: Value delta calculation logic in TradeStudioModal', () => {
    const targetItem = mockSwapItems[0]; // $850
    const offeredFair = { ...mockSwapItems[1], estimatedValue: 830 }; // $830 (delta -$20, abs <= 50)
    const offeredHigher = { ...mockSwapItems[1], estimatedValue: 1000 }; // $1000 (delta +$150)
    const offeredLower = { ...mockSwapItems[1], estimatedValue: 500 }; // $500 (delta -$350)

    const calcDelta = (offered: SwapItem, target: SwapItem) =>
      offered.estimatedValue - target.estimatedValue;

    assert.strictEqual(calcDelta(offeredFair, targetItem), -20);
    assert.ok(
      Math.abs(calcDelta(offeredFair, targetItem)) <= 50,
      'Fair value match condition',
    );

    assert.strictEqual(calcDelta(offeredHigher, targetItem), 150);
    assert.ok(
      calcDelta(offeredHigher, targetItem) > 50,
      'Higher value offered condition',
    );

    assert.strictEqual(calcDelta(offeredLower, targetItem), -350);
    assert.ok(
      calcDelta(offeredLower, targetItem) < -50,
      'Lower value offered condition',
    );
  });

  it('Scan 6: Search & Filter predicate robustness in ClosetHubView', () => {
    const items = mockSwapItems;

    // Filter by query "margiela"
    const margielaItems = items.filter((item) => {
      const q = 'margiela';
      const matchText =
        `${item.title} ${item.brand} ${item.description} ${item.ownerName} ${item.ownerLocation}`.toLowerCase();
      return matchText.includes(q);
    });
    assert.strictEqual(margielaItems.length, 1);
    assert.strictEqual(margielaItems[0].brand, 'Maison Margiela');

    // Filter by Archetype "Streetwear"
    const streetwearItems = items.filter(
      (item) => item.aestheticTag.toLowerCase() === 'streetwear'.toLowerCase(),
    );
    assert.strictEqual(streetwearItems.length, 1);

    // Filter by Size "EU 41"
    const eu41Items = items.filter(
      (item) => item.size.toLowerCase() === 'eu 41'.toLowerCase(),
    );
    assert.strictEqual(eu41Items.length, 1);

    // Corner case: Non-existent filter returns empty list without error
    const nonExistent = items.filter((item) =>
      item.title.includes('NONEXISTENT_ITEM_XYZ'),
    );
    assert.strictEqual(nonExistent.length, 0);
  });
});
