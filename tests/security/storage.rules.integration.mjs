import assert from 'node:assert/strict';

import { deleteApp, initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
} from 'firebase/auth';
import {
  connectStorageEmulator,
  deleteObject,
  getBytes,
  getStorage,
  ref,
  uploadBytes,
} from 'firebase/storage';

const PROJECT_ID = 'demo-omni-fashion-rules';
const AUTH_EMULATOR_URL = 'http://127.0.0.1:9099';
const STORAGE_EMULATOR_HOST = '127.0.0.1';
const STORAGE_EMULATOR_PORT = 9199;

const baseFirebaseConfig = {
  apiKey: 'demo-api-key',
  authDomain: `${PROJECT_ID}.firebaseapp.com`,
  projectId: PROJECT_ID,
  storageBucket: `${PROJECT_ID}.appspot.com`,
  appId: 'demo-app-id',
};

function createClient(name) {
  const app = initializeApp(baseFirebaseConfig, name);
  const auth = getAuth(app);
  const storage = getStorage(app);

  connectAuthEmulator(auth, AUTH_EMULATOR_URL, { disableWarnings: true });
  connectStorageEmulator(storage, STORAGE_EMULATOR_HOST, STORAGE_EMULATOR_PORT);

  return { app, auth, storage };
}

async function register(client, email) {
  const credential = await createUserWithEmailAndPassword(
    client.auth,
    email,
    'OmniFashion-Test-123!',
  );

  return credential.user.uid;
}

async function expectStorageDenied(operation, label) {
  try {
    await operation;
    assert.fail(`${label}: expected Storage permission denial.`);
  } catch (error) {
    if (error instanceof assert.AssertionError) {
      throw error;
    }

    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String(error.code)
        : '';

    assert.ok(
      code.includes('unauthorized') || code.includes('permission-denied'),
      `${label}: expected unauthorized/permission-denied, received ${code || 'unknown error'}.`,
    );
  }
}

async function run() {
  const owner = createClient('storage-owner');
  const stranger = createClient('storage-stranger');
  const anonymous = createClient('storage-anonymous');

  try {
    const ownerId = await register(owner, 'storage-owner@omni-fashion.test');
    await register(stranger, 'storage-stranger@omni-fashion.test');

    const wardrobePath = `users/${ownerId}/wardrobe/item-1/original.jpg`;
    const ownerWardrobeRef = ref(owner.storage, wardrobePath);

    // Owner can upload/read their private garment image.
    await uploadBytes(ownerWardrobeRef, new Uint8Array([1, 2, 3, 4]), {
      contentType: 'image/jpeg',
    });
    assert.deepEqual(
      Array.from(await getBytes(ownerWardrobeRef)),
      [1, 2, 3, 4],
    );

    // Another signed-in user cannot read or overwrite private wardrobe media.
    await expectStorageDenied(
      getBytes(ref(stranger.storage, wardrobePath)),
      'stranger reads private wardrobe image',
    );
    await expectStorageDenied(
      uploadBytes(
        ref(stranger.storage, wardrobePath),
        new Uint8Array([9, 9, 9]),
        { contentType: 'image/jpeg' },
      ),
      'stranger overwrites private wardrobe image',
    );

    // The owner cannot bypass the image-only restriction.
    await expectStorageDenied(
      uploadBytes(
        ref(owner.storage, `users/${ownerId}/wardrobe/item-2/not-an-image.txt`),
        new TextEncoder().encode('not an image'),
        { contentType: 'text/plain' },
      ),
      'owner uploads non-image wardrobe file',
    );

    // Profile avatars are readable by authenticated marketplace users, but not
    // by anonymous clients.
    const avatarPath = `users/${ownerId}/avatars/profile.jpg`;
    await uploadBytes(
      ref(owner.storage, avatarPath),
      new Uint8Array([5, 6, 7]),
      { contentType: 'image/jpeg' },
    );
    assert.deepEqual(
      Array.from(await getBytes(ref(stranger.storage, avatarPath))),
      [5, 6, 7],
    );
    await expectStorageDenied(
      getBytes(ref(anonymous.storage, avatarPath)),
      'anonymous reads authenticated-only avatar',
    );

    // Public listing media is readable, but no client can manufacture the
    // public snapshot directly. Trusted backend logic owns that write path.
    await expectStorageDenied(
      uploadBytes(
        ref(owner.storage, 'public/listings/listing-1/photo.jpg'),
        new Uint8Array([8, 8, 8]),
        { contentType: 'image/jpeg' },
      ),
      'client writes public listing media',
    );

    await deleteObject(ownerWardrobeRef);

    await signOut(owner.auth);
    await signOut(stranger.auth);

    console.log('Storage security rules integration tests passed.');
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
