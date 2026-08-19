import { httpsCallable } from 'firebase/functions';

import { getFirebaseServices } from '@/services/firebase/app';

import { parseGarmentAnalysisResponse } from './parse-response';
import { GARMENT_ANALYSIS_SCHEMA_VERSION } from './types';
import type { GarmentAnalysisRequest, GarmentAnalysisResponse } from './types';

const ANALYZE_WARDROBE_ITEM_FUNCTION = 'analyzeWardrobeItem';

export async function requestGarmentAnalysis(
  wardrobeItemId: string,
): Promise<GarmentAnalysisResponse> {
  const normalizedItemId = wardrobeItemId.trim();

  if (!normalizedItemId) {
    throw new Error('GARMENT_ANALYSIS_ITEM_ID_REQUIRED');
  }

  const { functions } = getFirebaseServices();
  const callable = httpsCallable<GarmentAnalysisRequest, unknown>(
    functions,
    ANALYZE_WARDROBE_ITEM_FUNCTION,
  );

  const response = await callable({
    wardrobeItemId: normalizedItemId,
    schemaVersion: GARMENT_ANALYSIS_SCHEMA_VERSION,
  });

  const parsed = parseGarmentAnalysisResponse(response.data);

  if (parsed.wardrobeItemId !== normalizedItemId) {
    throw new Error('GARMENT_ANALYSIS_ITEM_MISMATCH');
  }

  return parsed;
}
