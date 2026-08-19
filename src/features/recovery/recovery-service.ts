import { httpsCallable } from 'firebase/functions';

import { getFirebaseServices } from '@/services/firebase/app';

import type {
  FailedSwapRecoveryItem,
  ManualDisputeRecoveryItem,
  PushDeliveryRecoveryItem,
  RecoveryQueue,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readNullableString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return typeof value === 'string' ? value : undefined;
}

function parseFailedTransaction(value: unknown): FailedSwapRecoveryItem | null {
  if (!isRecord(value)) return null;
  const requesterId = readNullableString(value.requesterId);
  const listingOwnerId = readNullableString(value.listingOwnerId);
  const status = readNullableString(value.status);
  const finalizationState = readNullableString(value.finalizationState);

  if (
    typeof value.transactionId !== 'string' ||
    requesterId === undefined ||
    listingOwnerId === undefined ||
    status === undefined ||
    finalizationState === undefined ||
    typeof value.createdAtMillis !== 'number'
  ) {
    return null;
  }

  return {
    transactionId: value.transactionId,
    requesterId,
    listingOwnerId,
    status,
    finalizationState,
    createdAtMillis: value.createdAtMillis,
  };
}

function parseManualDispute(value: unknown): ManualDisputeRecoveryItem | null {
  if (!isRecord(value)) return null;
  const openedById = readNullableString(value.openedById);
  const reason = readNullableString(value.reason);

  if (
    typeof value.transactionId !== 'string' ||
    openedById === undefined ||
    reason === undefined ||
    typeof value.resolutionNote !== 'string' ||
    typeof value.createdAtMillis !== 'number'
  ) {
    return null;
  }

  return {
    transactionId: value.transactionId,
    openedById,
    reason,
    resolutionNote: value.resolutionNote,
    createdAtMillis: value.createdAtMillis,
  };
}

function parsePushDelivery(value: unknown): PushDeliveryRecoveryItem | null {
  if (!isRecord(value)) return null;
  const userId = readNullableString(value.userId);
  const deviceId = readNullableString(value.deviceId);
  const notificationId = readNullableString(value.notificationId);
  const status = readNullableString(value.status);
  const errorCode = readNullableString(value.errorCode);

  if (
    typeof value.deliveryId !== 'string' ||
    userId === undefined ||
    deviceId === undefined ||
    notificationId === undefined ||
    status === undefined ||
    errorCode === undefined ||
    typeof value.createdAtMillis !== 'number'
  ) {
    return null;
  }

  return {
    deliveryId: value.deliveryId,
    userId,
    deviceId,
    notificationId,
    status,
    errorCode,
    createdAtMillis: value.createdAtMillis,
  };
}

export async function loadRecoveryQueue(): Promise<RecoveryQueue> {
  const { functions } = getFirebaseServices();
  const callable = httpsCallable<Record<string, never>, unknown>(
    functions,
    'listRecoveryQueue',
  );
  const response = await callable({});

  if (
    !isRecord(response.data) ||
    !Array.isArray(response.data.failedTransactions) ||
    !Array.isArray(response.data.manualDisputes) ||
    !Array.isArray(response.data.pushDeliveries)
  ) {
    throw new Error('RECOVERY_INVALID_QUEUE_RESPONSE');
  }

  return {
    failedTransactions: response.data.failedTransactions
      .map(parseFailedTransaction)
      .filter((item): item is FailedSwapRecoveryItem => item !== null),
    manualDisputes: response.data.manualDisputes
      .map(parseManualDispute)
      .filter((item): item is ManualDisputeRecoveryItem => item !== null),
    pushDeliveries: response.data.pushDeliveries
      .map(parsePushDelivery)
      .filter((item): item is PushDeliveryRecoveryItem => item !== null),
  };
}
