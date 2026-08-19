export class SwapProgressError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.name = 'SwapProgressError';
        this.code = code;
    }
}
function unique(values) {
    return [...new Set(values)];
}
function includesAll(participantIds, values) {
    return participantIds.every((id) => values.includes(id));
}
function otherParticipant(participantIds, userId) {
    const other = participantIds.find((id) => id !== userId);
    if (!other) {
        throw new SwapProgressError('INVALID_PARTICIPANTS', 'Swap participants are invalid.');
    }
    return other;
}
function requireParticipant(state, userId) {
    if (!state.participantIds.includes(userId)) {
        throw new SwapProgressError('NOT_PARTICIPANT', 'User is not a participant of this swap.');
    }
}
function requireOpenTransaction(state) {
    if (state.status === 'completed' ||
        state.status === 'cancelled' ||
        state.status === 'disputed') {
        throw new SwapProgressError('TRANSACTION_CLOSED', 'This swap transaction is already closed.');
    }
}
export function applySwapProgressAction(current, userId, action) {
    requireParticipant(current, userId);
    requireOpenTransaction(current);
    if (action.type === 'confirm_mode') {
        if (current.fulfilmentMode !== null &&
            current.fulfilmentMode !== action.mode) {
            throw new SwapProgressError('MODE_CONFLICT', 'The other participant already selected a different fulfilment mode.');
        }
        const modeConfirmedByIds = unique([...current.modeConfirmedByIds, userId]);
        const bothConfirmed = includesAll(current.participantIds, modeConfirmedByIds);
        return {
            ...current,
            fulfilmentMode: action.mode,
            modeConfirmedByIds,
            status: bothConfirmed ? 'address_or_meetup' : 'accepted',
        };
    }
    if (action.type === 'retry_finalize') {
        if (current.status !== 'received' ||
            current.finalizationState !== 'failed' ||
            !includesAll(current.participantIds, current.receivedByIds)) {
            throw new SwapProgressError('FINALIZE_NOT_RETRYABLE', 'This transaction is not ready for a finalization retry.');
        }
        return {
            ...current,
            finalizationState: 'ready',
        };
    }
    if (!current.fulfilmentMode) {
        throw new SwapProgressError('MODE_REQUIRED', 'Both participants must choose a fulfilment mode first.');
    }
    if (!includesAll(current.participantIds, current.modeConfirmedByIds)) {
        throw new SwapProgressError('MODE_CONFIRMATION_REQUIRED', 'Both participants must confirm the fulfilment mode first.');
    }
    if (action.type === 'mark_shipped') {
        if (current.fulfilmentMode !== 'shipping') {
            throw new SwapProgressError('SHIPPING_NOT_SELECTED', 'Shipping progress is only valid for shipping trades.');
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
            throw new SwapProgressError('COUNTERPART_NOT_SHIPPED', 'The counterpart has not confirmed shipment yet.');
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
//# sourceMappingURL=transaction-state.js.map