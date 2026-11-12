import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  calculateEstimatedWaitTime,
  calculatePeopleAhead,
  getQueueDocId,
  isPatientTurn,
  todayString,
  type ActiveQueuePointer,
  type Announcement,
  type Appointment,
  type Doctor,
  type DoctorRating,
  type MedicalRecord,
  type QueueStatus,
  type User,
  type UserRole,
} from '@/types/models';

import {
  INITIAL_ANNOUNCEMENTS,
  INITIAL_APPOINTMENTS,
  INITIAL_DOCTORS,
  INITIAL_MEDICAL_RECORDS,
  INITIAL_PATIENT_USER,
  INITIAL_QUEUE_STATUSES,
  INITIAL_RATINGS,
  INITIAL_STAFF_USER,
} from './mock-data';

export const USER_PROFILE_STORAGE_KEY = '@afyaqueue:user_profile';
export const ACTIVE_QUEUE_STORAGE_KEY = '@afyaqueue:active_queue';
export const NOTIFICATIONS_STORAGE_KEY = '@afyaqueue:notifications';

export interface NotificationSettings {
  smsAlerts: boolean;
  pushNotifications: boolean;
  audioChimes: boolean;
  soundVolume: number;
}

export interface AppContextValue {
  // Auth & Roles
  currentUser: User | null;
  currentRole: UserRole;
  isInitializing: boolean;
  switchRole: (role: UserRole) => Promise<void>;
  signIn: (identifier: string, password: string, role?: UserRole) => Promise<User>;
  registerUser: (params: {
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    patientRegNo?: string;
  }) => Promise<User>;
  signOut: () => Promise<void>;

  // Doctors
  doctors: Doctor[];
  getDoctorById: (id: string) => Doctor | undefined;
  addDoctor: (doctor: Omit<Doctor, 'id' | 'createdAt'>) => Promise<Doctor>;

  // Appointments
  appointments: Appointment[];
  activeAppointment: Appointment | null;
  bookAppointment: (params: {
    doctorId: string;
    date: string;
    timeSlot: string;
    notes?: string;
  }) => Promise<Appointment>;
  rescheduleAppointment: (params: {
    appointmentId: string;
    newDate: string;
    newTimeSlot: string;
  }) => Promise<Appointment>;
  cancelAppointment: (appointmentId: string) => Promise<void>;

  // Live Queue Status
  queueStatuses: Record<string, QueueStatus>;
  getDoctorQueueStatus: (doctorId: string, date?: string) => QueueStatus;
  callNextPatient: (doctorId: string, date?: string) => Promise<number>;
  skipPatient: (doctorId: string, date?: string) => Promise<number>;

  // Announcements
  announcements: Announcement[];
  broadcastAnnouncement: (text: string, urgency?: 'normal' | 'urgent') => Promise<Announcement>;
  dismissAnnouncement: (id: string) => void;

  // Feedback & Ratings
  ratings: DoctorRating[];
  submitRating: (params: Omit<DoctorRating, 'id' | 'createdAt'>) => Promise<DoctorRating>;

  // Medical Records
  medicalRecords: MedicalRecord[];

  // Settings
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (partial: Partial<NotificationSettings>) => Promise<void>;

