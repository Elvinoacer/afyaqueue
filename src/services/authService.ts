/**
 * Authentication & User Profile Service for AfyaQueue.
 * Handles Firebase Auth sign-in / registration and Firestore `users` & `registry` sync.
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import { auth, db } from '@/lib/firebase';
import type { NotificationSettings, User, UserRole } from '@/types/models';

export const USERS_COLLECTION = 'users';
export const REGISTRY_COLLECTION = 'registry';

/**
 * Resolves an identifier (either email or hospital registration number PT-*)
 * to an authenticated user's email address.
 */
export async function resolveEmailFromIdentifier(identifier: string): Promise<string> {
  const trimmed = identifier.trim();
  if (trimmed.includes('@')) {
    return trimmed;
  }

  // Lookup in registry collection (PT-*)
  try {
    const regDocRef = doc(db, REGISTRY_COLLECTION, trimmed);
    const regSnap = await getDoc(regDocRef);
    if (regSnap.exists() && regSnap.data().email) {
      return regSnap.data().email as string;
    }

    // Fallback: Query users collection where patientRegNo == identifier
    const q = query(
      collection(db, USERS_COLLECTION),
      where('patientRegNo', '==', trimmed)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const data = snap.docs[0].data();
      if (data.email) return data.email as string;
    }
  } catch (err) {
    console.warn('AfyaQueue: Error resolving email from regNo:', err);
  }

  // Fallback to default demo mapping if query cannot resolve
  if (trimmed.startsWith('PT')) {
    return 'kevin.kibet@gmail.com';
  }
  return trimmed;
}

/**
 * Fetches a user profile document from Firestore `users/{uid}`.
 */
export async function getUserProfile(uid: string): Promise<User | null> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  return snap.data() as User;
}

/**
 * Creates or updates a user profile document in Firestore `users/{uid}`.
 */
export async function upsertUserProfile(user: User): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, user.uid);
  await setDoc(userRef, user, { merge: true });

  // If patient has registration number, sync to registry collection
  if (user.patientRegNo) {
    const regRef = doc(db, REGISTRY_COLLECTION, user.patientRegNo);
    await setDoc(
      regRef,
      {
        regNo: user.patientRegNo,
        uid: user.uid,
        email: user.email,
        patientName: user.name,
        phone: user.phone,
        facility: user.facility ?? 'Moi Teaching Hospital',
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  }
}

/**
 * Signs in a user with email/regNo and password.
 */
export async function signIn(
  identifier: string,
  password: string,
  expectedRole?: UserRole
): Promise<User> {
  const email = await resolveEmailFromIdentifier(identifier);
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const { user: fbUser } = credential;

  // Retrieve existing profile from Firestore
  let profile = await getUserProfile(fbUser.uid);

  // If profile doesn't exist yet (e.g. freshly created or demo account without doc), construct it
  if (!profile) {
    const role: UserRole =
      expectedRole ??
      (email.includes('mtrh.go.ke') || email.includes('staff') ? 'staff' : 'patient');

    profile = {
      uid: fbUser.uid,
      name: fbUser.displayName || (role === 'staff' ? 'Sister Mary Chebet' : 'Kevin Kibet'),
      email: fbUser.email || email,
      phone: fbUser.phoneNumber || (role === 'staff' ? '0722 000 111' : '0712 345 678'),
      role,
      patientRegNo: role === 'patient' ? 'PT-2026-0142' : undefined,
      facility: 'Moi Teaching & Referral Hospital',
      createdAt: Date.now(),
    };
    await upsertUserProfile(profile);
  }

  return profile;
}

/**
 * Registers a new user with Firebase Auth and persists profile in Firestore.
 */
export async function registerUser(params: {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  password?: string;
  patientRegNo?: string;
  facility?: string;
}): Promise<User> {
  const password = params.password || 'AfyaPass2026!';
  const credential = await createUserWithEmailAndPassword(auth, params.email.trim(), password);
  const { user: fbUser } = credential;

  const newUser: User = {
    uid: fbUser.uid,
    name: params.name.trim(),
    email: params.email.trim().toLowerCase(),
    phone: params.phone.trim(),
    role: params.role,
    patientRegNo:
      params.patientRegNo ||
      (params.role === 'patient'
        ? `PT-2026-${Math.floor(1000 + Math.random() * 9000)}`
        : undefined),
    facility: params.facility || 'Moi Teaching & Referral Hospital',
    createdAt: Date.now(),
  };

  await upsertUserProfile(newUser);
  return newUser;
}

/**
 * Signs out current user from Firebase Auth.
 */
export async function signOut(): Promise<void> {
  await fbSignOut(auth);
}

/**
 * Updates notification settings on user document.
 */
export async function updateNotificationSettings(
  uid: string,
  settings: Partial<NotificationSettings>
): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userRef, {
    notificationSettings: settings,
    updatedAt: Date.now(),
  });
}

/**
 * Attaches a listener for Firebase Auth state changes.
 */
export function onAuthStateChangedListener(
  callback: (fbUser: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}
