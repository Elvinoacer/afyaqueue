/**
 * Database Seed Script for AfyaQueue.
 * Populates Firebase Auth & Cloud Firestore with institutional baseline data:
 * - Demo user accounts (Patient: Kevin Kibet, Staff: Sister Mary Chebet, Queue Patients)
 * - Hospital Patient Master Index (registry collection)
 * - Doctor Directory (General Medicine, Pediatrics, Dental Surgery, ENT Specialist)
 * - Live Queue Statuses with slot mappings
 * - Clinical Appointments (Upcoming & Historical)
 * - Broadcast Announcements
 * - Doctor Ratings & Reviews
 * - Electronic Medical Records & Prescriptions
 */
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

import {
  INITIAL_ANNOUNCEMENTS,
  INITIAL_APPOINTMENTS,
  INITIAL_DOCTORS,
  INITIAL_MEDICAL_RECORDS,
  INITIAL_PATIENT_USER,
  INITIAL_QUEUE_STATUSES,
  INITIAL_RATINGS,
  INITIAL_STAFF_USER,
} from '../src/store/mock-data';
import type { User } from '../src/types/models';

// Configure emulator endpoints if not already in environment
const rawProjectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim();
const PROJECT_ID = rawProjectId && rawProjectId.length > 0 ? rawProjectId : (process.env.GCLOUD_PROJECT?.trim() || 'demo-afyaqueue');
const FIRESTORE_HOST = process.env.FIRESTORE_EMULATOR_HOST?.trim() || '127.0.0.1:8080';
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST?.trim() || '127.0.0.1:9099';

process.env.GCLOUD_PROJECT = PROJECT_ID;
process.env.GOOGLE_CLOUD_PROJECT = PROJECT_ID;
process.env.FIRESTORE_EMULATOR_HOST = FIRESTORE_HOST;
process.env.FIREBASE_AUTH_EMULATOR_HOST = AUTH_HOST;

const app = initializeApp({
  projectId: PROJECT_ID,
});

const auth = getAuth(app);
const db = getFirestore(app);

// All demo users to seed into Auth + Firestore
const DEMO_USERS: (User & { password?: string })[] = [
  {
    ...INITIAL_PATIENT_USER,
    password: 'Password123!',
  },
  {
    ...INITIAL_STAFF_USER,
    password: 'Password123!',
  },
  {
    uid: 'usr-faith',
    name: 'Faith Njeri',
    role: 'patient',
    email: 'faith.njeri@gmail.com',
    phone: '0711 223 344',
    patientRegNo: 'PT-2026-0089',
    facility: 'Moi Teaching & Referral Hospital',
    createdAt: 1726980000000,
    password: 'Password123!',
  },
  {
    uid: 'usr-grace',
    name: 'Grace Wanjiru',
    role: 'patient',
    email: 'grace.wanjiru@gmail.com',
    phone: '0722 334 455',
    patientRegNo: 'PT-2026-0114',
    facility: 'Moi Teaching & Referral Hospital',
    createdAt: 1726980000000,
    password: 'Password123!',
  },
  {
    uid: 'usr-peter',
    name: 'Peter Kipchoge',
    role: 'patient',
    email: 'peter.kipchoge@gmail.com',
    phone: '0733 445 566',
    patientRegNo: 'PT-2026-0205',
    facility: 'Moi Teaching & Referral Hospital',
    createdAt: 1726980000000,
    password: 'Password123!',
  },
  {
    uid: 'usr-mercy',
    name: 'Mercy Cherono',
    role: 'patient',
    email: 'mercy.cherono@gmail.com',
    phone: '0744 556 677',
    patientRegNo: 'PT-2026-0312',
    facility: 'Moi Teaching & Referral Hospital',
    createdAt: 1726980000000,
    password: 'Password123!',
  },
  {
    uid: 'usr-brian',
    name: 'Brian Otieno',
    role: 'patient',
    email: 'brian.otieno@gmail.com',
    phone: '0755 667 788',
    patientRegNo: 'PT-2026-0450',
    facility: 'Moi Teaching & Referral Hospital',
    createdAt: 1726980000000,
    password: 'Password123!',
  },
];

