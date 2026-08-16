import { createAsyncStorage } from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';
import { Platform } from 'react-native';

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

function hasFirebaseErrorCode(error: unknown, code: string): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }

  return (error as { code?: unknown }).code === code;
}

function getOrCreateApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp(requireFirebaseClientEnvironment());
}

function getOrCreateAuth(app: FirebaseApp): Auth {
  if (Platform.OS === 'web') {
    return getAuth(app);
  }

  try {
    const storage = createAsyncStorage('omni-fashion-auth');

    return initializeAuth(app, {
      persistence: getReactNativePersistence(storage),
    });
  } catch (error: unknown) {
    if (hasFirebaseErrorCode(error, 'auth/already-initialized')) {
      return getAuth(app);
    }

    throw error;
  }
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
    auth: getOrCreateAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
  };

  return services;
}

export { isFirebaseConfigured };
