export const REVIEW_SCHEMA_VERSION = 1 as const;

export interface SwapReview {
  id: string;
  transactionId: string;
  reviewerId: string;
  revieweeId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  createdAt: string;
  schemaVersion: typeof REVIEW_SCHEMA_VERSION;
}

export interface SubmitSwapReviewInput {
  transactionId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
}

export interface SubmitSwapReviewResponse {
  reviewId: string;
  created: true;
}
