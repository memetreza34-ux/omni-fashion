import { ActivityIndicator, Text, View } from 'react-native';

import { AppButton } from '@/design-system/AppButton';
import { StatusBanner } from '@/design-system/StatusBanner';
import { SwapReviewAction } from '@/features/reviews/components/SwapReviewAction';
import { SwapDisputeAction } from '@/features/trust-safety/components/SwapDisputeAction';

import type {
  AdvanceSwapTransactionAction,
  SwapOffer,
  SwapTransaction,
} from '../types';

function modeLabel(mode: SwapTransaction['fulfilmentMode']): string {
  if (mode === 'shipping') {
    return 'Versand';
  }
  if (mode === 'meetup') {
    return 'Persönliche Übergabe';
  }
  return 'Noch nicht festgelegt';
}

export function SwapTransactionCard({
  transaction,
  offer,
  currentUserId,
  busy,
  onAdvance,
}: {
  transaction: SwapTransaction;
  offer: SwapOffer | null;
  currentUserId: string;
  busy: boolean;
  onAdvance: (action: AdvanceSwapTransactionAction) => Promise<void>;
}) {
  const bothModeConfirmed = transaction.participantIds.every((id) =>
    transaction.modeConfirmedByIds.includes(id),
  );
  const userConfirmedMode = transaction.modeConfirmedByIds.includes(currentUserId);
  const userShipped = transaction.shippedByIds.includes(currentUserId);
  const userReceived = transaction.receivedByIds.includes(currentUserId);
  const counterpartId = transaction.participantIds.find(
    (id) => id !== currentUserId,
  );
  const counterpartShipped = counterpartId
    ? transaction.shippedByIds.includes(counterpartId)
    : false;

  const requestedTitle = offer?.requestedSnapshot.title ?? 'Angefragtes Teil';
  const offeredTitle = offer?.offeredSnapshot.title ?? 'Angebotenes Teil';
  const tradeLabel = `${requestedTitle} gegen ${offeredTitle}`;

  if (transaction.status === 'disputed') {
    return <SwapDisputeAction transaction={transaction} />;
  }

  if (transaction.status === 'completed') {
    return (
      <>
        <View className="mb-3">
          <StatusBanner
            tone="success"
            title="Trade abgeschlossen"
            message="Beide Empfänge wurden bestätigt. OmniSwap hat Eigentum und private Wardrobe-Bilder serverseitig in die neuen Schränke übertragen."
          />
        </View>
        <SwapReviewAction
          transaction={transaction}
          currentUserId={currentUserId}
        />
      </>
    );
  }

  return (
    <>
      <View
        accessibilityLabel={`Trade ${transaction.id.slice(0, 6)}, ${tradeLabel}, Tauschweg ${modeLabel(transaction.fulfilmentMode)}`}
        className="bg-indigo-500/10 border border-indigo-500/25 rounded-2xl p-4 mb-3"
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 pr-3">
            <Text className="text-indigo-900 dark:text-indigo-100 font-extrabold">
              Trade #{transaction.id.slice(0, 6)}
            </Text>
            <Text className="text-zinc-600 dark:text-zinc-400 text-xs mt-1">
              {requestedTitle} ↔ {offeredTitle}
            </Text>
          </View>
          <View className="bg-indigo-500/15 rounded-full px-3 py-1.5">
            <Text className="text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
              {modeLabel(transaction.fulfilmentMode)}
            </Text>
          </View>
        </View>

        <View className="bg-white/70 dark:bg-zinc-900/60 rounded-xl p-3 mb-3">
          <View className="flex-row justify-between mb-1">
            <Text className="text-zinc-500 text-xs">Modus bestätigt</Text>
            <Text className="text-black dark:text-white text-xs font-bold">
              {transaction.modeConfirmedByIds.length}/2
            </Text>
          </View>
          {transaction.fulfilmentMode === 'shipping' ? (
            <View className="flex-row justify-between mb-1">
              <Text className="text-zinc-500 text-xs">Versendet</Text>
              <Text className="text-black dark:text-white text-xs font-bold">
                {transaction.shippedByIds.length}/2
              </Text>
            </View>
          ) : null}
          <View className="flex-row justify-between">
            <Text className="text-zinc-500 text-xs">Erhalten bestätigt</Text>
            <Text className="text-black dark:text-white text-xs font-bold">
              {transaction.receivedByIds.length}/2
            </Text>
          </View>
        </View>

        {transaction.finalizationState === 'processing' ||
        transaction.finalizationState === 'ready' ? (
          <View
            accessibilityRole="progressbar"
            accessibilityLabel="Eigentumsübertragung wird abgeschlossen"
            className="flex-row items-center bg-white dark:bg-zinc-900 rounded-xl p-3"
          >
            <ActivityIndicator size="small" color="#4f46e5" />
            <Text className="text-zinc-600 dark:text-zinc-300 text-xs ml-3 flex-1 leading-5">
              Beide Empfänge sind bestätigt. Die private Zwei-Wege-Eigentumsübertragung wird sicher abgeschlossen.
            </Text>
          </View>
        ) : null}

        {transaction.finalizationState === 'failed' ? (
          <View className="mb-3">
            <StatusBanner
              tone="danger"
              title="Eigentumsübertragung nicht abgeschlossen"
              message="Die vorhandenen Wardrobe-Daten werden nicht als erfolgreich übertragen markiert. Du kannst den serverseitigen Abschluss erneut versuchen."
            />
            <View className="mt-3">
              <AppButton
                label="Abschluss erneut versuchen"
                accessibilityLabel={`Eigentumsübertragung für ${tradeLabel} erneut versuchen`}
                variant="danger"
                loading={busy}
                onPress={() => void onAdvance({ type: 'retry_finalize' })}
              />
            </View>
          </View>
        ) : null}

        {transaction.finalizationState === 'pending' && !userConfirmedMode ? (
          <View>
            <Text className="text-zinc-700 dark:text-zinc-300 text-xs font-bold mb-2">
              Tauschweg bestätigen
            </Text>
            <View className="flex-row">
              {(transaction.fulfilmentMode === null ||
                transaction.fulfilmentMode === 'shipping') &&
              transaction.shippingEnabled ? (
                <View className="flex-1 mr-2">
                  <AppButton
                    label="Versand"
                    accessibilityLabel={`Versand als Tauschweg bestätigen für ${tradeLabel}`}
                    loading={busy}
                    onPress={() =>
                      void onAdvance({ type: 'confirm_mode', mode: 'shipping' })
                    }
                  />
                </View>
              ) : null}
              {(transaction.fulfilmentMode === null ||
                transaction.fulfilmentMode === 'meetup') &&
              transaction.meetupEnabled ? (
                <View className="flex-1">
                  <AppButton
                    label="Übergabe"
                    accessibilityLabel={`Persönliche Übergabe als Tauschweg bestätigen für ${tradeLabel}`}
                    variant="secondary"
                    loading={busy}
                    onPress={() =>
                      void onAdvance({ type: 'confirm_mode', mode: 'meetup' })
                    }
                  />
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {transaction.finalizationState === 'pending' &&
        userConfirmedMode &&
        !bothModeConfirmed ? (
          <Text className="text-zinc-600 dark:text-zinc-400 text-xs leading-5">
            Du hast {modeLabel(transaction.fulfilmentMode)} bestätigt. OmniSwap wartet auf die Bestätigung der anderen Person.
          </Text>
        ) : null}

        {transaction.finalizationState === 'pending' &&
        bothModeConfirmed &&
        transaction.fulfilmentMode === 'shipping' ? (
          <View>
            {!userShipped ? (
              <View className="mb-2">
                <AppButton
                  label="Ich habe mein Teil versendet"
                  accessibilityLabel={`Versand bestätigen für ${tradeLabel}`}
                  loading={busy}
                  onPress={() => void onAdvance({ type: 'mark_shipped' })}
                />
              </View>
            ) : (
              <Text className="text-zinc-600 dark:text-zinc-400 text-xs mb-2">
                Dein Versand ist bestätigt.
              </Text>
            )}

            {!userReceived && counterpartShipped ? (
              <AppButton
                label="Ich habe das andere Teil erhalten"
                accessibilityLabel={`Empfang bestätigen für ${tradeLabel}`}
                loading={busy}
                onPress={() => void onAdvance({ type: 'mark_received' })}
              />
            ) : !userReceived ? (
              <Text className="text-zinc-500 text-xs leading-5">
                Die Empfangsbestätigung wird freigeschaltet, sobald die andere Person ihren Versand bestätigt hat.
              </Text>
            ) : (
              <Text className="text-zinc-600 dark:text-zinc-400 text-xs">
                Dein Empfang ist bestätigt. OmniSwap wartet gegebenenfalls noch auf die andere Seite.
              </Text>
            )}
          </View>
        ) : null}

        {transaction.finalizationState === 'pending' &&
        bothModeConfirmed &&
        transaction.fulfilmentMode === 'meetup' ? (
          <View>
            {!userReceived ? (
              <AppButton
                label="Übergabe erhalten bestätigen"
                accessibilityLabel={`Persönliche Übergabe als erhalten bestätigen für ${tradeLabel}`}
                loading={busy}
                onPress={() => void onAdvance({ type: 'mark_received' })}
              />
            ) : (
              <Text className="text-zinc-600 dark:text-zinc-400 text-xs leading-5">
                Deine Übergabe ist bestätigt. OmniSwap wartet auf die Bestätigung der anderen Person.
              </Text>
            )}
          </View>
        ) : null}
      </View>

      <SwapDisputeAction transaction={transaction} />
    </>
  );
}
