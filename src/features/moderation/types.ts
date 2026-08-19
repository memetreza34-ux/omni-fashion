export interface ModerationReportQueueItem {
  id: string;
  reporterId: string | null;
  targetType: string | null;
  targetId: string | null;
  targetOwnerId: string | null;
  reason: string | null;
  details: string;
  createdAtMillis: number;
}

export interface ModerationDisputeQueueItem {
  id: string;
  transactionId: string;
  participantIds: string[];
  openedById: string | null;
  reason: string | null;
  details: string;
  previousTransactionStatus: string | null;
  createdAtMillis: number;
}

export interface ModerationQueue {
  reports: ModerationReportQueueItem[];
  disputes: ModerationDisputeQueueItem[];
}

export type ModerationReportResolution = 'dismissed' | 'action_required';
export type ModerationDisputeResolution = 'resume_trade' | 'manual_recovery';
