import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useSwap } from '@/context/SwapContext';
import { useWardrobe } from '@/context/WardrobeContext';
import { CreateSwapListingModal } from '@/features/swap/components/CreateSwapListingModal';
import { SendSwapOfferModal } from '@/features/swap/components/SendSwapOfferModal';
import type {
  SetSwapListingStatusInput,
  SwapListing,
  SwapOffer,
} from '@/features/swap/types';

function money(valueCents: number | null): string | null {
  if (valueCents === null) {
    return null;
  }
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(valueCents / 100);
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Aktiv',
    paused: 'Pausiert',
    reserved: 'Reserviert',
    traded: 'Getauscht',
    removed: 'Entfernt',
    sent: 'Gesendet',
    accepted: 'Angenommen',
    declined: 'Abgelehnt',
    cancelled: 'Storniert',
    expired: 'Abgelaufen',
    address_or_meetup: 'Übergabe planen',
    shipped: 'Versendet',
    received: 'Erhalten',
    completed: 'Abgeschlossen',
    disputed: 'Klärungsfall',
  };
  return labels[status] ?? status;
}

function ListingCard({
  listing,
  actionLabel,
  onAction,
  ownerActions,
  busy,
}: {
  listing: SwapListing;
  actionLabel?: string;
  onAction?: () => void;
  ownerActions?: {
    primaryLabel: string;
    onPrimary: () => void;
    onRemove: () => void;
  } | null;
  busy?: boolean;
}) {
  const value = money(listing.estimatedValueCents);

  return (
    <View className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden mb-4">
      <View className="h-64 bg-zinc-100 dark:bg-zinc-800 items-center justify-center">
        {listing.publicImageUrl ? (
          <Image
            source={{ uri: listing.publicImageUrl }}
            className="w-full h-full"
            resizeMode="contain"
          />
        ) : (
          <Text className="text-zinc-400">Bild nicht verfügbar</Text>
        )}
      </View>
      <View className="p-5">
        <View className="flex-row justify-between items-start">
          <View className="flex-1 pr-3">
            <Text className="text-black dark:text-white text-xl font-extrabold">
              {listing.title}
            </Text>
            <Text className="text-zinc-500 text-xs mt-1">
              {listing.category} · {listing.color}
              {listing.size ? ` · Größe ${listing.size}` : ''}
            </Text>
          </View>
          <View className="bg-zinc-100 dark:bg-zinc-800 rounded-full px-3 py-1.5">
            <Text className="text-zinc-600 dark:text-zinc-300 text-[10px] font-bold">
              {statusLabel(listing.status)}
            </Text>
          </View>
        </View>

        {listing.description ? (
          <Text className="text-zinc-600 dark:text-zinc-300 text-sm mt-4 leading-6">
            {listing.description}
          </Text>
        ) : null}

        <View className="flex-row flex-wrap mt-4">
          <View className="bg-indigo-500/10 rounded-full px-3 py-2 mr-2 mb-2">
            <Text className="text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
              {listing.city}
            </Text>
          </View>
          {listing.shippingEnabled ? (
            <View className="bg-zinc-100 dark:bg-zinc-800 rounded-full px-3 py-2 mr-2 mb-2">
              <Text className="text-zinc-600 dark:text-zinc-300 text-xs">
                Versand
              </Text>
            </View>
          ) : null}
          {listing.meetupEnabled ? (
            <View className="bg-zinc-100 dark:bg-zinc-800 rounded-full px-3 py-2 mr-2 mb-2">
              <Text className="text-zinc-600 dark:text-zinc-300 text-xs">
                Übergabe
              </Text>
            </View>
          ) : null}
          {value ? (
            <View className="bg-emerald-500/10 rounded-full px-3 py-2 mb-2">
              <Text className="text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                Schätzwert {value}
              </Text>
            </View>
          ) : null}
        </View>

        {actionLabel && onAction ? (
          <TouchableOpacity
            onPress={onAction}
            className="bg-indigo-600 rounded-2xl py-4 items-center mt-3"
          >
            <Text className="text-white font-extrabold">{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}

        {ownerActions ? (
          <View className="flex-row mt-3">
            <TouchableOpacity
              onPress={ownerActions.onPrimary}
              disabled={busy}
              className="flex-1 bg-zinc-900 dark:bg-white rounded-xl py-3 items-center mr-2"
            >
              {busy ? (
                <ActivityIndicator size="small" color="#71717a" />
              ) : (
                <Text className="text-white dark:text-black font-bold text-xs">
                  {ownerActions.primaryLabel}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={ownerActions.onRemove}
              disabled={busy}
              className="flex-1 bg-red-500/10 border border-red-500/30 rounded-xl py-3 items-center"
            >
              <Text className="text-red-500 font-bold text-xs">Entfernen</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function OfferCard({
  offer,
  incoming,
  onAccept,
  onDecline,
  onCancel,
  busy,
}: {
  offer: SwapOffer;
  incoming: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
  busy?: boolean;
}) {
  return (
    <View className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 mb-3">
      <View className="flex-row justify-between items-start mb-3">
        <Text className="text-black dark:text-white font-bold flex-1 pr-3">
          {incoming ? 'Eingehendes Angebot' : 'Dein Angebot'}
        </Text>
        <Text className="text-zinc-500 text-xs font-bold">
          {statusLabel(offer.status)}
        </Text>
      </View>
      <Text className="text-zinc-500 text-[11px] uppercase font-bold mb-1">
        Gewünschtes Teil
      </Text>
      <Text className="text-black dark:text-white text-sm font-semibold">
        {offer.requestedSnapshot.title}
      </Text>
      <Text className="text-zinc-500 text-xs mt-1 mb-3">
        {offer.requestedSnapshot.category} · {offer.requestedSnapshot.color}
      </Text>
      <Text className="text-zinc-500 text-[11px] uppercase font-bold mb-1">
        Angebot
      </Text>
      <Text className="text-black dark:text-white text-sm font-semibold">
        {offer.offeredSnapshot.title}
      </Text>
      <Text className="text-zinc-500 text-xs mt-1">
        {offer.offeredSnapshot.category} · {offer.offeredSnapshot.color}
      </Text>

      {incoming && offer.status === 'sent' && onAccept && onDecline ? (
        <View className="flex-row mt-4">
          <TouchableOpacity
            onPress={onAccept}
            disabled={busy}
            className="flex-1 bg-emerald-600 rounded-xl py-3 items-center mr-2"
          >
            {busy ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-white font-bold text-xs">Annehmen</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDecline}
            disabled={busy}
            className="flex-1 bg-red-500/10 border border-red-500/30 rounded-xl py-3 items-center"
          >
            <Text className="text-red-500 font-bold text-xs">Ablehnen</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!incoming && offer.status === 'sent' && onCancel ? (
        <TouchableOpacity
          onPress={onCancel}
          disabled={busy}
          className="bg-zinc-100 dark:bg-zinc-800 rounded-xl py-3 items-center mt-4"
        >
          {busy ? (
            <ActivityIndicator size="small" color="#71717a" />
          ) : (
            <Text className="text-zinc-700 dark:text-zinc-200 font-bold text-xs">
              Angebot zurückziehen
            </Text>
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function SwapScreen() {
  const { items } = useWardrobe();
  const {
    marketplaceListings,
    ownListings,
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
  } = useSwap();
  const [tab, setTab] = useState<'market' | 'mine' | 'trades'>('market');
  const [listingModalVisible, setListingModalVisible] = useState(false);
  const [offerTarget, setOfferTarget] = useState<SwapListing | null>(null);
  const [respondingOfferId, setRespondingOfferId] = useState<string | null>(null);
  const [changingListingId, setChangingListingId] = useState<string | null>(null);
  const [cancellingOfferId, setCancellingOfferId] = useState<string | null>(null);

  const lockedOfferedIds = useMemo(
    () =>
      new Set(
        outgoingOffers
          .filter((offer) => offer.status === 'sent' || offer.status === 'accepted')
          .map((offer) => offer.offeredWardrobeItemId),
      ),
    [outgoingOffers],
  );

  const eligibleListingItems = items.filter(
    (item) =>
      item.imagePath &&
      !item.isListedForSwap &&
      !lockedOfferedIds.has(item.id),
  );
  const eligibleOfferItems = eligibleListingItems;

  const handleRespond = async (
    offer: SwapOffer,
    decision: 'accept' | 'decline',
  ) => {
    if (respondingOfferId) {
      return;
    }

    setRespondingOfferId(offer.id);
    try {
      const transactionId = await respondToOffer({ offerId: offer.id, decision });
      if (decision === 'accept') {
        Alert.alert(
          'Tausch reserviert',
          transactionId
            ? 'OmniSwap hat eine echte Trade-Transaktion angelegt. Der nächste Schritt ist die sichere Übergabe-/Versandabwicklung.'
            : 'Das Angebot wurde angenommen.',
        );
      }
    } catch (respondError: unknown) {
      console.error('Failed to respond to OmniSwap offer', respondError);
      Alert.alert(
        'Antwort nicht gespeichert',
        'Der Status wurde nicht verändert. Bitte erneut versuchen.',
      );
    } finally {
      setRespondingOfferId(null);
    }
  };

  const runListingAction = async (
    listing: SwapListing,
    action: SetSwapListingStatusInput['action'],
  ) => {
    if (changingListingId) {
      return;
    }

    setChangingListingId(listing.id);
    try {
      await changeListingStatus({ listingId: listing.id, action });
    } catch (actionError: unknown) {
      console.error('Failed to change OmniSwap listing status', actionError);
      Alert.alert(
        'Listing nicht geändert',
        'Der bisherige Status bleibt bestehen. Bitte erneut versuchen.',
      );
    } finally {
      setChangingListingId(null);
    }
  };

  const confirmListingRemoval = (listing: SwapListing) => {
    Alert.alert(
      'Listing entfernen?',
      'Das öffentliche Listing-Bild wird entfernt und das Kleidungsstück wieder für deinen privaten Schrank freigegeben. Offene Angebote laufen ab.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Entfernen',
          style: 'destructive',
          onPress: () => void runListingAction(listing, 'remove'),
        },
      ],
    );
  };

  const handleCancelOffer = async (offer: SwapOffer) => {
    if (cancellingOfferId) {
      return;
    }

    setCancellingOfferId(offer.id);
    try {
      await cancelOffer({ offerId: offer.id });
    } catch (cancelError: unknown) {
      console.error('Failed to cancel OmniSwap offer', cancelError);
      Alert.alert(
        'Angebot nicht zurückgezogen',
        'Das Angebot bleibt offen. Bitte erneut versuchen.',
      );
    } finally {
      setCancellingOfferId(null);
    }
  };

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950 pt-16 px-4">
      <View className="flex-row justify-between items-start mb-5">
        <View className="flex-1 pr-3">
          <Text className="text-black dark:text-white text-3xl font-black">
            OmniSwap
          </Text>
          <Text className="text-zinc-500 text-xs mt-1">
            Echte Wardrobe-Listings und servergeschützte Tauschangebote.
          </Text>
        </View>
        {isCloudBacked ? (
          <TouchableOpacity
            onPress={() => setListingModalVisible(true)}
            className="bg-indigo-600 rounded-xl px-4 py-3"
          >
            <Text className="text-white font-bold text-xs">Teil listen</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {!isCloudBacked ? (
        <View className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5">
          <Text className="text-amber-700 dark:text-amber-300 font-bold">
            OmniSwap benötigt das echte Cloud-Backend
          </Text>
          <Text className="text-zinc-600 dark:text-zinc-400 text-sm mt-2 leading-6">
            Im Development-Demo-Modus werden keine erfundenen Marketplace-Nutzer, Listings oder Trades mehr angezeigt.
          </Text>
        </View>
      ) : (
        <>
          <View className="flex-row bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1 mb-4">
            {([
              ['market', 'Marktplatz'],
              ['mine', `Meine Listings (${ownListings.length})`],
              ['trades', `Trades (${incomingOffers.length + outgoingOffers.length})`],
            ] as const).map(([value, label]) => (
              <TouchableOpacity
                key={value}
                onPress={() => setTab(value)}
                className={`flex-1 py-3 rounded-xl items-center ${
                  tab === value ? 'bg-black dark:bg-white' : ''
                }`}
              >
                <Text
                  className={
                    tab === value
                      ? 'text-white dark:text-black text-[11px] font-bold'
                      : 'text-zinc-500 text-[11px] font-bold'
                  }
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {error ? (
            <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
              <Text className="text-red-500 text-xs">{error}</Text>
            </View>
          ) : null}

          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#4f46e5" />
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              {tab === 'market' ? (
                marketplaceListings.length > 0 ? (
                  marketplaceListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      actionLabel="Tausch anbieten"
                      onAction={() => setOfferTarget(listing)}
                    />
                  ))
                ) : (
                  <View className="bg-white dark:bg-zinc-900 rounded-3xl p-8 items-center border border-zinc-200 dark:border-zinc-800">
                    <Text className="text-black dark:text-white font-bold text-lg">
                      Noch keine fremden aktiven Listings
                    </Text>
                    <Text className="text-zinc-500 text-sm text-center mt-2 leading-6">
                      Der Feed bleibt leer, bis echte Nutzer Kleidungsstücke veröffentlichen.
                    </Text>
                  </View>
                )
              ) : null}

              {tab === 'mine' ? (
                <>
                  {ownListings.length === 0 ? (
                    <View className="bg-white dark:bg-zinc-900 rounded-3xl p-8 items-center border border-zinc-200 dark:border-zinc-800">
                      <Text className="text-black dark:text-white font-bold text-lg">
                        Noch nichts gelistet
                      </Text>
                      <Text className="text-zinc-500 text-sm text-center mt-2 leading-6 mb-4">
                        Wähle ein noch verfügbares Kleidungsstück aus deinem Schrank.
                      </Text>
                      <TouchableOpacity
                        onPress={() => setListingModalVisible(true)}
                        className="bg-indigo-600 rounded-xl px-5 py-3"
                      >
                        <Text className="text-white font-bold">Erstes Listing</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    ownListings.map((listing) => {
                      const ownerActions =
                        listing.status === 'active'
                          ? {
                              primaryLabel: 'Pausieren',
                              onPrimary: () =>
                                void runListingAction(listing, 'pause'),
                              onRemove: () => confirmListingRemoval(listing),
                            }
                          : listing.status === 'paused'
                            ? {
                                primaryLabel: 'Reaktivieren',
                                onPrimary: () =>
                                  void runListingAction(listing, 'resume'),
                                onRemove: () => confirmListingRemoval(listing),
                              }
                            : null;

                      return (
                        <ListingCard
                          key={listing.id}
                          listing={listing}
                          ownerActions={ownerActions}
                          busy={changingListingId === listing.id}
                        />
                      );
                    })
                  )}
                </>
              ) : null}

              {tab === 'trades' ? (
                <>
                  <Text className="text-black dark:text-white text-xl font-extrabold mb-3">
                    Eingehend
                  </Text>
                  {incomingOffers.length === 0 ? (
                    <Text className="text-zinc-500 text-sm mb-6">
                      Noch keine eingehenden Angebote.
                    </Text>
                  ) : (
                    incomingOffers.map((offer) => (
                      <OfferCard
                        key={offer.id}
                        offer={offer}
                        incoming
                        busy={respondingOfferId === offer.id}
                        onAccept={() => void handleRespond(offer, 'accept')}
                        onDecline={() => void handleRespond(offer, 'decline')}
                      />
                    ))
                  )}

                  <Text className="text-black dark:text-white text-xl font-extrabold mt-4 mb-3">
                    Ausgehend
                  </Text>
                  {outgoingOffers.length === 0 ? (
                    <Text className="text-zinc-500 text-sm mb-6">
                      Du hast noch keine Tauschangebote gesendet.
                    </Text>
                  ) : (
                    outgoingOffers.map((offer) => (
                      <OfferCard
                        key={offer.id}
                        offer={offer}
                        incoming={false}
                        busy={cancellingOfferId === offer.id}
                        onCancel={() => void handleCancelOffer(offer)}
                      />
                    ))
                  )}

                  <Text className="text-black dark:text-white text-xl font-extrabold mt-4 mb-3">
                    Transaktionen
                  </Text>
                  {transactions.length === 0 ? (
                    <Text className="text-zinc-500 text-sm">
                      Noch keine angenommenen Trades.
                    </Text>
                  ) : (
                    transactions.map((transaction) => (
                      <View
                        key={transaction.id}
                        className="bg-indigo-500/10 border border-indigo-500/25 rounded-2xl p-4 mb-3"
                      >
                        <View className="flex-row justify-between items-center">
                          <Text className="text-indigo-800 dark:text-indigo-200 font-bold">
                            Trade #{transaction.id.slice(0, 6)}
                          </Text>
                          <Text className="text-indigo-600 dark:text-indigo-300 text-xs font-bold">
                            {statusLabel(transaction.status)}
                          </Text>
                        </View>
                        <Text className="text-zinc-600 dark:text-zinc-400 text-xs mt-2 leading-5">
                          Eigentum wird erst nach einer beidseitig bestätigten Übergabe und sicherer Migration der privaten Bilder übertragen.
                        </Text>
                      </View>
                    ))
                  )}
                </>
              ) : null}
            </ScrollView>
          )}
        </>
      )}

      <CreateSwapListingModal
        visible={listingModalVisible}
        items={eligibleListingItems}
        onClose={() => setListingModalVisible(false)}
        onCreate={createListing}
      />

      <SendSwapOfferModal
        visible={offerTarget !== null}
        listing={offerTarget}
        eligibleItems={eligibleOfferItems}
        onClose={() => setOfferTarget(null)}
        onSend={async (listingId, wardrobeItemId) =>
          sendOffer({
            requestedListingId: listingId,
            offeredWardrobeItemId: wardrobeItemId,
          })
        }
      />
    </View>
  );
}
