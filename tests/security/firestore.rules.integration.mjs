import assert from 'node:assert/strict';

import { deleteApp, initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
} from 'firebase/auth';
import {
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

const PROJECT_ID = 'demo-omni-fashion-rules';
const AUTH_EMULATOR_URL = 'http://127.0.0.1:9099';
const FIRESTORE_EMULATOR_HOST = '127.0.0.1';
const FIRESTORE_EMULATOR_PORT = 8080;

const baseFirebaseConfig = {
  apiKey: 'demo-api-key',
  authDomain: `${PROJECT_ID}.firebaseapp.com`,
  projectId: PROJECT_ID,
  appId: 'demo-app-id',
};

function createClient(name) {
  const app = initializeApp(baseFirebaseConfig, name);
  const auth = getAuth(app);
  const db = getFirestore(app);

  connectAuthEmulator(auth, AUTH_EMULATOR_URL, { disableWarnings: true });
  connectFirestoreEmulator(
    db,
    FIRESTORE_EMULATOR_HOST,
    FIRESTORE_EMULATOR_PORT,
  );

  return { app, auth, db };
}

async function register(client, email) {
  const credential = await createUserWithEmailAndPassword(
    client.auth,
    email,
    'OmniFashion-Test-123!',
  );

  return credential.user.uid;
}

async function expectPermissionDenied(operation, label) {
  try {
    await operation;
    assert.fail(
      `${label}: expected permission-denied, but operation succeeded.`,
    );
  } catch (error) {
    if (error instanceof assert.AssertionError) {
      throw error;
    }

    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String(error.code)
        : '';

    assert.ok(
      code.includes('permission-denied'),
      `${label}: expected permission-denied, received ${code || 'unknown error'}.`,
    );
  }
}

function validUserProfile(displayName) {
  const now = Timestamp.now();

  return {
    displayName,
    avatarUrl: null,
    locale: 'de-DE',
    country: 'DE',
    city: 'Berlin',
    onboardingCompleted: false,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
  };
}

function validWardrobeItem(ownerId, itemId) {
  const now = Timestamp.now();

  return {
    ownerId,
    imagePath: `users/${ownerId}/wardrobe/${itemId}/original.jpg`,
    name: 'Schwarze Jacke',
    category: 'Outerwear',
    subcategory: null,
    color: 'Schwarz',
    secondaryColors: [],
    brand: null,
    material: null,
    size: null,
    season: 'All',
    condition: 'good',
    styleTags: [],
    source: 'camera',
    aiStatus: 'not_requested',
    aiConfidence: null,
    aiFieldConfidence: null,
    aiModelVersion: null,
    aiPromptVersion: null,
    aiAnalyzedAt: null,
    aiErrorCode: null,
    isListedForSwap: false,
    swapListingId: null,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
  };
}

async function run() {
  const owner = createClient('rules-owner');
  const stranger = createClient('rules-stranger');
  const anonymous = createClient('rules-anonymous');

  try {
    const ownerId = await register(owner, 'owner@omni-fashion.test');
    const strangerId = await register(stranger, 'stranger@omni-fashion.test');

    const ownerProfileRef = doc(owner.db, 'users', ownerId);
    await setDoc(ownerProfileRef, validUserProfile('Owner'));
    assert.equal((await getDoc(ownerProfileRef)).exists(), true);

    await updateDoc(ownerProfileRef, {
      onboardingCompleted: true,
      updatedAt: Timestamp.now(),
    });
    assert.equal(
      (await getDoc(ownerProfileRef)).data()?.onboardingCompleted,
      true,
    );

    await expectPermissionDenied(
      updateDoc(doc(stranger.db, 'users', ownerId), {
        onboardingCompleted: false,
        updatedAt: Timestamp.now(),
      }),
      'stranger changes onboarding completion state',
    );

    await expectPermissionDenied(
      updateDoc(ownerProfileRef, {
        onboardingCompleted: 'yes',
        updatedAt: Timestamp.now(),
      }),
      'owner writes invalid onboarding completion type',
    );

    await expectPermissionDenied(
      setDoc(doc(stranger.db, 'users', strangerId), {
        displayName: 'Incomplete Profile',
      }),
      'invalid user profile shape',
    );

    await expectPermissionDenied(
      getDoc(doc(stranger.db, 'users', ownerId)),
      'stranger reads private profile',
    );
    await expectPermissionDenied(
      getDoc(doc(anonymous.db, 'users', ownerId)),
      'anonymous reads private profile',
    );

    const itemId = 'owner-item-1';
    const wardrobeRef = doc(owner.db, 'wardrobeItems', itemId);
    await setDoc(wardrobeRef, validWardrobeItem(ownerId, itemId));
    assert.equal((await getDoc(wardrobeRef)).exists(), true);

    await updateDoc(wardrobeRef, {
      name: 'Schwarze Lederjacke',
      brand: 'Vintage',
      material: 'Leder',
      updatedAt: Timestamp.now(),
    });

    await updateDoc(wardrobeRef, {
      category: 'Dress',
      subcategory: 'Midikleid',
      updatedAt: Timestamp.now(),
    });
    await updateDoc(wardrobeRef, {
      category: 'Outerwear',
      subcategory: null,
      updatedAt: Timestamp.now(),
    });

    await expectPermissionDenied(
      getDoc(doc(stranger.db, 'wardrobeItems', itemId)),
      'stranger reads private wardrobe item',
    );
    await expectPermissionDenied(
      updateDoc(doc(stranger.db, 'wardrobeItems', itemId), {
        name: 'Manipulated',
      }),
      'stranger updates private wardrobe item',
    );
    await expectPermissionDenied(
      deleteDoc(doc(stranger.db, 'wardrobeItems', itemId)),
      'stranger deletes private wardrobe item',
    );

    await expectPermissionDenied(
      updateDoc(wardrobeRef, { ownerId: strangerId }),
      'owner changes wardrobe ownerId',
    );
    await expectPermissionDenied(
      updateDoc(wardrobeRef, {
        imagePath: `users/${strangerId}/wardrobe/${itemId}/original.jpg`,
      }),
      'owner changes wardrobe image ownership path',
    );

    await expectPermissionDenied(
      updateDoc(wardrobeRef, {
        aiStatus: 'completed',
        aiConfidence: 0.99,
        aiFieldConfidence: {
          category: 0.99,
          subcategory: 0.9,
          color: 0.99,
          brand: 0.2,
          material: 0.8,
          season: 0.8,
          styleTags: 0.85,
        },
        aiModelVersion: 'fake-client-model',
        aiPromptVersion: 'fake-client-prompt',
        aiAnalyzedAt: Timestamp.now(),
        aiErrorCode: null,
      }),
      'client forges completed AI result',
    );
    await expectPermissionDenied(
      updateDoc(wardrobeRef, {
        aiStatus: 'failed',
        aiErrorCode: 'CLIENT_FORGED_ERROR',
      }),
      'client forges AI error state',
    );
    await expectPermissionDenied(
      updateDoc(wardrobeRef, {
        isListedForSwap: true,
        swapListingId: 'fake-listing',
      }),
      'client forges swap linkage',
    );

    await expectPermissionDenied(
      setDoc(doc(owner.db, 'wardrobeItems', 'forged-item'), {
        ...validWardrobeItem(ownerId, 'forged-item'),
        aiStatus: 'completed',
        aiConfidence: 1,
        aiFieldConfidence: {
          category: 1,
          subcategory: 1,
          color: 1,
          brand: 1,
          material: 1,
          season: 1,
          styleTags: 1,
        },
        aiModelVersion: 'client-forged',
        aiPromptVersion: 'client-forged',
        aiAnalyzedAt: Timestamp.now(),
      }),
      'client creates wardrobe item with forged AI state',
    );

    await expectPermissionDenied(
      setDoc(doc(owner.db, 'swapListings', 'listing-1'), {
        ownerId,
        wardrobeItemId: itemId,
        title: 'Schwarze Lederjacke',
        status: 'active',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }),
      'client creates swap listing directly',
    );

    await expectPermissionDenied(
      setDoc(doc(owner.db, 'swapOffers', 'offer-1'), {
        requesterId: ownerId,
        listingOwnerId: strangerId,
        status: 'sent',
      }),
      'client creates swap offer directly',
    );
    await expectPermissionDenied(
      setDoc(doc(owner.db, 'swapTransactions', 'trade-1'), {
        participantIds: [ownerId, strangerId],
        status: 'accepted',
      }),
      'client creates trade transaction directly',
    );
    await expectPermissionDenied(
      setDoc(doc(owner.db, 'swapLocks', itemId), {
        ownerId,
        offerId: 'fake-offer',
      }),
      'client creates swap lock directly',
    );
    await expectPermissionDenied(
      setDoc(doc(owner.db, 'swapOfferKeys', `listing-1_${ownerId}`), {
        requesterId: ownerId,
        offerId: 'fake-offer',
      }),
      'client creates offer key directly',
    );

    await expectPermissionDenied(
      setDoc(doc(owner.db, 'unexpectedCollection', 'document-1'), {
        ownerId,
      }),
      'unknown collection write',
    );

    await signOut(owner.auth);
    await signOut(stranger.auth);

    console.log('Security rules integration tests passed.');
  } finally {
    await Promise.all([
      deleteApp(owner.app),
      deleteApp(stranger.app),
      deleteApp(anonymous.app),
    ]);
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
