/**
 * Firebase bootstrap (Auth + Cloud Firestore) for AfyaQueue.
 *
 * Configuration comes from EXPO_PUBLIC_* environment variables (see `.env.example`).
 * When `EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true`, the client talks to the local
 * Firebase Emulator Suite (`npm run emulators`) instead of the cloud project.
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { connectAuthEmulator, type Auth } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
  type FirestoreSettings,
} from 'firebase/firestore';

import { createAuth } from './firebase-auth';

// NOTE: Expo inlines EXPO_PUBLIC_* variables at build time, so each one must be
// referenced statically as `process.env.EXPO_PUBLIC_…` (no dynamic lookups).
export const USE_FIREBASE_EMULATOR = process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? (USE_FIREBASE_EMULATOR ? 'demo-api-key' : undefined),
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? (USE_FIREBASE_EMULATOR ? 'demo-afyaqueue' : undefined),
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/** True when enough configuration is present to reach a backend. */
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

if (!isFirebaseConfigured) {
  console.warn(
    'AfyaQueue: Firebase is not configured. Copy .env.example to .env.local and either set ' +
      'EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true or provide your EXPO_PUBLIC_FIREBASE_* keys.'
  );
}

/**
 * Resolves the host the device should use to reach the emulators running on the
 * development machine. Physical devices / Android emulators cannot use `localhost`,
 * so we reuse the LAN address Metro is served from (`Constants.expoConfig.hostUri`).
 */
function resolveEmulatorHost(): string {
  const override = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST;
  if (override) return override;
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  }
  const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.1.20:8081"
  const host = hostUri?.split(':')[0];
  if (host && !host.endsWith('.exp.direct')) return host;
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
}

function createFirestore(app: FirebaseApp): Firestore {
  const settings: FirestoreSettings = {
    // Optional model fields are frequently `undefined`; drop them instead of throwing.
    ignoreUndefinedProperties: true,
    // React Native has no IndexedDB, so the persistent cache is web-only. On native,
    // the last known queue pointer & profile are cached in AsyncStorage instead.
    localCache:
      Platform.OS === 'web' && typeof window !== 'undefined'
        ? persistentLocalCache({ tabManager: persistentMultipleTabManager() })
        : memoryLocalCache(),
  };
  try {
    return initializeFirestore(app, settings);
  } catch {
    // Already initialised (Fast Refresh) — reuse the existing instance.
    return getFirestore(app);
  }
}

type EmulatorGlobal = typeof globalThis & { __afyaqueueEmulatorsConnected?: boolean };

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = createAuth(app);
export const db: Firestore = createFirestore(app);

export const EMULATOR_HOST = USE_FIREBASE_EMULATOR ? resolveEmulatorHost() : null;

const g = globalThis as EmulatorGlobal;
if (EMULATOR_HOST && !g.__afyaqueueEmulatorsConnected) {
  g.__afyaqueueEmulatorsConnected = true;
  connectAuthEmulator(auth, `http://${EMULATOR_HOST}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, EMULATOR_HOST, 8080);
  console.log(`AfyaQueue: using Firebase emulators at ${EMULATOR_HOST}`);
}

export { app };
