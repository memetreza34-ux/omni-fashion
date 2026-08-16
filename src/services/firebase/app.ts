import { getApp, getApps, initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';

import {
  isFirebaseConfigured,
  requireFirebaseClientEnvironment,
} from '@/config/env';

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
}

let services: FirebaseServices | null = null;

function getOrCreateApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp(requireFirebaseClientEnvironment());
}

export function getFirebaseServices(): FirebaseServices {
  if (!isFirebaseConfigured) {
    throw new Error(
      'FIREBASE_NOT_CONFIGURED: Firebase services cannot start until the client environment is configured.',
    );
  }

  if (services) {
    return services;
  }

  const app = getOrCreateApp();

  services = {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
  };

  return services;
}

export { isFirebaseConfigured };
