export const NOTIFICATION_SCHEMA_VERSION = 1 as const;

export const NOTIFICATION_TYPES = [
  'swap_offer_received',
  'swap_offer_accepted',
  'swap_offer_declined',
  'swap_offer_cancelled',
  'swap_mode_confirmed',
  'swap_item_shipped',
  'swap_item_received',
  'swap_completed',
  'swap_disputed',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedOfferId: string | null;
  relatedTransactionId: string | null;
  relatedListingId: string | null;
  readAt: string | null;
  createdAt: string;
  schemaVersion: typeof NOTIFICATION_SCHEMA_VERSION;
}
