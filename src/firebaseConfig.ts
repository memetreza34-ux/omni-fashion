import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// TODO: Ersetze diese Platzhalter mit deinen echten Firebase-Daten aus der Firebase Console!
const firebaseConfig = {
  apiKey: "AIzaSyDummyKey-DasMussErsetztWerden",
  authDomain: "omnifashion-dummy.firebaseapp.com",
  projectId: "omnifashion-dummy",
  storageBucket: "omnifashion-dummy.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

// Verhindert, dass Firebase mehrfach initialisiert wird (z.B. beim Hot Reloading in React Native)
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
