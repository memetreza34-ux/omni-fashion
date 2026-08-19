import { fetch } from 'expo/fetch';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';

import { getFirebaseServices } from '@/services/firebase/app';

const MAX_WARDROBE_IMAGE_BYTES = 10 * 1024 * 1024;
const UPLOAD_CANCELED_CODE = 'WARDROBE_IMAGE_UPLOAD_CANCELED';

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

function canceledUploadError(): Error {
  return new Error(`${UPLOAD_CANCELED_CODE}: Image upload was canceled.`);
}

export function isWardrobeImageUploadCanceled(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.name === 'AbortError' ||
      error.message.includes(UPLOAD_CANCELED_CODE)
    );
  }

  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String(error.code).includes('storage/canceled');
  }

  return false;
}

export interface WardrobeImageUploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  fraction: number;
}

export interface WardrobeImageUploadOptions {
  signal?: AbortSignal;
  onProgress?: (progress: WardrobeImageUploadProgress) => void;
}

export interface UploadedWardrobeImage {
  path: string;
  downloadUrl: string;
}

export async function uploadWardrobeImage(
  userId: string,
  itemId: string,
  localUri: string,
  options: WardrobeImageUploadOptions = {},
): Promise<UploadedWardrobeImage> {
  if (options.signal?.aborted) {
    throw canceledUploadError();
  }

  const response = await fetch(localUri, { signal: options.signal });

  if (!response.ok) {
    throw new Error(
      `WARDROBE_IMAGE_READ_FAILED: Could not read selected image (${response.status}).`,
    );
  }

  const blob = await response.blob();

  if (options.signal?.aborted) {
    throw canceledUploadError();
  }

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
  const uploadTask = uploadBytesResumable(storageRef, blob, {
    contentType: contentType || 'image/jpeg',
    customMetadata: {
      ownerId: userId,
      wardrobeItemId: itemId,
    },
  });

  await new Promise<void>((resolve, reject) => {
    let unsubscribe = () => undefined;

    const handleAbort = () => {
      uploadTask.cancel();
    };

    const cleanup = () => {
      unsubscribe();
      options.signal?.removeEventListener('abort', handleAbort);
    };

    options.signal?.addEventListener('abort', handleAbort, { once: true });

    unsubscribe = uploadTask.on(
      'state_changed',
      (snapshot) => {
        const fraction =
          snapshot.totalBytes > 0
            ? snapshot.bytesTransferred / snapshot.totalBytes
            : 0;

        options.onProgress?.({
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes,
          fraction: Math.max(0, Math.min(1, fraction)),
        });
      },
      (error) => {
        cleanup();
        reject(
          String(error.code).includes('storage/canceled')
            ? canceledUploadError()
            : error,
        );
      },
      () => {
        cleanup();
        resolve();
      },
    );

    if (options.signal?.aborted) {
      handleAbort();
    }
  });

  if (options.signal?.aborted) {
    try {
      await deleteObject(storageRef);
    } catch (error: unknown) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String(error.code)
          : '';
      if (!code.includes('object-not-found')) {
        throw error;
      }
    }
    throw canceledUploadError();
  }

  options.onProgress?.({
    bytesTransferred: blob.size,
    totalBytes: blob.size,
    fraction: 1,
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
