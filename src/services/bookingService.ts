/**
 * Atomic Booking & Queue Management Service for AfyaQueue.
 * Handles transactional slot reservations, sequential queue token issuance,
 * and real-time live queue synchronization.
 */
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type {
  Appointment,
  CancelReason,
  Doctor,
  QueueStatus,
} from '@/types/models';
import {
  getAppointmentDocId,
  getQueueDocId,
  todayString,
} from '@/types/models';

import { DOCTORS_COLLECTION, QUEUE_COLLECTION } from './doctorService';

export const APPOINTMENTS_COLLECTION = 'appointments';

/**
 * Subscribes to appointments in real-time.
 * If patientId is provided, filters for that patient; otherwise returns all appointments for staff.
 */
export function subscribeToAppointments(
  patientId: string | null | undefined,
  onUpdate: (appointments: Appointment[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, APPOINTMENTS_COLLECTION);
  const q = patientId
    ? query(colRef, where('patientId', '==', patientId))
    : query(colRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const appointments: Appointment[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Appointment, 'id'>),
      }));
      // Sort in memory by date descending, then queueNumber ascending
      appointments.sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return a.queueNumber - b.queueNumber;
      });
      onUpdate(appointments);
    },
    (err) => {
      console.warn('AfyaQueue: Error in subscribeToAppointments:', err);
      onError?.(err);
    }
  );
}

/**
 * Subscribes to all active queue statuses across the hospital.
 */
export function subscribeToQueueStatuses(
  onUpdate: (statuses: Record<string, QueueStatus>) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, QUEUE_COLLECTION);

  return onSnapshot(
    colRef,
    (snapshot) => {
      const map: Record<string, QueueStatus> = {};
      for (const docSnap of snapshot.docs) {
        map[docSnap.id] = docSnap.data() as QueueStatus;
      }
      onUpdate(map);
    },
    (err) => {
      console.warn('AfyaQueue: Error in subscribeToQueueStatuses:', err);
      onError?.(err);
    }
  );
}

/**
 * Subscribes to a specific doctor's queue status for a given day.
 */
export function subscribeToDoctorQueue(
  doctorId: string,
  date: string,
  onUpdate: (status: QueueStatus | null) => void,
  onError?: (err: Error) => void
): () => void {
  const queueId = getQueueDocId(doctorId, date);
  const queueRef = doc(db, QUEUE_COLLECTION, queueId);

  return onSnapshot(
    queueRef,
    (docSnap) => {
      if (!docSnap.exists()) {
        onUpdate(null);
        return;
      }
      onUpdate(docSnap.data() as QueueStatus);
    },
    (err) => {
      console.warn(`AfyaQueue: Error in subscribeToDoctorQueue (${queueId}):`, err);
      onError?.(err);
    }
  );
}

/**
 * Atomically books an appointment and claims the next sequential queue token.
 * Prevents double-booking via Firestore transaction.
 */
export async function bookAppointmentAtomic(params: {
  doctorId: string;
  date: string;
  timeSlot: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  patientRegNo?: string;
  notes?: string;
}): Promise<Appointment> {
  const { doctorId, date, timeSlot, patientId, patientName, patientPhone, patientRegNo, notes } = params;

  return await runTransaction(db, async (txn) => {
    // 1. Read doctor details
    const doctorRef = doc(db, DOCTORS_COLLECTION, doctorId);
    const doctorSnap = await txn.get(doctorRef);
    const doctorData = doctorSnap.exists() ? (doctorSnap.data() as Doctor) : null;

    const doctorName = doctorData?.name ?? 'Dr. Specialist';
    const doctorSpecialty = doctorData?.specialty ?? 'General Medicine';
    const facility = doctorData?.facility ?? 'Moi Teaching Hospital';
    const room = doctorData?.room ?? 'Room 14 (Wing B)';

    // 2. Read live queue status
    const queueDocId = getQueueDocId(doctorId, date);
    const queueRef = doc(db, QUEUE_COLLECTION, queueDocId);
    const queueSnap = await txn.get(queueRef);

    let lastIssuedNumber = 0;
    let nowServing = 0;
    let bookedSlots: Record<string, string> = {};

    if (queueSnap.exists()) {
      const qData = queueSnap.data() as QueueStatus;
      lastIssuedNumber = qData.lastIssuedNumber ?? 0;
      nowServing = qData.nowServing ?? 0;
      bookedSlots = qData.bookedSlots ?? {};
    }

    // 3. Double-booking concurrency check
    if (bookedSlots[timeSlot]) {
      throw new Error(`Time slot ${timeSlot} is already booked. Please choose an open slot.`);
    }

    // 4. Increment queue token sequentially
    const nextQueueNumber = lastIssuedNumber + 1;
    const appointmentDocId = getAppointmentDocId(doctorId, date, nextQueueNumber);
    const appointmentRef = doc(db, APPOINTMENTS_COLLECTION, appointmentDocId);

    const newAppointment: Appointment = {
      id: appointmentDocId,
      patientId,
      patientName,
      patientPhone: patientPhone ?? '0712 345 678',
      patientRegNo: patientRegNo ?? 'PT-2026-0142',
      doctorId,
      doctorName,
      doctorSpecialty,
      facility,
      room,
      date,
      timeSlot,
      queueNumber: nextQueueNumber,
      status: 'upcoming',
      notes,
      createdAt: Date.now(),
    };

    // 5. Atomic write: Appointment + QueueStatus
    txn.set(appointmentRef, newAppointment);

    const updatedBookedSlots = { ...bookedSlots, [timeSlot]: appointmentDocId };
    txn.set(
      queueRef,
      {
        doctorId,
        date,
        lastIssuedNumber: nextQueueNumber,
        nowServing,
        bookedSlots: updatedBookedSlots,
        lastUpdatedAt: Date.now(),
      },
      { merge: true }
    );

    return newAppointment;
  });
}

