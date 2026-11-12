# AfyaQueue — Complete End-to-End System Architecture, Requirements & Expo Build Specification

**Project Name:** AfyaQueue (Healthcare Appointment & Queue Management Platform)  
**Target Platform:** Android & iOS via **Expo (React Native + TypeScript + Expo Router)**  
**Application Identifier:** `com.moiuniversity.afyaqueue`  
**Architecture Priority:**  
1. **Primary (Document-First):** Firebase Authentication + Cloud Firestore (Real-time `onSnapshot` listeners + Atomic `runTransaction` + Firestore Offline Persistence) + `@react-native-async-storage/async-storage`  
2. **Secondary (Relational Alternative):** Prisma ORM + PostgreSQL + WebSockets (Supabase Realtime / Socket.io) + `@react-native-async-storage/async-storage` + `expo-secure-store`

---

## 1. Executive Summary & Problem Statement

### 1.1 The Problem
Healthcare facilities frequently suffer from severe bottlenecks in patient flow and appointment coordination:
1. **Unpredictable Waiting Times:** Patients wait for long, unpredictable periods at hospitals and clinics with zero visibility into their position in the queue or estimated wait time.
2. **Manual Booking Friction:** Appointment booking is frequently done in person or by phone, which is slow, administrative-heavy, and prone to double-booking.
3. **Lack of Front-Desk Queue Tooling:** Reception staff have no simple, synchronized digital tool to manage the day's queue, register doctor/service availability, or summon the next patient efficiently.

### 1.2 The Solution
**AfyaQueue** is a real-time, dual-role mobile platform that digitizes the entire clinic appointment and waiting-room lifecycle:
* **For Patients:** Browse doctors and clinic services by specialty, view open time slots for a chosen date, book an appointment, automatically receive a guaranteed-unique digital queue number, and track live queue progress (`Your Number`, `Now Serving`, `People Ahead`, and `Estimated Wait`) in real time from anywhere.
* **For Clinic Staff (Receptionists):** View today's live queue per doctor, see `Serving` and `Waiting` summary counts, advance the queue with a single **"Call Next Patient"** action that updates all listening devices in under $1\text{--}2\text{ seconds}$, add new doctors/services with custom time slots, and broadcast facility announcements.

---

## 2. System Requirements & Prerequisites

### 2.1 Development Machine Requirements (Part A Parity)
| Requirement | Minimum Specification | Recommended Specification |
| :--- | :--- | :--- |
| **Operating System** | Windows 10 (64-bit), macOS 12, or 64-bit Linux | Windows 11 / macOS 14+ |
| **RAM** | $8\text{ GB}$ | $16\text{ GB}$ |
| **Disk Space** | $8\text{ GB}$ free | $20+\text{ GB}$ free (Node modules + Android SDK + Emulator images) |
| **Screen Resolution** | $1280 \times 800$ | $1920 \times 1080$ |
| **Node.js & Tooling** | Node.js LTS ($v20+$), Git, Watchman (macOS) | Node.js LTS + VS Code + Android Studio (for AVD Emulator) |
| **Target Android SDK** | Minimum SDK: API 24 (Android 7.0 — covers $>95\%$ of devices) | Target/Compile SDK: API 34+ (Android 14) |

---

## 3. Complete System Architecture & Persistence Strategy

### 3.1 Priority 1: Document-First Architecture (Firebase + AsyncStorage + Firestore Cache)
AfyaQueue is designed as a reactive mobile client communicating with Firebase Backend-as-a-Service (BaaS) over HTTPS/WSS. The defining architectural characteristic of AfyaQueue is that **two distinct user roles (Patient and Receptionist) observe and mutate the same shared state in real time without polling or manual screen refreshes**.

```
+---------------------------------------------------------------------------------------+
|                          EXPO MOBILE CLIENT (React Native / TS)                       |
|                                                                                       |
|  +-------------------+  +-------------------+  +-------------------+  +------------+  |
|  | Auth & Onboarding |  | Patient Experience|  | Live Queue Engine |  | Staff Desk |  |
|  | - Splash Router   |  | - Home/Doctor List|  | - LiveQueueStatus |  | - Today's  |  |
|  | - Login           |  | - Doctor Detail   |  | - onSnapshot Hook |  |   Queue    |  |
|  | - Register        |  | - My Appointments |  | - Turn Alert UI   |  | - Add Doc  |  |
|  |   (Patient/Staff) |  | - Notifications   |  | - Active Queue    |  | - Broadcast|  |
|  +---------+---------+  +---------+---------+  +---------+---------+  +------+-----+  |
|            |                      |                      |                   |        |
|  +---------v----------------------v----------------------v-------------------v-----+  |
|  |                       LOCAL PERSISTENCE & OFFLINE LAYER                         |  |
|  |  1. @react-native-async-storage/async-storage:                                  |  |
|  |     - Persists Firebase Auth session tokens across app restarts                 |  |
|  |     - Caches User Role ("patient" | "staff") for instant Splash routing         |  |
|  |     - Caches active appointment pointer ({ doctorId, date, queueNumber })       |  |
|  |  2. Firestore Built-in Offline Cache (persistentLocalCache):                    |  |
|  |     - Keeps last known queue position, doctors, & appointments visible offline  |  |
|  +---------+----------------------+----------------------+-------------------+-----+  |
+------------|----------------------|----------------------|-------------------|--------+
             | HTTPS                | HTTPS (Transactions) | WSS (Real-Time)   | HTTPS / WSS
+------------v----------------------v----------------------v-------------------v--------+
|                          FIREBASE BACKEND (Google Cloud)                              |
|                                                                                       |
|  +------------------------+  +----------------------------+  +---------------------+  |
|  | Firebase Authentication|  | Cloud Firestore (NoSQL)    |  | Cloud Messaging     |  |
|  | - Email / Password     |  | - users/{uid}              |  | (FCM / Expo Push)   |  |
|  | - UID & Session Tokens |  | - doctors/{doctorId}       |  | - Turn Approaching  |  |
|  |                        |  | - appointments/{id}        |  |   Notifications     |  |
|  |                        |  | - queueStatus/{docId_date} |  | - Facility Alerts   |  |
|  |                        |  | - announcements/{id}       |  |                     |  |
|  +------------------------+  +----------------------------+  +---------------------+  |
+---------------------------------------------------------------------------------------+
```

