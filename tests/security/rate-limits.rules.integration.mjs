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
  updateDoc,
} from 'firebase/firestore';

const PROJECT_ID = 'demo-omni-fashion-rules';

async function expectPermissionDenied(operation, label) {
  try {
    await operation;
    assert.fail(`${label}: expected permission-denied.`);
  } catch (error) {
    if (error instanceof assert.AssertionError) throw error;
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
  const app = initializeApp(
    {
      apiKey: 'demo-api-key',
      authDomain: `${PROJECT_ID}.firebaseapp.com`,
      projectId: PROJECT_ID,
      appId: 'demo-app-id',
    },
    'rate-limit-rules',
  );

  try {
    const auth = getAuth(app);
    const db = getFirestore(app);
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', {
      disableWarnings: true,
    });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);

    await createUserWithEmailAndPassword(
      auth,
      'rate-limits@omni-fashion.test',
      'OmniFashion-Test-123!',
    );

    const rateLimitRef = doc(db, 'rateLimits', 'client-forged-state');

    await expectPermissionDenied(
      getDoc(rateLimitRef),
      'authenticated client reads rate-limit state',
    );
    await expectPermissionDenied(
      setDoc(rateLimitRef, {
        userId: auth.currentUser?.uid ?? 'unknown',
        scope: 'analyze_wardrobe_item',
        count: 0,
        windowStartedAtMs: Date.now(),
      }),
      'authenticated client creates rate-limit state',
    );
    await expectPermissionDenied(
      updateDoc(rateLimitRef, { count: 0 }),
      'authenticated client resets rate-limit state',
    );
    await expectPermissionDenied(
      deleteDoc(rateLimitRef),
      'authenticated client deletes rate-limit state',
    );

    console.log('Rate-limit security rules tests passed.');
  } finally {
    await deleteApp(app);
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
