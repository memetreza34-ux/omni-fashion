import { GARMENT_ANALYSIS_MODEL, GARMENT_ANALYSIS_PROMPT_VERSION, GARMENT_ANALYSIS_SCHEMA_VERSION, WARDROBE_CATEGORIES, WARDROBE_SEASONS, } from './contracts.js';
import { GarmentAnalysisError } from './errors.js';
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
function readBoolean(record, key) {
    const value = record[key];
    if (typeof value !== 'boolean') {
        throw new GarmentAnalysisError('INVALID_PROVIDER_OUTPUT', `Invalid boolean field: ${key}`);
    }
    return value;
}
function readString(record, key, maxLength) {
    const value = record[key];
    if (typeof value !== 'string') {
        throw new GarmentAnalysisError('INVALID_PROVIDER_OUTPUT', `Invalid string field: ${key}`);
    }
    const normalized = value.trim();
    if (!normalized || normalized.length > maxLength) {
        throw new GarmentAnalysisError('INVALID_PROVIDER_OUTPUT', `Invalid string length: ${key}`);
    }
    return normalized;
}
function readNullableString(record, key, maxLength) {
    const value = record[key];
    if (value === null) {
        return null;
    }
    if (typeof value !== 'string') {
        throw new GarmentAnalysisError('INVALID_PROVIDER_OUTPUT', `Invalid nullable string: ${key}`);
    }
    const normalized = value.trim();
    if (normalized.length > maxLength) {
        throw new GarmentAnalysisError('INVALID_PROVIDER_OUTPUT', `Invalid nullable string length: ${key}`);
    }
    return normalized || null;
}
function readStringArray(record, key, maxItems, maxItemLength) {
    const value = record[key];
    if (!Array.isArray(value) || value.length > maxItems) {
        throw new GarmentAnalysisError('INVALID_PROVIDER_OUTPUT', `Invalid array field: ${key}`);
    }
    return value.map((entry) => {
        if (typeof entry !== 'string') {
            throw new GarmentAnalysisError('INVALID_PROVIDER_OUTPUT', `Invalid array entry: ${key}`);
        }
        const normalized = entry.trim();
        if (!normalized || normalized.length > maxItemLength) {
            throw new GarmentAnalysisError('INVALID_PROVIDER_OUTPUT', `Invalid array entry length: ${key}`);
        }
        return normalized;
    });
}
function readConfidence(record, key) {
    const value = record[key];
    if (typeof value !== 'number' || value < 0 || value > 1) {
        throw new GarmentAnalysisError('INVALID_PROVIDER_OUTPUT', `Invalid confidence: ${key}`);
    }
    return value;
}
function readEnum(record, key, allowed) {
    const value = record[key];
    if (typeof value !== 'string' || !allowed.includes(value)) {
        throw new GarmentAnalysisError('INVALID_PROVIDER_OUTPUT', `Invalid enum field: ${key}`);
    }
    return value;
}
function parseFieldConfidence(value) {
    if (!isRecord(value)) {
        throw new GarmentAnalysisError('INVALID_PROVIDER_OUTPUT', 'Invalid fieldConfidence object.');
    }
    return {
        category: readConfidence(value, 'category'),
        subcategory: readConfidence(value, 'subcategory'),
        color: readConfidence(value, 'color'),
        brand: readConfidence(value, 'brand'),
        material: readConfidence(value, 'material'),
        season: readConfidence(value, 'season'),
        styleTags: readConfidence(value, 'styleTags'),
    };
}
export function parseGarmentProviderResult(value) {
    if (!isRecord(value)) {
        throw new GarmentAnalysisError('INVALID_PROVIDER_OUTPUT', 'Provider returned a non-object result.');
    }
    if (!readBoolean(value, 'isGarment')) {
        throw new GarmentAnalysisError('IMAGE_NOT_GARMENT', 'No analyzable garment detected.');
    }
    const fieldConfidence = parseFieldConfidence(value.fieldConfidence);
    const brand = readNullableString(value, 'brand', 80);
    const material = readNullableString(value, 'material', 100);
    return {
        category: readEnum(value, 'category', WARDROBE_CATEGORIES),
        subcategory: fieldConfidence.subcategory >= 0.45
            ? readNullableString(value, 'subcategory', 80)
            : null,
        color: readString(value, 'color', 60),
        secondaryColors: readStringArray(value, 'secondaryColors', 5, 60),
        // Brand hallucinations are particularly harmful for marketplace data.
        brand: fieldConfidence.brand >= 0.85 ? brand : null,
        material: fieldConfidence.material >= 0.45 ? material : null,
        season: readEnum(value, 'season', WARDROBE_SEASONS),
        styleTags: readStringArray(value, 'styleTags', 20, 50),
        confidence: readConfidence(value, 'confidence'),
        fieldConfidence,
        modelVersion: GARMENT_ANALYSIS_MODEL,
        promptVersion: GARMENT_ANALYSIS_PROMPT_VERSION,
        schemaVersion: GARMENT_ANALYSIS_SCHEMA_VERSION,
    };
}
//# sourceMappingURL=garment-result.js.map