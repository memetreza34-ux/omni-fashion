import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import type { QueryDocumentSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { getFirebaseServices } from '@/services/firebase/app';
import {
  WARDROBE_CATEGORIES,
  WARDROBE_CONDITIONS,
} from '@/features/wardrobe/types';
import type {
  WardrobeCategory,
  WardrobeCondition,
} from '@/features/wardrobe/types';

import {
  SWAP_FINALIZATION_STATES,
  SWAP_OFFER_SCHEMA_VERSION,
  SWAP_OFFER_STATUSES,
  SWAP_TRANSACTION_SCHEMA_VERSION,
  SWAP_TRANSACTION_STATUSES,
} from './types';
import type {
  AdvanceSwapTransactionInput,
  AdvanceSwapTransactionResponse,
  RespondSwapOfferInput,
  RespondSwapOfferResponse,
  SendSwapOfferInput,
  SendSwapOfferResponse,
  SwapFinalizationState,
  SwapOffer,
  SwapOfferItemSnapshot,
  SwapOfferStatus,
  SwapTransaction,
  SwapTransactionStatus,
} from './types';

const SWAP_HISTORY_LIMIT = 100;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(
  record: Record<string, unknown>,
  key: string,
): string | null {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readNullableString(
  record: Record<string, unknown>,
  key: string,
): string | null {
  const value = record[key];
  return value === null || typeof value === 'string' ? value : null;
}

function readBoolean(
  record: Record<string, unknown>,
  key: string,
): boolean | null {
  const value = record[key];
  return typeof value === 'boolean' ? value : null;
}

function readStringArray(
  record: Record<string, unknown>,
  key: string,
): string[] | null {
  const value = record[key];
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== 'string')
  ) {
    return null;
  }
  return [...new Set(value)];
}

function readEnum<T extends string>(
  record: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
): T | null {
  const value = record[key];
  return typeof value === 'string' && allowed.includes(value as T)
    ? (value as T)
    : null;
}

function timestampToIso(value: unknown): string | null {
  return value instanceof Timestamp ? value.toDate().toISOString() : null;
}

function parseItemSnapshot(value: unknown): SwapOfferItemSnapshot | null {
  if (!isRecord(value)) {
    return null;
  }

  const wardrobeItemId = readString(value, 'wardrobeItemId');
  const title = readString(value, 'title');
  const category = readEnum<WardrobeCategory>(
    value,
    'category',
    WARDROBE_CATEGORIES,
  );
  const subcategory = readNullableString(value, 'subcategory');
  const color = readString(value, 'color');
  const brand = readNullableString(value, 'brand');
  const size = readNullableString(value, 'size');
  const condition = readEnum<WardrobeCondition>(
    value,
    'condition',
    WARDROBE_CONDITIONS,
  );

  if (!wardrobeItemId || !title || !category || !color || !condition) {
    return null;
  }

  return {
    wardrobeItemId,
    title,
    category,
    subcategory,
    color,
    brand,
    size,
    condition,
  };
}

function mapOffer(snapshot: QueryDocumentSnapshot<unknown>): SwapOffer | null {
  const raw = snapshot.data();
  if (!isRecord(raw)) {
    return null;
  }

  const requesterId = readString(raw, 'requesterId');
  const listingOwnerId = readString(raw, 'listingOwnerId');
  const requestedListingId = readString(raw, 'requestedListingId');
  const requestedWardrobeItemId = readString(raw, 'requestedWardrobeItemId');
  const offeredWardrobeItemId = readString(raw, 'offeredWardrobeItemId');
  const requestedSnapshot = parseItemSnapshot(raw.requestedSnapshot);
  const offeredSnapshot = parseItemSnapshot(raw.offeredSnapshot);
  const status = readEnum<SwapOfferStatus>(raw, 'status', SWAP_OFFER_STATUSES);
  const transactionId = readNullableString(raw, 'transactionId');
  const createdAt = timestampToIso(raw.createdAt);
  const updatedAt = timestampToIso(raw.updatedAt);

  if (
    !requesterId ||
    !listingOwnerId ||
    !requestedListingId ||
    !requestedWardrobeItemId ||
    !offeredWardrobeItemId ||
    !requestedSnapshot ||
    !offeredSnapshot ||
    !status ||
    !createdAt ||
    !updatedAt ||
    raw.schemaVersion !== SWAP_OFFER_SCHEMA_VERSION
  ) {
    console.warn(`Skipping invalid OmniSwap offer ${snapshot.id}.`);
    return null;
  }

  return {
    id: snapshot.id,
    requesterId,
    listingOwnerId,
    requestedListingId,
    requestedWardrobeItemId,
    offeredWardrobeItemId,
    requestedSnapshot,
    offeredSnapshot,
    status,
    transactionId,
    createdAt,
    updatedAt,
    schemaVersion: SWAP_OFFER_SCHEMA_VERSION,
  };
}

