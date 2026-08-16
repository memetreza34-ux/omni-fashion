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
import type {
  CreateSwapListingInput,
  SwapListing,
} from '@/features/swap/types';

interface SwapContextType {
  activeListings: SwapListing[];
  ownListings: SwapListing[];
  marketplaceListings: SwapListing[];
  isLoading: boolean;
  error: string | null;
  isCloudBacked: boolean;
  createListing: (input: CreateSwapListingInput) => Promise<string>;
}

const SwapContext = createContext<SwapContextType | undefined>(undefined);

export function SwapProvider({ children }: { children: React.ReactNode }) {
  const { user, isBackendConfigured } = useAuth();
  const [activeListings, setActiveListings] = useState<SwapListing[]>([]);
  const [ownListings, setOwnListings] = useState<SwapListing[]>([]);
  const [activeLoaded, setActiveLoaded] = useState(false);
  const [ownLoaded, setOwnLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCloudBacked = Boolean(
    user && isBackendConfigured && !user.isDevelopmentDemo,
  );

  useEffect(() => {
    setError(null);
    setActiveListings([]);
    setOwnListings([]);
    setActiveLoaded(false);
    setOwnLoaded(false);

    if (!user || !isCloudBacked) {
      setActiveLoaded(true);
      setOwnLoaded(true);
      return undefined;
    }

    const onSubscriptionError = (subscriptionError: Error) => {
      console.error('OmniSwap listing subscription failed', subscriptionError);
      setError('OmniSwap-Listings konnten nicht geladen werden.');
      setActiveLoaded(true);
      setOwnLoaded(true);
    };

    const unsubscribeActive = subscribeToActiveSwapListings(
      (listings) => {
        setActiveListings(listings);
        setActiveLoaded(true);
      },
      onSubscriptionError,
    );
    const unsubscribeOwn = subscribeToOwnSwapListings(
      user.id,
      (listings) => {
        setOwnListings(listings);
        setOwnLoaded(true);
      },
      onSubscriptionError,
    );

    return () => {
      unsubscribeActive();
      unsubscribeOwn();
    };
  }, [isCloudBacked, user]);

  const marketplaceListings = useMemo(
    () =>
      activeListings.filter(
        (listing) => !user || listing.ownerId !== user.id,
      ),
    [activeListings, user],
  );

  const createListing = async (
    input: CreateSwapListingInput,
  ): Promise<string> => {
    if (!user || !isCloudBacked) {
      throw new Error('SWAP_CLOUD_BACKEND_REQUIRED');
    }

    const response = await createSwapListing(input);
    return response.listingId;
  };

  return (
    <SwapContext.Provider
      value={{
        activeListings,
        ownListings,
        marketplaceListings,
        isLoading: !activeLoaded || !ownLoaded,
        error,
        isCloudBacked,
        createListing,
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
