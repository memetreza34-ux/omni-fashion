import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import type { QueryDocumentSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { getFirebaseServices } from '@/services/firebase/app';

import {
  NOTIFICATION_SCHEMA_VERSION,
  NOTIFICATION_TYPES,
} from './types';
import type { AppNotification, NotificationType } from './types';

const NOTIFICATION_FEED_LIMIT = 100;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readNullableString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return typeof value === 'string' ? value : undefined;
}

function mapNotification(
  snapshot: QueryDocumentSnapshot<unknown>,
): AppNotification | null {
  const raw = snapshot.data();
  if (!isRecord(raw)) return null;

  const type = raw.type;
  const relatedOfferId = readNullableString(raw.relatedOfferId);
  const relatedTransactionId = readNullableString(raw.relatedTransactionId);
  const relatedListingId = readNullableString(raw.relatedListingId);
  const readAt =
    raw.readAt === null
      ? null
      : raw.readAt instanceof Timestamp
        ? raw.readAt.toDate().toISOString()
        : undefined;

  if (
    typeof raw.userId !== 'string' ||
    !raw.userId ||
    typeof type !== 'string' ||
    !NOTIFICATION_TYPES.includes(type as NotificationType) ||
    typeof raw.title !== 'string' ||
    !raw.title ||
    typeof raw.body !== 'string' ||
    !raw.body ||
    relatedOfferId === undefined ||
    relatedTransactionId === undefined ||
    relatedListingId === undefined ||
    readAt === undefined ||
    !(raw.createdAt instanceof Timestamp) ||
    raw.schemaVersion !== NOTIFICATION_SCHEMA_VERSION
  ) {
    console.warn(`Skipping invalid notification ${snapshot.id}.`);
    return null;
  }

  return {
    id: snapshot.id,
    userId: raw.userId,
    type: type as NotificationType,
    title: raw.title,
    body: raw.body,
    relatedOfferId,
    relatedTransactionId,
    relatedListingId,
    readAt,
    createdAt: raw.createdAt.toDate().toISOString(),
    schemaVersion: NOTIFICATION_SCHEMA_VERSION,
  };
}

export function subscribeToNotifications(
  userId: string,
  onChange: (notifications: AppNotification[]) => void,
  onError: (error: Error) => void,
): () => void {
  const { db } = getFirebaseServices();
  return onSnapshot(
    query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(NOTIFICATION_FEED_LIMIT),
    ),
    (snapshot) => {
      onChange(
        snapshot.docs
          .map(mapNotification)
          .filter(
            (notification): notification is AppNotification =>
              notification !== null,
          ),
      );
    },
    onError,
  );
}

export async function markNotificationRead(
  notificationId: string,
): Promise<void> {
  const { functions } = getFirebaseServices();
  const callable = httpsCallable<
    { notificationId: string },
    { notificationId: string; read: true }
  >(functions, 'markNotificationRead');
  const response = await callable({ notificationId });

  if (
    !isRecord(response.data) ||
    response.data.notificationId !== notificationId ||
    response.data.read !== true
  ) {
    throw new Error('NOTIFICATION_INVALID_READ_RESPONSE');
  }
}
