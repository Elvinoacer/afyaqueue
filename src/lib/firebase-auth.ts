/**
 * Web Firebase Auth initialisation (browser persistence via IndexedDB/localStorage).
 * The native counterpart lives in `firebase-auth.native.ts`.
 */
import type { FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

export function createAuth(app: FirebaseApp): Auth {
  return getAuth(app);
}
