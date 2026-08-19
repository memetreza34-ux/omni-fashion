import { createHash } from 'node:crypto';

import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

export const NOTIFICATION_SCHEMA_VERSION = 1;

export type NotificationType =
  | 'swap_offer_received'
  | 'swap_offer_accepted'
  | 'swap_offer_declined'
  | 'swap_offer_cancelled'
  | 'swap_mode_confirmed'
  | 'swap_item_shipped'
  | 'swap_item_received'
  | 'swap_completed'
  | 'swap_disputed';

export interface CreateNotificationInput {
  userId: string;
  dedupeKey: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedOfferId?: string | null;
  relatedTransactionId?: string | null;
  relatedListingId?: string | null;
}

function ensureAdminInitialized(): void {
  if (getApps().length === 0) initializeApp();
}

function notificationId(userId: string, dedupeKey: string): string {
  return createHash('sha256')
    .update(`${userId}:${dedupeKey}`)
    .digest('hex')
    .slice(0, 48);
}

export async function createUserNotification(
  input: CreateNotificationInput,
): Promise<string> {
  ensureAdminInitialized();
  const db = getFirestore();
  const id = notificationId(input.userId, input.dedupeKey);
  const ref = db.collection('notifications').doc(id);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (snapshot.exists) {
      return;
    }

    transaction.set(ref, {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      relatedOfferId: input.relatedOfferId ?? null,
      relatedTransactionId: input.relatedTransactionId ?? null,
      relatedListingId: input.relatedListingId ?? null,
      readAt: null,
      createdAt: FieldValue.serverTimestamp(),
      schemaVersion: NOTIFICATION_SCHEMA_VERSION,
    });
  });

  return id;
}