  // Computed Helpers
  activeQueueNumber: number;
  nowServingNumber: number;
  peopleAheadCount: number;
  estimatedWaitMinutes: number;
  isMyTurnActive: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(INITIAL_PATIENT_USER);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [doctors, setDoctors] = useState<Doctor[]>(INITIAL_DOCTORS);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [queueStatuses, setQueueStatuses] =
    useState<Record<string, QueueStatus>>(INITIAL_QUEUE_STATUSES);
  const [announcements, setAnnouncements] =
    useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [ratings, setRatings] = useState<DoctorRating[]>(INITIAL_RATINGS);
  const [medicalRecords] = useState<MedicalRecord[]>(INITIAL_MEDICAL_RECORDS);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    smsAlerts: true,
    pushNotifications: true,
    audioChimes: true,
    soundVolume: 80,
  });

  // Restore stored session on startup
  useEffect(() => {
    async function loadStorage() {
      try {
        const storedUser = await AsyncStorage.getItem(USER_PROFILE_STORAGE_KEY);
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        }
        const storedSettings = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (storedSettings) {
          setNotificationSettings(JSON.parse(storedSettings));
        }
      } catch (err) {
        console.warn('AfyaQueue: Error restoring state from AsyncStorage', err);
      } finally {
        setIsInitializing(false);
      }
    }
    loadStorage();
  }, []);

  const currentRole: UserRole = currentUser?.role ?? 'patient';

  // Find active appointment for current patient
  const activeAppointment =
    appointments.find(
      (a) =>
        a.patientId === currentUser?.uid &&
        a.status === 'upcoming' &&
        a.date === todayString()
    ) ??
    appointments.find(
      (a) => a.patientId === currentUser?.uid && a.status === 'upcoming'
    ) ??
    null;

  // Active queue calculations
  const doctorId = activeAppointment?.doctorId ?? 'doc-sarah-wanjiku';
  const apptDate = activeAppointment?.date ?? todayString();
  const queueDocId = getQueueDocId(doctorId, apptDate);
  const activeQueueStatus = queueStatuses[queueDocId] ?? {
    doctorId,
    date: apptDate,
    lastIssuedNumber: 18,
    nowServing: 12,
  };

  const activeQueueNumber = activeAppointment?.queueNumber ?? 18;
  const nowServingNumber = activeQueueStatus.nowServing;
  const peopleAheadCount = calculatePeopleAhead(activeQueueNumber, nowServingNumber);
  const estimatedWaitMinutes = calculateEstimatedWaitTime(
    peopleAheadCount,
    doctors.find((d) => d.id === doctorId)?.avgConsultationMins ?? 5
  );
  const isMyTurnActive = isPatientTurn(activeQueueNumber, nowServingNumber);

  // Switch Role
  const switchRole = async (role: UserRole) => {
    const newUser = role === 'staff' ? INITIAL_STAFF_USER : INITIAL_PATIENT_USER;
    setCurrentUser(newUser);
    await AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(newUser));
  };

  // Sign In
  const signIn = async (identifier: string, _password: string, role?: UserRole): Promise<User> => {
    const targetRole = role ?? (identifier.toLowerCase().includes('staff') ? 'staff' : 'patient');
    const user: User = targetRole === 'staff'
      ? {
          ...INITIAL_STAFF_USER,
          email: identifier.includes('@') ? identifier : INITIAL_STAFF_USER.email,
        }
      : {
          ...INITIAL_PATIENT_USER,
          email: identifier.includes('@') ? identifier : INITIAL_PATIENT_USER.email,
          patientRegNo: identifier.startsWith('PT') ? identifier : INITIAL_PATIENT_USER.patientRegNo,
        };

    setCurrentUser(user);
    await AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(user));
    return user;
  };

  // Register
  const registerUser = async (params: {
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    patientRegNo?: string;
  }): Promise<User> => {
    const newUser: User = {
      uid: `usr-${Date.now()}`,
      name: params.name,
      email: params.email,
      phone: params.phone,
      role: params.role,
      patientRegNo: params.patientRegNo || (params.role === 'patient' ? `PT-2026-${Math.floor(1000 + Math.random() * 9000)}` : undefined),
      facility: 'Moi Teaching & Referral Hospital',
      createdAt: Date.now(),
    };
    setCurrentUser(newUser);
    await AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(newUser));
    return newUser;
  };

  // Sign Out
  const signOut = async () => {
    await AsyncStorage.removeItem(USER_PROFILE_STORAGE_KEY);
    setCurrentUser(null);
  };

  // Doctor helpers
  const getDoctorById = (id: string) => doctors.find((d) => d.id === id);

  const addDoctor = async (doctorData: Omit<Doctor, 'id' | 'createdAt'>): Promise<Doctor> => {
    const newDoc: Doctor = {
      ...doctorData,
      id: `doc-${Date.now()}`,
      createdAt: Date.now(),
    };
    setDoctors((prev) => [newDoc, ...prev]);

    // Initialize queueStatus for this doctor and date
    const qId = getQueueDocId(newDoc.id, newDoc.availableDate);
    setQueueStatuses((prev) => ({
      ...prev,
      [qId]: {
        doctorId: newDoc.id,
        date: newDoc.availableDate,
        lastIssuedNumber: 0,
        nowServing: 0,
        lastUpdatedAt: Date.now(),
      },
    }));

    return newDoc;
  };

  // Live Queue Operations
  const getDoctorQueueStatus = (docId: string, date: string = todayString()): QueueStatus => {
    const key = getQueueDocId(docId, date);
    return (
      queueStatuses[key] ?? {
        doctorId: docId,
        date,
        lastIssuedNumber: 0,
        nowServing: 0,
      }
    );
  };

  const callNextPatient = async (docId: string, date: string = todayString()): Promise<number> => {
    const key = getQueueDocId(docId, date);
    const current = queueStatuses[key] ?? {
      doctorId: docId,
      date,
      lastIssuedNumber: 18,
      nowServing: 12,
    };

    const nextServing = current.nowServing + 1;
    const updatedStatus: QueueStatus = {
      ...current,
      nowServing: nextServing,
      lastUpdatedAt: Date.now(),
    };

    setQueueStatuses((prev) => ({
      ...prev,
      [key]: updatedStatus,
    }));

    // Update appointment status if matching
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.doctorId === docId && a.date === date && a.queueNumber < nextServing && a.status === 'upcoming') {
          return { ...a, status: 'completed' };
        }
        return a;
      })
    );

    return nextServing;
  };

  const skipPatient = async (docId: string, date: string = todayString()): Promise<number> => {
    return callNextPatient(docId, date);
  };

  // Atomic Booking Simulation
  const bookAppointment = async (params: {
    doctorId: string;
    date: string;
    timeSlot: string;
    notes?: string;
  }): Promise<Appointment> => {
    const doc = getDoctorById(params.doctorId);
    const docName = doc?.name ?? 'Dr. Specialist';
    const docSpecialty = doc?.specialty ?? 'General Clinic';
    const facility = doc?.facility ?? 'Moi Teaching Hospital';
    const room = doc?.room ?? 'Room 14';

    const qKey = getQueueDocId(params.doctorId, params.date);
    const currentQ = queueStatuses[qKey] ?? {
      doctorId: params.doctorId,
      date: params.date,
      lastIssuedNumber: 0,
      nowServing: 0,
    };

    const nextQueueNumber = currentQ.lastIssuedNumber + 1;

    // Update queue status
    setQueueStatuses((prev) => ({
      ...prev,
      [qKey]: {
        ...currentQ,
        lastIssuedNumber: nextQueueNumber,
        lastUpdatedAt: Date.now(),
      },
    }));

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      patientId: currentUser?.uid ?? 'usr-kevin-kibet',
      patientName: currentUser?.name ?? 'Kevin Kibet',
      patientPhone: currentUser?.phone ?? '0712 345 678',
      patientRegNo: currentUser?.patientRegNo ?? 'PT-2026-0142',
      doctorId: params.doctorId,
      doctorName: docName,
      doctorSpecialty: docSpecialty,
      facility,
      room,
      date: params.date,
      timeSlot: params.timeSlot,
      queueNumber: nextQueueNumber,
      status: 'upcoming',
      notes: params.notes,
      createdAt: Date.now(),
    };

    setAppointments((prev) => [newAppointment, ...prev]);

    // Persist active queue pointer
    const pointer: ActiveQueuePointer = {
      appointmentId: newAppointment.id,
      doctorId: params.doctorId,
      doctorName: docName,
      doctorSpecialty: docSpecialty,
      date: params.date,
      timeSlot: params.timeSlot,
      queueNumber: nextQueueNumber,
      room,
    };
    await AsyncStorage.setItem(ACTIVE_QUEUE_STORAGE_KEY, JSON.stringify(pointer));

    return newAppointment;
  };

  // Reschedule Appointment
  const rescheduleAppointment = async (params: {
    appointmentId: string;
    newDate: string;
    newTimeSlot: string;
  }): Promise<Appointment> => {
    // 1. Mark existing as cancelled
    setAppointments((prev) =>
      prev.map((a) => (a.id === params.appointmentId ? { ...a, status: 'cancelled' } : a))
    );

    const oldAppt = appointments.find((a) => a.id === params.appointmentId);
    const targetDocId = oldAppt?.doctorId ?? 'doc-sarah-wanjiku';

    // 2. Issue new appointment with next atomic queue number
    return bookAppointment({
      doctorId: targetDocId,
      date: params.newDate,
      timeSlot: params.newTimeSlot,
      notes: `Rescheduled from ${oldAppt?.date ?? 'previous appointment'} (${oldAppt?.timeSlot ?? ''})`,
    });
  };

  // Cancel Appointment
  const cancelAppointment = async (appointmentId: string): Promise<void> => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status: 'cancelled' } : a))
    );
    await AsyncStorage.removeItem(ACTIVE_QUEUE_STORAGE_KEY);
  };

  // Announcements
  const broadcastAnnouncement = async (
    text: string,
    urgency: 'normal' | 'urgent' = 'normal'
  ): Promise<Announcement> => {
    const newAnnouncement: Announcement = {
      id: `ann-${Date.now()}`,
      text: text.trim(),
      urgency,
      postedBy: currentUser?.name ?? 'Desk Officer',
      postedByRole: currentUser?.role === 'staff' ? 'Receptionist' : 'Staff',
      facility: 'Moi Teaching & Referral Hospital',
      createdAt: Date.now(),
    };
    setAnnouncements((prev) => [newAnnouncement, ...prev]);
    return newAnnouncement;
  };

  const dismissAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  // Ratings
  const submitRating = async (
    params: Omit<DoctorRating, 'id' | 'createdAt'>
  ): Promise<DoctorRating> => {
    const newRating: DoctorRating = {
      ...params,
      id: `rate-${Date.now()}`,
      createdAt: Date.now(),
    };
    setRatings((prev) => [newRating, ...prev]);
    return newRating;
  };

  // Settings
  const updateNotificationSettings = async (partial: Partial<NotificationSettings>) => {
    setNotificationSettings((prev) => {
      const next = { ...prev, ...partial };
      AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentRole,
        isInitializing,
        switchRole,
        signIn,
        registerUser,
        signOut,
        doctors,
        getDoctorById,
        addDoctor,
        appointments,
        activeAppointment,
        bookAppointment,
        rescheduleAppointment,
        cancelAppointment,
        queueStatuses,
        getDoctorQueueStatus,
        callNextPatient,
        skipPatient,
        announcements,
        broadcastAnnouncement,
        dismissAnnouncement,
        ratings,
        submitRating,
        medicalRecords,
        notificationSettings,
        updateNotificationSettings,
        activeQueueNumber,
        nowServingNumber,
        peopleAheadCount,
        estimatedWaitMinutes,
        isMyTurnActive,
      }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
