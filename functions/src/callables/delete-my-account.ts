import { createHash } from 'node:crypto';

import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import {
  FieldValue,
  getFirestore,
  type DocumentReference,
  type QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

const FUNCTIONS_REGION = 'europe-west1';
const RECENT_AUTH_SECONDS = 5 * 60;
const DELETION_AUDIT_SCHEMA_VERSION = 1;
const REDACTED_TEXT = '[redacted after account deletion]';

function ensureAdminInitialized(): void {
  if (getApps().length === 0) {
    initializeApp();
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function requireRecentAuthentication(token: unknown): void {
  if (!isRecord(token) || typeof token.auth_time !== 'number') {
    throw new HttpsError(
      'failed-precondition',
      'Für die Kontolöschung ist eine erneute Anmeldung erforderlich.',
    );
  }

  const ageSeconds = Math.floor(Date.now() / 1000) - token.auth_time;
  if (ageSeconds < 0 || ageSeconds > RECENT_AUTH_SECONDS) {
    throw new HttpsError(
      'failed-precondition',
      'Die Anmeldung ist für diese sensible Aktion nicht mehr aktuell. Bitte erneut anmelden.',
    );
  }
}

function pseudonymForUser(uid: string): string {
  return `deleted_${createHash('sha256')
    .update(`omni-fashion-deleted:${uid}`)
    .digest('hex')
    .slice(0, 24)}`;
}

function activeStatus(value: unknown, allowed: readonly string[]): boolean {
  return typeof value === 'string' && allowed.includes(value);
}

function participantIds(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : [];
}

function uniqueDocuments(documents: QueryDocumentSnapshot[]): QueryDocumentSnapshot[] {
  const values = new Map<string, QueryDocumentSnapshot>();
  for (const document of documents) {
    values.set(document.ref.path, document);
  }
  return [...values.values()];
}

function uniqueReferences(references: DocumentReference[]): DocumentReference[] {
  const values = new Map<string, DocumentReference>();
  for (const reference of references) {
    values.set(reference.path, reference);
  }
  return [...values.values()];
}

export const deleteMyAccount = onCall(
  {
    region: FUNCTIONS_REGION,
    timeoutSeconds: 300,
    memory: '512MiB',
  },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Anmeldung erforderlich.');
    }
    requireRecentAuthentication(request.auth?.token);

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
    if (
      [...requesterOffersSnapshot.docs, ...ownerOffersSnapshot.docs].some(
        (document) => document.data().status === 'sent',
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

    if (blockers.length > 0) {
      throw new HttpsError(
        'failed-precondition',
        'Das Konto kann erst gelöscht werden, wenn alle offenen OmniSwap-Vorgänge abgeschlossen oder beendet sind.',
        { blockers: [...new Set(blockers)] },
      );
    }

    const pseudonym = pseudonymForUser(uid);
    const [
      wardrobeSnapshot,
      outfitsSnapshot,
      disputesSnapshot,
      authoredReviewsSnapshot,
      receivedReviewsSnapshot,
      outgoingBlocksSnapshot,
      incomingBlocksSnapshot,
      notificationsSnapshot,
      reportsByReporterSnapshot,
      reportsByOwnerSnapshot,
      reportsByTargetSnapshot,
      pushDevicesSnapshot,
      pushDeliveriesSnapshot,
      pushTicketsSnapshot,
      offerKeysSnapshot,
    ] = await Promise.all([
      db.collection('wardrobeItems').where('ownerId', '==', uid).get(),
      db.collection('outfits').where('ownerId', '==', uid).get(),
      db
        .collection('swapDisputes')
        .where('participantIds', 'array-contains', uid)
        .get(),
      db.collection('reviews').where('reviewerId', '==', uid).get(),
      db.collection('reviews').where('revieweeId', '==', uid).get(),
      db.collection('blocks').where('blockerId', '==', uid).get(),
      db.collection('blocks').where('blockedId', '==', uid).get(),
      db.collection('notifications').where('userId', '==', uid).get(),
      db.collection('reports').where('reporterId', '==', uid).get(),
      db.collection('reports').where('targetOwnerId', '==', uid).get(),
      db.collection('reports').where('targetId', '==', uid).get(),
      db.collection('pushDevices').where('userId', '==', uid).get(),
      db.collection('pushDeliveries').where('userId', '==', uid).get(),
      db.collection('pushTickets').where('userId', '==', uid).get(),
      db.collection('swapOfferKeys').where('requesterId', '==', uid).get(),
    ]);

    const writer = db.bulkWriter();
    let deletedPrivateDocuments = 0;
    let pseudonymizedHistoricalDocuments = 0;

    const privateReferences = uniqueReferences([
      ...wardrobeSnapshot.docs.map((document) => document.ref),
      ...outfitsSnapshot.docs.map((document) => document.ref),
      ...outgoingBlocksSnapshot.docs.map((document) => document.ref),
      ...incomingBlocksSnapshot.docs.map((document) => document.ref),
      ...notificationsSnapshot.docs.map((document) => document.ref),
      ...pushDevicesSnapshot.docs.map((document) => document.ref),
      ...pushDeliveriesSnapshot.docs.map((document) => document.ref),
      ...pushTicketsSnapshot.docs.map((document) => document.ref),
      ...offerKeysSnapshot.docs.map((document) => document.ref),
      db.collection('styleProfiles').doc(uid),
      db.collection('notificationPreferences').doc(uid),
    ]);

    for (const reference of privateReferences) {
      writer.delete(reference);
      deletedPrivateDocuments += 1;
    }

    for (const document of listingsSnapshot.docs) {
      writer.update(document.ref, {
        ownerId: pseudonym,
        description: '',
        city: '',
        updatedAt: FieldValue.serverTimestamp(),
        ownerPseudonymizedAt: FieldValue.serverTimestamp(),
      });
      pseudonymizedHistoricalDocuments += 1;
    }

    for (const document of uniqueDocuments([
      ...requesterOffersSnapshot.docs,
      ...ownerOffersSnapshot.docs,
    ])) {
      const raw: unknown = document.data();
      if (!isRecord(raw)) continue;
      const update: Record<string, unknown> = {
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (raw.requesterId === uid) update.requesterId = pseudonym;
      if (raw.listingOwnerId === uid) update.listingOwnerId = pseudonym;
      writer.update(document.ref, update);
      pseudonymizedHistoricalDocuments += 1;
    }

    for (const document of transactionsSnapshot.docs) {
      const raw: unknown = document.data();
      if (!isRecord(raw)) continue;
      const update: Record<string, unknown> = {
        participantIds: participantIds(raw.participantIds).map((id) =>
          id === uid ? pseudonym : id,
        ),
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (raw.requesterId === uid) update.requesterId = pseudonym;
      if (raw.listingOwnerId === uid) update.listingOwnerId = pseudonym;
      writer.update(document.ref, update);
      pseudonymizedHistoricalDocuments += 1;
    }

    for (const document of disputesSnapshot.docs) {
      const raw: unknown = document.data();
      if (!isRecord(raw)) continue;
      writer.update(document.ref, {
        participantIds: participantIds(raw.participantIds).map((id) =>
          id === uid ? pseudonym : id,
        ),
        openedById: raw.openedById === uid ? pseudonym : raw.openedById,
        details: REDACTED_TEXT,
        resolutionNote: raw.resolutionNote ? REDACTED_TEXT : null,
        updatedAt: FieldValue.serverTimestamp(),
      });
      pseudonymizedHistoricalDocuments += 1;
    }

    for (const document of uniqueDocuments([
      ...authoredReviewsSnapshot.docs,
      ...receivedReviewsSnapshot.docs,
    ])) {
      const raw: unknown = document.data();
      if (!isRecord(raw)) continue;
      const update: Record<string, unknown> = {
        comment: '',
      };
      if (raw.reviewerId === uid) update.reviewerId = pseudonym;
      if (raw.revieweeId === uid) update.revieweeId = pseudonym;
      writer.update(document.ref, update);
      pseudonymizedHistoricalDocuments += 1;
    }

    for (const document of uniqueDocuments([
      ...reportsByReporterSnapshot.docs,
      ...reportsByOwnerSnapshot.docs,
      ...reportsByTargetSnapshot.docs,
    ])) {
      const raw: unknown = document.data();
      if (!isRecord(raw)) continue;
      const update: Record<string, unknown> = {
        details: REDACTED_TEXT,
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (raw.reporterId === uid) update.reporterId = pseudonym;
      if (raw.targetOwnerId === uid) update.targetOwnerId = pseudonym;
      if (raw.targetType === 'user' && raw.targetId === uid) {
        update.targetId = pseudonym;
      }
      writer.update(document.ref, update);
      pseudonymizedHistoricalDocuments += 1;
    }

    await writer.close();

    // Delete every private user-owned object only. Public listing media is
    // handled by the inactive-listing cleanup worker after its listing is no
    // longer active.
    await getStorage().bucket().deleteFiles({
      prefix: `users/${uid}/`,
    });

    await Promise.all([
      db.collection('users').doc(uid).delete(),
      db.collection('accountDeletionPrivateState').doc(uid).delete(),
    ]);

    await db.collection('privacyDeletionAudit').doc(pseudonym).set({
      pseudonym,
      deletedPrivateDocuments,
      pseudonymizedHistoricalDocuments,
      completedAt: FieldValue.serverTimestamp(),
      schemaVersion: DELETION_AUDIT_SCHEMA_VERSION,
    });

    // Authentication is deliberately deleted last. If an earlier cleanup
    // step fails, the authenticated user can retry the idempotent workflow.
    await getAuth().deleteUser(uid);

    return {
      deleted: true as const,
      pseudonymizedHistoricalDocuments,
    };
  },
);
