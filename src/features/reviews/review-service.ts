import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { getFirebaseServices } from '@/services/firebase/app';

import { REVIEW_SCHEMA_VERSION } from './types';
import type {
  SubmitSwapReviewInput,
  SubmitSwapReviewResponse,
  SwapReview,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isRating(value: unknown): value is 1 | 2 | 3 | 4 | 5 {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

function mapReview(id: string, raw: unknown): SwapReview | null {
  if (!isRecord(raw)) {
    return null;
  }

  const transactionId = raw.transactionId;
  const reviewerId = raw.reviewerId;
  const revieweeId = raw.revieweeId;
  const rating = raw.rating;
  const comment = raw.comment;
  const createdAt = raw.createdAt;

  if (
    typeof transactionId !== 'string' ||
    !transactionId ||
    typeof reviewerId !== 'string' ||
    !reviewerId ||
    typeof revieweeId !== 'string' ||
    !revieweeId ||
    !isRating(rating) ||
    typeof comment !== 'string' ||
    !(createdAt instanceof Timestamp) ||
    raw.schemaVersion !== REVIEW_SCHEMA_VERSION
  ) {
    return null;
  }

  return {
    id,
    transactionId,
    reviewerId,
    revieweeId,
    rating,
    comment,
    createdAt: createdAt.toDate().toISOString(),
    schemaVersion: REVIEW_SCHEMA_VERSION,
  };
}

export function subscribeToSwapReview(
  transactionId: string,
  reviewerId: string,
  onChange: (review: SwapReview | null) => void,
  onError: (error: Error) => void,
): () => void {
  const { db } = getFirebaseServices();
  const reviewId = `${transactionId}_${reviewerId}`;

  return onSnapshot(
    doc(db, 'reviews', reviewId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onChange(null);
        return;
      }

      const review = mapReview(snapshot.id, snapshot.data());
      if (!review) {
        console.warn(`Skipping invalid swap review ${snapshot.id}.`);
        onChange(null);
        return;
      }
      onChange(review);
    },
    (error) => onError(error),
  );
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
