import assert from 'node:assert/strict';

import { deleteApp, initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
} from 'firebase/auth';
import {
  connectFirestoreEmulator,
  doc,
  getDoc,
  getFirestore,
  setDoc,
  Timestamp,
} from 'firebase/firestore';

const PROJECT_ID = 'demo-omni-fashion-rules';
const AUTH_EMULATOR_URL = 'http://127.0.0.1:9099';
const FIRESTORE_EMULATOR_HOST = '127.0.0.1';
const FIRESTORE_EMULATOR_PORT = 8080;

const app = initializeApp(
  {
    apiKey: 'demo-api-key',
    authDomain: `${PROJECT_ID}.firebaseapp.com`,
    projectId: PROJECT_ID,
    appId: 'demo-push-rules-app',
  },
  'push-rules-client',
);
const auth = getAuth(app);
const db = getFirestore(app);

connectAuthEmulator(auth, AUTH_EMULATOR_URL, { disableWarnings: true });
connectFirestoreEmulator(db, FIRESTORE_EMULATOR_HOST, FIRESTORE_EMULATOR_PORT);

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
  const credential = await createUserWithEmailAndPassword(
    auth,
    'push-rules@omni-fashion.test',
    'OmniFashion-Test-123!',
  );
  const userId = credential.user.uid;
  const now = Timestamp.now();

  await expectPermissionDenied(
    setDoc(doc(db, 'pushDevices', 'client-device'), {
      userId,
      expoPushToken: 'ExpoPushToken[client-forged-token]',
      platform: 'android',
      enabled: true,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    }),
    'client creates push device directly',
  );

  await expectPermissionDenied(
    getDoc(doc(db, 'pushDevices', 'unknown-device')),
    'client reads push device infrastructure',
  );

  await expectPermissionDenied(
    setDoc(doc(db, 'pushDeliveries', 'client-delivery'), {
      userId,
      notificationId: 'notification-1',
      status: 'receipt_ok',
      createdAt: now,
    }),
    'client forges push delivery state',
  );

  await expectPermissionDenied(
    getDoc(doc(db, 'pushDeliveries', 'unknown-delivery')),
    'client reads push delivery infrastructure',
  );

  await expectPermissionDenied(
    setDoc(doc(db, 'pushTickets', 'client-ticket'), {
      userId,
      status: 'pending',
      createdAt: now,
    }),
    'client forges push ticket state',
  );

  await expectPermissionDenied(
    getDoc(doc(db, 'pushTickets', 'unknown-ticket')),
    'client reads push ticket infrastructure',
  );

  console.log('Push security rules integration tests passed.');
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await deleteApp(app);
  });