function mapTransaction(
  snapshot: QueryDocumentSnapshot<unknown>,
): SwapTransaction | null {
  const raw = snapshot.data();
  if (!isRecord(raw)) {
    return null;
  }

  const offerId = readString(raw, 'offerId');
  const listingId = readString(raw, 'listingId');
  const participantIds = readStringArray(raw, 'participantIds');
  const requesterId = readString(raw, 'requesterId');
  const listingOwnerId = readString(raw, 'listingOwnerId');
  const requestedWardrobeItemId = readString(raw, 'requestedWardrobeItemId');
  const offeredWardrobeItemId = readString(raw, 'offeredWardrobeItemId');
  const shippingEnabled = readBoolean(raw, 'shippingEnabled');
  const meetupEnabled = readBoolean(raw, 'meetupEnabled');
  const status = readEnum<SwapTransactionStatus>(
    raw,
    'status',
    SWAP_TRANSACTION_STATUSES,
  );
  const fulfilmentMode = raw.fulfilmentMode;
  const modeConfirmedByIds = readStringArray(raw, 'modeConfirmedByIds');
  const shippedByIds = readStringArray(raw, 'shippedByIds');
  const receivedByIds = readStringArray(raw, 'receivedByIds');
  const finalizationState = readEnum<SwapFinalizationState>(
    raw,
    'finalizationState',
    SWAP_FINALIZATION_STATES,
  );
  const finalizationErrorCode = readNullableString(
    raw,
    'finalizationErrorCode',
  );
  const createdAt = timestampToIso(raw.createdAt);
  const updatedAt = timestampToIso(raw.updatedAt);
  const completedAt =
    raw.completedAt === null ? null : timestampToIso(raw.completedAt);

  if (
    !offerId ||
    !listingId ||
    !participantIds ||
    participantIds.length !== 2 ||
    !requesterId ||
    !listingOwnerId ||
    !participantIds.includes(requesterId) ||
    !participantIds.includes(listingOwnerId) ||
    !requestedWardrobeItemId ||
    !offeredWardrobeItemId ||
    shippingEnabled === null ||
    meetupEnabled === null ||
    (!shippingEnabled && !meetupEnabled) ||
    !status ||
    !(
      fulfilmentMode === null ||
      fulfilmentMode === 'shipping' ||
      fulfilmentMode === 'meetup'
    ) ||
    !modeConfirmedByIds ||
    !shippedByIds ||
    !receivedByIds ||
    !finalizationState ||
    !createdAt ||
    !updatedAt ||
    raw.schemaVersion !== SWAP_TRANSACTION_SCHEMA_VERSION
  ) {
    console.warn(`Skipping invalid OmniSwap transaction ${snapshot.id}.`);
    return null;
  }

  return {
    id: snapshot.id,
    offerId,
    listingId,
    participantIds: [participantIds[0], participantIds[1]],
    requesterId,
    listingOwnerId,
    requestedWardrobeItemId,
    offeredWardrobeItemId,
    shippingEnabled,
    meetupEnabled,
    status,
    fulfilmentMode,
    modeConfirmedByIds,
    shippedByIds,
    receivedByIds,
    finalizationState,
    finalizationErrorCode,
    createdAt,
    updatedAt,
    completedAt,
    schemaVersion: SWAP_TRANSACTION_SCHEMA_VERSION,
  };
}

function subscribeMapped<T>(
  queryValue: ReturnType<typeof query>,
  mapper: (snapshot: QueryDocumentSnapshot<unknown>) => T | null,
  onChange: (values: T[]) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    queryValue,
    (snapshot) => {
      onChange(
        snapshot.docs.map(mapper).filter((value): value is T => value !== null),
      );
    },
    (error) => onError(error),
  );
}

