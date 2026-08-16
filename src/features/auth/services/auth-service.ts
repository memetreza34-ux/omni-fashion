import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';

import { getFirebaseServices } from '@/services/firebase/app';

import { AuthUser, LoginCredentials } from '../types';

function mapFirebaseUser(user: User): AuthUser {
  return {
    id: user.uid,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerified,
    isDevelopmentDemo: false,
  };
}

export function subscribeToAuthUser(
  onChange: (user: AuthUser | null) => void,
): () => void {
  const { auth } = getFirebaseServices();

  return onAuthStateChanged(auth, (user) => {
    onChange(user ? mapFirebaseUser(user) : null);
  });
}

export async function loginWithEmail(
  credentials: LoginCredentials,
): Promise<AuthUser> {
  const { auth } = getFirebaseServices();
  const result = await signInWithEmailAndPassword(
    auth,
    credentials.email,
    credentials.password,
  );

  return mapFirebaseUser(result.user);
}

export async function logoutFirebaseUser(): Promise<void> {
  const { auth } = getFirebaseServices();
  await signOut(auth);
}