#### Why This Persistence Strategy Is Optimal for Expo
1. **`@react-native-async-storage/async-storage` (Session & State Persistence):**
   * **Auth Persistence:** The Firebase JS SDK in React Native requires `AsyncStorage` passed to `initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })`. This guarantees the user stays logged in when the app is closed or backgrounded.
   * **Role & Active Queue Caching:** Stores `@afyaqueue:user_profile` (so the Splash screen knows whether to route to Patient Home or Staff Home immediately) and `@afyaqueue:active_queue` (so tapping the **Queue** bottom tab opens the patient's active queue immediately).
2. **Firestore Offline Cache (`persistentLocalCache`):**
   * Implements Part G.3 of the manual (*"Offline support using Firestore's built-in local cache so a patient's last known queue position remains visible during a brief connection drop"*).

---

### 3.2 Priority 2: Relational Alternative (Prisma + PostgreSQL + Realtime WebSockets)
If you deploy with **Prisma ORM and PostgreSQL** instead of Firebase:

```
+---------------------------------------------------------------------------------------+
|                          EXPO MOBILE CLIENT (React Native / TS)                       |
|  - Auth Tokens persisted in `expo-secure-store`                                       |
|  - Query Cache & Active Queue persisted in `@react-native-async-storage/async-storage`|
+-------------------+-----------------------------------+-------------------------------+
                    | HTTPS REST / tRPC                 | WSS (Socket.io / Supabase)
+-------------------v-----------------------------------v-------------------------------+
|                     NODE.JS API SERVER (Fastify / NestJS / Express)                   |
|  - JWT Auth Middleware (Role-based guards: Patient vs Staff)                          |
|  - Prisma Transaction Service (`prisma.$transaction` for atomic queue numbers)        |
|  - WebSocket Broadcaster (Emits `queueStatus:updated` to room `${doctorId}_${date}`)  |
+-------------------------------------------+-------------------------------------------+
                                            | TCP / Connection Pool
+-------------------------------------------v-------------------------------------------+
|                             POSTGRESQL DATABASE (Prisma)                              |
|  Tables: User | Doctor | Appointment | QueueStatus | Announcement | DoctorRating      |
+---------------------------------------------------------------------------------------+
```

---

## 4. End-to-End Functional & Non-Functional Requirements

### 4.1 Core Functional Requirements (Part C & Part D)

| Req ID | Module | Role | Detailed Specification |
| :--- | :--- | :--- | :--- |
| **FR-01** | **Splash & Auto-Routing** | Both | Display branded splash screen for $1.2\text{ seconds}$ on launch. Check authentication state: if unauthenticated, route to `Login`; if authenticated, fetch `users/{uid}.role` and route to `Patient Home` (`role == "patient"`) or `Staff Home` (`role == "staff"`). |
| **FR-02** | **User Registration** | Both | Allow users to toggle between `Patient` and `Staff` role chips, input Full Name, Patient Reg No. (e.g., `PT-2026-0142` for patients), Email, Phone Number, and Password ($\ge 6$ characters). Create auth account and save `User` document in `users/{uid}`. |
| **FR-03** | **Email/Password Login** | Both | Authenticate existing users via Email and Password, retrieve their role from `users/{uid}`, cache profile in `AsyncStorage`, and navigate to the role-appropriate home screen. Provide a `"Forgot password?"` reset trigger. |
| **FR-04** | **Doctor & Service Discovery** | Patient | Display personalized greeting (`"Hi {FirstName}"`), free-text search bar (filtering across doctor `name` and `specialty`), horizontal specialty filter chips (`All`, `Dental`, `Pediatrics`, `General Medicine`), and scrollable doctor cards. |
| **FR-05** | **Doctor Card Summary** | Patient | Each card displays the doctor's circular avatar, name, specialty, current date, availability badge (`Open`), count of remaining open slots (`6 slots left`), and a `Book Appointment` CTA. |
| **FR-06** | **Date & Open-Slot Selection** | Patient | On Doctor Detail, display specialty, facility (`Moi Teaching Hospital`), `Available today` badge, horizontal upcoming date picker, and time slot grid. **Booked slots for the selected doctor and date must be dynamically filtered out so only open slots are bookable.** |
| **FR-07** | **Atomic Queue Booking** | Patient | Tapping `Confirm Booking` executes an atomic database transaction on `queueStatus/${doctorId}_${date}`: reads `lastIssuedNumber`, increments by $1$, writes the updated `QueueStatus` and new `Appointment` document together, and navigates to `Live Queue Status`. |
| **FR-08** | **Live Queue Status Screen** | Patient | Subscribes via real-time snapshot listener to `queueStatus/${doctorId}_${date}`. Displays `YOUR NUMBER`, `Now serving`, `Ahead of you`, and `Estimated wait` ($\approx \text{ahead} \times 5\text{ mins}$). Updates automatically within $1\text{--}2\text{s}$ when staff advances the queue. |
| **FR-09** | **Turn Reached Alert** | Patient | When $\text{myQueueNumber} \le \text{nowServing}$, display a high-visibility callout banner: *"It's your turn — please proceed to the doctor's office"*. |
| **FR-10** | **My Appointments** | Patient | Display patient's bookings split into `Upcoming` (`status == "upcoming"`) and `Past` (`status == "completed"` or `"cancelled"`) tabs, ordered by `createdAt` descending. Tapping an upcoming card opens its `Live Queue Status`. |
| **FR-11** | **Cancel & Reschedule** | Patient | Upcoming appointment cards provide `Cancel` (updates `status` to `"cancelled"`) and `Reschedule` (cancels old appointment and runs the booking transaction for a new date/time slot). |
| **FR-12** | **Staff Today's Queue** | Staff | Display doctor selector tabs/dropdown, real-time `Serving` and `Waiting` summary counters, and a live-updating list of today's upcoming appointments ordered ascending by `queueNumber`. Highlight the active row (`queueNumber == nowServing`) with a `NOW` badge. |
| **FR-13** | **Call Next Patient** | Staff | Tapping `Call Next Patient` executes an atomic transaction incrementing `nowServing` by $1$ on `queueStatus/${doctorId}_${today}`, optionally marking the previous appointment `"completed"`, and immediately syncing to all listening patient and staff devices. |
| **FR-14** | **Add Doctor / Service** | Staff | Allow staff to input Doctor/Service Name, Specialty, Facility, Available Date, and toggleable Time Slot chips (`09:00`, `09:30`, `10:00`, `10:30`, `11:00`, `11:30`, etc.), writing a new document to `doctors`. |

### 4.2 Extension & Stretch Goal Requirements (Part G)

| Req ID | Feature | Detailed Specification |
| :--- | :--- | :--- |
| **FR-15** | **Push Notifications (G.1)** | Register device push token (`fcmToken` / `expoPushToken`) and store it in `users/{uid}`. Notify the patient when their turn is approaching ($\text{queueNumber} - \text{nowServing} \le 2$) or when $\text{queueNumber} == \text{nowServing}$. |
| **FR-16** | **Facility Announcements (G.2)** | Staff can post broadcast notices to the `announcements` collection. Patients see the latest $5$ announcements in real time at the top of the Home screen and in the Notifications tab. |
| **FR-17** | **Doctor Ratings (G.3)** | After an appointment is marked `"completed"`, allow patients to submit a $1\text{--}5$ star rating and optional comment under `doctors/{doctorId}/ratings`. |
| **FR-18** | **Dynamic Wait Time (G.3)** | Calculate estimated wait time using each doctor's historical average consultation duration ($T_{\text{avg}}$) rather than a hardcoded $5$-minute constant. |
| **FR-19** | **Cursor Pagination (G.3)** | Support paginated loading (`startAfter` cursor in Firestore / `cursor` in Prisma) when appointment history exceeds $50$ records. |

---

## 5. Data Model & Database Schemas

### 5.1 Why the Data Model Is Normalized This Way (Part C.4 Rationale)
1. **Referenced IDs (`doctorId`, `patientId`) over Full Embedding:** An appointment stores `doctorId` and `patientId` (alongside display snapshots `doctorName` and `patientName`) so a doctor's profile, photo, or available slots can be updated without rewriting every historical appointment document.
2. **Separating `queueStatus` as a "Hot" Document:** The `queueStatus` collection holds one tiny, frequently updated document per doctor per day (`${doctorId}_${date}`). Separating this fast-changing counter from the much larger `appointments` collection ensures the real-time listener on the patient's phone is instantaneous and consumes minimal bandwidth.

### 5.2 Complete TypeScript Data Interfaces (`src/types/models.ts`)

```typescript
// src/types/models.ts

export type UserRole = 'patient' | 'staff';

export type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled';

export interface User {
  uid: string;
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  patientRegNo?: string; // e.g., "PT-2026-0142"
  fcmToken?: string;     // Part G.1 Push notification token
  createdAt: number;     // Epoch ms (System.currentTimeMillis() parity)
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;            // e.g., "General Medicine", "Dental", "Pediatrics"
  facility: string;             // e.g., "Moi Teaching Hospital"
  availableDate?: string;       // e.g., "2026-09-22"
  availableSlots: string[];     // e.g., ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"]
  photoUrl: string;
  avgConsultationMins?: number; // Default: 5 minutes (Part G.3 dynamic wait time)
  ratingAvg?: number;           // Part G.3 doctor ratings
  ratingCount?: number;
  createdAt: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty?: string;
  facility?: string;
  date: string;                 // "YYYY-MM-DD" (e.g., "2026-09-22")
  timeSlot: string;             // "HH:mm" (e.g., "09:30")
  queueNumber: number;          // 1-based sequential number assigned via transaction
  status: AppointmentStatus;    // "upcoming" | "completed" | "cancelled"
  createdAt: number;
}

export interface QueueStatus {
  doctorId: string;
  date: string;                 // "YYYY-MM-DD"
  lastIssuedNumber: number;     // Incremented each time a new appointment is booked
  nowServing: number;           // Updated by staff's "Call Next Patient" action
  lastUpdatedAt?: number;       // Used to compute rolling average consultation time
}

export interface Announcement {
  id: string;
  text: string;                 // e.g., "Dr. Otieno is unavailable this afternoon"
  postedBy: string;
  createdAt: number;
}

export interface DoctorRating {
  id: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  appointmentId: string;
  stars: number;                // 1 to 5
  comment?: string;
  createdAt: number;
}
```

### 5.3 Priority 1: Cloud Firestore Schema & Composite Indexes

```
AfyaQueue - Firestore Data Model
+-------------------------+     +-------------------------+     +-------------------------+     +-------------------------+
| users / {uid}           |     | doctors / {doctorId}    |     | appointments / {id}     |     | queueStatus / {id}      |
+-------------------------+     +-------------------------+     +-------------------------+     +-------------------------+
| uid: string             |     | id: string              |     | id: string              |     | (id = doctorId_date)    |
| name: string            |     | name: string            |     | patientId: string ----->|     | doctorId: string        |
| role: "patient"|"staff" |     | specialty: string       |     | patientName: string     |     | date: string            |
| email: string           |     | facility: string        |     | doctorId: string ------>|     | lastIssuedNumber: int   |
| phone: string           |     | availableSlots: array   |     | doctorName: string      |     | nowServing: int         |
| patientRegNo: string    |     | photoUrl: string        |     | date: string            |     +-------------------------+
| fcmToken: string        |     | avgConsultationMins: int|     | timeSlot: string        |
| createdAt: number       |     | createdAt: number       |     | queueNumber: int        |     +-------------------------+
+-------------------------+     +-------------------------+     | status: string          |     | announcements / {id}    |
                                                                | createdAt: number       |     +-------------------------+
                                                                +-------------------------+     | id: string              |
                                                                                                | text: string            |
                                                                                                | postedBy: string        |
                                                                                                | createdAt: number       |
                                                                                                +-------------------------+
```

#### `firestore.indexes.json` (Deploy via `firebase deploy --only firestore:indexes`)
```json
{
  "indexes": [
    {
      "collectionGroup": "appointments",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "patientId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "appointments",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "doctorId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "queueNumber", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

### 5.4 Priority 2: Prisma + PostgreSQL Schema (`prisma/schema.prisma`)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  patient
  staff
}

enum AppointmentStatus {
  upcoming
  completed
  cancelled
}

model User {
  uid          String         @id @default(uuid())
  name         String
  role         Role           @default(patient)
  email        String         @unique
  passwordHash String
  phone        String
  patientRegNo String?
  fcmToken     String?
  createdAt    DateTime       @default(now())
  appointments Appointment[]
  ratings      DoctorRating[]

  @@index([email])
}

model Doctor {
  id                  String         @id @default(uuid())
  name                String
  specialty           String
  facility            String         @default("Moi Teaching Hospital")
  availableDate       String?
  availableSlots      String[]
  photoUrl            String         @default("")
  avgConsultationMins Int            @default(5)
  ratingAvg           Float          @default(5.0)
  ratingCount         Int            @default(0)
  createdAt           DateTime       @default(now())
  appointments        Appointment[]
  queueStatuses       QueueStatus[]
  ratings             DoctorRating[]

  @@index([specialty])
  @@index([name])
}

model Appointment {
  id          String            @id @default(uuid())
  patientId   String
  patientName String
  doctorId    String
  doctorName  String
  date        String            // "YYYY-MM-DD"
  timeSlot    String            // "HH:mm"
  queueNumber Int
  status      AppointmentStatus @default(upcoming)
  createdAt   DateTime          @default(now())

  patient     User              @relation(fields: [patientId], references: [uid], onDelete: Cascade)
  doctor      Doctor            @relation(fields: [doctorId], references: [id], onDelete: Cascade)

  @@unique([doctorId, date, queueNumber])
  @@unique([doctorId, date, timeSlot, status])
  @@index([patientId, status, createdAt(sort: Desc)])
  @@index([doctorId, date, status, queueNumber(sort: Asc)])
}

model QueueStatus {
  id               String   @id // "${doctorId}_${date}"
  doctorId         String
  date             String   // "YYYY-MM-DD"
  lastIssuedNumber Int      @default(0)
  nowServing       Int      @default(0)
  updatedAt        DateTime @updatedAt

  doctor           Doctor   @relation(fields: [doctorId], references: [id], onDelete: Cascade)

  @@unique([doctorId, date])
}

model Announcement {
  id        String   @id @default(uuid())
  text      String
  postedBy  String
  createdAt DateTime @default(now())

  @@index([createdAt(sort: Desc)])
}

model DoctorRating {
  id            String   @id @default(uuid())
  doctorId      String
  patientId     String
  patientName   String
  appointmentId String   @unique
  stars         Int
  comment       String?
  createdAt     DateTime @default(now())

  doctor        Doctor   @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  patient       User     @relation(fields: [patientId], references: [uid], onDelete: Cascade)

  @@index([doctorId, createdAt(sort: Desc)])
}
```

---

## 6. Core Algorithms, Concurrency & Dataflow

### 6.1 Queue Position & Wait-Time Mathematical Formulas
Given a patient's assigned queue number $Q_{\text{patient}}$, the clinic's live serving number $Q_{\text{serving}}$, and the doctor's average consultation duration $T_{\text{avg}}$ (default $5\text{ minutes}$):

1. **Patients Ahead of You ($N_{\text{ahead}}$):**
   $$N_{\text{ahead}} = \max(0, Q_{\text{patient}} - Q_{\text{serving}} - 1)$$
   *Verification against Manual (Figure D.6):* When $Q_{\text{patient}} = 18$ and $Q_{\text{serving}} = 12$:
   $$N_{\text{ahead}} = \max(0, 18 - 12 - 1) = 5\text{ people}$$

2. **Estimated Wait Time ($\text{ETA}_{\text{minutes}}$):**
   $$\text{ETA}_{\text{minutes}} = N_{\text{ahead}} \times T_{\text{avg}}$$
   *Verification against Manual (Figure D.6):* With $N_{\text{ahead}} = 5$ and $T_{\text{avg}} = 5\text{ mins}$:
   $$\text{ETA}_{\text{minutes}} = 5 \times 5 = 25\text{ minutes}$$

3. **Active Turn Condition ($\text{isMyTurn}$):**
   $$\text{isMyTurn} = (Q_{\text{patient}} > 0) \land (Q_{\text{patient}} \le Q_{\text{serving}})$$

4. **Staff Waiting Counter ($N_{\text{waiting}}$ on Staff Home):**
   $$N_{\text{waiting}} = \text{count}(\{ a \in \text{Appointments}_{\text{today}} \mid a.\text{status} = \text{"upcoming"} \land a.\text{queueNumber} > Q_{\text{serving}} \})$$

5. **Open Slots Filter (Doctor Detail Screen — Figure D.4):**
   $$\text{OpenSlots}(d, \text{date}) = d.\text{availableSlots} \setminus \{ a.\text{timeSlot} \mid a \in \text{Appointments}(d, \text{date}) \land a.\text{status} = \text{"upcoming"} \}$$

---

## 7. Complete UI/UX Strategy & Design System

### 7.1 Branding & Adaptive Icon Specification (Part D.1)
* **Adaptive Launcher Icon:**
  * **Foreground Layer:** White medical cross glyph (`+`) centered inside the safe zone.
  * **Background Layer:** Solid AfyaQueue Green (`#1E7A46`) or Royal Blue (`#2752B7`).
* **Color Palette (`src/constants/theme.ts`):**

```typescript
// src/constants/theme.ts
export const COLORS = {
  brandGreen: '#1E7A46',       // res/values/colors.xml brand_green
  brandGreenSoft: '#E6F4EC',   // Soft pill background for "Open", "Available today", "Now serving"
  brandAccent: '#C1541A',      // res/values/colors.xml brand_accent
  brandOrangeBtn: '#F27438',   // Primary CTA buttons (Log In, Create Account, Confirm Booking, Call Next)
  brandNavy: '#16264A',        // res/values/colors.xml brand_navy (headings & numbers)
  brandRoyalBlue: '#2752B7',   // Splash bg, Live Queue header, selected date/time chips, "NOW" badge
  brandBlueSoft: '#EBF1FF',    // Giant queue circle fill, active staff queue row bg, "Book Appointment" btn
  background: '#F8FAFC',       // Screen background
  card: '#FFFFFF',             // Card surface
  border: '#E2E8F0',           // 1px card & input border
  textPrimary: '#16264A',
  textSecondary: '#64748B',
  danger: '#DC2626',           // Cancel appointment action
};
```

### 7.2 Screen-by-Screen UI & Interaction Checklist

| Screen # | Screen Name | Route Path | Key UI Elements & Interactions |
| :--- | :--- | :--- | :--- |
| **1** | **Splash Screen** | `app/index.tsx` | Full-screen `#2752B7` background, white medical cross `+`, `"AfyaQueue"`, `"Skip the wait. See a doctor."`. Auto-routes after $1200\text{ms}$. |
| **2** | **Login Screen** | `app/(auth)/login.tsx` | `"Welcome back"`, `"Sign in to continue"`, Email input, Password input, orange `"Log In"` button, `"Forgot password?"` action, `"Don't have an account? Register"` footer. |
| **3** | **Register Screen** | `app/(auth)/register.tsx` | `"Create account"`, `Patient` / `Staff` toggle chips, `Full name`, `Patient reg. no.` (`PT-2026-0142`), `Email`, `Phone` (`0712 345 678`), `Password`, orange `"Create Account"` button. |
| **4** | **Patient Home** | `app/(patient)/index.tsx` | `"Hi {Name}"`, notification bell icon, live Facility Announcements banner, `"Search doctor, specialty..."` input, horizontal specialty filter chips (`All`, `Dental`, `Pediatrics`), scrollable Doctor cards, and 5-tab Bottom Navigation (`Home`, `Appointments`, `Queue`, `Notifications`, `Profile`). |
| **5** | **Doctor Detail / Book** | `app/(patient)/doctor/[id].tsx` | Back button, circular stethoscope avatar, doctor name, `"General Medicine • Moi Teaching Hospital"`, `"✓ Available today"` pill, horizontal date strip (`Mon 22`, `Tue 23`...), 3-column open time-slot grid (`09:00`, `09:30`...), orange `"Confirm Booking"` button. |
| **6** | **My Appointments** | `app/(patient)/appointments.tsx` | Segmented toggle (`Upcoming` vs `Past`), appointment cards showing doctor name, date/time, queue number badge, status chip, and `Reschedule` / `Cancel` actions on upcoming cards. |
| **7** | **Live Queue Status** | `app/(patient)/queue-status.tsx` | Blue header (`Live Queue Status`, doctor name & specialty), giant bordered circle (`YOUR NUMBER`, `18`), `Now serving` green card (`12`), `Ahead of you` gray card (`5 people`), `Estimated wait` (`~ 25 minutes`), and green `"It's your turn"` banner when $\text{myQueueNumber} \le \text{nowServing}$. |
| **8** | **Staff Today's Queue** | `app/(staff)/index.tsx` | `"Today's Queue"`, doctor & date subtitle, doctor selector strip, `Serving` (`12`) and `Waiting` (`6`) summary cards, ordered patient rows (`11 Faith N.`, `12 Grace Wanjiru [NOW]`, `13 Peter K.`), header action to `+ Add Doctor` / `Broadcast`, and sticky orange `"Call Next Patient"` button. |
| **9** | **Add Doctor / Service** | `app/(staff)/add-doctor.tsx` | Inputs for `Doctor / service name`, `Specialty`, `Facility`, `Available date`, 3-column toggleable time slot chips, and green `"Save Doctor"` button. |
| **10** | **Announcements / Alerts** | `app/(patient)/notifications.tsx` & `app/(staff)/announcements.tsx` | Live feed of clinic announcements ordered newest-first; Staff screen includes input form to post new announcements. |

---

## 8. Complete End-to-End Implementation Blueprint (Expo + TypeScript)

### 8.1 Authentication Context & Role Router (`src/context/AuthContext.tsx`)
Handles Firebase Auth state, looks up the user's `role` in `users/{uid}`, caches the profile in `AsyncStorage`, and provides sign-in, registration, password reset, and sign-out methods.

```typescript
// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db, USER_PROFILE_STORAGE_KEY } from '../lib/firebase';
import { User, UserRole } from '../types/models';

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  registerUser: (params: {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: UserRole;
    patientRegNo?: string;
  }) => Promise<User>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState<boolean>(true);

  useEffect(() => {
    // Load cached user profile immediately for fast cold start
    AsyncStorage.getItem(USER_PROFILE_STORAGE_KEY).then((cached) => {
      if (cached) {
        try {
          setUser(JSON.parse(cached));
        } catch {}
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        await AsyncStorage.removeItem(USER_PROFILE_STORAGE_KEY);
        setInitializing(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const profile = userDoc.data() as User;
          setUser(profile);
          await AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
        }
      } catch (err) {
        console.warn('AfyaQueue: Failed to fetch user profile, using cached profile', err);
      } finally {
        setInitializing(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<User> => {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password.trim());
    const uid = credential.user.uid;
    const userDoc = await getDoc(doc(db, 'users', uid));

    const profile: User = userDoc.exists()
      ? (userDoc.data() as User)
      : {
          uid,
          name: credential.user.displayName || 'Patient',
          role: 'patient',
          email: email.trim(),
          phone: '',
          createdAt: Date.now(),
        };

    setUser(profile);
    await AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    return profile;
  };

  const registerUser = async (params: {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: UserRole;
    patientRegNo?: string;
  }): Promise<User> => {
    const credential = await createUserWithEmailAndPassword(
      auth,
      params.email.trim(),
      params.password.trim()
    );
    await updateProfile(credential.user, { displayName: params.name.trim() });

    const newUser: User = {
      uid: credential.user.uid,
      name: params.name.trim(),
      role: params.role,
      email: params.email.trim(),
      phone: params.phone.trim(),
      patientRegNo: params.patientRegNo?.trim() || '',
      createdAt: Date.now(),
    };

    await setDoc(doc(db, 'users', newUser.uid), newUser);
    setUser(newUser);
    await AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(newUser));
    return newUser;
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    await AsyncStorage.removeItem(USER_PROFILE_STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, initializing, signIn, registerUser, resetPassword, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

---

### 8.2 Doctor Service & Open-Slot Filtering (`src/services/doctorService.ts`)
Implements Doctor listing, Staff Doctor creation (Part D.9), and dynamic filtering of already-booked time slots (Figure D.4 requirement: *"Only open slots are shown; booked slots disappear"*).

```typescript
// src/services/doctorService.ts
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Appointment, Doctor } from '../types/models';

