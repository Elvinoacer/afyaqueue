/**
 * Announcement Service for AfyaQueue.
 * Handles hospital-wide broadcast banners and urgency alerts.
 */
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { Announcement, User } from '@/types/models';

export const ANNOUNCEMENTS_COLLECTION = 'announcements';

/**
 * Subscribes to hospital announcements ordered by recency.
 */
export function subscribeToAnnouncements(
  onUpdate: (announcements: Announcement[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(
    collection(db, ANNOUNCEMENTS_COLLECTION),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const announcements: Announcement[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Announcement, 'id'>),
      }));
      onUpdate(announcements);
    },
    (err) => {
      console.warn('AfyaQueue: Error in subscribeToAnnouncements:', err);
      onError?.(err);
    }
  );
}

/**
 * One-time fetch of current announcements.
 */
export async function getAnnouncements(): Promise<Announcement[]> {
  const q = query(
    collection(db, ANNOUNCEMENTS_COLLECTION),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Announcement, 'id'>),
  }));
}

/**
 * Broadcasts a new hospital announcement (staff-only).
 */
export async function broadcastAnnouncement(
  text: string,
  urgency: 'normal' | 'urgent' = 'normal',
  author?: User | null
): Promise<Announcement> {
  const id = `ann-${Date.now()}`;
  const announcement: Announcement = {
    id,
    text: text.trim(),
    urgency,
    postedBy: author?.name ?? 'Desk Receptionist',
    postedByUid: author?.uid,
    postedByRole: author?.role === 'staff' ? 'Triage Desk' : 'Staff',
    facility: author?.facility ?? 'Moi Teaching & Referral Hospital',
    createdAt: Date.now(),
  };

  const ref = doc(db, ANNOUNCEMENTS_COLLECTION, id);
  await setDoc(ref, announcement);
  return announcement;
}

/**
 * Deletes or dismisses an announcement (staff-only).
 */
export async function deleteAnnouncement(id: string): Promise<void> {
  const ref = doc(db, ANNOUNCEMENTS_COLLECTION, id);
  await deleteDoc(ref);
}
