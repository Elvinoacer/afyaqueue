export type UserRole = 'patient' | 'staff';

export interface NotificationSettings {
  smsAlerts: boolean;
  pushNotifications: boolean;
  audioChimes: boolean;
  soundVolume: number;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  smsAlerts: true,
  pushNotifications: true,
  audioChimes: true,
  soundVolume: 80,
};

export interface User {
  uid: string;
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  patientRegNo?: string;
  facility?: string;
  notificationSettings?: NotificationSettings;
  expoPushToken?: string | null;
  createdAt: number;
  updatedAt?: number;
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
  lastRatingId?: string; // set atomically with each new rating (rules audit trail)
  createdAt: number;
  createdBy?: string;
}

export type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled';
export type CancelReason = 'patient' | 'rescheduled' | 'no-show';

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
  cancelReason?: CancelReason;
  rescheduledFrom?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface QueueStatus {
  doctorId: string;
  date: string; // "YYYY-MM-DD"
  lastIssuedNumber: number; // incremented on booking
  nowServing: number; // incremented on "Call Next Patient"
  /** timeSlot -> appointmentId for every live (upcoming) booking on this day. */
  bookedSlots?: Record<string, string>;
  lastUpdatedAt?: number;
}

export interface Announcement {
  id: string;
  text: string;
  urgency: 'normal' | 'urgent';
  postedBy: string;
  postedByUid?: string;
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
  createdAt?: number;
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
 * Deterministic appointment document ID: ${doctorId}_${date}_${queueNumber}.
 * Guarantees one appointment per queue token and lets staff transactions
 * read a token's appointment directly without a query.
 */
export function getAppointmentDocId(doctorId: string, date: string, queueNumber: number): string {
  return `${doctorId}_${date}_${queueNumber}`;
}

/**
 * Formats a Date as a local "YYYY-MM-DD" string.
 */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Institutional baseline date for the AfyaQueue prototype (22 Sep 2026).
 */
export const PROTOTYPE_DATE = '2026-09-22';

/**
 * Returns today's local ISO date string: "YYYY-MM-DD".
 * Falls back to the institutional prototype date (2026-09-22) when no Date is supplied,
 * matching seeded records and institutional schedule verification.
 */
export function todayString(now?: Date): string {
  if (now) return toISODate(now);
  if (process.env.EXPO_PUBLIC_TODAY_DATE) return process.env.EXPO_PUBLIC_TODAY_DATE;
  return PROTOTYPE_DATE;
}

/**
 * Open slots formula (Section 6.1.5): availableSlots \ bookedSlots
 */
export function getOpenSlots(doctor: Pick<Doctor, 'availableSlots'>, queue?: Pick<QueueStatus, 'bookedSlots'>): string[] {
  const booked = queue?.bookedSlots ?? {};
  return (doctor.availableSlots ?? []).filter((slot) => !booked[slot]);
}