export async function fetchAllDoctors(): Promise<Doctor[]> {
  const q = query(collection(db, 'doctors'), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    ...(d.data() as Doctor),
    id: d.id,
  }));
}

export async function fetchDoctorById(doctorId: string): Promise<Doctor | null> {
  const snap = await getDoc(doc(db, 'doctors', doctorId));
  if (!snap.exists()) return null;
  return { ...(snap.data() as Doctor), id: snap.id };
}

export async function fetchOpenSlotsForDoctorAndDate(
  doctor: Doctor,
  date: string
): Promise<string[]> {
  const q = query(
    collection(db, 'appointments'),
    where('doctorId', '==', doctor.id),
    where('date', '==', date),
    where('status', '==', 'upcoming')
  );
  const snapshot = await getDocs(q);
  const bookedSlots = new Set(
    snapshot.docs.map((docSnap) => (docSnap.data() as Appointment).timeSlot)
  );

  return (doctor.availableSlots || []).filter((slot) => !bookedSlots.has(slot));
}

export async function createDoctorService(params: {
  name: string;
  specialty: string;
  facility: string;
  availableDate: string;
  availableSlots: string[];
  photoUrl?: string;
}): Promise<string> {
  const newDoctor: Omit<Doctor, 'id'> = {
    name: params.name.trim(),
    specialty: params.specialty.trim(),
    facility: params.facility.trim() || 'Moi Teaching Hospital',
    availableDate: params.availableDate,
    availableSlots: params.availableSlots,
    photoUrl: params.photoUrl || '',
    avgConsultationMins: 5,
    createdAt: Date.now(),
  };

  const docRef = await addDoc(collection(db, 'doctors'), newDoctor);
  return docRef.id;
}
```

---

### 8.3 Atomic Booking, Rescheduling & Active Queue Persistence (`src/services/bookingService.ts`)
Implements Part D.5 (`DoctorDetailActivity.kt`) and Part D.6 (`MyAppointmentsActivity.kt`), plus caches the active appointment pointer in `AsyncStorage` so the patient can jump straight to their live queue from the Bottom Navigation bar at any time.

```typescript
// src/services/bookingService.ts
import {
  collection,
  doc,
  runTransaction,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  DocumentSnapshot,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../lib/firebase';
import { getQueueDocId } from '../lib/dateUtils';
import { Appointment, Doctor, QueueStatus } from '../types/models';

export const ACTIVE_QUEUE_STORAGE_KEY = '@afyaqueue:active_queue';

export interface ActiveQueuePointer {
  appointmentId: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  date: string;
  queueNumber: number;
}

export async function bookAppointmentTransaction(params: {
  patientId: string;
  patientName: string;
  doctor: Doctor;
  date: string;
  timeSlot: string;
}): Promise<ActiveQueuePointer> {
  const { patientId, patientName, doctor, date, timeSlot } = params;

  const queueDocId = getQueueDocId(doctor.id, date);
  const queueStatusRef = doc(db, 'queueStatus', queueDocId);
  const appointmentRef = doc(collection(db, 'appointments'));

  const queueNumber = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(queueStatusRef);
    const currentLast = snapshot.exists()
      ? (snapshot.data() as QueueStatus).lastIssuedNumber ?? 0
      : 0;
    const currentNowServing = snapshot.exists()
      ? (snapshot.data() as QueueStatus).nowServing ?? 0
      : 0;

    const nextNumber = currentLast + 1;

    transaction.set(queueStatusRef, {
      doctorId: doctor.id,
      date,
      lastIssuedNumber: nextNumber,
      nowServing: currentNowServing,
      lastUpdatedAt: Date.now(),
    });

    const appointmentData: Appointment = {
      id: appointmentRef.id,
      patientId,
      patientName,
      doctorId: doctor.id,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialty,
      facility: doctor.facility || 'Moi Teaching Hospital',
      date,
      timeSlot,
      queueNumber: nextNumber,
      status: 'upcoming',
      createdAt: Date.now(),
    };

    transaction.set(appointmentRef, appointmentData);
    return nextNumber;
  });

  const activePointer: ActiveQueuePointer = {
    appointmentId: appointmentRef.id,
    doctorId: doctor.id,
    doctorName: doctor.name,
    doctorSpecialty: doctor.specialty,
    date,
    queueNumber,
  };

  await AsyncStorage.setItem(ACTIVE_QUEUE_STORAGE_KEY, JSON.stringify(activePointer));
  console.log(`AfyaQueue: appointments/${appointmentRef.id} created, queueNumber=${queueNumber}`);
  return activePointer;
}

