export interface FailedSwapRecoveryItem {
  transactionId: string;
  requesterId: string | null;
  listingOwnerId: string | null;
  status: string | null;
  finalizationState: string | null;
  createdAtMillis: number;
}

export interface ManualDisputeRecoveryItem {
  transactionId: string;
  openedById: string | null;
  reason: string | null;
  resolutionNote: string;
  createdAtMillis: number;
}

export interface PushDeliveryRecoveryItem {
  deliveryId: string;
  userId: string | null;
  deviceId: string | null;
  notificationId: string | null;
  status: string | null;
  errorCode: string | null;
  createdAtMillis: number;
}

export interface RecoveryQueue {
  failedTransactions: FailedSwapRecoveryItem[];
  manualDisputes: ManualDisputeRecoveryItem[];
  pushDeliveries: PushDeliveryRecoveryItem[];
}
