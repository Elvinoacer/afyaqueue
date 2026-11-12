/**
 * Doctor Service for AfyaQueue.
 * Manages doctor directory queries, subscriptions, and staff mutations.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { Doctor, QueueStatus } from '@/types/models';
import { getQueueDocId, todayString } from '@/types/models';

export const DOCTORS_COLLECTION = 'doctors';
export const QUEUE_COLLECTION = 'queueStatus';

/**
 * Subscribes to real-time updates for all doctors in the facility.
 */
export function subscribeToDoctors(
  onUpdate: (doctors: Doctor[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(collection(db, DOCTORS_COLLECTION), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const doctors: Doctor[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Doctor, 'id'>),
      }));
      onUpdate(doctors);
    },
    (error) => {
      console.warn('AfyaQueue: Error in subscribeToDoctors listener:', error);
      onError?.(error);
    }
  );
}

/**
 * One-time fetch of all doctors.
 */
export async function getDoctors(): Promise<Doctor[]> {
  const q = query(collection(db, DOCTORS_COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Doctor, 'id'>),
  }));
}

/**
 * Fetches a single doctor by document ID.
 */
export async function getDoctorById(id: string): Promise<Doctor | null> {
  const ref = doc(db, DOCTORS_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Doctor, 'id'>) };
}

/**
 * Creates a new doctor in Firestore and initializes their queueStatus document.
 * Callable by staff.
 */
export async function createDoctor(
  doctorData: Omit<Doctor, 'id' | 'createdAt'>,
  staffUid?: string
): Promise<Doctor> {
  const docId = `doc-${Date.now()}`;
  const newDoctor: Doctor = {
    rating: 5.0,
    reviewCount: 0,
    ...doctorData,
    id: docId,
    createdAt: Date.now(),
    createdBy: staffUid,
  };

  const doctorRef = doc(db, DOCTORS_COLLECTION, docId);
  await setDoc(doctorRef, newDoctor);

  // Initialize initial queue status for the doctor's available date
  const scheduleDate = doctorData.availableDate || todayString();
  const qDocId = getQueueDocId(docId, scheduleDate);
  const queueRef = doc(db, QUEUE_COLLECTION, qDocId);

  const initialQueue: QueueStatus = {
    doctorId: docId,
    date: scheduleDate,
    lastIssuedNumber: 0,
    nowServing: 0,
    bookedSlots: {},
    lastUpdatedAt: Date.now(),
  };
  await setDoc(queueRef, initialQueue, { merge: true });

  return newDoctor;
}

/**
 * Updates doctor record (staff operation).
 */
export async function updateDoctor(
  doctorId: string,
  partial: Partial<Doctor>
): Promise<void> {
  const doctorRef = doc(db, DOCTORS_COLLECTION, doctorId);
  await updateDoc(doctorRef, {
    ...partial,
    updatedAt: Date.now(),
  });
}
