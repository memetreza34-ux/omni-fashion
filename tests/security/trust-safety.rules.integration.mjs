import assert from 'node:assert/strict';

import { deleteApp, initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
} from 'firebase/auth';
import {
  collection,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  Timestamp,
  where,
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
    'OmniFashion-Trust-Test-123!',
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

async function run() {
  const owner = createClient('trust-owner');
  const stranger = createClient('trust-stranger');

  try {
    const ownerId = await register(owner, 'trust-owner@omni-fashion.test');
    const strangerId = await register(
      stranger,
      'trust-stranger@omni-fashion.test',
    );

    await expectPermissionDenied(
      setDoc(doc(owner.db, 'reports', 'client-report'), {
        reporterId: ownerId,
        targetType: 'user',
        targetId: strangerId,
        reason: 'fraud',
        details: '',
        status: 'open',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        schemaVersion: 1,
      }),
      'client creates moderation report directly',
    );

    await expectPermissionDenied(
      getDoc(doc(owner.db, 'reports', 'client-report')),
      'client reads moderation report directly',
    );

    await expectPermissionDenied(
      setDoc(doc(owner.db, 'blocks', `${ownerId}_${strangerId}`), {
        blockerId: ownerId,
        blockedId: strangerId,
        createdAt: Timestamp.now(),
        schemaVersion: 1,
      }),
      'client creates block directly',
    );

    const ownBlockQuery = query(
      collection(owner.db, 'blocks'),
      where('blockerId', '==', ownerId),
    );
    assert.equal((await getDocs(ownBlockQuery)).empty, true);

    await expectPermissionDenied(
      getDocs(
        query(
          collection(owner.db, 'blocks'),
          where('blockerId', '==', strangerId),
        ),
      ),
      'user enumerates another account block list',
    );

    await expectPermissionDenied(
      setDoc(doc(owner.db, 'swapDisputes', 'fake-trade'), {
        transactionId: 'fake-trade',
        participantIds: [ownerId, strangerId],
        openedById: ownerId,
        reason: 'item_not_received',
        details: '',
        status: 'open',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        schemaVersion: 1,
      }),
      'client creates swap dispute directly',
    );

    await signOut(owner.auth);
    await signOut(stranger.auth);

    console.log('Trust & Safety security rules integration tests passed.');
  } finally {
    await Promise.all([deleteApp(owner.app), deleteApp(stranger.app)]);
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