export async function cancelAppointment(appointmentId: string): Promise<void> {
  await updateDoc(doc(db, 'appointments', appointmentId), {
    status: 'cancelled',
  });
}

export async function rescheduleAppointment(params: {
  oldAppointmentId: string;
  patientId: string;
  patientName: string;
  doctor: Doctor;
  newDate: string;
  newTimeSlot: string;
}): Promise<ActiveQueuePointer> {
  await cancelAppointment(params.oldAppointmentId);
  return bookAppointmentTransaction({
    patientId: params.patientId,
    patientName: params.patientName,
    doctor: params.doctor,
    date: params.newDate,
    timeSlot: params.newTimeSlot,
  });
}

// Supports Part G.3 Cursor Pagination
export async function fetchPatientAppointmentsPaginated(params: {
  patientId: string;
  status: 'upcoming' | 'completed';
  pageSize?: number;
  lastDoc?: DocumentSnapshot;
}): Promise<{ appointments: Appointment[]; lastVisible: DocumentSnapshot | null }> {
  const { patientId, status, pageSize = 20, lastDoc } = params;

  const baseConstraints: any[] = [
    where('patientId', '==', patientId),
    where('status', '==', status),
    orderBy('createdAt', 'desc'),
    limit(pageSize),
  ];

  if (lastDoc) {
    baseConstraints.push(startAfter(lastDoc));
  }

  const q = query(collection(db, 'appointments'), ...baseConstraints);
  const snapshot = await getDocs(q);

  const appointments = snapshot.docs.map((d) => ({
    ...(d.data() as Appointment),
    id: d.id,
  }));

  const lastVisible =
    snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

  return { appointments, lastVisible };
}
```

---

### 8.4 Staff Real-Time Queue Subscription & Call Next Patient (`src/hooks/useStaffQueue.ts`)
Implements Part D.8 (`StaffHomeActivity.kt`) with real-time snapshot listeners on both `appointments` and `queueStatus`, so multiple receptionists at the front desk stay in sync automatically.

```typescript
// src/hooks/useStaffQueue.ts
import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
   orderBy,
  query,
  runTransaction,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getQueueDocId, todayString } from '../lib/dateUtils';
