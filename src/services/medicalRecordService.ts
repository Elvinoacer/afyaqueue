/**
 * Medical Records Service for AfyaQueue.
 * Handles patient electronic health summaries, diagnoses, and prescription histories.
 */
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { MedicalRecord } from '@/types/models';

export const RECORDS_COLLECTION = 'medicalRecords';

/**
 * Subscribes to medical records for a specific patient.
 */
export function subscribeToPatientRecords(
  patientId: string,
  onUpdate: (records: MedicalRecord[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, RECORDS_COLLECTION);
  const q = query(colRef, where('patientId', '==', patientId));

  return onSnapshot(
    q,
    (snapshot) => {
      const records: MedicalRecord[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<MedicalRecord, 'id'>),
      }));
      // Sort by date desc
      records.sort((a, b) => b.date.localeCompare(a.date));
      onUpdate(records);
    },
    (err) => {
      console.warn(`AfyaQueue: Error in subscribeToPatientRecords (${patientId}):`, err);
      onError?.(err);
    }
  );
}

/**
 * Fetches medical records for a patient once.
 */
export async function getPatientRecords(patientId: string): Promise<MedicalRecord[]> {
  const colRef = collection(db, RECORDS_COLLECTION);
  const q = query(colRef, where('patientId', '==', patientId));
  const snap = await getDocs(q);
  const records = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<MedicalRecord, 'id'>),
  }));
  records.sort((a, b) => b.date.localeCompare(a.date));
  return records;
}

/**
 * Creates a new medical record (staff clinician only).
 */
export async function createMedicalRecord(
  record: Omit<MedicalRecord, 'id'>
): Promise<MedicalRecord> {
  const id = `rec-${Date.now()}`;
  const newRecord: MedicalRecord = {
    ...record,
    id,
    createdAt: Date.now(),
  };

  const ref = doc(db, RECORDS_COLLECTION, id);
  await setDoc(ref, newRecord);
  return newRecord;
}