async function seed() {
  console.log(`\n🌱 Starting AfyaQueue Firestore & Auth Seeding [${PROJECT_ID}]...`);
  console.log(`   Firestore: http://${FIRESTORE_HOST}`);
  console.log(`   Auth:      http://${AUTH_HOST}\n`);

  // 1. Seed Auth accounts & Firestore `users` + `registry`
  console.log('👤 Seeding Demo Users & Hospital Registry...');
  for (const u of DEMO_USERS) {
    try {
      // Ensure user in Firebase Auth
      try {
        await auth.getUser(u.uid);
      } catch {
        await auth.createUser({
          uid: u.uid,
          email: u.email,
          displayName: u.name,
          phoneNumber: undefined,
          password: u.password ?? 'Password123!',
        });
      }

      // Set custom claims for role-based rules evaluation
      await auth.setCustomUserClaims(u.uid, { role: u.role });

      // Save user profile to Firestore
      const { password: _, ...profileData } = u;
      await db.collection('users').doc(u.uid).set(profileData, { merge: true });

      // If patient, register in patient registry index
      if (u.patientRegNo) {
        await db.collection('registry').doc(u.patientRegNo).set(
          {
            regNo: u.patientRegNo,
            uid: u.uid,
            email: u.email,
            patientName: u.name,
            phone: u.phone,
            facility: u.facility ?? 'Moi Teaching Hospital',
            createdAt: u.createdAt,
          },
          { merge: true }
        );
      }
      console.log(`   ✔ User: ${u.name} (${u.role}) -> ${u.email}`);
    } catch (err: any) {
      console.error(`   ❌ Failed to seed user ${u.email}:`, err.message);
    }
  }

  // 2. Seed Doctors
  console.log('\n🩺 Seeding Doctors...');
  for (const doc of INITIAL_DOCTORS) {
    await db.collection('doctors').doc(doc.id).set(doc, { merge: true });
    console.log(`   ✔ Doctor: ${doc.name} - ${doc.specialty} (${doc.facility})`);
  }

  // 3. Seed Queue Statuses (with bookedSlots mapping)
  console.log('\n⏱️ Seeding Live Queue Statuses...');
  for (const [key, qStatus] of Object.entries(INITIAL_QUEUE_STATUSES)) {
    // Build initial bookedSlots from INITIAL_APPOINTMENTS for this doctor and date
    const relevantAppts = INITIAL_APPOINTMENTS.filter(
      (a) => a.doctorId === qStatus.doctorId && a.date === qStatus.date && a.status === 'upcoming'
    );
    const bookedSlots: Record<string, string> = {};
    for (const a of relevantAppts) {
      bookedSlots[a.timeSlot] = a.id;
    }

    const payload = {
      ...qStatus,
      bookedSlots,
      lastUpdatedAt: Date.now(),
    };
    await db.collection('queueStatus').doc(key).set(payload, { merge: true });
    console.log(
      `   ✔ Queue: ${key} [Now Serving: #${payload.nowServing} | Last Token: #${payload.lastIssuedNumber}]`
    );
  }

  // 4. Seed Appointments
  console.log('\n📅 Seeding Appointments...');
  for (const appt of INITIAL_APPOINTMENTS) {
    await db.collection('appointments').doc(appt.id).set(appt, { merge: true });
    console.log(
      `   ✔ Appointment: ${appt.id} | Token #${appt.queueNumber} for ${appt.patientName} -> ${appt.doctorName} (${appt.timeSlot})`
    );
  }

  // 5. Seed Announcements
  console.log('\n📢 Seeding Hospital Announcements...');
  for (const ann of INITIAL_ANNOUNCEMENTS) {
    await db.collection('announcements').doc(ann.id).set(ann, { merge: true });
    console.log(`   ✔ Announcement: [${ann.urgency.toUpperCase()}] "${ann.text.slice(0, 40)}..."`);
  }

  // 6. Seed Ratings
  console.log('\n⭐ Seeding Doctor Ratings...');
  for (const rate of INITIAL_RATINGS) {
    await db.collection('ratings').doc(rate.id).set(rate, { merge: true });
    console.log(`   ✔ Rating: ${rate.stars}★ from ${rate.patientName} for ${rate.doctorName}`);
  }

  // 7. Seed Medical Records
  console.log('\n📋 Seeding Medical Records & Prescriptions...');
  for (const rec of INITIAL_MEDICAL_RECORDS) {
    await db.collection('medicalRecords').doc(rec.id).set(rec, { merge: true });
    console.log(`   ✔ Medical Record: ${rec.id} - ${rec.diagnosis}`);
  }

  console.log('\n🎉 AfyaQueue database seed completed successfully!\n');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal seed failure:', err);
    process.exit(1);
  });