/**
 * Cancels an appointment and releases its booked slot if requested.
 */
/**
 * Cancels an appointment and releases its booked slot atomically in a single transaction.
 */
export async function cancelAppointment(
  appointmentId: string,
  cancelReason: CancelReason = 'patient'
): Promise<void> {
  const aptRef = doc(db, APPOINTMENTS_COLLECTION, appointmentId);

  await runTransaction(db, async (txn) => {
    const aptSnap = await txn.get(aptRef);
    if (!aptSnap.exists()) {
      throw new Error(`Appointment ${appointmentId} not found.`);
    }

    const aptData = aptSnap.data() as Appointment;
    if (aptData.status === 'cancelled') {
      return;
    }

    const queueDocId = getQueueDocId(aptData.doctorId, aptData.date);
    const queueRef = doc(db, QUEUE_COLLECTION, queueDocId);
    const queueSnap = await txn.get(queueRef);

    // 1. Mark appointment as cancelled
    txn.update(aptRef, {
      status: 'cancelled',
      cancelReason,
      updatedAt: Date.now(),
    });

    // 2. Free the slot in the queue document
    if (queueSnap.exists()) {
      const qData = queueSnap.data() as QueueStatus;
      const bookedSlots = { ...(qData.bookedSlots ?? {}) };
      if (bookedSlots[aptData.timeSlot]) {
        delete bookedSlots[aptData.timeSlot];
        txn.update(queueRef, {
          bookedSlots,
          lastUpdatedAt: Date.now(),
        });
      }
    }
  });
}

/**
 * Reschedules an appointment atomically: validates slot availability,
 * marks old appointment as rescheduled, frees old slot, and claims the new slot in ONE transaction.
 */
