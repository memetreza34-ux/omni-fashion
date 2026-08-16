const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Read swap-data.ts content and parse objects
const dataPath = path.join(__dirname, '../src/data/swap-data.ts');
const fileContent = fs.readFileSync(dataPath, 'utf8');

// Strip TypeScript type annotations to evaluate cleanly in Node
const jsContent = fileContent
  .replace(/import\s+type\s+[^;]+;/g, '')
  .replace(/import\s+{[^}]+}\s+from\s+['"][^'"]+['"];/g, '')
  .replace(/export\s+const\s+/g, 'const ')
  .replace(/export\s+let\s+/g, 'let ')
  .replace(/:\s*SwapItem\[\]/g, '')
  .replace(/:\s*SwapTradeProposal\[\]/g, '')
  .replace(/:\s*UserSwapProfileStats/g, '')
  .replace(/:\s*EcoImpactMetrics/g, '');

const sandbox = {};
const runScript = new Function('exports', jsContent + '\nexports.mockSwapItems = mockSwapItems;\nexports.mockTradeProposals = mockTradeProposals;\nexports.mockUserProfileStats = mockUserProfileStats;\nexports.mockEcoImpactMetrics = mockEcoImpactMetrics;');
runScript(sandbox);

const { mockSwapItems, mockTradeProposals, mockUserProfileStats, mockEcoImpactMetrics } = sandbox;

console.log('=== EMPIRICAL STRESS TEST OF DATA MODEL INTEGRITY ===');

// 1. Stress test mockSwapItems
console.log(`Checking mockSwapItems (${mockSwapItems.length} items)...`);
assert.ok(Array.isArray(mockSwapItems) && mockSwapItems.length >= 5, 'mockSwapItems must be an array with >= 5 items');

const requiredFields = [
  'id', 'title', 'brand', 'category', 'size', 'condition',
  'estimatedValue', 'co2SavedKg', 'waterSavedLiters',
  'imageUrl', 'ownerName', 'ownerAvatar', 'ownerLocation',
  'aestheticTag', 'description'
];

const validCategories = new Set(['Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories']);
const validConditions = new Set(['Like New', 'Excellent', 'Good', 'Upcycled']);
const seenIds = new Set();

mockSwapItems.forEach((item, idx) => {
  // Check all required fields exist
  for (const field of requiredFields) {
    assert.ok(field in item, `Item ${idx} (${item.id || 'unknown'}) is missing required field: ${field}`);
  }

  // ID uniqueness & non-empty
  assert.ok(typeof item.id === 'string' && item.id.trim().length > 0, `Item ${idx}: invalid id`);
  assert.ok(!seenIds.has(item.id), `Duplicate ID found: ${item.id}`);
  seenIds.add(item.id);

  // String field validations
  ['title', 'brand', 'size', 'imageUrl', 'ownerName', 'ownerAvatar', 'ownerLocation', 'aestheticTag', 'description'].forEach(f => {
    assert.ok(typeof item[f] === 'string' && item[f].trim().length > 0, `Item ${item.id}: field ${f} must be non-empty string`);
  });

  // Category & Condition enum validations
  assert.ok(validCategories.has(item.category), `Item ${item.id}: invalid category '${item.category}'`);
  assert.ok(validConditions.has(item.condition), `Item ${item.id}: invalid condition '${item.condition}'`);

  // Positive numeric field validations
  assert.ok(typeof item.estimatedValue === 'number' && Number.isFinite(item.estimatedValue) && item.estimatedValue > 0, `Item ${item.id}: estimatedValue (${item.estimatedValue}) must be positive number`);
  assert.ok(typeof item.co2SavedKg === 'number' && Number.isFinite(item.co2SavedKg) && item.co2SavedKg > 0, `Item ${item.id}: co2SavedKg (${item.co2SavedKg}) must be positive number`);
  assert.ok(typeof item.waterSavedLiters === 'number' && Number.isFinite(item.waterSavedLiters) && item.waterSavedLiters > 0, `Item ${item.id}: waterSavedLiters (${item.waterSavedLiters}) must be positive number`);

  console.log(`  ✓ Item [${item.id}] "${item.title}" - Category: ${item.category}, Condition: ${item.condition}, Value: $${item.estimatedValue}, CO2: ${item.co2SavedKg}kg, Water: ${item.waterSavedLiters}L`);
});

// 2. Stress test mockEcoImpactMetrics
console.log('\nChecking mockEcoImpactMetrics...');
assert.ok(mockEcoImpactMetrics && typeof mockEcoImpactMetrics === 'object', 'mockEcoImpactMetrics must be an object');
const ecoFields = ['totalCommunitySwaps', 'totalCo2SavedKg', 'totalWaterSavedLiters', 'treesEquivalentSaved'];
ecoFields.forEach(field => {
  assert.ok(field in mockEcoImpactMetrics, `mockEcoImpactMetrics missing field: ${field}`);
  const val = mockEcoImpactMetrics[field];
  assert.ok(typeof val === 'number' && Number.isFinite(val) && val > 0, `mockEcoImpactMetrics.${field} (${val}) must be positive number`);
  console.log(`  ✓ ${field}: ${val}`);
});

// 3. Stress test mockTradeProposals
console.log(`\nChecking mockTradeProposals (${mockTradeProposals.length} proposals)...`);
mockTradeProposals.forEach(p => {
  assert.ok(seenIds.has(p.offeredItemId), `Trade proposal ${p.id}: offeredItemId '${p.offeredItemId}' not found in swap items`);
  assert.ok(seenIds.has(p.requestedItemId), `Trade proposal ${p.id}: requestedItemId '${p.requestedItemId}' not found in swap items`);
  assert.ok(['pending', 'accepted', 'declined'].includes(p.status), `Trade proposal ${p.id}: invalid status '${p.status}'`);
  assert.ok(!isNaN(Date.parse(p.createdAt)), `Trade proposal ${p.id}: invalid createdAt date '${p.createdAt}'`);
  console.log(`  ✓ Proposal [${p.id}] status: ${p.status}, offered: ${p.offeredItemId} -> requested: ${p.requestedItemId}`);
});

// 4. Stress test mockUserProfileStats
console.log('\nChecking mockUserProfileStats...');
assert.ok(typeof mockUserProfileStats.totalSwaps === 'number' && mockUserProfileStats.totalSwaps >= 0, 'totalSwaps must be >= 0');
assert.ok(typeof mockUserProfileStats.totalCo2SavedKg === 'number' && mockUserProfileStats.totalCo2SavedKg >= 0, 'totalCo2SavedKg must be >= 0');
assert.ok(typeof mockUserProfileStats.totalWaterSavedLiters === 'number' && mockUserProfileStats.totalWaterSavedLiters >= 0, 'totalWaterSavedLiters must be >= 0');
assert.ok(typeof mockUserProfileStats.reputationScore === 'number' && mockUserProfileStats.reputationScore >= 0 && mockUserProfileStats.reputationScore <= 5, 'reputationScore must be between 0 and 5');
console.log(`  ✓ User profile stats verified (swaps: ${mockUserProfileStats.totalSwaps}, score: ${mockUserProfileStats.reputationScore})`);

console.log('\n✅ ALL EMPIRICAL DATA INTEGRITY STRESS TESTS PASSED CLEANLY.');