import { Appointment, QueueStatus } from '../types/models';

export function useStaffQueue(doctorId: string | null, date: string = todayString()) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [nowServing, setNowServing] = useState<number>(0);
  const [lastIssuedNumber, setLastIssuedNumber] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!doctorId) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. Listen to today's upcoming appointments for this doctor ordered by queueNumber
    const apptQuery = query(
      collection(db, 'appointments'),
      where('doctorId', '==', doctorId),
      where('date', '==', date),
      where('status', '==', 'upcoming'),
      orderBy('queueNumber', 'asc')
    );

    const unsubAppointments = onSnapshot(apptQuery, (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        ...(d.data() as Appointment),
        id: d.id,
      }));
      setAppointments(list);
      setLoading(false);
    });

    // 2. Listen to live queueStatus document for this doctor & date
    const queueRef = doc(db, 'queueStatus', getQueueDocId(doctorId, date));
    const unsubQueue = onSnapshot(queueRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as QueueStatus;
        setNowServing(data.nowServing ?? 0);
        setLastIssuedNumber(data.lastIssuedNumber ?? 0);
      } else {
        setNowServing(0);
        setLastIssuedNumber(0);
      }
    });

    return () => {
      unsubAppointments();
      unsubQueue();
    };
  }, [doctorId, date]);

  const waitingCount = appointments.filter((a) => a.queueNumber > nowServing).length;

  const callNextPatient = async () => {
    if (!doctorId) return;
    const queueRef = doc(db, 'queueStatus', getQueueDocId(doctorId, date));

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(queueRef);
      const currentServing = snap.exists()
        ? (snap.data() as QueueStatus).nowServing ?? 0
        : 0;
      const currentLast = snap.exists()
        ? (snap.data() as QueueStatus).lastIssuedNumber ?? 0
        : 0;

      transaction.set(
        queueRef,
        {
          doctorId,
          date,
          lastIssuedNumber: currentLast,
          nowServing: currentServing + 1,
          lastUpdatedAt: Date.now(),
        },
        { merge: true }
      );
    });
  };

  return {
    appointments,
    nowServing,
    lastIssuedNumber,
    waitingCount,
    loading,
    callNextPatient,
  };
}
```

---

### 8.5 Extension Implementations (Part G.1, G.2, G.3)

#### A. Push Notifications Hook (`src/hooks/useNotifications.ts` — Part G.1)
Registers the device for push notifications, stores the token on `users/{uid}`, and triggers a local notification if the patient's live queue position reaches $\le 2$ people ahead while the app is open or backgrounded.

```typescript
// src/hooks/useNotifications.ts
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications(uid?: string) {
  useEffect(() => {
    if (!uid || !Device.isDevice) return;

    (async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;

      const tokenData = await Notifications.getExpoPushTokenAsync();
      await updateDoc(doc(db, 'users', uid), {
        fcmToken: tokenData.data,
      });
    })();
  }, [uid]);
}

