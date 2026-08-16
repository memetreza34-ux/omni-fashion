import { httpsCallable } from 'firebase/functions';

import { getFirebaseServices } from '@/services/firebase/app';

import type {
  CancelSwapOfferInput,
  CancelSwapOfferResponse,
  SetSwapListingStatusInput,
  SetSwapListingStatusResponse,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function setSwapListingStatus(
  input: SetSwapListingStatusInput,
): Promise<SetSwapListingStatusResponse> {
  const { functions } = getFirebaseServices();
  const callable = httpsCallable<
    SetSwapListingStatusInput,
    SetSwapListingStatusResponse
  >(functions, 'setSwapListingStatus');
  const response = await callable(input);

  if (
    !isRecord(response.data) ||
    response.data.listingId !== input.listingId ||
    !(
      response.data.status === 'active' ||
      response.data.status === 'paused' ||
      response.data.status === 'removed'
    )
  ) {
    throw new Error('SWAP_INVALID_LISTING_STATUS_RESPONSE');
  }

  return {
    listingId: response.data.listingId,
    status: response.data.status,
  };
}

export async function cancelSwapOffer(
  input: CancelSwapOfferInput,
): Promise<CancelSwapOfferResponse> {
  const { functions } = getFirebaseServices();
  const callable = httpsCallable<CancelSwapOfferInput, CancelSwapOfferResponse>(
    functions,
    'cancelSwapOffer',
  );
  const response = await callable(input);

  if (
    !isRecord(response.data) ||
    response.data.offerId !== input.offerId ||
    response.data.status !== 'cancelled'
  ) {
    throw new Error('SWAP_INVALID_CANCEL_RESPONSE');
  }

  return { offerId: response.data.offerId, status: 'cancelled' };
}
