import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

const FUNCTIONS_REGION = 'europe-west1';
const RECENT_AUTH_SECONDS = 5 * 60;

function ensureAdminInitialized(): void {
  if (getApps().length === 0) {
    initializeApp();
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function hasRecentAuthentication(token: unknown): boolean {
  if (!isRecord(token) || typeof token.auth_time !== 'number') {
    return false;
  }
  return Math.floor(Date.now() / 1000) - token.auth_time <= RECENT_AUTH_SECONDS;
}

function activeStatus(value: unknown, allowed: readonly string[]): boolean {
  return typeof value === 'string' && allowed.includes(value);
}

export const getAccountDeletionReadiness = onCall(
  {
    region: FUNCTIONS_REGION,
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Anmeldung erforderlich.');
    }

    ensureAdminInitialized();
    const db = getFirestore();
    const [
      listingsSnapshot,
      requesterOffersSnapshot,
      ownerOffersSnapshot,
      transactionsSnapshot,
      locksSnapshot,
    ] = await Promise.all([
      db.collection('swapListings').where('ownerId', '==', uid).get(),
      db.collection('swapOffers').where('requesterId', '==', uid).get(),
      db.collection('swapOffers').where('listingOwnerId', '==', uid).get(),
      db
        .collection('swapTransactions')
        .where('participantIds', 'array-contains', uid)
        .get(),
      db.collection('swapLocks').where('ownerId', '==', uid).get(),
    ]);

    const blockers: string[] = [];

    if (
      listingsSnapshot.docs.some((document) =>
        activeStatus(document.data().status, ['active', 'paused', 'reserved']),
      )
    ) {
      blockers.push('ACTIVE_SWAP_LISTING');
    }

    const offerDocuments = [
      ...requesterOffersSnapshot.docs,
      ...ownerOffersSnapshot.docs,
    ];
    if (
      offerDocuments.some((document) =>
        activeStatus(document.data().status, ['sent']),
      )
    ) {
      blockers.push('ACTIVE_SWAP_OFFER');
    }

    if (
      transactionsSnapshot.docs.some(
        (document) =>
          !activeStatus(document.data().status, ['completed', 'cancelled']),
      )
    ) {
      blockers.push('OPEN_SWAP_TRANSACTION');
    }

    if (!locksSnapshot.empty) {
      blockers.push('ACTIVE_SWAP_LOCK');
    }

    return {
      ready: blockers.length === 0,
      blockers: [...new Set(blockers)],
      recentAuthentication: hasRecentAuthentication(request.auth?.token),
      recentAuthenticationWindowSeconds: RECENT_AUTH_SECONDS,
    };
  },
);
