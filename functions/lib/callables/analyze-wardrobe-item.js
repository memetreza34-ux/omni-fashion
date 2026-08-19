import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { logger } from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { GARMENT_ANALYSIS_MODEL, GARMENT_ANALYSIS_PROMPT_VERSION, GARMENT_ANALYSIS_SCHEMA_VERSION, } from '../ai/contracts.js';
import { GarmentAnalysisError } from '../ai/errors.js';
import { parseGarmentProviderResult } from '../ai/garment-result.js';
import { GeminiGarmentVisionProvider } from '../ai/providers/gemini-garment-vision-provider.js';
import { enforceUserRateLimit } from '../security/rate-limit.js';
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
const FUNCTIONS_REGION = 'europe-west1';
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const PENDING_STALE_AFTER_MS = 2 * 60 * 1000;
const SUPPORTED_IMAGE_TYPES = new Set([
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/heic',
    'image/heif',
]);
function ensureAdminInitialized() {
    if (getApps().length === 0) {
        initializeApp();
    }
}
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
function parseRequest(data) {
    if (!isRecord(data)) {
        throw new HttpsError('invalid-argument', 'Ungültige Analyseanfrage.');
    }
    const wardrobeItemId = data.wardrobeItemId;
    const schemaVersion = data.schemaVersion;
    if (typeof wardrobeItemId !== 'string' ||
        !wardrobeItemId.trim() ||
        wardrobeItemId.length > 160 ||
        wardrobeItemId.includes('/')) {
        throw new HttpsError('invalid-argument', 'Ungültige Kleidungsstück-ID.');
    }
    if (schemaVersion !== GARMENT_ANALYSIS_SCHEMA_VERSION) {
        throw new HttpsError('failed-precondition', 'Diese App-Version verwendet ein nicht unterstütztes Analyseschema.');
    }
    return {
        wardrobeItemId: wardrobeItemId.trim(),
        schemaVersion,
    };
}
function buildCachedResponse(wardrobeItemId, data) {
    if (data.aiStatus !== 'completed' ||
        data.aiModelVersion !== GARMENT_ANALYSIS_MODEL ||
        data.aiPromptVersion !== GARMENT_ANALYSIS_PROMPT_VERSION ||
        !(data.aiAnalyzedAt instanceof Timestamp)) {
        return null;
    }
    try {
        const result = parseGarmentProviderResult({
            isGarment: true,
            category: data.category,
            subcategory: data.subcategory,
            color: data.color,
            secondaryColors: data.secondaryColors,
            brand: data.brand,
            material: data.material,
            season: data.season,
            styleTags: data.styleTags,
            confidence: data.aiConfidence,
            fieldConfidence: data.aiFieldConfidence,
        });
        return {
            wardrobeItemId,
            status: 'completed',
            result,
            processedAt: data.aiAnalyzedAt.toDate().toISOString(),
        };
    }
    catch {
        return null;
    }
}
function validateImagePath(imagePath, userId, wardrobeItemId) {
    if (typeof imagePath !== 'string') {
        throw new HttpsError('failed-precondition', 'Für dieses Kleidungsstück ist kein analysierbares Bild gespeichert.');
    }
    const expectedPrefix = `users/${userId}/wardrobe/${wardrobeItemId}/`;
    if (!imagePath.startsWith(expectedPrefix)) {
        throw new HttpsError('permission-denied', 'Der Bildpfad gehört nicht zu diesem Kleidungsstück.');
    }
    return imagePath;
}
function failureCodeFrom(error) {
    if (error instanceof GarmentAnalysisError) {
        return error.code;
    }
    return 'INTERNAL_ERROR';
}
function clientErrorFor(code) {
    switch (code) {
        case 'IMAGE_NOT_FOUND':
            return new HttpsError('not-found', 'Das Kleidungsbild wurde nicht gefunden.');
        case 'IMAGE_INVALID':
            return new HttpsError('failed-precondition', 'Das gespeicherte Bild kann nicht analysiert werden.');
        case 'IMAGE_NOT_GARMENT':
            return new HttpsError('failed-precondition', 'Auf dem Bild wurde kein eindeutiges Kleidungsstück erkannt.');
        case 'PROVIDER_TIMEOUT':
            return new HttpsError('deadline-exceeded', 'Die Analyse hat zu lange gedauert. Bitte erneut versuchen.');
        case 'PROVIDER_UNAVAILABLE':
            return new HttpsError('unavailable', 'Die Kleidungsanalyse ist vorübergehend nicht verfügbar.');
        case 'INVALID_PROVIDER_OUTPUT':
        case 'INTERNAL_ERROR':
            return new HttpsError('internal', 'Die Kleidungsanalyse konnte nicht abgeschlossen werden.');
    }
}
async function loadImage(imagePath) {
    ensureAdminInitialized();
    const file = getStorage().bucket().file(imagePath);
    let metadata;
    try {
        [metadata] = await file.getMetadata();
    }
    catch {
        throw new GarmentAnalysisError('IMAGE_NOT_FOUND', 'Wardrobe image does not exist in Storage.');
    }
    const size = Number(metadata.size ?? 0);
    const mimeType = metadata.contentType ?? '';
    if (!Number.isFinite(size) ||
        size <= 0 ||
        size >= MAX_IMAGE_BYTES ||
        !SUPPORTED_IMAGE_TYPES.has(mimeType)) {
        throw new GarmentAnalysisError('IMAGE_INVALID', 'Wardrobe image metadata is invalid for analysis.');
    }
    let buffer;
    try {
        [buffer] = await file.download();
    }
    catch {
        throw new GarmentAnalysisError('IMAGE_NOT_FOUND', 'Wardrobe image could not be downloaded.');
    }
    if (buffer.length <= 0 || buffer.length >= MAX_IMAGE_BYTES) {
        throw new GarmentAnalysisError('IMAGE_INVALID', 'Wardrobe image bytes are invalid for analysis.');
    }
    return {
        imageBase64: buffer.toString('base64'),
        mimeType,
    };
}
async function markAnalysisFailed(wardrobeItemId, failureCode) {
    ensureAdminInitialized();
    const db = getFirestore();
    try {
        await db.doc(`wardrobeItems/${wardrobeItemId}`).update({
            aiStatus: 'failed',
            aiConfidence: null,
            aiFieldConfidence: null,
            aiModelVersion: GARMENT_ANALYSIS_MODEL,
            aiPromptVersion: GARMENT_ANALYSIS_PROMPT_VERSION,
            aiAnalyzedAt: null,
            aiErrorCode: failureCode,
            updatedAt: FieldValue.serverTimestamp(),
        });
    }
    catch (error) {
        logger.warn('Could not persist garment analysis failure state.', {
            wardrobeItemId,
            failureCode,
            errorName: error instanceof Error ? error.name : typeof error,
        });
    }
}
async function prepareAnalysis(userId, wardrobeItemId) {
    ensureAdminInitialized();
    const db = getFirestore();
    const itemRef = db.doc(`wardrobeItems/${wardrobeItemId}`);
    return db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(itemRef);
        if (!snapshot.exists) {
            throw new HttpsError('not-found', 'Kleidungsstück nicht gefunden.');
        }
        const raw = snapshot.data();
        if (!isRecord(raw)) {
            throw new HttpsError('failed-precondition', 'Kleidungsstück hat ungültige Daten.');
        }
        if (raw.ownerId !== userId) {
            throw new HttpsError('permission-denied', 'Dieses Kleidungsstück gehört nicht zu deinem Konto.');
        }
        const cachedResponse = buildCachedResponse(wardrobeItemId, raw);
        if (cachedResponse) {
            return { kind: 'cached', response: cachedResponse };
        }
        if (raw.aiStatus === 'pending' && raw.updatedAt instanceof Timestamp) {
            const pendingAgeMs = Date.now() - raw.updatedAt.toMillis();
            if (pendingAgeMs >= 0 && pendingAgeMs < PENDING_STALE_AFTER_MS) {
                throw new HttpsError('failed-precondition', 'Für dieses Kleidungsstück läuft bereits eine Analyse.');
            }
        }
        const imagePath = validateImagePath(raw.imagePath, userId, wardrobeItemId);
        transaction.update(itemRef, {
            aiStatus: 'pending',
            aiConfidence: null,
            aiFieldConfidence: null,
            aiModelVersion: GARMENT_ANALYSIS_MODEL,
            aiPromptVersion: GARMENT_ANALYSIS_PROMPT_VERSION,
            aiAnalyzedAt: null,
            aiErrorCode: null,
            updatedAt: FieldValue.serverTimestamp(),
        });
        return { kind: 'run', imagePath };
    });
}
async function completeAnalysis(wardrobeItemId, result) {
    ensureAdminInitialized();
    const db = getFirestore();
    const itemRef = db.doc(`wardrobeItems/${wardrobeItemId}`);
    const processedAt = new Date().toISOString();
    await itemRef.update({
        category: result.category,
        subcategory: result.subcategory,
        color: result.color,
        secondaryColors: result.secondaryColors,
        brand: result.brand,
        material: result.material,
        season: result.season,
        styleTags: result.styleTags,
        aiStatus: 'completed',
        aiConfidence: result.confidence,
        aiFieldConfidence: result.fieldConfidence,
        aiModelVersion: result.modelVersion,
        aiPromptVersion: result.promptVersion,
        aiAnalyzedAt: FieldValue.serverTimestamp(),
        aiErrorCode: null,
        updatedAt: FieldValue.serverTimestamp(),
    });
    return {
        wardrobeItemId,
        status: 'completed',
        result,
        processedAt,
    };
}
export const analyzeWardrobeItem = onCall({
    region: FUNCTIONS_REGION,
    secrets: [GEMINI_API_KEY],
    timeoutSeconds: 60,
    memory: '512MiB',
    maxInstances: 10,
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Du musst angemeldet sein, um ein Kleidungsstück zu analysieren.');
    }
    const input = parseRequest(request.data);
    const userId = request.auth.uid;
    ensureAdminInitialized();
    await enforceUserRateLimit({
        uid: userId,
        scope: 'analyze_wardrobe_item',
        maxAttempts: 20,
        windowSeconds: 60 * 60,
    });
    let markedPending = false;
    try {
        const preparation = await prepareAnalysis(userId, input.wardrobeItemId);
        if (preparation.kind === 'cached') {
            return preparation.response;
        }
        markedPending = true;
        const image = await loadImage(preparation.imagePath);
        const provider = new GeminiGarmentVisionProvider(GEMINI_API_KEY.value());
        const result = await provider.analyze(image);
        return await completeAnalysis(input.wardrobeItemId, result);
    }
    catch (error) {
        if (error instanceof HttpsError) {
            throw error;
        }
        const failureCode = failureCodeFrom(error);
        logger.error('Garment analysis failed.', {
            wardrobeItemId: input.wardrobeItemId,
            userId,
            failureCode,
            errorName: error instanceof Error ? error.name : typeof error,
        });
        if (markedPending) {
            await markAnalysisFailed(input.wardrobeItemId, failureCode);
        }
        throw clientErrorFor(failureCode);
    }
});
//# sourceMappingURL=analyze-wardrobe-item.js.map