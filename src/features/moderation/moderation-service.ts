import { httpsCallable } from 'firebase/functions';

import { getFirebaseServices } from '@/services/firebase/app';

import type {
  ModerationDisputeQueueItem,
  ModerationDisputeResolution,
  ModerationQueue,
  ModerationReportQueueItem,
  ModerationReportResolution,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readNullableString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return typeof value === 'string' ? value : undefined;
}

function parseReport(value: unknown): ModerationReportQueueItem | null {
  if (!isRecord(value)) return null;
  const reporterId = readNullableString(value.reporterId);
  const targetType = readNullableString(value.targetType);
  const targetId = readNullableString(value.targetId);
  const targetOwnerId = readNullableString(value.targetOwnerId);
  const reason = readNullableString(value.reason);
  if (
    typeof value.id !== 'string' ||
    reporterId === undefined ||
    targetType === undefined ||
    targetId === undefined ||
    targetOwnerId === undefined ||
    reason === undefined ||
    typeof value.details !== 'string' ||
    typeof value.createdAtMillis !== 'number'
  ) {
    return null;
  }

  return {
    id: value.id,
    reporterId,
    targetType,
    targetId,
    targetOwnerId,
    reason,
    details: value.details,
    createdAtMillis: value.createdAtMillis,
  };
}

function parseDispute(value: unknown): ModerationDisputeQueueItem | null {
  if (!isRecord(value)) return null;
  const openedById = readNullableString(value.openedById);
  const reason = readNullableString(value.reason);
  const previousTransactionStatus = readNullableString(
    value.previousTransactionStatus,
  );
  if (
    typeof value.id !== 'string' ||
    typeof value.transactionId !== 'string' ||
    !Array.isArray(value.participantIds) ||
    value.participantIds.some((id) => typeof id !== 'string') ||
    openedById === undefined ||
    reason === undefined ||
    previousTransactionStatus === undefined ||
    typeof value.details !== 'string' ||
    typeof value.createdAtMillis !== 'number'
  ) {
    return null;
  }

  return {
    id: value.id,
    transactionId: value.transactionId,
    participantIds: value.participantIds,
    openedById,
    reason,
    details: value.details,
    previousTransactionStatus,
    createdAtMillis: value.createdAtMillis,
  };
}

export async function loadModerationQueue(): Promise<ModerationQueue> {
  const { functions } = getFirebaseServices();
  const callable = httpsCallable<Record<string, never>, unknown>(
    functions,
    'listModerationQueue',
  );
  const response = await callable({});

  if (
    !isRecord(response.data) ||
    !Array.isArray(response.data.reports) ||
    !Array.isArray(response.data.disputes)
  ) {
    throw new Error('MODERATION_INVALID_QUEUE_RESPONSE');
  }

  const reports = response.data.reports
    .map(parseReport)
    .filter((item): item is ModerationReportQueueItem => item !== null);
  const disputes = response.data.disputes
    .map(parseDispute)
    .filter((item): item is ModerationDisputeQueueItem => item !== null);

  return { reports, disputes };
}

export async function resolveModerationReport(input: {
  reportId: string;
  resolution: ModerationReportResolution;
  note: string;
}): Promise<void> {
  const { functions } = getFirebaseServices();
  const callable = httpsCallable<
    typeof input,
    {
      reportId: string;
      status: 'resolved';
      resolution: ModerationReportResolution;
    }
  >(functions, 'resolveModerationReport');
  const response = await callable(input);

  if (
    !isRecord(response.data) ||
    response.data.reportId !== input.reportId ||
    response.data.status !== 'resolved' ||
    response.data.resolution !== input.resolution
  ) {
    throw new Error('MODERATION_INVALID_REPORT_RESPONSE');
  }
}

export async function resolveSwapDispute(input: {
  transactionId: string;
  resolution: ModerationDisputeResolution;
  note: string;
}): Promise<void> {
  const { functions } = getFirebaseServices();
  const callable = httpsCallable<
    typeof input,
    {
      transactionId: string;
      status: 'resolved';
      resolution: ModerationDisputeResolution;
    }
  >(functions, 'resolveSwapDispute');
  const response = await callable(input);

  if (
    !isRecord(response.data) ||
    response.data.transactionId !== input.transactionId ||
    response.data.status !== 'resolved' ||
    response.data.resolution !== input.resolution
  ) {
    throw new Error('MODERATION_INVALID_DISPUTE_RESPONSE');
  }
}
