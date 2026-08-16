/// <reference types="node" />
import test from 'node:test';
import assert from 'node:assert';
import { mockSwapItems, mockTradeProposals, mockUserProfileStats, mockEcoImpactMetrics } from '../src/data/swap-data.ts';
import type { SwapItem, SwapTradeProposal, UserSwapProfileStats, EcoImpactMetrics } from '../src/types/swap.ts';

test('Challenger 2 Empirical Stress Test: mockSwapItems Data Integrity', () => {
  assert.ok(Array.isArray(mockSwapItems), 'mockSwapItems must be an array');
  assert.ok(mockSwapItems.length >= 5, `mockSwapItems count should be at least 5 (found ${mockSwapItems.length})`);

  const allowedCategories = new Set(['Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories']);
  const allowedConditions = new Set(['Like New', 'Excellent', 'Good', 'Upcycled']);
  const seenIds = new Set<string>();

  for (let i = 0; i < mockSwapItems.length; i++) {
    const item: SwapItem = mockSwapItems[i];

    // Check id
    assert.strictEqual(typeof item.id, 'string', `Item ${i}: id must be string`);
    assert.ok(item.id.trim().length > 0, `Item ${i}: id must not be empty`);
    assert.ok(!seenIds.has(item.id), `Item ${i}: duplicate id '${item.id}' found`);
    seenIds.add(item.id);

    // Check string fields
    assert.strictEqual(typeof item.title, 'string', `Item ${item.id}: title must be string`);
    assert.ok(item.title.trim().length > 0, `Item ${item.id}: title must not be empty`);

    assert.strictEqual(typeof item.brand, 'string', `Item ${item.id}: brand must be string`);
    assert.ok(item.brand.trim().length > 0, `Item ${item.id}: brand must not be empty`);

    assert.strictEqual(typeof item.size, 'string', `Item ${item.id}: size must be string`);
    assert.ok(item.size.trim().length > 0, `Item ${item.id}: size must not be empty`);

    assert.strictEqual(typeof item.imageUrl, 'string', `Item ${item.id}: imageUrl must be string`);
    assert.ok(item.imageUrl.startsWith('http://') || item.imageUrl.startsWith('https://'), `Item ${item.id}: imageUrl must be HTTP(S) URL`);

    assert.strictEqual(typeof item.ownerName, 'string', `Item ${item.id}: ownerName must be string`);
    assert.ok(item.ownerName.trim().length > 0, `Item ${item.id}: ownerName must not be empty`);

    assert.strictEqual(typeof item.ownerAvatar, 'string', `Item ${item.id}: ownerAvatar must be string`);
    assert.ok(item.ownerAvatar.startsWith('http://') || item.ownerAvatar.startsWith('https://'), `Item ${item.id}: ownerAvatar must be HTTP(S) URL`);

    assert.strictEqual(typeof item.ownerLocation, 'string', `Item ${item.id}: ownerLocation must be string`);
    assert.ok(item.ownerLocation.trim().length > 0, `Item ${item.id}: ownerLocation must not be empty`);

    assert.strictEqual(typeof item.aestheticTag, 'string', `Item ${item.id}: aestheticTag must be string`);
    assert.ok(item.aestheticTag.trim().length > 0, `Item ${item.id}: aestheticTag must not be empty`);

    assert.strictEqual(typeof item.description, 'string', `Item ${item.id}: description must be string`);
    assert.ok(item.description.trim().length > 0, `Item ${item.id}: description must not be empty`);

    // Check union enum fields
    assert.ok(allowedCategories.has(item.category), `Item ${item.id}: category '${item.category}' invalid`);
    assert.ok(allowedConditions.has(item.condition), `Item ${item.id}: condition '${item.condition}' invalid`);

    // Check positive numeric fields
    assert.strictEqual(typeof item.estimatedValue, 'number', `Item ${item.id}: estimatedValue must be number`);
    assert.ok(Number.isFinite(item.estimatedValue) && item.estimatedValue > 0, `Item ${item.id}: estimatedValue (${item.estimatedValue}) must be positive`);

    assert.strictEqual(typeof item.co2SavedKg, 'number', `Item ${item.id}: co2SavedKg must be number`);
    assert.ok(Number.isFinite(item.co2SavedKg) && item.co2SavedKg > 0, `Item ${item.id}: co2SavedKg (${item.co2SavedKg}) must be positive`);

    assert.strictEqual(typeof item.waterSavedLiters, 'number', `Item ${item.id}: waterSavedLiters must be number`);
    assert.ok(Number.isFinite(item.waterSavedLiters) && item.waterSavedLiters > 0, `Item ${item.id}: waterSavedLiters (${item.waterSavedLiters}) must be positive`);
  }
});

