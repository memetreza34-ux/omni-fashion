import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '@/context/AuthContext';
import { useTrustSafety } from '@/context/TrustSafetyContext';
import {
  createSwapListing,
  subscribeToActiveSwapListings,
  subscribeToOwnSwapListings,
} from '@/features/swap/swap-listing-service';
import {
  cancelSwapOffer,
  setSwapListingStatus,
} from '@/features/swap/swap-lifecycle-service';
import {
  advanceSwapTransaction,
  respondSwapOffer,
  sendSwapOffer,
  subscribeToIncomingSwapOffers,
  subscribeToOutgoingSwapOffers,
  subscribeToSwapTransactions,
} from '@/features/swap/swap-trade-service';
import type {
  AdvanceSwapTransactionInput,
  CancelSwapOfferInput,
  CreateSwapListingInput,
  RespondSwapOfferInput,
  SendSwapOfferInput,
  SetSwapListingStatusInput,
  SwapListing,
  SwapOffer,
  SwapTransaction,
} from '@/features/swap/types';

interface SwapContextType {
  activeListings: SwapListing[];
  ownListings: SwapListing[];
  marketplaceListings: SwapListing[];
  incomingOffers: SwapOffer[];
  outgoingOffers: SwapOffer[];
  transactions: SwapTransaction[];
  isLoading: boolean;
  error: string | null;
  isCloudBacked: boolean;
  createListing: (input: CreateSwapListingInput) => Promise<string>;
  changeListingStatus: (input: SetSwapListingStatusInput) => Promise<void>;
  sendOffer: (input: SendSwapOfferInput) => Promise<string>;
  cancelOffer: (input: CancelSwapOfferInput) => Promise<void>;
  respondToOffer: (input: RespondSwapOfferInput) => Promise<string | null>;
  advanceTransaction: (input: AdvanceSwapTransactionInput) => Promise<void>;
}

interface SwapSnapshot {
  ownerId: string;
  activeListings: SwapListing[];
  ownListings: SwapListing[];
  incomingOffers: SwapOffer[];
  outgoingOffers: SwapOffer[];
  transactions: SwapTransaction[];
  loadedKeys: Set<string>;
  error: string | null;
}

const SwapContext = createContext<SwapContextType | undefined>(undefined);

function emptySwapSnapshot(ownerId: string): SwapSnapshot {
  return {
    ownerId,
    activeListings: [],
    ownListings: [],
    incomingOffers: [],
    outgoingOffers: [],
    transactions: [],
    loadedKeys: new Set(),
    error: null,
  };
}