export async function rescheduleAppointmentAtomic(params: {
  appointmentId: string;
  newDate: string;
  newTimeSlot: string;
}): Promise<Appointment> {
  const { appointmentId, newDate, newTimeSlot } = params;
  const oldAptRef = doc(db, APPOINTMENTS_COLLECTION, appointmentId);

  return await runTransaction(db, async (txn) => {
    // 1. Read old appointment
    const oldSnap = await txn.get(oldAptRef);
    if (!oldSnap.exists()) {
      throw new Error(`Appointment ${appointmentId} not found.`);
    }
    const oldAppt = oldSnap.data() as Appointment;
    if (oldAppt.status !== 'upcoming') {
      throw new Error(`Cannot reschedule an appointment that is already ${oldAppt.status}.`);
    }

    // 2. Read doctor info
    const doctorRef = doc(db, DOCTORS_COLLECTION, oldAppt.doctorId);
    const doctorSnap = await txn.get(doctorRef);
    const doctorData = doctorSnap.exists() ? (doctorSnap.data() as Doctor) : null;

    // 3. Read target (new) queue document
    const newQueueDocId = getQueueDocId(oldAppt.doctorId, newDate);
    const newQueueRef = doc(db, QUEUE_COLLECTION, newQueueDocId);
    const newQueueSnap = await txn.get(newQueueRef);

    const isSameQueue = oldAppt.date === newDate;
    let oldQueueRef = newQueueRef;
    let oldQueueSnap = newQueueSnap;

    if (!isSameQueue) {
      const oldQueueDocId = getQueueDocId(oldAppt.doctorId, oldAppt.date);
      oldQueueRef = doc(db, QUEUE_COLLECTION, oldQueueDocId);
      oldQueueSnap = await txn.get(oldQueueRef);
    }

    // Check slot availability in new queue
    const newBookedSlots = newQueueSnap.exists()
      ? { ...((newQueueSnap.data() as QueueStatus).bookedSlots ?? {}) }
      : {};

    // If rescheduling on the same day to a different slot, old slot is freed, so it shouldn't block
    if (isSameQueue && newBookedSlots[oldAppt.timeSlot] === appointmentId) {
      delete newBookedSlots[oldAppt.timeSlot];
    }

    if (newBookedSlots[newTimeSlot]) {
      throw new Error(`Time slot ${newTimeSlot} is already booked. Please choose an open slot.`);
    }

    // Determine next queue token for new queue
    const newLastIssued = newQueueSnap.exists()
      ? ((newQueueSnap.data() as QueueStatus).lastIssuedNumber ?? 0)
      : 0;
    const newNowServing = newQueueSnap.exists()
      ? ((newQueueSnap.data() as QueueStatus).nowServing ?? 0)
      : 0;
    const nextQueueNumber = newLastIssued + 1;

    const newAppointmentDocId = getAppointmentDocId(oldAppt.doctorId, newDate, nextQueueNumber);
    const newAptRef = doc(db, APPOINTMENTS_COLLECTION, newAppointmentDocId);

    const newAppointment: Appointment = {
      id: newAppointmentDocId,
      patientId: oldAppt.patientId,
      patientName: oldAppt.patientName,
      patientPhone: oldAppt.patientPhone,
      patientRegNo: oldAppt.patientRegNo,
      doctorId: oldAppt.doctorId,
      doctorName: doctorData?.name ?? oldAppt.doctorName,
      doctorSpecialty: doctorData?.specialty ?? oldAppt.doctorSpecialty,
      facility: doctorData?.facility ?? oldAppt.facility,
      room: doctorData?.room ?? oldAppt.room,
      date: newDate,
      timeSlot: newTimeSlot,
      queueNumber: nextQueueNumber,
      status: 'upcoming',
      notes: `Rescheduled from ${oldAppt.date} (${oldAppt.timeSlot})`,
      createdAt: Date.now(),
    };

    // Commit writes:
    // a. Cancel old appointment
    txn.update(oldAptRef, {
      status: 'cancelled',
      cancelReason: 'rescheduled',
      updatedAt: Date.now(),
    });

    // b. Create new appointment
    txn.set(newAptRef, newAppointment);

    // c. Update queue documents
    if (isSameQueue) {
      newBookedSlots[newTimeSlot] = newAppointmentDocId;
      txn.set(
        newQueueRef,
        {
          doctorId: oldAppt.doctorId,
          date: newDate,
          lastIssuedNumber: nextQueueNumber,
          nowServing: newNowServing,
          bookedSlots: newBookedSlots,
          lastUpdatedAt: Date.now(),
        },
        { merge: true }
      );
    } else {
      // Free old slot in old queue
      if (oldQueueSnap.exists()) {
        const oldSlots = { ...((oldQueueSnap.data() as QueueStatus).bookedSlots ?? {}) };
        delete oldSlots[oldAppt.timeSlot];
        txn.update(oldQueueRef, {
          bookedSlots: oldSlots,
          lastUpdatedAt: Date.now(),
        });
      }
      // Claim new slot in new queue
      newBookedSlots[newTimeSlot] = newAppointmentDocId;
      txn.set(
        newQueueRef,
        {
          doctorId: oldAppt.doctorId,
          date: newDate,
          lastIssuedNumber: nextQueueNumber,
          nowServing: newNowServing,
          bookedSlots: newBookedSlots,
          lastUpdatedAt: Date.now(),
        },
        { merge: true }
      );
    }

    return newAppointment;
  });
}

/**
 * Increments `nowServing` pointer for staff desk ("Call Next Patient").
 * Also marks appointments whose queueNumber has passed as completed.
 */
export async function callNextPatientAtomic(
  doctorId: string,
  date: string = todayString()
): Promise<number> {
  const queueDocId = getQueueDocId(doctorId, date);
  const queueRef = doc(db, QUEUE_COLLECTION, queueDocId);

  return await runTransaction(db, async (txn) => {
    const snap = await txn.get(queueRef);
    let nowServing = 0;
    let lastIssuedNumber = 0;

    if (snap.exists()) {
      const q = snap.data() as QueueStatus;
      nowServing = q.nowServing ?? 0;
      lastIssuedNumber = q.lastIssuedNumber ?? 0;
    }

    const nextServing = nowServing + 1;

    txn.set(
      queueRef,
      {
        doctorId,
        date,
        lastIssuedNumber,
        nowServing: nextServing,
        lastUpdatedAt: Date.now(),
      },
      { merge: true }
    );

    return nextServing;
  }).then(async (nextServing) => {
    // Background query to mark served appointments as completed
    try {
      const q = query(
        collection(db, APPOINTMENTS_COLLECTION),
        where('doctorId', '==', doctorId),
        where('date', '==', date),
        where('status', '==', 'upcoming')
      );
      const apptSnaps = await getDocs(q);
      for (const d of apptSnaps.docs) {
        const apt = d.data() as Appointment;
        if (apt.queueNumber < nextServing) {
          await updateDoc(d.ref, { status: 'completed', updatedAt: Date.now() });
        }
      }
    } catch (err) {
      console.warn('AfyaQueue: Non-fatal error completing past appointments:', err);
    }
    return nextServing;
  });
}

/**
 * Skips a patient on the staff queue tracker.
 */
export async function skipPatientAtomic(
  doctorId: string,
  date: string = todayString()
): Promise<number> {
  return callNextPatientAtomic(doctorId, date);
}