export async function triggerTurnApproachingAlert(
  doctorName: string,
  aheadCount: number,
  isMyTurn: boolean
) {
  if (isMyTurn) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "It's Your Turn! 🩺",
        body: `Please proceed to ${doctorName}'s office now.`,
      },
      trigger: null,
    });
  } else if (aheadCount === 1) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Almost Your Turn (1 person ahead)',
        body: `Get ready to see ${doctorName}. You are next in line!`,
      },
      trigger: null,
    });
  }
}
```

#### B. Facility Announcements Service & Hook (`src/services/announcementService.ts` — Part G.2)
Implements the exact real-time broadcast board from Part G.2 (`orderBy("createdAt", DESCENDING).limit(5).addSnapshotListener(...)`).

```typescript
// src/services/announcementService.ts
import { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Announcement } from '../types/models';

export async function postFacilityAnnouncement(text: string, postedBy: string): Promise<void> {
  await addDoc(collection(db, 'announcements'), {
    text: text.trim(),
    postedBy,
    createdAt: Date.now(),
  });
}

export function useLiveAnnouncements(maxCount = 5): Announcement[] {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'announcements'),
      orderBy('createdAt', 'desc'),
      limit(maxCount)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        ...(d.data() as Announcement),
        id: d.id,
      }));
      setAnnouncements(items);
    });

    return () => unsubscribe();
  }, [maxCount]);

  return announcements;
}
```

#### C. Doctor Ratings Service (`src/services/ratingService.ts` — Part G.3)
Stores patient ratings as a subcollection `doctors/{doctorId}/ratings` after a completed appointment and updates the doctor's rolling rating average.

```typescript
// src/services/ratingService.ts
import { collection, doc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Doctor, DoctorRating } from '../types/models';

