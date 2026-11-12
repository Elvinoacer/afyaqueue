/**
 * Native (iOS / Android) Firebase Auth initialisation.
 *
 * Sessions are persisted with AsyncStorage so users stay signed in across app
 * restarts (https://expo.fyi/firebase-js-auth-setup). `getReactNativePersistence`
 * only exists in the React Native build of `@firebase/auth`, which Metro resolves
 * through the package's "react-native" export condition; the public TypeScript
 * typings describe the browser build, hence the narrow cast below.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FirebaseApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import type { Auth, Persistence } from 'firebase/auth';

type ReactNativeAuthModule = typeof FirebaseAuth & {
  getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
};

export function createAuth(app: FirebaseApp): Auth {
  const { initializeAuth, getAuth, getReactNativePersistence } = FirebaseAuth as ReactNativeAuthModule;
  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    // initializeAuth throws if called twice (e.g. Fast Refresh).
    return getAuth(app);
  }
}
