import { fetch } from 'expo/fetch';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';

import { getFirebaseServices } from '@/services/firebase/app';

const MAX_WARDROBE_IMAGE_BYTES = 10 * 1024 * 1024;

function extensionFromContentType(contentType: string | null): string {
  switch (contentType) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/heic':
    case 'image/heif':
      return 'heic';
    case 'image/jpeg':
    default:
      return 'jpg';
  }
}

export interface UploadedWardrobeImage {
  path: string;
  downloadUrl: string;
}

export async function uploadWardrobeImage(
  userId: string,
  itemId: string,
  localUri: string,
): Promise<UploadedWardrobeImage> {
  const response = await fetch(localUri);

  if (!response.ok) {
    throw new Error(
      `WARDROBE_IMAGE_READ_FAILED: Could not read selected image (${response.status}).`,
    );
  }

  const blob = await response.blob();

  if (blob.size <= 0) {
    throw new Error('WARDROBE_IMAGE_EMPTY: Selected image contains no data.');
  }

  if (blob.size >= MAX_WARDROBE_IMAGE_BYTES) {
    throw new Error(
      'WARDROBE_IMAGE_TOO_LARGE: Image must be smaller than 10 MB.',
    );
  }

  const contentType = blob.type || response.headers.get('content-type');
  const extension = extensionFromContentType(contentType);
  const path = `users/${userId}/wardrobe/${itemId}/original.${extension}`;
  const { storage } = getFirebaseServices();
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, blob, {
    contentType: contentType || 'image/jpeg',
    customMetadata: {
      ownerId: userId,
      wardrobeItemId: itemId,
    },
  });

  return {
    path,
    downloadUrl: await getDownloadURL(storageRef),
  };
}

export async function getWardrobeImageUrl(imagePath: string): Promise<string> {
  const { storage } = getFirebaseServices();
  return getDownloadURL(ref(storage, imagePath));
}

export async function deleteWardrobeImage(
  imagePath: string | null,
): Promise<void> {
  if (!imagePath) {
    return;
  }

  const { storage } = getFirebaseServices();

  try {
    await deleteObject(ref(storage, imagePath));
  } catch (error: unknown) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String(error.code)
        : '';

    // Deleting an already missing file is idempotent from the app's perspective.
    if (!code.includes('object-not-found')) {
      throw error;
    }
  }
}
