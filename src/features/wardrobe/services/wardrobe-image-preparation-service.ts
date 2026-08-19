import {
  ImageManipulator,
  SaveFormat,
} from 'expo-image-manipulator';

const MAX_WARDROBE_IMAGE_LONG_SIDE = 2048;
const WARDROBE_JPEG_COMPRESSION = 0.82;
const PREPARATION_FAILED_CODE = 'WARDROBE_IMAGE_PREPARATION_FAILED';
const PREPARATION_CANCELED_CODE = 'WARDROBE_IMAGE_UPLOAD_CANCELED';

export interface WardrobeImageDimensions {
  width: number;
  height: number;
}

export interface PreparedWardrobeImage {
  uri: string;
  width: number;
  height: number;
  originalWidth: number | null;
  originalHeight: number | null;
  wasResized: boolean;
  format: 'jpeg';
}

function isPositiveFinite(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function calculateWardrobeImageTargetSize(
  width: number | undefined,
  height: number | undefined,
): WardrobeImageDimensions | null {
  if (!isPositiveFinite(width) || !isPositiveFinite(height)) {
    return null;
  }

  const longSide = Math.max(width, height);
  if (longSide <= MAX_WARDROBE_IMAGE_LONG_SIDE) {
    return null;
  }

  const scale = MAX_WARDROBE_IMAGE_LONG_SIDE / longSide;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function throwIfCanceled(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw new Error(
      `${PREPARATION_CANCELED_CODE}: Image preparation was canceled.`,
    );
  }
}

export async function prepareWardrobeImageForUpload(
  localUri: string,
  originalWidth?: number,
  originalHeight?: number,
  signal?: AbortSignal,
): Promise<PreparedWardrobeImage> {
  throwIfCanceled(signal);

  try {
    const context = ImageManipulator.manipulate(localUri);
    const targetSize = calculateWardrobeImageTargetSize(
      originalWidth,
      originalHeight,
    );

    if (targetSize) {
      context.resize(targetSize);
    }

    const renderedImage = await context.renderAsync();
    throwIfCanceled(signal);

    const savedImage = await renderedImage.saveAsync({
      compress: WARDROBE_JPEG_COMPRESSION,
      format: SaveFormat.JPEG,
    });
    throwIfCanceled(signal);

    return {
      uri: savedImage.uri,
      width: savedImage.width,
      height: savedImage.height,
      originalWidth: isPositiveFinite(originalWidth) ? originalWidth : null,
      originalHeight: isPositiveFinite(originalHeight) ? originalHeight : null,
      wasResized: targetSize !== null,
      format: 'jpeg',
    };
  } catch (error: unknown) {
    if (signal?.aborted) {
      throw new Error(
        `${PREPARATION_CANCELED_CODE}: Image preparation was canceled.`,
      );
    }

    if (
      error instanceof Error &&
      error.message.includes(PREPARATION_CANCELED_CODE)
    ) {
      throw error;
    }

    throw new Error(
      `${PREPARATION_FAILED_CODE}: Selected image could not be prepared for upload.`,
    );
  }
}
