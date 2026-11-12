/// <reference types="bun-types" />
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, setDefaultTimeout } from 'bun:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

setDefaultTimeout(30000);

const PROJECT_ID = 'demo-afyaqueue';

describe('Cloud Firestore Security Rules', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    console.log('[Test Setup] Initializing test environment...');
    const rulesPath = resolve(process.cwd(), 'firestore.rules');
    const rules = readFileSync(rulesPath, 'utf8');

    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules,
        host: '127.0.0.1',
        port: 8080,
      },
    });
    console.log('[Test Setup] Test environment initialized.');
  }, 30000);

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  }, 30000);

  beforeEach(async () => {
    console.log('[Test Setup] Clearing Firestore...');
    await testEnv.clearFirestore();

    // Seed staff profile so isStaff() lookup succeeds via document lookup as well as token claim
    console.log('[Test Setup] Seeding baseline fixtures...');
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'users/usr-sister-mary'), {
        uid: 'usr-sister-mary',
        name: 'Sister Mary Chebet',
        role: 'staff',
        email: 'mary.chebet@mtrh.go.ke',
        phone: '0722 000 111',
        createdAt: Date.now(),
      });
      await setDoc(doc(db, 'users/usr-kevin-kibet'), {
        uid: 'usr-kevin-kibet',
        name: 'Kevin Kibet',
        role: 'patient',
        email: 'kevin.kibet@gmail.com',
        phone: '0712 345 678',
        patientRegNo: 'PT-2026-0142',
        createdAt: Date.now(),
      });
      await setDoc(doc(db, 'doctors/doc-sarah-wanjiku'), {
        id: 'doc-sarah-wanjiku',
        name: 'Dr. Sarah Wanjiku',
        specialty: 'General Medicine',
        facility: 'Moi Teaching Hospital',
        availableSlots: ['09:00 AM', '09:30 AM'],
        avgConsultationMins: 5,
        rating: 4.9,
        reviewCount: 10,
        createdAt: Date.now(),
      });
      await setDoc(doc(db, 'queueStatus/doc-sarah-wanjiku_2026-09-22'), {
        doctorId: 'doc-sarah-wanjiku',
        date: '2026-09-22',
        lastIssuedNumber: 18,
        nowServing: 12,
      });
    });
    console.log('[Test Setup] Baseline fixtures seeded.');
  }, 30000);

  // -------------------------------------------------------------
  // 1. Users Collection
  // -------------------------------------------------------------
  describe('Users Collection', () => {
    it('unauthenticated user cannot read profiles', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(getDoc(doc(unauthDb, 'users/usr-kevin-kibet')));
    });

    it('patient can read their own profile', async () => {
      const patientDb = testEnv.authenticatedContext('usr-kevin-kibet', { role: 'patient' }).firestore();
      await assertSucceeds(getDoc(doc(patientDb, 'users/usr-kevin-kibet')));
    });

    it('patient cannot read another patient profile', async () => {
      const patientDb = testEnv.authenticatedContext('usr-kevin-kibet', { role: 'patient' }).firestore();
      await assertFails(getDoc(doc(patientDb, 'users/usr-faith')));
    });

    it('staff can read any user profile for desk operations', async () => {
      const staffDb = testEnv.authenticatedContext('usr-sister-mary', { role: 'staff' }).firestore();
      await assertSucceeds(getDoc(doc(staffDb, 'users/usr-kevin-kibet')));
    });

    it('staff can read any user profile without custom token claims (via /users/{uid} document)', async () => {
      const staffDb = testEnv.authenticatedContext('usr-sister-mary').firestore();
      await assertSucceeds(getDoc(doc(staffDb, 'users/usr-kevin-kibet')));
    });

    it('patient cannot alter their role on update', async () => {
      const patientDb = testEnv.authenticatedContext('usr-kevin-kibet', { role: 'patient' }).firestore();
      await assertFails(
        updateDoc(doc(patientDb, 'users/usr-kevin-kibet'), {
          role: 'staff',
        })
      );
    });
  });

  // -------------------------------------------------------------
  // 2. Doctors Collection
  // -------------------------------------------------------------
  describe('Doctors Collection', () => {
    it('authenticated users can read doctors list', async () => {
      const patientDb = testEnv.authenticatedContext('usr-kevin-kibet').firestore();
      await assertSucceeds(getDoc(doc(patientDb, 'doctors/doc-sarah-wanjiku')));
    });

    it('unauthenticated users cannot read doctors list', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(getDoc(doc(unauthDb, 'doctors/doc-sarah-wanjiku')));
    });

    it('patient cannot add a new doctor', async () => {
      const patientDb = testEnv.authenticatedContext('usr-kevin-kibet', { role: 'patient' }).firestore();
      await assertFails(
        setDoc(doc(patientDb, 'doctors/doc-new'), {
          id: 'doc-new',
          name: 'Dr. Hacker',
          specialty: 'Surgery',
          facility: 'MTRH',
          availableSlots: ['09:00 AM'],
          avgConsultationMins: 5,
          createdAt: Date.now(),
        })
      );
    });

    it('staff can add a new doctor', async () => {
      const staffDb = testEnv.authenticatedContext('usr-sister-mary', { role: 'staff' }).firestore();
      await assertSucceeds(
        setDoc(doc(staffDb, 'doctors/doc-new-2'), {
          id: 'doc-new-2',
          name: 'Dr. Jane Muthoni',
          specialty: 'Cardiology',
          facility: 'Moi Teaching Hospital',
          availableSlots: ['10:00 AM', '11:00 AM'],
          avgConsultationMins: 10,
          createdAt: Date.now(),
        })
      );
    });

    it('patient can update doctor reviewCount and rating atomically', async () => {
      const patientDb = testEnv.authenticatedContext('usr-kevin-kibet', { role: 'patient' }).firestore();
      await assertSucceeds(
        updateDoc(doc(patientDb, 'doctors/doc-sarah-wanjiku'), {
          rating: 4.95,
          reviewCount: 11,
          lastRatingId: 'rate-123',
        })
      );
    });
  });

  // -------------------------------------------------------------
  // 3. Appointments Collection
  // -------------------------------------------------------------
  describe('Appointments Collection', () => {
    it('patient can book an appointment for themselves', async () => {
      const patientDb = testEnv.authenticatedContext('usr-kevin-kibet', { role: 'patient' }).firestore();
      await assertSucceeds(
        setDoc(doc(patientDb, 'appointments/apt-test-1'), {
          id: 'apt-test-1',
          patientId: 'usr-kevin-kibet',
          patientName: 'Kevin Kibet',
          doctorId: 'doc-sarah-wanjiku',
          doctorName: 'Dr. Sarah Wanjiku',
          doctorSpecialty: 'General Medicine',
          facility: 'Moi Teaching Hospital',
          date: '2026-09-22',
          timeSlot: '09:30 AM',
          queueNumber: 19,
          status: 'upcoming',
          createdAt: Date.now(),
        })
      );
    });

    it('patient cannot book an appointment for someone else', async () => {
      const patientDb = testEnv.authenticatedContext('usr-kevin-kibet', { role: 'patient' }).firestore();
      await assertFails(
        setDoc(doc(patientDb, 'appointments/apt-test-spoof'), {
          id: 'apt-test-spoof',
          patientId: 'usr-other-patient',
          patientName: 'Other Person',
          doctorId: 'doc-sarah-wanjiku',
          doctorName: 'Dr. Sarah Wanjiku',
          doctorSpecialty: 'General Medicine',
          facility: 'Moi Teaching Hospital',
          date: '2026-09-22',
          timeSlot: '09:30 AM',
          queueNumber: 19,
          status: 'upcoming',
          createdAt: Date.now(),
        })
      );
    });

    it('patient can cancel their own upcoming appointment', async () => {
      // First seed Kevin's appointment
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'appointments/apt-kevin-cancel'), {
          id: 'apt-kevin-cancel',
          patientId: 'usr-kevin-kibet',
          patientName: 'Kevin Kibet',
          doctorId: 'doc-sarah-wanjiku',
          doctorName: 'Dr. Sarah Wanjiku',
          doctorSpecialty: 'General Medicine',
          facility: 'MTRH',
          date: '2026-09-22',
          timeSlot: '09:30 AM',
          queueNumber: 18,
          status: 'upcoming',
          createdAt: Date.now(),
        });
      });

      const patientDb = testEnv.authenticatedContext('usr-kevin-kibet', { role: 'patient' }).firestore();
      await assertSucceeds(
        updateDoc(doc(patientDb, 'appointments/apt-kevin-cancel'), {
          status: 'cancelled',
          cancelReason: 'patient',
          updatedAt: Date.now(),
        })
      );
    });

    it('staff can complete an appointment', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'appointments/apt-staff-serve'), {
          id: 'apt-staff-serve',
          patientId: 'usr-faith',
          patientName: 'Faith Njeri',
          doctorId: 'doc-sarah-wanjiku',
          doctorName: 'Dr. Sarah Wanjiku',
          doctorSpecialty: 'General Medicine',
          facility: 'MTRH',
          date: '2026-09-22',
          timeSlot: '09:15 AM',
          queueNumber: 12,
          status: 'upcoming',
          createdAt: Date.now(),
        });
      });

      const staffDb = testEnv.authenticatedContext('usr-sister-mary', { role: 'staff' }).firestore();
      await assertSucceeds(
        updateDoc(doc(staffDb, 'appointments/apt-staff-serve'), {
          status: 'completed',
          updatedAt: Date.now(),
        })
      );
    });

    it('patient cannot cancel another patient appointment', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'appointments/apt-faith-other'), {
          id: 'apt-faith-other',
          patientId: 'usr-faith',
          patientName: 'Faith Njeri',
          doctorId: 'doc-sarah-wanjiku',
          doctorName: 'Dr. Sarah Wanjiku',
          doctorSpecialty: 'General Medicine',
          facility: 'MTRH',
          date: '2026-09-22',
          timeSlot: '09:15 AM',
          queueNumber: 12,
          status: 'upcoming',
          createdAt: Date.now(),
        });
      });

      const patientDb = testEnv.authenticatedContext('usr-kevin-kibet', { role: 'patient' }).firestore();
      await assertFails(
        updateDoc(doc(patientDb, 'appointments/apt-faith-other'), {
          status: 'cancelled',
          cancelReason: 'patient',
          updatedAt: Date.now(),
        })
      );
    });

    it('patient cannot complete an appointment', async () => {
      const patientDb = testEnv.authenticatedContext('usr-kevin-kibet', { role: 'patient' }).firestore();
      await assertFails(
        updateDoc(doc(patientDb, 'appointments/apt-kevin-cancel'), {
          status: 'completed',
          updatedAt: Date.now(),
        })
      );
    });

    it('patient cannot read another patient appointment', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'appointments/apt-faith-private'), {
          id: 'apt-faith-private',
          patientId: 'usr-faith',
          patientName: 'Faith Njeri',
          doctorId: 'doc-sarah-wanjiku',
          doctorName: 'Dr. Sarah Wanjiku',
          doctorSpecialty: 'General Medicine',
          facility: 'MTRH',
          date: '2026-09-22',
          timeSlot: '09:15 AM',
          queueNumber: 12,
          status: 'upcoming',
          createdAt: Date.now(),
        });
      });

      const patientDb = testEnv.authenticatedContext('usr-kevin-kibet', { role: 'patient' }).firestore();
      await assertFails(getDoc(doc(patientDb, 'appointments/apt-faith-private')));
    });
  });

  // -------------------------------------------------------------
  // 4. Live Queue Status Collection
  // -------------------------------------------------------------
  describe('QueueStatus Collection', () => {
    it('patient can atomically increment lastIssuedNumber by exactly 1 on booking', async () => {
      const patientDb = testEnv.authenticatedContext('usr-kevin-kibet', { role: 'patient' }).firestore();
      await assertSucceeds(
        updateDoc(doc(patientDb, 'queueStatus/doc-sarah-wanjiku_2026-09-22'), {
          lastIssuedNumber: 19,
          lastUpdatedAt: Date.now(),
        })
      );
    });

    it('patient cannot skip or advance nowServing', async () => {
      const patientDb = testEnv.authenticatedContext('usr-kevin-kibet', { role: 'patient' }).firestore();
      await assertFails(
        updateDoc(doc(patientDb, 'queueStatus/doc-sarah-wanjiku_2026-09-22'), {
          nowServing: 13,
        })
      );
    });

    it('staff can advance nowServing (call next patient)', async () => {
      const staffDb = testEnv.authenticatedContext('usr-sister-mary', { role: 'staff' }).firestore();
      await assertSucceeds(
        updateDoc(doc(staffDb, 'queueStatus/doc-sarah-wanjiku_2026-09-22'), {
          nowServing: 13,
          lastUpdatedAt: Date.now(),
        })
      );
    });

    it('patient can release their booked slot upon cancelling an appointment', async () => {
      const patientDb = testEnv.authenticatedContext('usr-kevin-kibet', { role: 'patient' }).firestore();
      await assertSucceeds(
        updateDoc(doc(patientDb, 'queueStatus/doc-sarah-wanjiku_2026-09-22'), {
          bookedSlots: {},
          lastUpdatedAt: Date.now(),
        })
      );
    });
  });

  // -------------------------------------------------------------
  // 5. Announcements Collection
  // -------------------------------------------------------------
  describe('Announcements Collection', () => {
    it('patient cannot broadcast announcements', async () => {
      const patientDb = testEnv.authenticatedContext('usr-kevin-kibet', { role: 'patient' }).firestore();
      await assertFails(
        setDoc(doc(patientDb, 'announcements/ann-hack'), {
          id: 'ann-hack',
          text: 'Clinic closed today',
          urgency: 'urgent',
          postedBy: 'Hacker',
          createdAt: Date.now(),
        })
      );
    });

    it('staff can broadcast announcements', async () => {
      const staffDb = testEnv.authenticatedContext('usr-sister-mary', { role: 'staff' }).firestore();
      await assertSucceeds(
        setDoc(doc(staffDb, 'announcements/ann-legit'), {
          id: 'ann-legit',
          text: 'Room 14 is now open for triage.',
          urgency: 'normal',
          postedBy: 'Sister Mary Chebet',
          createdAt: Date.now(),
        })
      );
    });

    it('patient cannot delete an announcement', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'announcements/ann-to-del'), {
          id: 'ann-to-del',
          text: 'Clinic notice',
          urgency: 'normal',
          postedBy: 'Sister Mary',
          createdAt: Date.now(),
        });
      });
      const patientDb = testEnv.authenticatedContext('usr-kevin-kibet', { role: 'patient' }).firestore();
      await assertFails(deleteDoc(doc(patientDb, 'announcements/ann-to-del')));
    });

    it('staff can delete an announcement', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'announcements/ann-staff-del'), {
          id: 'ann-staff-del',
          text: 'Clinic notice to delete',
          urgency: 'normal',
          postedBy: 'Sister Mary',
          createdAt: Date.now(),
        });
      });
      const staffDb = testEnv.authenticatedContext('usr-sister-mary', { role: 'staff' }).firestore();
      await assertSucceeds(deleteDoc(doc(staffDb, 'announcements/ann-staff-del')));
    });
  });

  // -------------------------------------------------------------
  // 6. Ratings & Medical Records
  // -------------------------------------------------------------
  describe('Ratings & Medical Records', () => {
    it('patient can submit rating for their appointment', async () => {
      const patientDb = testEnv.authenticatedContext('usr-kevin-kibet', { role: 'patient' }).firestore();
      await assertSucceeds(
        setDoc(doc(patientDb, 'ratings/rate-kibet-1'), {
          id: 'rate-kibet-1',
          doctorId: 'doc-sarah-wanjiku',
          patientId: 'usr-kevin-kibet',
          patientName: 'Kevin Kibet',
          appointmentId: 'apt-today-kevin',
          stars: 5,
          createdAt: Date.now(),
        })
      );
    });

    it('patient cannot submit rating with 0 or 6 stars', async () => {
      const patientDb = testEnv.authenticatedContext('usr-kevin-kibet', { role: 'patient' }).firestore();
      await assertFails(
        setDoc(doc(patientDb, 'ratings/rate-invalid'), {
          id: 'rate-invalid',
          doctorId: 'doc-sarah-wanjiku',
          patientId: 'usr-kevin-kibet',
          stars: 6,
          createdAt: Date.now(),
        })
      );
    });

    it('patient can read their own medical records but not others', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'medicalRecords/rec-kevin'), {
          id: 'rec-kevin',
          patientId: 'usr-kevin-kibet',
          doctorName: 'Dr. Sarah Wanjiku',
          specialty: 'General Medicine',
          facility: 'MTRH',
          date: '2026-08-10',
          diagnosis: 'Hypertension',
          prescriptions: [],
        });
        await setDoc(doc(ctx.firestore(), 'medicalRecords/rec-other'), {
          id: 'rec-other',
          patientId: 'usr-other',
          doctorName: 'Dr. Sarah Wanjiku',
          specialty: 'General Medicine',
          facility: 'MTRH',
          date: '2026-08-10',
          diagnosis: 'Asthma',
          prescriptions: [],
        });
      });

      const patientDb = testEnv.authenticatedContext('usr-kevin-kibet', { role: 'patient' }).firestore();
      await assertSucceeds(getDoc(doc(patientDb, 'medicalRecords/rec-kevin')));
      await assertFails(getDoc(doc(patientDb, 'medicalRecords/rec-other')));
    });

    it('patient cannot create a medical record', async () => {
      const patientDb = testEnv.authenticatedContext('usr-kevin-kibet', { role: 'patient' }).firestore();
      await assertFails(
        setDoc(doc(patientDb, 'medicalRecords/rec-forged'), {
          id: 'rec-forged',
          patientId: 'usr-kevin-kibet',
          doctorName: 'Dr. Sarah Wanjiku',
          specialty: 'General Medicine',
          facility: 'MTRH',
          date: '2026-09-22',
          diagnosis: 'Healthy',
          prescriptions: [],
        })
      );
    });

    it('staff can create a clinical medical record', async () => {
      const staffDb = testEnv.authenticatedContext('usr-sister-mary', { role: 'staff' }).firestore();
      await assertSucceeds(
        setDoc(doc(staffDb, 'medicalRecords/rec-official'), {
          id: 'rec-official',
          patientId: 'usr-kevin-kibet',
          doctorName: 'Dr. Sarah Wanjiku',
          specialty: 'General Medicine',
          facility: 'MTRH',
          date: '2026-09-22',
          diagnosis: 'Malaria negative; routine review',
          prescriptions: ['Paracetamol 500mg TDS x 3/7'],
        })
      );
    });
  });
});
