import assert from 'node:assert/strict';
import test from 'node:test';

import {
  outerwearNeedFor,
  rainProtectionRecommended,
  temperatureBandFor,
} from '../lib/weather/weather-normalization.js';

test('maps apparent temperatures into stable clothing bands', () => {
  assert.equal(temperatureBandFor(-2), 'very-cold');
  assert.equal(temperatureBandFor(4), 'cold');
  assert.equal(temperatureBandFor(10), 'cool');
  assert.equal(temperatureBandFor(17), 'mild');
  assert.equal(temperatureBandFor(23), 'warm');
  assert.equal(temperatureBandFor(30), 'hot');
});

test('requires outerwear in cold conditions', () => {
  assert.equal(outerwearNeedFor(4, 0, 5), 'required');
});

test('recommends outerwear for rain or strong wind', () => {
  assert.equal(outerwearNeedFor(18, 1.2, 8), 'recommended');
  assert.equal(outerwearNeedFor(18, 0, 34), 'recommended');
});

test('avoids outerwear in hot dry weather', () => {
  assert.equal(outerwearNeedFor(30, 0, 5), 'avoid');
});

test('uses both precipitation and probability for rain protection', () => {
  assert.equal(rainProtectionRecommended(0.4, 0, 5), true);
  assert.equal(rainProtectionRecommended(0, 0, 55), true);
  assert.equal(rainProtectionRecommended(0, 0, 20), false);
});
