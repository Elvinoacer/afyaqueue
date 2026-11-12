export type UserRole = 'patient' | 'staff';

export interface User {
  uid: string;
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  patientRegNo?: string;
  facility?: string;
  createdAt: number;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  facility: string;
  room?: string;
  consultationFee?: number;
  availableDate: string; // "YYYY-MM-DD"
  availableSlots: string[]; // ["09:00 AM", "09:30 AM", ...]
  photoUrl?: string;
  avgConsultationMins: number; // default 5 mins
  rating?: number; // e.g. 4.9
  reviewCount?: number; // e.g. 128
  experienceYears?: number; // e.g. 8
  createdAt: number;
}

export type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  patientRegNo?: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  facility: string;
  room?: string;
  date: string; // "YYYY-MM-DD"
  timeSlot: string; // "09:30 AM"
  queueNumber: number; // 1-based sequential number
  status: AppointmentStatus;
  notes?: string;
  createdAt: number;
}

export interface QueueStatus {
  doctorId: string;
  date: string; // "YYYY-MM-DD"
  lastIssuedNumber: number; // incremented on booking
  nowServing: number; // incremented on "Call Next Patient"
  lastUpdatedAt?: number;
}

export interface Announcement {
  id: string;
  text: string;
  urgency: 'normal' | 'urgent';
  postedBy: string;
  postedByRole?: string;
  facility?: string;
  createdAt: number;
}

export interface DoctorRating {
  id: string;
  doctorId: string;
  doctorName?: string;
  patientId: string;
  patientName: string;
  appointmentId: string;
  stars: number; // 1 to 5
  tags?: string[];
  comment?: string;
  createdAt: number;
}

export interface PrescriptionItem {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorName: string;
  specialty: string;
  facility: string;
  date: string;
  diagnosis: string;
  prescriptions: PrescriptionItem[];
  labResults?: string[];
  notes?: string;
}

export interface ActiveQueuePointer {
  appointmentId: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  date: string;
  timeSlot: string;
  queueNumber: number;
  room?: string;
}

// -------------------------------------------------------------
// Mathematical Formulas (Architecture Spec Section 6.1)
// -------------------------------------------------------------

/**
 * 1. Patients Ahead of You (N_ahead):
 * N_ahead = max(0, Q_patient - Q_serving - 1)
 */
export function calculatePeopleAhead(queueNumber: number, nowServing: number): number {
  if (queueNumber <= nowServing) return 0;
  return Math.max(0, queueNumber - nowServing - 1);
}

/**
 * 2. Estimated Wait Time (ETA_minutes):
 * ETA_minutes = N_ahead * T_avg
 */
export function calculateEstimatedWaitTime(peopleAhead: number, avgConsultationMins: number = 5): number {
  return Math.max(0, peopleAhead * avgConsultationMins);
}

/**
 * 3. Active Turn Condition (isMyTurn):
 * isMyTurn = (Q_patient > 0) && (Q_patient <= Q_serving)
 */
export function isPatientTurn(queueNumber: number, nowServing: number): boolean {
  return queueNumber > 0 && queueNumber === nowServing;
}

/**
 * Checks if patient's turn has passed (already completed)
 */
export function isPatientTurnPast(queueNumber: number, nowServing: number): boolean {
  return queueNumber > 0 && queueNumber < nowServing;
}

/**
 * Generates composite queue document ID: ${doctorId}_${date}
 */
export function getQueueDocId(doctorId: string, date: string): string {
  return `${doctorId}_${date}`;
}

/**
 * Returns today's ISO date string: "YYYY-MM-DD"
 */
export function todayString(): string {
  return '2026-09-22'; // Matches prototype institutional date (22 Sep 2026)
}
