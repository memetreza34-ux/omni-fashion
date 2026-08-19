export type AppEnvironment = 'development' | 'staging' | 'production';

export interface FirebaseClientEnvironment {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

function normalize(value: string | undefined): string {
  return value?.trim() ?? '';
}

function resolveAppEnvironment(value: string | undefined): AppEnvironment {
  if (value === 'staging' || value === 'production') {
    return value;
  }

  return 'development';
}

export const appEnvironment = resolveAppEnvironment(
  process.env.EXPO_PUBLIC_APP_ENV,
);

export const firebaseClientEnvironment: FirebaseClientEnvironment = {
  apiKey: normalize(process.env.EXPO_PUBLIC_FIREBASE_API_KEY),
  authDomain: normalize(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: normalize(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: normalize(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: normalize(
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  ),
  appId: normalize(process.env.EXPO_PUBLIC_FIREBASE_APP_ID),
};

// Provisional EU default until the real Firebase projects are created. The
// chosen production region must later be aligned with Functions/Firestore
// deployment and documented before launch.
export const firebaseFunctionsRegion =
  normalize(process.env.EXPO_PUBLIC_FIREBASE_FUNCTIONS_REGION) ||
  'europe-west1';

export const isFirebaseConfigured = Object.values(
  firebaseClientEnvironment,
).every((value) => value.length > 0);

export function requireFirebaseClientEnvironment(): FirebaseClientEnvironment {
  if (!isFirebaseConfigured) {
    throw new Error(
      'FIREBASE_NOT_CONFIGURED: Copy .env.example to .env and provide the Firebase client configuration for this environment.',
    );
  }

  return firebaseClientEnvironment;
}
