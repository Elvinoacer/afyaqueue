import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
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
  type NotificationSettings,
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

import * as authService from '@/services/authService';
import * as doctorService from '@/services/doctorService';
import * as bookingService from '@/services/bookingService';
import * as announcementService from '@/services/announcementService';
import * as ratingService from '@/services/ratingService';
import * as medicalRecordService from '@/services/medicalRecordService';

export const USER_PROFILE_STORAGE_KEY = '@afyaqueue:user_profile';
export const ACTIVE_QUEUE_STORAGE_KEY = '@afyaqueue:active_queue';
export const NOTIFICATIONS_STORAGE_KEY = '@afyaqueue:notifications';

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
  const [medicalRecords, setMedicalRecords] =
    useState<MedicalRecord[]>(INITIAL_MEDICAL_RECORDS);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    smsAlerts: true,
    pushNotifications: true,
    audioChimes: true,
    soundVolume: 80,
  });

  // 1. Restore cached session & settings on startup
  useEffect(() => {
    let isMounted = true;

    async function loadStorage() {
      try {
        const storedUser = await AsyncStorage.getItem(USER_PROFILE_STORAGE_KEY);
        if (storedUser && isMounted) {
          const parsed = JSON.parse(storedUser);
          setCurrentUser(parsed);
        }
        const storedSettings = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (storedSettings && isMounted) {
          setNotificationSettings(JSON.parse(storedSettings));
        }
      } catch (err) {
        console.warn('AfyaQueue: Error restoring state from AsyncStorage', err);
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    }

    loadStorage();

    // Listen to Firebase Auth state
    const unsubscribeAuth = authService.onAuthStateChangedListener(async (fbUser) => {
      if (!isMounted) return;
      if (fbUser) {
        try {
          const profile = await authService.getUserProfile(fbUser.uid);
          if (profile && isMounted) {
            setCurrentUser(profile);
            await AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
          }
        } catch (err) {
          console.warn('AfyaQueue: Error syncing user profile from auth:', err);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribeAuth();
    };
  }, []);

  // 2. Global Firestore Real-Time Subscriptions (Doctors, Live Queue, Announcements, Ratings)
  useEffect(() => {
    // Doctors subscription
    const unsubDoctors = doctorService.subscribeToDoctors((docs) => {
      if (docs.length > 0) setDoctors(docs);
    });

    // Queue statuses subscription
    const unsubQueues = bookingService.subscribeToQueueStatuses((statuses) => {
      if (Object.keys(statuses).length > 0) setQueueStatuses(statuses);
    });

    // Announcements subscription
    const unsubAnnouncements = announcementService.subscribeToAnnouncements((anns) => {
      if (anns.length > 0) setAnnouncements(anns);
    });

    // Ratings subscription
    const unsubRatings = ratingService.subscribeToRatings(undefined, (rats) => {
      if (rats.length > 0) setRatings(rats);
    });

    return () => {
      unsubDoctors();
      unsubQueues();
      unsubAnnouncements();
      unsubRatings();
    };
  }, []);

  // 3. User-Scoped Firestore Real-Time Subscriptions (Appointments & Medical Records)
  useEffect(() => {
    const userUid = currentUser?.uid;
    const userRole = currentUser?.role;
    if (!userUid) return;

    // For staff, subscribe to all hospital appointments; for patient, only their own
    const patientFilter = userRole === 'staff' ? null : userUid;
    const unsubAppointments = bookingService.subscribeToAppointments(
      patientFilter,
      (appts) => {
        if (appts.length > 0) {
          setAppointments(appts);
        }
      }
    );

    // Subscribe to patient's clinical medical records
    let unsubRecords: (() => void) | undefined;
    if (userRole === 'patient') {
      unsubRecords = medicalRecordService.subscribeToPatientRecords(
        userUid,
        (recs) => {
          if (recs.length > 0) setMedicalRecords(recs);
        }
      );
    }

    return () => {
      unsubAppointments();
      unsubRecords?.();
    };
  }, [currentUser?.uid, currentUser?.role]);

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
  const docId = activeAppointment?.doctorId ?? 'doc-sarah-wanjiku';
  const apptDate = activeAppointment?.date ?? todayString();
  const queueDocId = getQueueDocId(docId, apptDate);
  const activeQueueStatus = queueStatuses[queueDocId] ?? {
    doctorId: docId,
    date: apptDate,
    lastIssuedNumber: 18,
    nowServing: 12,
  };

  const activeQueueNumber = activeAppointment?.queueNumber ?? 18;
  const nowServingNumber = activeQueueStatus.nowServing;
  const peopleAheadCount = calculatePeopleAhead(activeQueueNumber, nowServingNumber);
  const estimatedWaitMinutes = calculateEstimatedWaitTime(
    peopleAheadCount,
    doctors.find((d) => d.id === docId)?.avgConsultationMins ?? 5
  );
  const isMyTurnActive = isPatientTurn(activeQueueNumber, nowServingNumber);

  // Switch Role (Demo Convenience & Auth Sync)
  const switchRole = async (role: UserRole) => {
    const newUser = role === 'staff' ? INITIAL_STAFF_USER : INITIAL_PATIENT_USER;
    setCurrentUser(newUser);
    await AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(newUser));

    // Attempt Firebase Auth sign in with demo credentials in background
    try {
      const email = newUser.email;
      await authService.signIn(email, 'Password123!', role);
    } catch {
      // Non-fatal if offline/unreachable: state is already switched locally
    }
  };

  // Sign In with Firebase Auth + Firestore Profile
  const signIn = async (
    identifier: string,
    password: string,
    role?: UserRole
  ): Promise<User> => {
    try {
      const user = await authService.signIn(identifier, password, role);
      setCurrentUser(user);
      await AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(user));
      return user;
    } catch (err) {
      console.warn('AfyaQueue: Firebase Auth sign-in failed, checking fallback:', err);
      // Fallback for offline demo resilience
      const targetRole =
        role ?? (identifier.toLowerCase().includes('staff') ? 'staff' : 'patient');
      const fallbackUser: User =
        targetRole === 'staff'
          ? {
              ...INITIAL_STAFF_USER,
              email: identifier.includes('@') ? identifier : INITIAL_STAFF_USER.email,
            }
          : {
              ...INITIAL_PATIENT_USER,
              email: identifier.includes('@') ? identifier : INITIAL_PATIENT_USER.email,
              patientRegNo: identifier.startsWith('PT')
                ? identifier
                : INITIAL_PATIENT_USER.patientRegNo,
            };
      setCurrentUser(fallbackUser);
      await AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(fallbackUser));
      return fallbackUser;
    }
  };

  // Register User with Firebase Auth + Firestore Profile
  const registerUser = async (params: {
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    patientRegNo?: string;
  }): Promise<User> => {
    try {
      const user = await authService.registerUser(params);
      setCurrentUser(user);
      await AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(user));
      return user;
    } catch (err) {
      console.warn('AfyaQueue: Firebase Auth register failed, using offline profile:', err);
      const fallbackUser: User = {
        uid: `usr-${Date.now()}`,
        name: params.name,
        email: params.email,
        phone: params.phone,
        role: params.role,
        patientRegNo:
          params.patientRegNo ||
          (params.role === 'patient'
            ? `PT-2026-${Math.floor(1000 + Math.random() * 9000)}`
            : undefined),
        facility: 'Moi Teaching & Referral Hospital',
        createdAt: Date.now(),
      };
      setCurrentUser(fallbackUser);
      await AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(fallbackUser));
      return fallbackUser;
    }
  };

  // Sign Out
  const signOut = async () => {
    try {
      await authService.signOut();
    } catch (err) {
      console.warn('AfyaQueue: Error signing out from Firebase Auth:', err);
    }
    await AsyncStorage.removeItem(USER_PROFILE_STORAGE_KEY);
    await AsyncStorage.removeItem(ACTIVE_QUEUE_STORAGE_KEY);
    setCurrentUser(null);
  };

  // Doctor helpers
  const getDoctorById = (id: string) => doctors.find((d) => d.id === id);

  const addDoctor = async (
    doctorData: Omit<Doctor, 'id' | 'createdAt'>
  ): Promise<Doctor> => {
    try {
      const newDoc = await doctorService.createDoctor(doctorData, currentUser?.uid);
      setDoctors((prev) => [newDoc, ...prev]);
      return newDoc;
    } catch (err) {
      console.warn('AfyaQueue: Error in createDoctor backend call:', err);
      // Optimistic local fallback
      const fallbackDoc: Doctor = {
        ...doctorData,
        id: `doc-${Date.now()}`,
        createdAt: Date.now(),
      };
      setDoctors((prev) => [fallbackDoc, ...prev]);
      return fallbackDoc;
    }
  };

  // Live Queue Operations
  const getDoctorQueueStatus = (
    doctorIdParam: string,
    dateParam: string = todayString()
  ): QueueStatus => {
    const key = getQueueDocId(doctorIdParam, dateParam);
    return (
      queueStatuses[key] ?? {
        doctorId: doctorIdParam,
        date: dateParam,
        lastIssuedNumber: 0,
        nowServing: 0,
      }
    );
  };

  const callNextPatient = async (
    doctorIdParam: string,
    dateParam: string = todayString()
  ): Promise<number> => {
    try {
      const nextServing = await bookingService.callNextPatientAtomic(
        doctorIdParam,
        dateParam
      );
      return nextServing;
    } catch (err) {
      console.warn('AfyaQueue: Error in callNextPatient backend call:', err);
      // Fallback local update
      const key = getQueueDocId(doctorIdParam, dateParam);
      const current = queueStatuses[key] ?? {
        doctorId: doctorIdParam,
        date: dateParam,
        lastIssuedNumber: 18,
        nowServing: 12,
      };
      const nextServing = current.nowServing + 1;
      setQueueStatuses((prev) => ({
        ...prev,
        [key]: { ...current, nowServing: nextServing, lastUpdatedAt: Date.now() },
      }));
      setAppointments((prev) =>
        prev.map((a) => {
          if (
            a.doctorId === doctorIdParam &&
            a.date === dateParam &&
            a.queueNumber < nextServing &&
            a.status === 'upcoming'
          ) {
            return { ...a, status: 'completed' };
          }
          return a;
        })
      );
      return nextServing;
    }
  };

  const skipPatient = async (
    doctorIdParam: string,
    dateParam: string = todayString()
  ): Promise<number> => {
    return callNextPatient(doctorIdParam, dateParam);
  };

  // Atomic Booking
  const bookAppointment = async (params: {
    doctorId: string;
    date: string;
    timeSlot: string;
    notes?: string;
  }): Promise<Appointment> => {
    try {
      const newAppt = await bookingService.bookAppointmentAtomic({
        ...params,
        patientId: currentUser?.uid ?? 'usr-kevin-kibet',
        patientName: currentUser?.name ?? 'Kevin Kibet',
        patientPhone: currentUser?.phone ?? '0712 345 678',
        patientRegNo: currentUser?.patientRegNo ?? 'PT-2026-0142',
      });

      setAppointments((prev) => [newAppt, ...prev]);

      const pointer: ActiveQueuePointer = {
        appointmentId: newAppt.id,
        doctorId: newAppt.doctorId,
        doctorName: newAppt.doctorName,
        doctorSpecialty: newAppt.doctorSpecialty,
        date: newAppt.date,
        timeSlot: newAppt.timeSlot,
        queueNumber: newAppt.queueNumber,
        room: newAppt.room,
      };
      await AsyncStorage.setItem(ACTIVE_QUEUE_STORAGE_KEY, JSON.stringify(pointer));
      return newAppt;
    } catch (err) {
      console.warn('AfyaQueue: bookAppointment backend call failed, fallback local:', err);
      const doc = getDoctorById(params.doctorId);
      const qKey = getQueueDocId(params.doctorId, params.date);
      const currentQ = queueStatuses[qKey] ?? {
        doctorId: params.doctorId,
        date: params.date,
        lastIssuedNumber: 0,
        nowServing: 0,
      };
      const nextQueueNumber = currentQ.lastIssuedNumber + 1;

      setQueueStatuses((prev) => ({
        ...prev,
        [qKey]: {
          ...currentQ,
          lastIssuedNumber: nextQueueNumber,
          lastUpdatedAt: Date.now(),
        },
      }));

      const fallbackAppt: Appointment = {
        id: `apt-${Date.now()}`,
        patientId: currentUser?.uid ?? 'usr-kevin-kibet',
        patientName: currentUser?.name ?? 'Kevin Kibet',
        patientPhone: currentUser?.phone ?? '0712 345 678',
        patientRegNo: currentUser?.patientRegNo ?? 'PT-2026-0142',
        doctorId: params.doctorId,
        doctorName: doc?.name ?? 'Dr. Specialist',
        doctorSpecialty: doc?.specialty ?? 'General Clinic',
        facility: doc?.facility ?? 'Moi Teaching Hospital',
        room: doc?.room ?? 'Room 14',
        date: params.date,
        timeSlot: params.timeSlot,
        queueNumber: nextQueueNumber,
        status: 'upcoming',
        notes: params.notes,
        createdAt: Date.now(),
      };

      setAppointments((prev) => [fallbackAppt, ...prev]);
      return fallbackAppt;
    }
  };

  // Reschedule Appointment
  const rescheduleAppointment = async (params: {
    appointmentId: string;
    newDate: string;
    newTimeSlot: string;
  }): Promise<Appointment> => {
    try {
      const newAppt = await bookingService.rescheduleAppointmentAtomic(params);
      setAppointments((prev) => [
        newAppt,
        ...prev.map((a) => (a.id === params.appointmentId ? { ...a, status: 'cancelled' as const } : a)),
      ]);
      return newAppt;
    } catch (err) {
      console.warn('AfyaQueue: rescheduleAppointment backend error, fallback:', err);
      setAppointments((prev) =>
        prev.map((a) => (a.id === params.appointmentId ? { ...a, status: 'cancelled' as const } : a))
      );
      const oldAppt = appointments.find((a) => a.id === params.appointmentId);
      return bookAppointment({
        doctorId: oldAppt?.doctorId ?? 'doc-sarah-wanjiku',
        date: params.newDate,
        timeSlot: params.newTimeSlot,
        notes: `Rescheduled from ${oldAppt?.date ?? ''} (${oldAppt?.timeSlot ?? ''})`,
      });
    }
  };

  // Cancel Appointment
  const cancelAppointment = async (appointmentId: string): Promise<void> => {
    try {
      await bookingService.cancelAppointment(appointmentId);
    } catch (err) {
      console.warn('AfyaQueue: cancelAppointment backend call error:', err);
    }
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status: 'cancelled' as const } : a))
    );
    await AsyncStorage.removeItem(ACTIVE_QUEUE_STORAGE_KEY);
  };

  // Announcements
  const broadcastAnnouncement = async (
    text: string,
    urgency: 'normal' | 'urgent' = 'normal'
  ): Promise<Announcement> => {
    try {
      const ann = await announcementService.broadcastAnnouncement(
        text,
        urgency,
        currentUser
      );
      setAnnouncements((prev) => [ann, ...prev]);
      return ann;
    } catch (err) {
      console.warn('AfyaQueue: broadcastAnnouncement backend error:', err);
      const fallbackAnn: Announcement = {
        id: `ann-${Date.now()}`,
        text: text.trim(),
        urgency,
        postedBy: currentUser?.name ?? 'Desk Officer',
        postedByRole: currentUser?.role === 'staff' ? 'Receptionist' : 'Staff',
        facility: 'Moi Teaching & Referral Hospital',
        createdAt: Date.now(),
      };
      setAnnouncements((prev) => [fallbackAnn, ...prev]);
      return fallbackAnn;
    }
  };

  const dismissAnnouncement = (id: string) => {
    try {
      announcementService.deleteAnnouncement(id);
    } catch (err) {
      console.warn('AfyaQueue: dismissAnnouncement error:', err);
    }
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  // Ratings
  const submitRating = async (
    params: Omit<DoctorRating, 'id' | 'createdAt'>
  ): Promise<DoctorRating> => {
    try {
      const newRating = await ratingService.submitRating(params);
      setRatings((prev) => [newRating, ...prev]);
      return newRating;
    } catch (err) {
      console.warn('AfyaQueue: submitRating backend error:', err);
      const fallbackRating: DoctorRating = {
        ...params,
        id: `rate-${Date.now()}`,
        createdAt: Date.now(),
      };
      setRatings((prev) => [fallbackRating, ...prev]);
      return fallbackRating;
    }
  };

  // Settings
  const updateNotificationSettings = async (partial: Partial<NotificationSettings>) => {
    setNotificationSettings((prev) => {
      const next = { ...prev, ...partial };
      AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(next));
      if (currentUser?.uid) {
        authService.updateNotificationSettings(currentUser.uid, next).catch(() => {});
      }
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
