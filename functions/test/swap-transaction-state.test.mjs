import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applySwapProgressAction,
  SwapProgressError,
} from '../lib/swap/transaction-state.js';

function baseState() {
  return {
    participantIds: ['requester', 'owner'],
    fulfilmentMode: null,
    modeConfirmedByIds: [],
    shippedByIds: [],
    receivedByIds: [],
    status: 'accepted',
    finalizationState: 'pending',
  };
}

test('shipping needs both mode confirmations, both shipments and both receipts', () => {
  let state = baseState();
  state = applySwapProgressAction(state, 'requester', {
    type: 'confirm_mode',
    mode: 'shipping',
  });
  assert.equal(state.status, 'accepted');

  state = applySwapProgressAction(state, 'owner', {
    type: 'confirm_mode',
    mode: 'shipping',
  });
  assert.equal(state.status, 'address_or_meetup');

  state = applySwapProgressAction(state, 'requester', {
    type: 'mark_shipped',
  });
  assert.equal(state.status, 'address_or_meetup');

  state = applySwapProgressAction(state, 'owner', { type: 'mark_shipped' });
  assert.equal(state.status, 'shipped');

  state = applySwapProgressAction(state, 'requester', {
    type: 'mark_received',
  });
  assert.equal(state.status, 'shipped');
  assert.equal(state.finalizationState, 'pending');

  state = applySwapProgressAction(state, 'owner', { type: 'mark_received' });
  assert.equal(state.status, 'received');
  assert.equal(state.finalizationState, 'ready');
});

test('meetup can complete receipts without shipment state', () => {
  let state = baseState();
  state = applySwapProgressAction(state, 'requester', {
    type: 'confirm_mode',
    mode: 'meetup',
  });
  state = applySwapProgressAction(state, 'owner', {
    type: 'confirm_mode',
    mode: 'meetup',
  });
  state = applySwapProgressAction(state, 'requester', {
    type: 'mark_received',
  });
  state = applySwapProgressAction(state, 'owner', { type: 'mark_received' });

  assert.equal(state.status, 'received');
  assert.deepEqual(state.shippedByIds, []);
  assert.equal(state.finalizationState, 'ready');
});

test('participant cannot confirm receipt before counterpart shipment', () => {
  let state = baseState();
  state = applySwapProgressAction(state, 'requester', {
    type: 'confirm_mode',
    mode: 'shipping',
  });
  state = applySwapProgressAction(state, 'owner', {
    type: 'confirm_mode',
    mode: 'shipping',
  });

  assert.throws(
    () =>
      applySwapProgressAction(state, 'requester', { type: 'mark_received' }),
    (error) =>
      error instanceof SwapProgressError &&
      error.code === 'COUNTERPART_NOT_SHIPPED',
  );
});

test('second participant cannot silently switch fulfilment mode', () => {
  const state = applySwapProgressAction(baseState(), 'requester', {
    type: 'confirm_mode',
    mode: 'shipping',
  });

  assert.throws(
    () =>
      applySwapProgressAction(state, 'owner', {
        type: 'confirm_mode',
        mode: 'meetup',
      }),
    (error) =>
      error instanceof SwapProgressError && error.code === 'MODE_CONFLICT',
  );
});

test('failed finalization can only be retried after both receipts', () => {
  const state = {
    ...baseState(),
    fulfilmentMode: 'meetup',
    modeConfirmedByIds: ['requester', 'owner'],
    receivedByIds: ['requester', 'owner'],
    status: 'received',
    finalizationState: 'failed',
  };

  const retried = applySwapProgressAction(state, 'requester', {
    type: 'retry_finalize',
  });
  assert.equal(retried.finalizationState, 'ready');
});
