import { httpsCallable } from 'firebase/functions';

import { getFirebaseServices } from '@/services/firebase/app';

import type {
  SubmitSwapReviewInput,
  SubmitSwapReviewResponse,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function submitSwapReview(
  input: SubmitSwapReviewInput,
): Promise<SubmitSwapReviewResponse> {
  const { functions } = getFirebaseServices();
  const callable = httpsCallable<SubmitSwapReviewInput, SubmitSwapReviewResponse>(
    functions,
    'submitSwapReview',
  );
  const response = await callable(input);

  if (
    !isRecord(response.data) ||
    typeof response.data.reviewId !== 'string' ||
    !response.data.reviewId ||
    response.data.created !== true
  ) {
    throw new Error('REVIEW_INVALID_SUBMIT_RESPONSE');
  }

  return { reviewId: response.data.reviewId, created: true };
}
