import {
  collection,
  onSnapshot,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import type { QueryDocumentSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { getFirebaseServices } from '@/services/firebase/app';

import { TRUST_SAFETY_SCHEMA_VERSION } from './types';
import type {
  OpenSwapDisputeInput,
  OpenSwapDisputeResponse,
  SetUserBlockInput,
  SetUserBlockResponse,
  SubmitReportInput,
  SubmitReportResponse,
  UserBlock,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function mapBlock(snapshot: QueryDocumentSnapshot<unknown>): UserBlock | null {
  const raw = snapshot.data();
  if (!isRecord(raw)) return null;

  const blockerId = raw.blockerId;
  const blockedId = raw.blockedId;
  const createdAt = raw.createdAt;
  if (
    typeof blockerId !== 'string' ||
    !blockerId ||
    typeof blockedId !== 'string' ||
    !blockedId ||
    blockerId === blockedId ||
    !(createdAt instanceof Timestamp) ||
    raw.schemaVersion !== TRUST_SAFETY_SCHEMA_VERSION
  ) {
    console.warn(`Skipping invalid user block ${snapshot.id}.`);
    return null;
  }

  return {
    id: snapshot.id,
    blockerId,
    blockedId,
    createdAt: createdAt.toDate().toISOString(),
    schemaVersion: TRUST_SAFETY_SCHEMA_VERSION,
  };
}

export function subscribeToUserBlocks(
  blockerId: string,
  onChange: (blocks: UserBlock[]) => void,
  onError: (error: Error) => void,
): () => void {
  const { db } = getFirebaseServices();
  return onSnapshot(
    query(collection(db, 'blocks'), where('blockerId', '==', blockerId)),
    (snapshot) => {
      onChange(
        snapshot.docs
          .map(mapBlock)
          .filter((block): block is UserBlock => block !== null),
      );
    },
    onError,
  );
}

export async function setUserBlock(
  input: SetUserBlockInput,
): Promise<SetUserBlockResponse> {
  const { functions } = getFirebaseServices();
  const callable = httpsCallable<SetUserBlockInput, SetUserBlockResponse>(
    functions,
    'setUserBlock',
  );
  const response = await callable(input);
  if (
    !isRecord(response.data) ||
    response.data.targetUserId !== input.targetUserId ||
    typeof response.data.blocked !== 'boolean'
  ) {
    throw new Error('TRUST_INVALID_BLOCK_RESPONSE');
  }
  return {
    targetUserId: response.data.targetUserId,
    blocked: response.data.blocked,
  };
}

export async function submitReport(
  input: SubmitReportInput,
): Promise<SubmitReportResponse> {
  const { functions } = getFirebaseServices();
  const callable = httpsCallable<SubmitReportInput, SubmitReportResponse>(
    functions,
    'submitReport',
  );
  const response = await callable(input);
  if (
    !isRecord(response.data) ||
    typeof response.data.reportId !== 'string' ||
    !response.data.reportId ||
    response.data.status !== 'open'
  ) {
    throw new Error('TRUST_INVALID_REPORT_RESPONSE');
  }
  return { reportId: response.data.reportId, status: 'open' };
}

export async function openSwapDispute(
  input: OpenSwapDisputeInput,
): Promise<OpenSwapDisputeResponse> {
  const { functions } = getFirebaseServices();
  const callable = httpsCallable<OpenSwapDisputeInput, OpenSwapDisputeResponse>(
    functions,
    'openSwapDispute',
  );
  const response = await callable(input);
  if (
    !isRecord(response.data) ||
    response.data.transactionId !== input.transactionId ||
    typeof response.data.disputeId !== 'string' ||
    !response.data.disputeId ||
    response.data.status !== 'disputed'
  ) {
    throw new Error('TRUST_INVALID_DISPUTE_RESPONSE');
  }
  return {
    transactionId: response.data.transactionId,
    disputeId: response.data.disputeId,
    status: 'disputed',
  };
}
