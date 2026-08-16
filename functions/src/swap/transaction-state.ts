export type SwapFulfilmentMode = 'shipping' | 'meetup';
export type SwapTransactionStatus =
  | 'accepted'
  | 'address_or_meetup'
  | 'shipped'
  | 'received'
  | 'completed'
  | 'cancelled'
  | 'disputed';
export type SwapFinalizationState =
  | 'pending'
  | 'ready'
  | 'processing'
  | 'completed'
  | 'failed';

export type SwapProgressAction =
  | { type: 'confirm_mode'; mode: SwapFulfilmentMode }
  | { type: 'mark_shipped' }
  | { type: 'mark_received' }
  | { type: 'retry_finalize' };

export interface SwapProgressState {
  participantIds: [string, string];
  fulfilmentMode: SwapFulfilmentMode | null;
  modeConfirmedByIds: string[];
  shippedByIds: string[];
  receivedByIds: string[];
  status: SwapTransactionStatus;
  finalizationState: SwapFinalizationState;
}

export class SwapProgressError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'SwapProgressError';
    this.code = code;
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function includesAll(participantIds: [string, string], values: string[]): boolean {
  return participantIds.every((id) => values.includes(id));
}

function otherParticipant(
  participantIds: [string, string],
  userId: string,
): string {
  const other = participantIds.find((id) => id !== userId);
  if (!other) {
    throw new SwapProgressError(
      'INVALID_PARTICIPANTS',
      'Swap participants are invalid.',
    );
  }
  return other;
}

function requireParticipant(state: SwapProgressState, userId: string): void {
  if (!state.participantIds.includes(userId)) {
    throw new SwapProgressError(
      'NOT_PARTICIPANT',
      'User is not a participant of this swap.',
    );
  }
}

function requireOpenTransaction(state: SwapProgressState): void {
  if (
    state.status === 'completed' ||
    state.status === 'cancelled' ||
    state.status === 'disputed'
  ) {
    throw new SwapProgressError(
      'TRANSACTION_CLOSED',
      'This swap transaction is already closed.',
    );
  }
}

export function applySwapProgressAction(
  current: SwapProgressState,
  userId: string,
  action: SwapProgressAction,
): SwapProgressState {
  requireParticipant(current, userId);
  requireOpenTransaction(current);

  if (action.type === 'confirm_mode') {
    if (
      current.fulfilmentMode !== null &&
      current.fulfilmentMode !== action.mode
    ) {
      throw new SwapProgressError(
        'MODE_CONFLICT',
        'The other participant already selected a different fulfilment mode.',
      );
    }

    const modeConfirmedByIds = unique([
      ...current.modeConfirmedByIds,
      userId,
    ]);
    const bothConfirmed = includesAll(
      current.participantIds,
      modeConfirmedByIds,
    );

    return {
      ...current,
      fulfilmentMode: action.mode,
      modeConfirmedByIds,
      status: bothConfirmed ? 'address_or_meetup' : 'accepted',
    };
  }

  if (action.type === 'retry_finalize') {
    if (
      current.status !== 'received' ||
      current.finalizationState !== 'failed' ||
      !includesAll(current.participantIds, current.receivedByIds)
    ) {
      throw new SwapProgressError(
        'FINALIZE_NOT_RETRYABLE',
        'This transaction is not ready for a finalization retry.',
      );
    }

    return {
      ...current,
      finalizationState: 'ready',
    };
  }

  if (!current.fulfilmentMode) {
    throw new SwapProgressError(
      'MODE_REQUIRED',
      'Both participants must choose a fulfilment mode first.',
    );
  }

  if (!includesAll(current.participantIds, current.modeConfirmedByIds)) {
    throw new SwapProgressError(
      'MODE_CONFIRMATION_REQUIRED',
      'Both participants must confirm the fulfilment mode first.',
    );
  }

  if (action.type === 'mark_shipped') {
    if (current.fulfilmentMode !== 'shipping') {
      throw new SwapProgressError(
        'SHIPPING_NOT_SELECTED',
        'Shipping progress is only valid for shipping trades.',
      );
    }

    const shippedByIds = unique([...current.shippedByIds, userId]);
    return {
      ...current,
      shippedByIds,
      status: includesAll(current.participantIds, shippedByIds)
        ? 'shipped'
        : 'address_or_meetup',
    };
  }

  if (current.fulfilmentMode === 'shipping') {
    const counterpartId = otherParticipant(current.participantIds, userId);
    if (!current.shippedByIds.includes(counterpartId)) {
      throw new SwapProgressError(
        'COUNTERPART_NOT_SHIPPED',
        'The counterpart has not confirmed shipment yet.',
      );
    }
  }

  const receivedByIds = unique([...current.receivedByIds, userId]);
  const bothReceived = includesAll(current.participantIds, receivedByIds);

  return {
    ...current,
    receivedByIds,
    status: bothReceived
      ? 'received'
      : current.fulfilmentMode === 'shipping' &&
          includesAll(current.participantIds, current.shippedByIds)
        ? 'shipped'
        : 'address_or_meetup',
    finalizationState: bothReceived ? 'ready' : current.finalizationState,
  };
}