test('Challenger 2 Empirical Stress Test: mockEcoImpactMetrics Data Integrity', () => {
  assert.ok(mockEcoImpactMetrics && typeof mockEcoImpactMetrics === 'object', 'mockEcoImpactMetrics must be an object');

  const { totalCommunitySwaps, totalCo2SavedKg, totalWaterSavedLiters, treesEquivalentSaved } = mockEcoImpactMetrics;

  assert.strictEqual(typeof totalCommunitySwaps, 'number', 'totalCommunitySwaps must be a number');
  assert.ok(Number.isFinite(totalCommunitySwaps) && totalCommunitySwaps > 0, `totalCommunitySwaps (${totalCommunitySwaps}) must be positive number`);

  assert.strictEqual(typeof totalCo2SavedKg, 'number', 'totalCo2SavedKg must be a number');
  assert.ok(Number.isFinite(totalCo2SavedKg) && totalCo2SavedKg > 0, `totalCo2SavedKg (${totalCo2SavedKg}) must be positive number`);

  assert.strictEqual(typeof totalWaterSavedLiters, 'number', 'totalWaterSavedLiters must be a number');
  assert.ok(Number.isFinite(totalWaterSavedLiters) && totalWaterSavedLiters > 0, `totalWaterSavedLiters (${totalWaterSavedLiters}) must be positive number`);

  assert.strictEqual(typeof treesEquivalentSaved, 'number', 'treesEquivalentSaved must be a number');
  assert.ok(Number.isFinite(treesEquivalentSaved) && treesEquivalentSaved > 0, `treesEquivalentSaved (${treesEquivalentSaved}) must be positive number`);
});

test('Challenger 2 Empirical Stress Test: Trade Proposals & User Profile Stats', () => {
  const itemIds = new Set(mockSwapItems.map(item => item.id));

  for (const proposal of mockTradeProposals) {
    assert.strictEqual(typeof proposal.id, 'string', 'proposal id must be string');
    assert.ok(itemIds.has(proposal.offeredItemId), `offeredItemId '${proposal.offeredItemId}' must exist in swap items`);
    assert.ok(itemIds.has(proposal.requestedItemId), `requestedItemId '${proposal.requestedItemId}' must exist in swap items`);
    assert.ok(['pending', 'accepted', 'declined'].includes(proposal.status), `status '${proposal.status}' must be valid`);
    assert.ok(!isNaN(Date.parse(proposal.createdAt)), `createdAt '${proposal.createdAt}' must be valid ISO date`);
  }

  assert.ok(mockUserProfileStats.totalSwaps >= 0, 'totalSwaps must be >= 0');
  assert.ok(mockUserProfileStats.totalCo2SavedKg >= 0, 'totalCo2SavedKg must be >= 0');
  assert.ok(mockUserProfileStats.totalWaterSavedLiters >= 0, 'totalWaterSavedLiters must be >= 0');
  assert.ok(mockUserProfileStats.reputationScore >= 0 && mockUserProfileStats.reputationScore <= 5, 'reputationScore must be between 0 and 5');
});
