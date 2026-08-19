import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isActiveSwapTransactionStatus,
  isSafeWardrobeImagePath,
  wardrobeDeleteBlockers,
} from '../lib/wardrobe/delete-policy.js';

function baseInput() {
  return {
    requesterId: 'owner-1',
    ownerId: 'owner-1',
    itemId: 'item-1',
    imagePath: 'users/owner-1/wardrobe/item-1/original.jpg',
    isListedForSwap: false,
    swapListingId: null,
    hasSwapLock: false,
    activeSwapTransactionCount: 0,
  };
}

test('plain owned wardrobe item can pass delete policy', () => {
  assert.deepEqual(wardrobeDeleteBlockers(baseInput()), []);
});

test('delete policy blocks foreign ownership', () => {
  assert.deepEqual(
    wardrobeDeleteBlockers({ ...baseInput(), requesterId: 'other-user' }),
    ['NOT_OWNER'],
  );
});

test('delete policy blocks listing, lock and active trade states', () => {
  assert.deepEqual(
    wardrobeDeleteBlockers({
      ...baseInput(),
      isListedForSwap: true,
      swapListingId: 'listing-1',
      hasSwapLock: true,
      activeSwapTransactionCount: 1,
    }),
    [
      'ACTIVE_SWAP_LISTING',
      'ACTIVE_SWAP_LOCK',
      'ACTIVE_SWAP_TRANSACTION',
    ],
  );
});

test('wardrobe storage cleanup path must stay inside owner and item prefix', () => {
  assert.equal(
    isSafeWardrobeImagePath(
      'owner-1',
      'item-1',
      'users/owner-1/wardrobe/item-1/original.jpg',
    ),
    true,
  );
  assert.equal(
    isSafeWardrobeImagePath(
      'owner-1',
      'item-1',
      'users/owner-2/wardrobe/item-1/original.jpg',
    ),
    false,
  );
  assert.equal(
    isSafeWardrobeImagePath(
      'owner-1',
      'item-1',
      'users/owner-1/wardrobe/item-2/original.jpg',
    ),
    false,
  );
});

test('only completed and cancelled swap transactions are terminal for deletion', () => {
  assert.equal(isActiveSwapTransactionStatus('accepted'), true);
  assert.equal(isActiveSwapTransactionStatus('address_or_meetup'), true);
  assert.equal(isActiveSwapTransactionStatus('shipped'), true);
  assert.equal(isActiveSwapTransactionStatus('received'), true);
  assert.equal(isActiveSwapTransactionStatus('disputed'), true);
  assert.equal(isActiveSwapTransactionStatus('completed'), false);
  assert.equal(isActiveSwapTransactionStatus('cancelled'), false);
});