export function SwapProvider({ children }: { children: React.ReactNode }) {
  const { user, isBackendConfigured } = useAuth();
  const { blockedUserIds, isLoading: isTrustSafetyLoading } = useTrustSafety();
  const [snapshot, setSnapshot] = useState<SwapSnapshot | null>(null);

  const isCloudBacked = Boolean(
    user && isBackendConfigured && !user.isDevelopmentDemo,
  );
  const activeOwnerId = user?.id ?? null;
  const currentSnapshot =
    activeOwnerId && snapshot?.ownerId === activeOwnerId ? snapshot : null;
  const activeListings = currentSnapshot?.activeListings ?? [];
  const ownListings = currentSnapshot?.ownListings ?? [];
  const incomingOffers = currentSnapshot?.incomingOffers ?? [];
  const outgoingOffers = currentSnapshot?.outgoingOffers ?? [];
  const transactions = currentSnapshot?.transactions ?? [];
  const error = currentSnapshot?.error ?? null;

  useEffect(() => {
    if (!user || !isCloudBacked) {
      return undefined;
    }

    const ownerId = user.id;

    const updateSnapshot = (
      key: string,
      update: (current: SwapSnapshot) => SwapSnapshot,
    ) => {
      setSnapshot((current) => {
        const base =
          current?.ownerId === ownerId ? current : emptySwapSnapshot(ownerId);
        const next = update(base);
        const loadedKeys = new Set(next.loadedKeys);
        loadedKeys.add(key);
        return { ...next, loadedKeys };
      });
    };

    const onSubscriptionError = (scope: string) => (subscriptionError: Error) => {
      console.error(`OmniSwap ${scope} subscription failed`, subscriptionError);
      updateSnapshot(scope, (current) => ({
        ...current,
        error: 'OmniSwap-Daten konnten nicht vollständig geladen werden.',
      }));
    };

    const unsubscribers = [
      subscribeToActiveSwapListings(
        (listings) => {
          updateSnapshot('active', (current) => ({
            ...current,
            activeListings: listings,
          }));
        },
        onSubscriptionError('active'),
      ),
      subscribeToOwnSwapListings(
        ownerId,
        (listings) => {
          updateSnapshot('own', (current) => ({
            ...current,
            ownListings: listings,
          }));
        },
        onSubscriptionError('own'),
      ),
      subscribeToIncomingSwapOffers(
        ownerId,
        (offers) => {
          updateSnapshot('incoming', (current) => ({
            ...current,
            incomingOffers: offers,
          }));
        },
        onSubscriptionError('incoming'),
      ),
      subscribeToOutgoingSwapOffers(
        ownerId,
        (offers) => {
          updateSnapshot('outgoing', (current) => ({
            ...current,
            outgoingOffers: offers,
          }));
        },
        onSubscriptionError('outgoing'),
      ),
      subscribeToSwapTransactions(
        ownerId,
        (nextTransactions) => {
          updateSnapshot('transactions', (current) => ({
            ...current,
            transactions: nextTransactions,
          }));
        },
        onSubscriptionError('transactions'),
      ),
    ];

    return () => {
      for (const unsubscribe of unsubscribers) {
        unsubscribe();
      }
    };
  }, [isCloudBacked, user]);

  const marketplaceListings = useMemo(
    () =>
      (currentSnapshot?.activeListings ?? []).filter(
        (listing) =>
          (!user || listing.ownerId !== user.id) &&
          !blockedUserIds.has(listing.ownerId),
      ),
    [blockedUserIds, currentSnapshot, user],
  );

  const requireCloud = () => {
    if (!user || !isCloudBacked) {
      throw new Error('SWAP_CLOUD_BACKEND_REQUIRED');
    }
  };

  const createListing = async (
    input: CreateSwapListingInput,
  ): Promise<string> => {
    requireCloud();
    const response = await createSwapListing(input);
    return response.listingId;
  };

  const changeListingStatus = async (
    input: SetSwapListingStatusInput,
  ): Promise<void> => {
    requireCloud();
    await setSwapListingStatus(input);
  };

  const sendOffer = async (input: SendSwapOfferInput): Promise<string> => {
    requireCloud();
    const response = await sendSwapOffer(input);
    return response.offerId;
  };

  const cancelOffer = async (input: CancelSwapOfferInput): Promise<void> => {
    requireCloud();
    await cancelSwapOffer(input);
  };

  const respondToOffer = async (
    input: RespondSwapOfferInput,
  ): Promise<string | null> => {
    requireCloud();
    const response = await respondSwapOffer(input);
    return response.transactionId;
  };

  const advanceTransaction = async (
    input: AdvanceSwapTransactionInput,
  ): Promise<void> => {
    requireCloud();
    await advanceSwapTransaction(input);
  };

  const isLoading = isCloudBacked
    ? !currentSnapshot ||
      currentSnapshot.loadedKeys.size < 5 ||
      isTrustSafetyLoading
    : false;

  return (
    <SwapContext.Provider
      value={{
        activeListings,
        ownListings,
        marketplaceListings,
        incomingOffers,
        outgoingOffers,
        transactions,
        isLoading,
        error,
        isCloudBacked,
        createListing,
        changeListingStatus,
        sendOffer,
        cancelOffer,
        respondToOffer,
        advanceTransaction,
      }}
    >
      {children}
    </SwapContext.Provider>
  );
}

export function useSwap(): SwapContextType {
  const context = useContext(SwapContext);
  if (!context) {
    throw new Error('useSwap must be used inside SwapProvider.');
  }
  return context;
}
