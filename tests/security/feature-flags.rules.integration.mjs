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
} from 'firebase/firestore';

const PROJECT_ID = 'demo-omni-fashion-rules';

function expectPermissionDenied(operation, label) {
  return operation.then(
    () => assert.fail(`${label}: expected permission-denied.`),
    (error) => {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String(error.code)
          : '';
      assert.ok(code.includes('permission-denied'), `${label}: received ${code}.`);
    },
  );
}

async function run() {
  const app = initializeApp(
    {
      apiKey: 'demo-api-key',
      authDomain: `${PROJECT_ID}.firebaseapp.com`,
      projectId: PROJECT_ID,
      appId: 'demo-app-id',
    },
    'feature-flags-rules',
  );

  try {
    const auth = getAuth(app);
    const db = getFirestore(app);
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);

    await createUserWithEmailAndPassword(
      auth,
      'feature-flags@omni-fashion.test',
      'OmniFashion-Test-123!',
    );

    const configRef = doc(db, 'runtimeConfig', 'publicFeatureFlags');

    await expectPermissionDenied(
      getDoc(configRef),
      'authenticated client reads runtime feature flags directly',
    );
    await expectPermissionDenied(
      setDoc(configRef, {
        schemaVersion: 1,
        flags: { internalModeratorUi: true },
      }),
      'authenticated client writes runtime feature flags directly',
    );

    console.log('Feature flag security rules tests passed.');
  } finally {
    await deleteApp(app);
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
