import {
  collection,
  onSnapshot,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
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
  SWAP_OFFER_SCHEMA_VERSION,
  SWAP_OFFER_STATUSES,
  SWAP_TRANSACTION_SCHEMA_VERSION,
  SWAP_TRANSACTION_STATUSES,
} from './types';
import type {
  RespondSwapOfferInput,
  RespondSwapOfferResponse,
  SendSwapOfferInput,
  SendSwapOfferResponse,
  SwapOffer,
  SwapOfferItemSnapshot,
  SwapOfferStatus,
  SwapTransaction,
  SwapTransactionStatus,
} from './types';

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

function mapOffer(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): SwapOffer | null {
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
  snapshot: QueryDocumentSnapshot<DocumentData>,
): SwapTransaction | null {
  const raw = snapshot.data();
  if (!isRecord(raw)) {
    return null;
  }

  const offerId = readString(raw, 'offerId');
  const listingId = readString(raw, 'listingId');
  const participantIds = raw.participantIds;
  const requesterId = readString(raw, 'requesterId');
  const listingOwnerId = readString(raw, 'listingOwnerId');
  const requestedWardrobeItemId = readString(raw, 'requestedWardrobeItemId');
  const offeredWardrobeItemId = readString(raw, 'offeredWardrobeItemId');
  const status = readEnum<SwapTransactionStatus>(
    raw,
    'status',
    SWAP_TRANSACTION_STATUSES,
  );
  const fulfilmentMode = raw.fulfilmentMode;
  const createdAt = timestampToIso(raw.createdAt);
  const updatedAt = timestampToIso(raw.updatedAt);
  const completedAt =
    raw.completedAt === null ? null : timestampToIso(raw.completedAt);

  if (
    !offerId ||
    !listingId ||
    !Array.isArray(participantIds) ||
    participantIds.length !== 2 ||
    participantIds.some((id) => typeof id !== 'string') ||
    !requesterId ||
    !listingOwnerId ||
    !requestedWardrobeItemId ||
    !offeredWardrobeItemId ||
    !status ||
    !(
      fulfilmentMode === null ||
      fulfilmentMode === 'shipping' ||
      fulfilmentMode === 'meetup'
    ) ||
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
    status,
    fulfilmentMode,
    createdAt,
    updatedAt,
    completedAt,
    schemaVersion: SWAP_TRANSACTION_SCHEMA_VERSION,
  };
}

function subscribeMapped<T>(
  queryValue: ReturnType<typeof query>,
  mapper: (snapshot: QueryDocumentSnapshot<DocumentData>) => T | null,
  onChange: (values: T[]) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    queryValue,
    (snapshot) => {
      const values = snapshot.docs
        .map(mapper)
        .filter((value): value is T => value !== null)
        .sort((a, b) => {
          const first = a as { createdAt?: string };
          const second = b as { createdAt?: string };
          return (second.createdAt ?? '').localeCompare(first.createdAt ?? '');
        });
      onChange(values);
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
    query(collection(db, 'swapOffers'), where('listingOwnerId', '==', ownerId)),
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
    query(collection(db, 'swapOffers'), where('requesterId', '==', requesterId)),
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
    (response.data.status !== 'accepted' && response.data.status !== 'declined') ||
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
