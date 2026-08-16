import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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

  if (transaction.status === 'completed') {
    return (
      <View className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 mb-3">
        <Text className="text-emerald-800 dark:text-emerald-200 font-extrabold">
          Trade abgeschlossen
        </Text>
        <Text className="text-zinc-600 dark:text-zinc-400 text-xs mt-2 leading-5">
          Beide Empfänge wurden bestätigt. OmniSwap hat Eigentum und private Wardrobe-Bilder serverseitig in die neuen Schränke übertragen.
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-indigo-500/10 border border-indigo-500/25 rounded-2xl p-4 mb-3">
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
        <View className="flex-row items-center bg-white dark:bg-zinc-900 rounded-xl p-3">
          <ActivityIndicator size="small" color="#4f46e5" />
          <Text className="text-zinc-600 dark:text-zinc-300 text-xs ml-3 flex-1 leading-5">
            Beide Empfänge sind bestätigt. Die private Zwei-Wege-Eigentumsübertragung wird sicher abgeschlossen.
          </Text>
        </View>
      ) : null}

      {transaction.finalizationState === 'failed' ? (
        <View className="bg-red-500/10 border border-red-500/25 rounded-xl p-3 mb-3">
          <Text className="text-red-600 dark:text-red-300 font-bold text-xs">
            Eigentumsübertragung nicht abgeschlossen
          </Text>
          <Text className="text-zinc-600 dark:text-zinc-400 text-xs mt-1 leading-5">
            Die vorhandenen Wardrobe-Daten werden nicht als erfolgreich übertragen markiert. Du kannst den serverseitigen Abschluss erneut versuchen.
          </Text>
          <TouchableOpacity
            onPress={() => void onAdvance({ type: 'retry_finalize' })}
            disabled={busy}
            className="bg-red-600 rounded-xl py-3 items-center mt-3"
          >
            {busy ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-white font-bold text-xs">
                Abschluss erneut versuchen
              </Text>
            )}
          </TouchableOpacity>
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
              <TouchableOpacity
                onPress={() =>
                  void onAdvance({ type: 'confirm_mode', mode: 'shipping' })
                }
                disabled={busy}
                className="flex-1 bg-indigo-600 rounded-xl py-3 items-center mr-2"
              >
                <Text className="text-white font-bold text-xs">Versand</Text>
              </TouchableOpacity>
            ) : null}
            {(transaction.fulfilmentMode === null ||
              transaction.fulfilmentMode === 'meetup') &&
            transaction.meetupEnabled ? (
              <TouchableOpacity
                onPress={() =>
                  void onAdvance({ type: 'confirm_mode', mode: 'meetup' })
                }
                disabled={busy}
                className="flex-1 bg-zinc-900 dark:bg-white rounded-xl py-3 items-center"
              >
                <Text className="text-white dark:text-black font-bold text-xs">
                  Übergabe
                </Text>
              </TouchableOpacity>
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
            <TouchableOpacity
              onPress={() => void onAdvance({ type: 'mark_shipped' })}
              disabled={busy}
              className="bg-indigo-600 rounded-xl py-3 items-center mb-2"
            >
              {busy ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-white font-bold text-xs">
                  Ich habe mein Teil versendet
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <Text className="text-zinc-600 dark:text-zinc-400 text-xs mb-2">
              Dein Versand ist bestätigt.
            </Text>
          )}

          {!userReceived && counterpartShipped ? (
            <TouchableOpacity
              onPress={() => void onAdvance({ type: 'mark_received' })}
              disabled={busy}
              className="bg-emerald-600 rounded-xl py-3 items-center"
            >
              <Text className="text-white font-bold text-xs">
                Ich habe das andere Teil erhalten
              </Text>
            </TouchableOpacity>
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
            <TouchableOpacity
              onPress={() => void onAdvance({ type: 'mark_received' })}
              disabled={busy}
              className="bg-emerald-600 rounded-xl py-3 items-center"
            >
              {busy ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-white font-bold text-xs">
                  Übergabe erhalten bestätigen
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <Text className="text-zinc-600 dark:text-zinc-400 text-xs leading-5">
              Deine Übergabe ist bestätigt. OmniSwap wartet auf die Bestätigung der anderen Person.
            </Text>
          )}
        </View>
      ) : null}
    </View>
  );
}
