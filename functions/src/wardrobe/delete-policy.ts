export type WardrobeDeleteBlocker =
  | 'NOT_OWNER'
  | 'ACTIVE_SWAP_LISTING'
  | 'ACTIVE_SWAP_LOCK'
  | 'ACTIVE_SWAP_TRANSACTION'
  | 'UNSAFE_IMAGE_PATH';

export interface WardrobeDeletePolicyInput {
  requesterId: string;
  ownerId: string;
  itemId: string;
  imagePath: string | null;
  isListedForSwap: boolean;
  swapListingId: string | null;
  hasSwapLock: boolean;
  activeSwapTransactionCount: number;
}

export function isSafeWardrobeImagePath(
  ownerId: string,
  itemId: string,
  imagePath: string | null,
): boolean {
  if (!imagePath) {
    return false;
  }

  return imagePath.startsWith(`users/${ownerId}/wardrobe/${itemId}/`);
}

export function wardrobeDeleteBlockers(
  input: WardrobeDeletePolicyInput,
): WardrobeDeleteBlocker[] {
  const blockers: WardrobeDeleteBlocker[] = [];

  if (input.ownerId !== input.requesterId) {
    blockers.push('NOT_OWNER');
  }

  if (input.isListedForSwap || Boolean(input.swapListingId)) {
    blockers.push('ACTIVE_SWAP_LISTING');
  }

  if (input.hasSwapLock) {
    blockers.push('ACTIVE_SWAP_LOCK');
  }

  if (input.activeSwapTransactionCount > 0) {
    blockers.push('ACTIVE_SWAP_TRANSACTION');
  }

  if (!isSafeWardrobeImagePath(input.ownerId, input.itemId, input.imagePath)) {
    blockers.push('UNSAFE_IMAGE_PATH');
  }

  return blockers;
}

export function isActiveSwapTransactionStatus(status: unknown): boolean {
  return status !== 'completed' && status !== 'cancelled';
}
