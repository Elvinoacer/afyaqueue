/**
 * Doctor Rating & Patient Feedback Service for AfyaQueue.
 * Handles rating submissions and atomic doctor score updates.
 */
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { Doctor, DoctorRating } from '@/types/models';

import { DOCTORS_COLLECTION } from './doctorService';

export const RATINGS_COLLECTION = 'ratings';

/**
 * Subscribes to ratings for a specific doctor or all doctors.
 */
export function subscribeToRatings(
  doctorId?: string,
  onUpdate?: (ratings: DoctorRating[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, RATINGS_COLLECTION);
  const q = doctorId
    ? query(colRef, where('doctorId', '==', doctorId), orderBy('createdAt', 'desc'))
    : query(colRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: DoctorRating[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<DoctorRating, 'id'>),
      }));
      onUpdate?.(list);
    },
    (err) => {
      console.warn('AfyaQueue: Error in subscribeToRatings:', err);
      onError?.(err);
    }
  );
}

/**
 * Submits a new doctor rating and atomically recalculates the doctor's aggregate rating.
 */
export async function submitRating(
  params: Omit<DoctorRating, 'id' | 'createdAt'>
): Promise<DoctorRating> {
  const ratingId = `rate-${Date.now()}`;
  const newRating: DoctorRating = {
    ...params,
    id: ratingId,
    createdAt: Date.now(),
  };

  const ratingRef = doc(db, RATINGS_COLLECTION, ratingId);
  const doctorRef = doc(db, DOCTORS_COLLECTION, params.doctorId);

  await runTransaction(db, async (txn) => {
    // 1. Read doctor document
    const docSnap = await txn.get(doctorRef);
    if (docSnap.exists()) {
      const docData = docSnap.data() as Doctor;
      const currentCount = docData.reviewCount ?? 0;
      const currentScore = docData.rating ?? 5.0;

      const newCount = currentCount + 1;
      const updatedScore = Number(
        (((currentScore * currentCount) + params.stars) / newCount).toFixed(2)
      );

      txn.update(doctorRef, {
        rating: updatedScore,
        reviewCount: newCount,
        lastRatingId: ratingId,
      });
    }

    // 2. Write rating document
    txn.set(ratingRef, newRating);
  });

  return newRating;
}
