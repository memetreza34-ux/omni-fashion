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
    assert.fail(`${label}: expected permission-denied, but operation succeeded.`);
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

async function run() {
  const owner = createClient('rules-owner');
  const stranger = createClient('rules-stranger');
  const anonymous = createClient('rules-anonymous');

  try {
    const ownerId = await register(owner, 'owner@omni-fashion.test');
    const strangerId = await register(stranger, 'stranger@omni-fashion.test');

    // UserProfile: owner can create/read their valid private profile.
    const ownerProfileRef = doc(owner.db, 'users', ownerId);
    await setDoc(ownerProfileRef, validUserProfile('Owner'));
    assert.equal((await getDoc(ownerProfileRef)).exists(), true);

    // Invalid profile shapes are rejected.
    await expectPermissionDenied(
      setDoc(doc(stranger.db, 'users', strangerId), {
        displayName: 'Incomplete Profile',
      }),
      'invalid user profile shape',
    );

    // Private profiles cannot be read by another user or anonymously.
    await expectPermissionDenied(
      getDoc(doc(stranger.db, 'users', ownerId)),
      'stranger reads private profile',
    );
    await expectPermissionDenied(
      getDoc(doc(anonymous.db, 'users', ownerId)),
      'anonymous reads private profile',
    );

    // Wardrobe: owner can create/read/update/delete own item.
    const wardrobeRef = doc(owner.db, 'wardrobeItems', 'owner-item-1');
    await setDoc(wardrobeRef, {
      ownerId,
      name: 'Schwarze Jacke',
      category: 'Outerwear',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    assert.equal((await getDoc(wardrobeRef)).exists(), true);

    await updateDoc(wardrobeRef, {
      name: 'Schwarze Lederjacke',
      updatedAt: Timestamp.now(),
    });

    // Another user cannot read/update/delete a private wardrobe item.
    await expectPermissionDenied(
      getDoc(doc(stranger.db, 'wardrobeItems', 'owner-item-1')),
      'stranger reads private wardrobe item',
    );
    await expectPermissionDenied(
      updateDoc(doc(stranger.db, 'wardrobeItems', 'owner-item-1'), {
        name: 'Manipulated',
      }),
      'stranger updates private wardrobe item',
    );
    await expectPermissionDenied(
      deleteDoc(doc(stranger.db, 'wardrobeItems', 'owner-item-1')),
      'stranger deletes private wardrobe item',
    );

    // Owner cannot transfer ownership by editing ownerId.
    await expectPermissionDenied(
      updateDoc(wardrobeRef, { ownerId: strangerId }),
      'owner changes wardrobe ownerId',
    );

    // Marketplace: active listings are intentionally public-readable.
    const listingRef = doc(owner.db, 'swapListings', 'listing-1');
    await setDoc(listingRef, {
      ownerId,
      wardrobeItemId: 'owner-item-1',
      title: 'Schwarze Lederjacke',
      status: 'active',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    assert.equal(
      (await getDoc(doc(stranger.db, 'swapListings', 'listing-1'))).exists(),
      true,
    );
    assert.equal(
      (await getDoc(doc(anonymous.db, 'swapListings', 'listing-1'))).exists(),
      true,
    );

    // Non-owner cannot mutate a listing.
    await expectPermissionDenied(
      updateDoc(doc(stranger.db, 'swapListings', 'listing-1'), {
        title: 'Manipulated listing',
      }),
      'stranger updates listing',
    );

    // Security-critical trade writes are server-only by design.
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

    // Unknown collections remain denied by the default-deny catch-all.
    await expectPermissionDenied(
      setDoc(doc(owner.db, 'unexpectedCollection', 'document-1'), {
        ownerId,
      }),
      'unknown collection write',
    );

    // Ensure auth state is clean before deleting app instances.
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
