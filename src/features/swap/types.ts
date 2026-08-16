import type {
  WardrobeCategory,
  WardrobeCondition,
} from '@/features/wardrobe/types';

export const SWAP_LISTING_SCHEMA_VERSION = 1 as const;
export const SWAP_OFFER_SCHEMA_VERSION = 1 as const;
export const SWAP_TRANSACTION_SCHEMA_VERSION = 1 as const;

export const SWAP_LISTING_STATUSES = [
  'active',
  'paused',
  'reserved',
  'traded',
  'removed',
] as const;

export const SWAP_OFFER_STATUSES = [
  'sent',
  'accepted',
  'declined',
  'cancelled',
  'expired',
] as const;

export const SWAP_TRANSACTION_STATUSES = [
  'accepted',
  'address_or_meetup',
  'shipped',
  'received',
  'completed',
  'cancelled',
  'disputed',
] as const;

export type SwapListingStatus = (typeof SWAP_LISTING_STATUSES)[number];
export type SwapOfferStatus = (typeof SWAP_OFFER_STATUSES)[number];
export type SwapTransactionStatus =
  (typeof SWAP_TRANSACTION_STATUSES)[number];

export interface SwapListing {
  id: string;
  ownerId: string;
  wardrobeItemId: string;
  title: string;
  description: string;
  category: WardrobeCategory;
  subcategory: string | null;
  color: string;
  brand: string | null;
  size: string | null;
  condition: WardrobeCondition;
  publicImagePath: string;
  publicImageUrl: string | null;
  city: string;
  shippingEnabled: boolean;
  meetupEnabled: boolean;
  estimatedValueCents: number | null;
  status: SwapListingStatus;
  createdAt: string;
  updatedAt: string;
  schemaVersion: typeof SWAP_LISTING_SCHEMA_VERSION;
}

export interface SwapOfferItemSnapshot {
  wardrobeItemId: string;
  title: string;
  category: WardrobeCategory;
  subcategory: string | null;
  color: string;
  brand: string | null;
  size: string | null;
  condition: WardrobeCondition;
  imagePath: string;
}

export interface SwapOffer {
  id: string;
  requesterId: string;
  listingOwnerId: string;
  requestedListingId: string;
  requestedWardrobeItemId: string;
  offeredWardrobeItemId: string;
  requestedSnapshot: SwapOfferItemSnapshot;
  offeredSnapshot: SwapOfferItemSnapshot;
  status: SwapOfferStatus;
  transactionId: string | null;
  createdAt: string;
  updatedAt: string;
  schemaVersion: typeof SWAP_OFFER_SCHEMA_VERSION;
}

export interface SwapTransaction {
  id: string;
  offerId: string;
  listingId: string;
  participantIds: [string, string];
  requesterId: string;
  listingOwnerId: string;
  requestedWardrobeItemId: string;
  offeredWardrobeItemId: string;
  status: SwapTransactionStatus;
  fulfilmentMode: 'shipping' | 'meetup' | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  schemaVersion: typeof SWAP_TRANSACTION_SCHEMA_VERSION;
}

export interface CreateSwapListingInput {
  wardrobeItemId: string;
  description: string;
  city: string;
  shippingEnabled: boolean;
  meetupEnabled: boolean;
  estimatedValueCents: number | null;
}

export interface CreateSwapListingResponse {
  listingId: string;
  status: 'active';
}

export interface SendSwapOfferInput {
  requestedListingId: string;
  offeredWardrobeItemId: string;
}

export interface SendSwapOfferResponse {
  offerId: string;
  status: 'sent';
}

export interface RespondSwapOfferInput {
  offerId: string;
  decision: 'accept' | 'decline';
}

export interface RespondSwapOfferResponse {
  offerId: string;
  status: 'accepted' | 'declined';
  transactionId: string | null;
}
