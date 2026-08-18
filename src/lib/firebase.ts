import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import defaultConfig from '../../firebase-applet-config.json';

const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};

// Dual-mode Firebase initialization (Vercel environment variables or local project config)
const firebaseConfig = {
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || defaultConfig.projectId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || defaultConfig.appId,
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || defaultConfig.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || defaultConfig.authDomain,
  firestoreDatabaseId: metaEnv.VITE_FIREBASE_DATABASE_ID || defaultConfig.firestoreDatabaseId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || defaultConfig.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultConfig.messagingSenderId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const databaseId = firebaseConfig.firestoreDatabaseId;

export const db: Firestore =
  databaseId && databaseId !== '(default)'
    ? getFirestore(app, databaseId)
    : getFirestore(app);

export { app, firebaseConfig };
