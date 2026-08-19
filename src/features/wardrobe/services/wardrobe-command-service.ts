import { httpsCallable } from 'firebase/functions';

import { getFirebaseServices } from '@/services/firebase/app';

const DELETE_WARDROBE_ITEM_FUNCTION = 'deleteWardrobeItem';

interface DeleteWardrobeItemRequest {
  itemId: string;
}

export interface DeleteWardrobeItemResponse {
  itemId: string;
  deleted: boolean;
  alreadyDeleted: boolean;
  cleanupPending: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseDeleteResponse(
  value: unknown,
  expectedItemId: string,
): DeleteWardrobeItemResponse {
  if (!isRecord(value)) {
    throw new Error('WARDROBE_DELETE_RESPONSE_INVALID');
  }

  if (
    value.itemId !== expectedItemId ||
    typeof value.deleted !== 'boolean' ||
    typeof value.alreadyDeleted !== 'boolean' ||
    typeof value.cleanupPending !== 'boolean'
  ) {
    throw new Error('WARDROBE_DELETE_RESPONSE_INVALID');
  }

  return {
    itemId: expectedItemId,
    deleted: value.deleted,
    alreadyDeleted: value.alreadyDeleted,
    cleanupPending: value.cleanupPending,
  };
}

export async function requestCloudWardrobeItemDelete(
  itemId: string,
): Promise<DeleteWardrobeItemResponse> {
  const normalizedItemId = itemId.trim();
  if (!normalizedItemId) {
    throw new Error('WARDROBE_DELETE_ITEM_ID_REQUIRED');
  }

  const { functions } = getFirebaseServices();
  const callable = httpsCallable<DeleteWardrobeItemRequest, unknown>(
    functions,
    DELETE_WARDROBE_ITEM_FUNCTION,
  );
  const response = await callable({ itemId: normalizedItemId });

  return parseDeleteResponse(response.data, normalizedItemId);
}
