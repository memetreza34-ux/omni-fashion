import assert from 'node:assert/strict';

import { deleteApp, initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
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

const firebaseConfig = {
  apiKey: 'demo-api-key',
  authDomain: `${PROJECT_ID}.firebaseapp.com`,
  projectId: PROJECT_ID,
  appId: 'demo-app-id',
};

function createClient(name) {
  const app = initializeApp(firebaseConfig, name);
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

async function expectDenied(operation, label) {
  try {
    await operation;
    assert.fail(`${label}: expected permission-denied.`);
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
      `${label}: expected permission-denied, got ${code || 'unknown'}.`,
    );
  }
}

function validOutfit(ownerId) {
  const now = Timestamp.now();
  return {
    ownerId,
    itemIds: ['item-a', 'item-b', 'item-c'],
    occasion: 'everyday',
    season: 'All',
    score: 84,
    scoreBreakdown: {
      styleMatch: 90,
      colorHarmony: 82,
      occasionFit: 80,
      seasonFit: 88,
      dataQuality: 72,
    },
    reasons: ['passt stark zu deiner Style-DNA'],
    feedback: 'none',
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
  };
}

async function run() {
  const owner = createClient('outfit-owner');
  const stranger = createClient('outfit-stranger');

  try {
    const ownerId = await register(owner, 'outfit-owner@omni-fashion.test');
    const strangerId = await register(
      stranger,
      'outfit-stranger@omni-fashion.test',
    );
    const outfitRef = doc(owner.db, 'outfits', 'outfit-1');

    await setDoc(outfitRef, validOutfit(ownerId));
    assert.equal((await getDoc(outfitRef)).exists(), true);

    await expectDenied(
      getDoc(doc(stranger.db, 'outfits', 'outfit-1')),
      'stranger reads private saved outfit',
    );

    await updateDoc(outfitRef, {
      feedback: 'liked',
      updatedAt: Timestamp.now(),
    });
    await updateDoc(outfitRef, {
      feedback: 'worn',
      updatedAt: Timestamp.now(),
    });

    await expectDenied(
      updateDoc(outfitRef, { ownerId: strangerId }),
      'owner transfers saved outfit ownership',
    );

    await expectDenied(
      updateDoc(outfitRef, { score: 100 }),
      'client rewrites immutable recommendation score',
    );

    await expectDenied(
      updateDoc(outfitRef, { itemIds: ['fake-a', 'fake-b'] }),
      'client rewrites saved outfit composition',
    );

    await expectDenied(
      setDoc(doc(stranger.db, 'outfits', 'invalid-outfit'), {
        ...validOutfit(strangerId),
        feedback: 'fake-feedback',
      }),
      'invalid feedback enum rejected',
    );

    await expectDenied(
      setDoc(doc(stranger.db, 'outfits', 'invalid-score'), {
        ...validOutfit(strangerId),
        score: 150,
      }),
      'score above 100 rejected',
    );

    await deleteDoc(outfitRef);
    assert.equal((await getDoc(outfitRef)).exists(), false);

    console.log('Saved outfit security rules integration tests passed.');
  } finally {
    await Promise.all([deleteApp(owner.app), deleteApp(stranger.app)]);
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
