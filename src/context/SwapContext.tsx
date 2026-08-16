import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '@/context/AuthContext';
import {
  createSwapListing,
  subscribeToActiveSwapListings,
  subscribeToOwnSwapListings,
} from '@/features/swap/swap-listing-service';
import {
  respondSwapOffer,
  sendSwapOffer,
  subscribeToIncomingSwapOffers,
  subscribeToOutgoingSwapOffers,
  subscribeToSwapTransactions,
} from '@/features/swap/swap-trade-service';
import type {
  CreateSwapListingInput,
  RespondSwapOfferInput,
  SendSwapOfferInput,
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
  sendOffer: (input: SendSwapOfferInput) => Promise<string>;
  respondToOffer: (input: RespondSwapOfferInput) => Promise<string | null>;
}

const SwapContext = createContext<SwapContextType | undefined>(undefined);

export function SwapProvider({ children }: { children: React.ReactNode }) {
  const { user, isBackendConfigured } = useAuth();
  const [activeListings, setActiveListings] = useState<SwapListing[]>([]);
  const [ownListings, setOwnListings] = useState<SwapListing[]>([]);
  const [incomingOffers, setIncomingOffers] = useState<SwapOffer[]>([]);
  const [outgoingOffers, setOutgoingOffers] = useState<SwapOffer[]>([]);
  const [transactions, setTransactions] = useState<SwapTransaction[]>([]);
  const [loadedKeys, setLoadedKeys] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const isCloudBacked = Boolean(
    user && isBackendConfigured && !user.isDevelopmentDemo,
  );

  useEffect(() => {
    setError(null);
    setActiveListings([]);
    setOwnListings([]);
    setIncomingOffers([]);
    setOutgoingOffers([]);
    setTransactions([]);
    setLoadedKeys(new Set());

    const markLoaded = (key: string) => {
      setLoadedKeys((current) => {
        const next = new Set(current);
        next.add(key);
        return next;
      });
    };

    if (!user || !isCloudBacked) {
      setLoadedKeys(
        new Set(['active', 'own', 'incoming', 'outgoing', 'transactions']),
      );
      return undefined;
    }

    const onSubscriptionError = (scope: string) => (subscriptionError: Error) => {
      console.error(`OmniSwap ${scope} subscription failed`, subscriptionError);
      setError('OmniSwap-Daten konnten nicht vollständig geladen werden.');
      markLoaded(scope);
    };

    const unsubscribers = [
      subscribeToActiveSwapListings(
        (listings) => {
          setActiveListings(listings);
          markLoaded('active');
        },
        onSubscriptionError('active'),
      ),
      subscribeToOwnSwapListings(
        user.id,
        (listings) => {
          setOwnListings(listings);
          markLoaded('own');
        },
        onSubscriptionError('own'),
      ),
      subscribeToIncomingSwapOffers(
        user.id,
        (offers) => {
          setIncomingOffers(offers);
          markLoaded('incoming');
        },
        onSubscriptionError('incoming'),
      ),
      subscribeToOutgoingSwapOffers(
        user.id,
        (offers) => {
          setOutgoingOffers(offers);
          markLoaded('outgoing');
        },
        onSubscriptionError('outgoing'),
      ),
      subscribeToSwapTransactions(
        user.id,
        (nextTransactions) => {
          setTransactions(nextTransactions);
          markLoaded('transactions');
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
      activeListings.filter(
        (listing) => !user || listing.ownerId !== user.id,
      ),
    [activeListings, user],
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

  const sendOffer = async (input: SendSwapOfferInput): Promise<string> => {
    requireCloud();
    const response = await sendSwapOffer(input);
    return response.offerId;
  };

  const respondToOffer = async (
    input: RespondSwapOfferInput,
  ): Promise<string | null> => {
    requireCloud();
    const response = await respondSwapOffer(input);
    return response.transactionId;
  };

  return (
    <SwapContext.Provider
      value={{
        activeListings,
        ownListings,
        marketplaceListings,
        incomingOffers,
        outgoingOffers,
        transactions,
        isLoading: loadedKeys.size < 5,
        error,
        isCloudBacked,
        createListing,
        sendOffer,
        respondToOffer,
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
