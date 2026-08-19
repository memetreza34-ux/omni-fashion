import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useNotifications } from '@/context/NotificationContext';
import type {
  AppNotification,
  NotificationType,
} from '@/features/notifications/types';

function typeLabel(type: NotificationType): string {
  const labels: Record<NotificationType, string> = {
    swap_offer_received: 'Neues Tauschangebot',
    swap_offer_accepted: 'Angebot angenommen',
    swap_offer_declined: 'Angebot abgelehnt',
    swap_offer_cancelled: 'Angebot zurückgezogen',
    swap_mode_confirmed: 'Tauschweg bestätigt',
    swap_item_shipped: 'Versand bestätigt',
    swap_item_received: 'Empfang bestätigt',
    swap_completed: 'Tausch abgeschlossen',
    swap_disputed: 'Klärungsfall',
  };
  return labels[type];
}

function NotificationCard({
  notification,
  onMarkRead,
}: {
  notification: AppNotification;
  onMarkRead: (notificationId: string) => void;
}) {
  const unread = notification.readAt === null;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${typeLabel(notification.type)}: ${notification.title}`}
      accessibilityState={{ selected: unread }}
      onPress={() => (unread ? onMarkRead(notification.id) : undefined)}
      className={`rounded-2xl border p-4 mb-3 ${
        unread
          ? 'bg-indigo-500/10 border-indigo-500/30'
          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
      }`}
    >
      <View className="flex-row justify-between items-start mb-1">
        <Text className="text-indigo-700 dark:text-indigo-300 text-[10px] font-bold uppercase flex-1 pr-3">
          {typeLabel(notification.type)}
        </Text>
        {unread ? (
          <View className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
        ) : null}
      </View>
      <Text className="text-black dark:text-white font-extrabold text-base mt-1">
        {notification.title}
      </Text>
      <Text className="text-zinc-600 dark:text-zinc-400 text-sm mt-2 leading-6">
        {notification.body}
      </Text>
      <Text className="text-zinc-400 text-[10px] mt-3">
        {new Date(notification.createdAt).toLocaleString('de-DE')}
      </Text>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    isCloudBacked,
    markRead,
  } = useNotifications();

  if (!isCloudBacked) {
    return (
      <View className="flex-1 bg-zinc-50 dark:bg-zinc-950 pt-16 px-4">
        <Text className="text-black dark:text-white text-3xl font-black">
          Aktivität
        </Text>
        <View className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 mt-5">
          <Text className="text-amber-700 dark:text-amber-300 font-bold">
            Aktivität benötigt das echte Cloud-Backend
          </Text>
          <Text className="text-zinc-600 dark:text-zinc-400 text-sm mt-2 leading-6">
            Im Development-Demo-Modus werden keine erfundenen Benachrichtigungen
            angezeigt.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950 pt-16 px-4">
      <View className="flex-row justify-between items-end mb-5">
        <View>
          <Text className="text-black dark:text-white text-3xl font-black">
            Aktivität
          </Text>
          <Text className="text-zinc-500 text-xs mt-1">
            {unreadCount} ungelesen
          </Text>
        </View>
      </View>

      {error ? (
        <View
          accessibilityRole="alert"
          className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4"
        >
          <Text className="text-red-500 text-xs">{error}</Text>
        </View>
      ) : null}

      {isLoading ? (
        <View
          accessibilityRole="progressbar"
          accessibilityLabel="Aktivität wird geladen"
          className="flex-1 items-center justify-center"
        >
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(notification) => notification.id}
          renderItem={({ item }) => (
            <NotificationCard
              notification={item}
              onMarkRead={(notificationId) => void markRead(notificationId)}
            />
          )}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={7}
          removeClippedSubviews
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
          ListEmptyComponent={
            <View className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 items-center">
              <Text className="text-black dark:text-white font-bold text-lg">
                Noch keine Aktivität
              </Text>
              <Text className="text-zinc-500 text-sm text-center mt-2 leading-6">
                Echte OmniSwap-Ereignisse erscheinen hier automatisch.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