export async function submitDoctorRating(params: {
  doctorId: string;
  patientId: string;
  patientName: string;
  appointmentId: string;
  stars: number;
  comment?: string;
}): Promise<void> {
  const doctorRef = doc(db, 'doctors', params.doctorId);
  const ratingRef = doc(collection(db, 'doctors', params.doctorId, 'ratings'));

  await runTransaction(db, async (tx) => {
    const docSnap = await tx.get(doctorRef);
    const doctorData = docSnap.exists() ? (docSnap.data() as Doctor) : null;

    const currentCount = doctorData?.ratingCount ?? 0;
    const currentAvg = doctorData?.ratingAvg ?? 5.0;
    const newCount = currentCount + 1;
    const newAvg = Number(((currentAvg * currentCount + params.stars) / newCount).toFixed(2));

    const ratingRecord: DoctorRating = {
      id: ratingRef.id,
      doctorId: params.doctorId,
      patientId: params.patientId,
      patientName: params.patientName,
      appointmentId: params.appointmentId,
      stars: params.stars,
      comment: params.comment?.trim() || '',
      createdAt: Date.now(),
    };

    tx.set(ratingRef, ratingRecord);
    tx.update(doctorRef, {
      ratingAvg: newAvg,
      ratingCount: newCount,
    });
  });
}
```

---

## 9. Testing, Debugging & Troubleshooting Guide (Part E & Appendix B)

### 9.1 Unit Test for Queue Calculation & Booking Transaction (`__tests__/queueLogic.test.ts` — Part G.3)

```typescript
// __tests__/queueLogic.test.ts
describe('AfyaQueue Live Queue Mathematics', () => {
  const computeQueueMetrics = (myNumber: number, nowServing: number, avgMins = 5) => {
    const ahead = Math.max(0, myNumber - nowServing - 1);
    const eta = ahead * avgMins;
    const isMyTurn = myNumber > 0 && myNumber <= nowServing;
    return { ahead, eta, isMyTurn };
  };

  it('matches Figure D.6 example: Your Number = 18, Now Serving = 12 -> Ahead = 5, ETA = 25 mins', () => {
    const result = computeQueueMetrics(18, 12, 5);
    expect(result.ahead).toBe(5);
    expect(result.eta).toBe(25);
    expect(result.isMyTurn).toBe(false);
  });

  it('triggers isMyTurn when nowServing reaches or passes myQueueNumber', () => {
    const exactTurn = computeQueueMetrics(18, 18, 5);
    expect(exactTurn.ahead).toBe(0);
    expect(exactTurn.eta).toBe(0);
    expect(exactTurn.isMyTurn).toBe(true);
  });
});
```

### 9.2 Complete Troubleshooting Matrix (Part E.6 & Appendix B)

| Symptom / Error Message | Likely Cause | Actionable Fix |
| :--- | :--- | :--- |
| **App crashes or fails to connect to Firebase on launch** | Missing Firebase environment variables or mismatched `package` name in `app.json` / `google-services.json`. | Confirm `com.moiuniversity.afyaqueue` matches across `app.json` and Firebase Console, and verify `EXPO_PUBLIC_FIREBASE_*` keys are set. |
| **`PERMISSION_DENIED` when reading/writing Firestore** | Firestore Security Rules rejected the request, or user is not authenticated yet. | Confirm `auth.currentUser` is non-null before firing queries and check `firestore.rules` (Section 8.5). |
| **Live Queue Status screen never updates in real time** | Listening to a different document ID than the one Staff Home is updating, or using a one-off `getDoc()` instead of `onSnapshot()`. | Ensure `getQueueDocId(doctorId, date)` (`"${doctorId}_${date}"`) is used identically in Booking, Live Queue Status, and Staff Home. |
| **Two patients receive the exact same `queueNumber`** | Booking used a plain `getDoc()` followed by `setDoc()` instead of an atomic transaction. | Always read and increment `lastIssuedNumber` inside `runTransaction(db, ...)` (or `prisma.$transaction`). |
| **Doctor or Appointments list shows nothing** | Missing composite index on Firestore query combining `where()` and `orderBy()`, or no doctor records exist yet. | Check console logs for the direct Firebase Index creation URL or deploy `firestore.indexes.json` (Section 5.3). |
| **`auth/email-already-in-use` (`FirebaseAuthUserCollisionException`)** | User attempted to register with an email address that already has an account. | Catch the error code in `RegisterScreen` and show a friendly prompt offering to navigate to `LoginScreen`. |
| **User is logged out every time the Expo app restarts** | Firebase Auth initialized without `AsyncStorage` persistence. | Ensure `initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })` is configured in `src/lib/firebase.ts`. |
| **`INSTALL_FAILED_INSUFFICIENT_STORAGE` on Emulator** | The Android Virtual Device (AVD) is out of disk space. | In Android Studio Device Manager, click **Wipe Data** on the emulator or free storage on the physical phone. |

---

## 10. Google Play Store Release Tracks & Deployment (Part F)

### 10.1 Google Play Console Release Tracks (Part F.6)
| Release Track | Who Can Install | Typical Use Case |
| :--- | :--- | :--- |
| **Internal Testing** | A small list of up to $100$ testers added by email address. | Rapid verification with project teammates and instructors; available within minutes without waiting for full public review. |
| **Closed Testing** | A larger, invite-only group via email list or Google Group. | Classroom beta testing or piloting the app with clinic reception staff. |
| **Open Testing** | Anyone with the opt-in Play Store link. | Wider public beta to gather feedback on device compatibility before full release. |
| **Production** | Everyone on the Google Play Store. | Full public release after passing Google Play review. |

### 10.2 Keystore Security Warning (Part F.2)
> **Keep Your Signing Key Safe:** Whether generated locally as `afyaqueue-release-key.jks` or managed via `eas credentials`, back up your keystore file and passwords in at least two secure locations (e.g., a password manager and encrypted cloud storage). Google cannot recover a lost signing key, and losing it permanently blocks future updates to the same app listing.

---

## 11. Glossary & Project Assessment Rubric (Appendix C & D)

### 11.1 Platform Glossary
| Term | Native Android (Manual) | Expo / React Native & Prisma Equivalent |
| :--- | :--- | :--- |
| **Screen Component** | `Activity` (`AppCompatActivity`) | Expo Router Screen (`app/*.tsx` React Functional Component) |
| **Navigation Trigger** | `Intent(this, TargetActivity::class.java)` | `router.push('/target')` / `router.replace('/target')` |
| **Scrollable List** | `RecyclerView` + `RecyclerView.Adapter` | `FlatList` / `FlashList` with `renderItem` |
| **Real-Time Listener** | `addSnapshotListener` + `listenerRegistration?.remove()` | `onSnapshot(ref, callback)` + `useEffect` cleanup `() => unsubscribe()` |
| **Atomic Queue Increment** | `db.runTransaction { ... }` | `runTransaction(db, async (tx) => ...)` or `prisma.$transaction(...)` |
| **Local Persistence** | SharedPreferences / Firestore Disk Cache | `@react-native-async-storage/async-storage` + `persistentLocalCache()` |
| **Release Package** | `.apk` (Debug/Preview) / `.aab` (Play Store Bundle) | Built via `eas build -p android --profile preview|production` |

### 11.2 Complete Project Assessment & Acceptance Rubric (100% Breakdown)
Use this rubric to verify that your completed AfyaQueue build meets every academic and production requirement:

| Criterion | Weight | Verification Evidence |
| :--- | :--- | :--- |
| **1. Environment & Project Setup** | **10%** | App compiles cleanly and runs on an emulator and/or physical device via Expo. |
| **2. Authentication & Role Routing** | **15%** | Registration and login work for both `patient` and `staff` roles, persisted via `AsyncStorage`, routing each role to its dedicated home experience. |
| **3. Atomic Appointment Booking** | **20%** | Selecting a doctor, date, and open time slot assigns a sequential, non-duplicate `queueNumber` via an atomic transaction (verified by the back-to-back booking test TC-06). |
| **4. Live Queue Real-Time Updates** | **20%** | Live two-device demonstration showing `nowServing`, `Ahead of you`, `Estimated wait`, and the `"It's your turn"` banner updating within $1\text{--}2\text{ seconds}$ without manual refresh. |
| **5. Staff Queue Management & Add Doctor** | **10%** | Staff can view today's ordered queue, see `Serving`/`Waiting` counts, advance the queue via `Call Next Patient`, and add new doctors/services with time slots. |
| **6. Code Quality, Architecture & Persistence** | **10%** | Clean separation of TypeScript models, services, real-time hooks, listener cleanup on unmount, and security rules. |
| **7. QA Testing Checklist Completion** | **10%** | All 11 test cases in Section 9.2 verified and passing, including offline cache behavior and error handling. |
| **8. Extension Features (Part G)** | **5%** | Implementation of Push Notifications, Facility Announcements Board, Rescheduling, or Doctor Ratings. |