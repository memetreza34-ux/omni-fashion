import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

const FUNCTIONS_REGION = 'europe-west1';
const LISTING_SCHEMA_VERSION = 1;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_CITY_LENGTH = 80;
const MAX_VALUE_CENTS = 5_000_000;

interface CreateSwapListingInput {
  wardrobeItemId: string;
  description: string;
  city: string;
  shippingEnabled: boolean;
  meetupEnabled: boolean;
  estimatedValueCents: number | null;
}

function ensureAdminInitialized(): void {
  if (getApps().length === 0) {
    initializeApp();
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readTrimmedString(
  value: unknown,
  fieldName: string,
  maxLength: number,
  allowEmpty = false,
): string {
  if (typeof value !== 'string') {
    throw new HttpsError('invalid-argument', `${fieldName} ist ungültig.`);
  }

  const normalized = value.trim();
  if ((!allowEmpty && !normalized) || normalized.length > maxLength) {
    throw new HttpsError('invalid-argument', `${fieldName} ist ungültig.`);
  }
  return normalized;
}

function parseRequest(data: unknown): CreateSwapListingInput {
  if (!isRecord(data)) {
    throw new HttpsError('invalid-argument', 'Ungültige Listing-Anfrage.');
  }

  const wardrobeItemId = readTrimmedString(
    data.wardrobeItemId,
    'wardrobeItemId',
    160,
  );
  if (wardrobeItemId.includes('/')) {
    throw new HttpsError('invalid-argument', 'wardrobeItemId ist ungültig.');
  }

  const description = readTrimmedString(
    data.description,
    'Beschreibung',
    MAX_DESCRIPTION_LENGTH,
    true,
  );
  const city = readTrimmedString(data.city, 'Stadt', MAX_CITY_LENGTH);
  const shippingEnabled = data.shippingEnabled;
  const meetupEnabled = data.meetupEnabled;
  const estimatedValueCents = data.estimatedValueCents;

  if (
    typeof shippingEnabled !== 'boolean' ||
    typeof meetupEnabled !== 'boolean' ||
    (!shippingEnabled && !meetupEnabled)
  ) {
    throw new HttpsError(
      'invalid-argument',
      'Mindestens Versand oder Übergabe muss aktiviert sein.',
    );
  }

  if (
    !(
      estimatedValueCents === null ||
      (typeof estimatedValueCents === 'number' &&
        Number.isInteger(estimatedValueCents) &&
        estimatedValueCents >= 0 &&
        estimatedValueCents <= MAX_VALUE_CENTS)
    )
  ) {
    throw new HttpsError('invalid-argument', 'Der Schätzwert ist ungültig.');
  }

  return {
    wardrobeItemId,
    description,
    city,
    shippingEnabled,
    meetupEnabled,
    estimatedValueCents,
  };
}

function requiredString(
  record: Record<string, unknown>,
  fieldName: string,
): string {
  const value = record[fieldName];
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpsError(
      'failed-precondition',
      `Kleidungsstück hat kein gültiges Feld ${fieldName}.`,
    );
  }
  return value.trim();
}

function nullableString(
  record: Record<string, unknown>,
  fieldName: string,
): string | null {
  const value = record[fieldName];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function publicFilePath(listingId: string, sourcePath: string): string {
  const sourceName = sourcePath.split('/').pop() ?? 'original.jpg';
  const extensionMatch = sourceName.match(/\.([a-zA-Z0-9]{2,8})$/);
  const extension = extensionMatch?.[1]?.toLowerCase() ?? 'jpg';
  return `public/listings/${listingId}/original.${extension}`;
}

export const createSwapListing = onCall(
  {
    region: FUNCTIONS_REGION,
    timeoutSeconds: 60,
    memory: '512MiB',
  },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Anmeldung erforderlich.');
    }

    const input = parseRequest(request.data);
    ensureAdminInitialized();

    const db = getFirestore();
    const bucket = getStorage().bucket();
    const itemRef = db.collection('wardrobeItems').doc(input.wardrobeItemId);
    const listingRef = db.collection('swapListings').doc();

    const initialSnapshot = await itemRef.get();
    if (!initialSnapshot.exists) {
      throw new HttpsError('not-found', 'Kleidungsstück wurde nicht gefunden.');
    }

    const initialData = initialSnapshot.data();
    if (!initialData || initialData.ownerId !== uid) {
      throw new HttpsError(
        'permission-denied',
        'Dieses Kleidungsstück gehört nicht zu deinem Schrank.',
      );
    }
    if (initialData.isListedForSwap === true || initialData.swapListingId) {
      throw new HttpsError(
        'already-exists',
        'Dieses Kleidungsstück ist bereits für OmniSwap gelistet.',
      );
    }

    const sourceImagePath = requiredString(initialData, 'imagePath');
    if (!sourceImagePath.startsWith(`users/${uid}/wardrobe/`)) {
      throw new HttpsError(
        'failed-precondition',
        'Das private Kleidungsbild hat einen ungültigen Pfad.',
      );
    }

    const destinationPath = publicFilePath(listingRef.id, sourceImagePath);
    const sourceFile = bucket.file(sourceImagePath);
    const destinationFile = bucket.file(destinationPath);

    const [sourceExists] = await sourceFile.exists();
    if (!sourceExists) {
      throw new HttpsError(
        'failed-precondition',
        'Das Kleidungsbild ist nicht mehr verfügbar.',
      );
    }

    try {
      await sourceFile.copy(destinationFile);

      await db.runTransaction(async (transaction) => {
        const currentSnapshot = await transaction.get(itemRef);
        if (!currentSnapshot.exists) {
          throw new HttpsError(
            'failed-precondition',
            'Das Kleidungsstück wurde während der Erstellung entfernt.',
          );
        }

        const item = currentSnapshot.data();
        if (!item || item.ownerId !== uid) {
          throw new HttpsError('permission-denied', 'Eigentümerprüfung fehlgeschlagen.');
        }
        if (item.isListedForSwap === true || item.swapListingId) {
          throw new HttpsError(
            'already-exists',
            'Dieses Kleidungsstück ist bereits gelistet.',
          );
        }
        if (item.imagePath !== sourceImagePath) {
          throw new HttpsError(
            'aborted',
            'Das Kleidungsbild wurde während der Erstellung geändert.',
          );
        }

        const now = FieldValue.serverTimestamp();
        transaction.set(listingRef, {
          ownerId: uid,
          wardrobeItemId: input.wardrobeItemId,
          title: requiredString(item, 'name'),
          description: input.description,
          category: requiredString(item, 'category'),
          subcategory: nullableString(item, 'subcategory'),
          color: requiredString(item, 'color'),
          brand: nullableString(item, 'brand'),
          size: nullableString(item, 'size'),
          condition: requiredString(item, 'condition'),
          publicImagePath: destinationPath,
          city: input.city,
          shippingEnabled: input.shippingEnabled,
          meetupEnabled: input.meetupEnabled,
          estimatedValueCents: input.estimatedValueCents,
          status: 'active',
          createdAt: now,
          updatedAt: now,
          schemaVersion: LISTING_SCHEMA_VERSION,
        });

        transaction.update(itemRef, {
          isListedForSwap: true,
          swapListingId: listingRef.id,
          updatedAt: now,
        });
      });
    } catch (error: unknown) {
      try {
        await destinationFile.delete({ ignoreNotFound: true });
      } catch (cleanupError: unknown) {
        logger.error('Failed to clean up public listing image', cleanupError);
      }

      if (error instanceof HttpsError) {
        throw error;
      }
      logger.error('Failed to create swap listing', error);
      throw new HttpsError(
        'internal',
        'OmniSwap-Listing konnte nicht erstellt werden.',
      );
    }

    return {
      listingId: listingRef.id,
      status: 'active' as const,
    };
  },
);
