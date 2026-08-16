import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
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

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isBackendConfigured } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isCloudBacked = Boolean(
    user && isBackendConfigured && !user.isDevelopmentDemo,
  );

  useEffect(() => {
    setNotifications([]);
    setError(null);
    setIsLoading(true);

    if (!user || !isCloudBacked) {
      setIsLoading(false);
      return undefined;
    }

    return subscribeToNotifications(
      user.id,
      (nextNotifications) => {
        setNotifications(nextNotifications);
        setIsLoading(false);
      },
      (subscriptionError) => {
        console.error('Notification subscription failed', subscriptionError);
        setError('Aktivität konnte nicht vollständig geladen werden.');
        setIsLoading(false);
      },
    );
  }, [isCloudBacked, user]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => notification.readAt === null).length,
    [notifications],
  );

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
