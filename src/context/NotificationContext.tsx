import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { useAuth } from '@/context/AuthContext';
import {
  markNotificationRead,
  subscribeToNotifications,
} from '@/features/notifications/notification-service';
import type { AppNotification } from '@/features/notifications/types';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  isCloudBacked: boolean;
  markRead: (notificationId: string) => Promise<void>;
}

interface NotificationSnapshot {
  ownerId: string;
  notifications: AppNotification[];
  isLoading: boolean;
  error: string | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isBackendConfigured } = useAuth();
  const [snapshot, setSnapshot] = useState<NotificationSnapshot | null>(null);

  const isCloudBacked = Boolean(
    user && isBackendConfigured && !user.isDevelopmentDemo,
  );
  const activeOwnerId = user?.id ?? null;
  const currentSnapshot =
    activeOwnerId && snapshot?.ownerId === activeOwnerId ? snapshot : null;
  const notifications = currentSnapshot?.notifications ?? [];
  const isLoading = Boolean(activeOwnerId && isCloudBacked && !currentSnapshot)
    ? true
    : (currentSnapshot?.isLoading ?? false);
  const error = currentSnapshot?.error ?? null;

  useEffect(() => {
    if (!user || !isCloudBacked) {
      return undefined;
    }

    const ownerId = user.id;
    return subscribeToNotifications(
      ownerId,
      (nextNotifications) => {
        setSnapshot({
          ownerId,
          notifications: nextNotifications,
          isLoading: false,
          error: null,
        });
      },
      (subscriptionError) => {
        console.error('Notification subscription failed', subscriptionError);
        setSnapshot({
          ownerId,
          notifications: [],
          isLoading: false,
          error: 'Aktivität konnte nicht vollständig geladen werden.',
        });
      },
    );
  }, [isCloudBacked, user]);

  const unreadCount = notifications.filter(
    (notification) => notification.readAt === null,
  ).length;

  const markRead = async (notificationId: string): Promise<void> => {
    if (!user || !isCloudBacked) {
      throw new Error('NOTIFICATION_CLOUD_BACKEND_REQUIRED');
    }
    await markNotificationRead(notificationId);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        error,
        isCloudBacked,
        markRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used inside NotificationProvider.');
  }
  return context;
}
