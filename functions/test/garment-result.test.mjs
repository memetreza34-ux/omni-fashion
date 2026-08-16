import assert from 'node:assert/strict';
import test from 'node:test';

import { GarmentAnalysisError } from '../lib/ai/errors.js';
import { parseGarmentProviderResult } from '../lib/ai/garment-result.js';

function validProviderResult() {
  return {
    isGarment: true,
    category: 'Outerwear',
    subcategory: 'Lederjacke',
    color: 'Schwarz',
    secondaryColors: ['Silber'],
    brand: 'Example Brand',
    material: 'Leder',
    season: 'Autumn',
    styleTags: ['Biker', 'Streetwear'],
    confidence: 0.92,
    fieldConfidence: {
      category: 0.99,
      subcategory: 0.94,
      color: 0.99,
      brand: 0.91,
      material: 0.82,
      season: 0.8,
      styleTags: 0.78,
    },
  };
}

test('parses and versions a valid garment result', () => {
  const result = parseGarmentProviderResult(validProviderResult());

  assert.equal(result.category, 'Outerwear');
  assert.equal(result.brand, 'Example Brand');
  assert.equal(result.material, 'Leder');
  assert.equal(result.modelVersion, 'gemini-3.6-flash');
  assert.equal(result.promptVersion, 'garment-v1');
  assert.equal(result.schemaVersion, 1);
});

test('drops an uncertain brand instead of hallucinating it into domain data', () => {
  const raw = validProviderResult();
  raw.fieldConfidence.brand = 0.3;

  const result = parseGarmentProviderResult(raw);
  assert.equal(result.brand, null);
  assert.equal(result.fieldConfidence.brand, 0.3);
});

test('drops uncertain material and subcategory but preserves reliable fields', () => {
  const raw = validProviderResult();
  raw.fieldConfidence.material = 0.2;
  raw.fieldConfidence.subcategory = 0.2;

  const result = parseGarmentProviderResult(raw);
  assert.equal(result.material, null);
  assert.equal(result.subcategory, null);
  assert.equal(result.color, 'Schwarz');
});

test('rejects a non-garment image with a stable domain error', () => {
  const raw = validProviderResult();
  raw.isGarment = false;

  assert.throws(
    () => parseGarmentProviderResult(raw),
    (error) =>
      error instanceof GarmentAnalysisError &&
      error.code === 'IMAGE_NOT_GARMENT',
  );
});

test('rejects confidence values outside 0..1', () => {
  const raw = validProviderResult();
  raw.confidence = 1.2;

  assert.throws(
    () => parseGarmentProviderResult(raw),
    (error) =>
      error instanceof GarmentAnalysisError &&
      error.code === 'INVALID_PROVIDER_OUTPUT',
  );
});

test('rejects unsupported category values', () => {
  const raw = validProviderResult();
  raw.category = 'Dress';

  assert.throws(
    () => parseGarmentProviderResult(raw),
    (error) =>
      error instanceof GarmentAnalysisError &&
      error.code === 'INVALID_PROVIDER_OUTPUT',
  );
});
