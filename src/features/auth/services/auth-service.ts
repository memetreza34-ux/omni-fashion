import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import type { User } from 'firebase/auth';

import { getFirebaseServices } from '@/services/firebase/app';

import type { AuthUser, LoginCredentials, RegisterCredentials } from '../types';

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

export async function registerWithEmail(
  credentials: RegisterCredentials,
): Promise<AuthUser> {
  const { auth } = getFirebaseServices();
  const result = await createUserWithEmailAndPassword(
    auth,
    credentials.email,
    credentials.password,
  );

  const displayName = credentials.displayName.trim();
  if (displayName.length > 0) {
    await updateProfile(result.user, { displayName });
  }

  await sendEmailVerification(result.user);

  return mapFirebaseUser(result.user);
}

export async function resendCurrentUserVerification(): Promise<void> {
  const { auth } = getFirebaseServices();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('AUTH_REQUIRED');
  }

  if (currentUser.emailVerified) {
    return;
  }

  await sendEmailVerification(currentUser);
}

export async function refreshCurrentAuthUser(): Promise<AuthUser | null> {
  const { auth } = getFirebaseServices();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    return null;
  }

  await reload(currentUser);
  return mapFirebaseUser(currentUser);
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { auth } = getFirebaseServices();
  await sendPasswordResetEmail(auth, email.trim());
}

export async function logoutFirebaseUser(): Promise<void> {
  const { auth } = getFirebaseServices();
  await signOut(auth);
}
