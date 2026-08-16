import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

const FUNCTIONS_REGION = 'europe-west1';
const EXPORT_SCHEMA_VERSION = 1;

function ensureAdminInitialized(): void {
  if (getApps().length === 0) {
    initializeApp();
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function jsonSafe(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(jsonSafe);
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, jsonSafe(entry)]),
    );
  }
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  return String(value);
}

function documentData(id: string, raw: Record<string, unknown>) {
  return { id, ...jsonSafe(raw) as Record<string, unknown> };
}

function uniqueDocuments(
  documents: { id: string; data: () => FirebaseFirestore.DocumentData }[],
) {
  const values = new Map<string, Record<string, unknown>>();
  for (const document of documents) {
    const raw: unknown = document.data();
    if (isRecord(raw)) {
      values.set(document.id, documentData(document.id, raw));
    }
  }
  return [...values.values()];
}

export const exportMyData = onCall(
  {
    region: FUNCTIONS_REGION,
    timeoutSeconds: 120,
    memory: '512MiB',
  },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Anmeldung erforderlich.');
    }

    ensureAdminInitialized();
    const db = getFirestore();

    const [
      profileSnapshot,
      styleProfileSnapshot,
      wardrobeSnapshot,
      outfitsSnapshot,
      listingsSnapshot,
      requesterOffersSnapshot,
      ownerOffersSnapshot,
      transactionsSnapshot,
      disputesSnapshot,
      authoredReviewsSnapshot,
      receivedReviewsSnapshot,
      blocksSnapshot,
      notificationsSnapshot,
      notificationPreferencesSnapshot,
      reportsSnapshot,
      pushDevicesSnapshot,
    ] = await Promise.all([
      db.collection('users').doc(uid).get(),
      db.collection('styleProfiles').doc(uid).get(),
      db.collection('wardrobeItems').where('ownerId', '==', uid).get(),
      db.collection('outfits').where('ownerId', '==', uid).get(),
      db.collection('swapListings').where('ownerId', '==', uid).get(),
      db.collection('swapOffers').where('requesterId', '==', uid).get(),
      db.collection('swapOffers').where('listingOwnerId', '==', uid).get(),
      db
        .collection('swapTransactions')
        .where('participantIds', 'array-contains', uid)
        .get(),
      db
        .collection('swapDisputes')
        .where('participantIds', 'array-contains', uid)
        .get(),
      db.collection('reviews').where('reviewerId', '==', uid).get(),
      db.collection('reviews').where('revieweeId', '==', uid).get(),
      db.collection('blocks').where('blockerId', '==', uid).get(),
      db.collection('notifications').where('userId', '==', uid).get(),
      db.collection('notificationPreferences').doc(uid).get(),
      db.collection('reports').where('reporterId', '==', uid).get(),
      db.collection('pushDevices').where('userId', '==', uid).get(),
    ]);

    const profileRaw: unknown = profileSnapshot.data();
    const styleProfileRaw: unknown = styleProfileSnapshot.data();
    const preferenceRaw: unknown = notificationPreferencesSnapshot.data();

    const pushDevices = pushDevicesSnapshot.docs.map((document) => {
      const raw: unknown = document.data();
      if (!isRecord(raw)) {
        return { id: document.id };
      }
      return {
        id: document.id,
        platform: jsonSafe(raw.platform),
        enabled: jsonSafe(raw.enabled),
        createdAt: jsonSafe(raw.createdAt),
        updatedAt: jsonSafe(raw.updatedAt),
        lastDeliveryAt: jsonSafe(raw.lastDeliveryAt),
        lastErrorCode: jsonSafe(raw.lastErrorCode),
        tokenCredentialOmitted: true,
      };
    });

    return {
      schemaVersion: EXPORT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      userId: uid,
      profile:
        profileSnapshot.exists && isRecord(profileRaw)
          ? documentData(profileSnapshot.id, profileRaw)
          : null,
      styleProfile:
        styleProfileSnapshot.exists && isRecord(styleProfileRaw)
          ? documentData(styleProfileSnapshot.id, styleProfileRaw)
          : null,
      wardrobeItems: uniqueDocuments(wardrobeSnapshot.docs),
      outfits: uniqueDocuments(outfitsSnapshot.docs),
      swapListings: uniqueDocuments(listingsSnapshot.docs),
      swapOffers: uniqueDocuments([
        ...requesterOffersSnapshot.docs,
        ...ownerOffersSnapshot.docs,
      ]),
      swapTransactions: uniqueDocuments(transactionsSnapshot.docs),
      swapDisputes: uniqueDocuments(disputesSnapshot.docs),
      reviews: uniqueDocuments([
        ...authoredReviewsSnapshot.docs,
        ...receivedReviewsSnapshot.docs,
      ]),
      blocks: uniqueDocuments(blocksSnapshot.docs),
      notifications: uniqueDocuments(notificationsSnapshot.docs),
      notificationPreferences:
        notificationPreferencesSnapshot.exists && isRecord(preferenceRaw)
          ? documentData(notificationPreferencesSnapshot.id, preferenceRaw)
          : null,
      submittedReports: uniqueDocuments(reportsSnapshot.docs),
      pushDevices,
      securityCredentialsOmitted: [
        'Expo push tokens',
        'Firebase authentication credentials',
        'server secrets',
      ],
    };
  },
);