export function subscribeToIncomingSwapOffers(
  ownerId: string,
  onChange: (offers: SwapOffer[]) => void,
  onError: (error: Error) => void,
): () => void {
  const { db } = getFirebaseServices();
  return subscribeMapped(
    query(
      collection(db, 'swapOffers'),
      where('listingOwnerId', '==', ownerId),
      orderBy('createdAt', 'desc'),
      limit(SWAP_HISTORY_LIMIT),
    ),
    mapOffer,
    onChange,
    onError,
  );
}

export function subscribeToOutgoingSwapOffers(
  requesterId: string,
  onChange: (offers: SwapOffer[]) => void,
  onError: (error: Error) => void,
): () => void {
  const { db } = getFirebaseServices();
  return subscribeMapped(
    query(
      collection(db, 'swapOffers'),
      where('requesterId', '==', requesterId),
      orderBy('createdAt', 'desc'),
      limit(SWAP_HISTORY_LIMIT),
    ),
    mapOffer,
    onChange,
    onError,
  );
}

export function subscribeToSwapTransactions(
  userId: string,
  onChange: (transactions: SwapTransaction[]) => void,
  onError: (error: Error) => void,
): () => void {
  const { db } = getFirebaseServices();
  return subscribeMapped(
    query(
      collection(db, 'swapTransactions'),
      where('participantIds', 'array-contains', userId),
      orderBy('createdAt', 'desc'),
      limit(SWAP_HISTORY_LIMIT),
    ),
    mapTransaction,
    onChange,
    onError,
  );
}

export async function sendSwapOffer(
  input: SendSwapOfferInput,
): Promise<SendSwapOfferResponse> {
  const { functions } = getFirebaseServices();
  const callable = httpsCallable<SendSwapOfferInput, SendSwapOfferResponse>(
    functions,
    'sendSwapOffer',
  );
  const response = await callable(input);

  if (
    !isRecord(response.data) ||
    typeof response.data.offerId !== 'string' ||
    !response.data.offerId ||
    response.data.status !== 'sent'
  ) {
    throw new Error('SWAP_INVALID_OFFER_RESPONSE');
  }

  return { offerId: response.data.offerId, status: 'sent' };
}

export async function respondSwapOffer(
  input: RespondSwapOfferInput,
): Promise<RespondSwapOfferResponse> {
  const { functions } = getFirebaseServices();
  const callable = httpsCallable<
    RespondSwapOfferInput,
    RespondSwapOfferResponse
  >(functions, 'respondSwapOffer');
  const response = await callable(input);

  if (
    !isRecord(response.data) ||
    response.data.offerId !== input.offerId ||
    (response.data.status !== 'accepted' &&
      response.data.status !== 'declined') ||
    !(
      response.data.transactionId === null ||
      typeof response.data.transactionId === 'string'
    )
  ) {
    throw new Error('SWAP_INVALID_RESPONSE_RESULT');
  }

  return {
    offerId: response.data.offerId,
    status: response.data.status,
    transactionId: response.data.transactionId,
  };
}

export async function advanceSwapTransaction(
  input: AdvanceSwapTransactionInput,
): Promise<AdvanceSwapTransactionResponse> {
  const { functions } = getFirebaseServices();
  const callable = httpsCallable<
    AdvanceSwapTransactionInput,
    AdvanceSwapTransactionResponse
  >(functions, 'advanceSwapTransaction');
  const response = await callable(input);

  if (
    !isRecord(response.data) ||
    response.data.transactionId !== input.transactionId ||
    typeof response.data.status !== 'string' ||
    !SWAP_TRANSACTION_STATUSES.includes(
      response.data.status as SwapTransactionStatus,
    ) ||
    typeof response.data.finalizationState !== 'string' ||
    !SWAP_FINALIZATION_STATES.includes(
      response.data.finalizationState as SwapFinalizationState,
    )
  ) {
    throw new Error('SWAP_INVALID_TRANSACTION_PROGRESS_RESPONSE');
  }

  return {
    transactionId: response.data.transactionId,
    status: response.data.status as SwapTransactionStatus,
    finalizationState: response.data.finalizationState as SwapFinalizationState,
  };
}
