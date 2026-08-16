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

function validStyleProfile(userId) {
  const now = Timestamp.now();
  return {
    userId,
    questionnaire: {
      preferredStyles: ['minimal', 'smart-casual'],
      preferredColors: ['Schwarz', 'Beige'],
      avoidedColors: ['Orange'],
      fitPreferences: ['regular'],
      formalVsCasual: 0.5,
      minimalVsBold: 0.2,
      questionnaireVersion: 1,
    },
    wardrobeSignals: {
      dominantCategories: ['Outerwear', 'Top'],
      dominantColors: ['Schwarz'],
      dominantStyleTags: ['minimalistisch'],
      analyzedItemCount: 2,
      totalItemCount: 3,
    },
    summary: {
      title: 'Urban Minimalist',
      archetype: 'The Editor',
      description: 'Klare Kombinationen und vielseitige Teile.',
      topStyles: ['minimal', 'smart-casual'],
    },
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
  };
}

async function run() {
  const owner = createClient('style-owner');
  const stranger = createClient('style-stranger');

  try {
    const ownerId = await register(owner, 'style-owner@omni-fashion.test');
    const strangerId = await register(
      stranger,
      'style-stranger@omni-fashion.test',
    );
    const profileRef = doc(owner.db, 'styleProfiles', ownerId);

    await setDoc(profileRef, validStyleProfile(ownerId));
    assert.equal((await getDoc(profileRef)).exists(), true);

    await expectDenied(
      getDoc(doc(stranger.db, 'styleProfiles', ownerId)),
      'stranger reads private StyleProfile',
    );

    await updateDoc(profileRef, {
      questionnaire: {
        ...validStyleProfile(ownerId).questionnaire,
        preferredStyles: ['streetwear'],
      },
      summary: {
        title: 'Urban Street',
        archetype: 'The Culture Mix',
        description: 'Urbane Silhouetten mit klarer Haltung.',
        topStyles: ['streetwear'],
      },
      updatedAt: Timestamp.now(),
    });

    await expectDenied(
      setDoc(doc(owner.db, 'styleProfiles', 'wrong-id'), {
        ...validStyleProfile(ownerId),
        userId: ownerId,
      }),
      'owner writes StyleProfile under another document id',
    );

    await expectDenied(
      setDoc(doc(stranger.db, 'styleProfiles', strangerId), {
        ...validStyleProfile(strangerId),
        questionnaire: {
          ...validStyleProfile(strangerId).questionnaire,
          preferredStyles: ['not-a-style'],
        },
      }),
      'invalid style enum is rejected',
    );

    await expectDenied(
      setDoc(doc(stranger.db, 'styleProfiles', strangerId), {
        ...validStyleProfile(strangerId),
        wardrobeSignals: {
          dominantCategories: [],
          dominantColors: [],
          dominantStyleTags: [],
          analyzedItemCount: 5,
          totalItemCount: 2,
        },
      }),
      'analyzed count cannot exceed total wardrobe count',
    );

    await expectDenied(
      updateDoc(profileRef, {
        userId: strangerId,
      }),
      'StyleProfile userId cannot be transferred',
    );

    console.log('StyleProfile security rules integration tests passed.');
  } finally {
    await Promise.all([deleteApp(owner.app), deleteApp(stranger.app)]);
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
