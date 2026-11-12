# AfyaQueue — Backend Architecture, Firestore Rules & Data Services

This document details the backend architecture, database schemas, atomic concurrency algorithms, security rules, and data layer services for **AfyaQueue** (Moi Teaching and Referral Hospital Outpatient & Queue Dispatch System).

---

## 1. System Overview

AfyaQueue employs a **Document-First Reactive Architecture** built on **Firebase Authentication** and **Cloud Firestore** (with the modular Firebase v13 JS SDK). The mobile client operates in real time across two synchronized user roles:
1. **Patients**: Discover doctors, select dates, reserve open time slots atomically, track real-time queue position with dynamic ETA calculations, and view medical records.
2. **Clinic Receptionists / Triage Nurses**: Monitor clinician queues, advance the active queue token ("Call Next Patient"), register visiting doctors, and broadcast hospital-wide announcements.

```
+------------------------------------------------------------------------------------+
|                             EXPO MOBILE CLIENT (SDK 58)                            |
|                                                                                    |
|  +--------------------+  +----------------------+  +----------------------------+  |
|  | Patient Experience |  | Live Queue Engine    |  | Staff Desk Operations      |  |
|  | - Doctor Discovery |  | - Circular Telemetry |  | - Real-time Queue Stream   |  |
|  | - Time Slot Grid   |  | - onSnapshot Hook    |  | - Call Next Dispatch       |  |
|  | - My Appointments  |  | - Turn Alert Banner  |  | - Facility Announcements   |  |
|  +---------+----------+  +----------+-----------+  +-------------+--------------+  |
|            |                        |                            |                 |
|  +---------v------------------------v----------------------------v--------------+  |
|  |                 LOCAL PERSISTENCE & DATA SERVICES LAYER                      |  |
|  |  - AsyncStorage: Auth Session & Active Queue Pointer Cache                   |  |
|  |  - src/services/bookingService.ts (Atomic runTransaction)                    |  |
|  |  - src/services/doctorService.ts  (Clinician listing & creation)             |  |
|  |  - src/services/authService.ts    (Email/RegNo + Password Auth)              |  |
|  +----------------------------------+-------------------------------------------+  |
+-------------------------------------|----------------------------------------------+
                                      | HTTPS / WebSocket (WSS)
+-------------------------------------v----------------------------------------------+
|                        CLOUD FIRESTORE & FIREBASE AUTH                             |
|                                                                                    |
|  - users/{uid}                     - queueStatus/{doctorId_date} (Hot Counters)    |
|  - patientRegistry/{regNo}         - appointments/{doctorId_date_queueNum}         |
|  - staffAllowlist/{email}          - announcements/{id}                            |
|  - doctors/{doctorId}              - ratings/{appointmentId}                       |
|                                    - medicalRecords/{id}                           |
+------------------------------------------------------------------------------------+
```

---

## 2. Cloud Firestore Collections & Schemas

### 2.1 `users/{uid}`
* **Purpose**: User profile and institutional role representation.
* **Access**: Owner-only read/update. Role modifications are strictly forbidden after creation.
* **Schema**:
  ```typescript
  interface User {
    uid: string;
    name: string;
    role: 'patient' | 'staff';
    email: string;
    phone: string;
    patientRegNo?: string;        // e.g. "PT-2026-0142"
    facility?: string;            // e.g. "Moi Teaching & Referral Hospital"
    notificationSettings?: {
      smsAlerts: boolean;
      pushNotifications: boolean;
      audioChimes: boolean;
      soundVolume: number;
    };
    expoPushToken?: string | null;
    createdAt: number;
    updatedAt?: number;
  }
  ```

### 2.2 `patientRegistry/{regNo}`
* **Purpose**: Maps hospital patient registration numbers (e.g. `PT-2026-0142`) to authenticated accounts so patients can sign in via their hospital ID.
* **Access**: Public unauthenticated `get` (single document lookup on login); authenticated creation during registration; updates and deletions denied.

### 2.3 `staffAllowlist/{email}`
* **Purpose**: Secure server-side allowlist of authorized MTRH staff emails (e.g. `@mtrh.go.ke`).
* **Access**: 100% denied to mobile clients (seeded only via Admin SDK).

### 2.4 `doctors/{doctorId}`
* **Purpose**: Clinician profiles, duty schedules, consultation fees, and real-time rating aggregates.
* **Access**: Read by all authenticated users. Created and updated by staff; patients may only update `rating`, `reviewCount`, and `lastRatingId` atomically when submitting visit feedback.

### 2.5 `queueStatus/{doctorId_date}` *(Hot Document)*
* **Purpose**: One lightweight counter document per clinician per clinic date (composite key: `${doctorId}_${date}`). Minimizes bandwidth and allows instantaneous client subscription without querying the large appointments table.
* **Schema**:
  ```typescript
  interface QueueStatus {
    doctorId: string;
    date: string;               // "YYYY-MM-DD"
    lastIssuedNumber: number;   // Incremented atomically upon each new booking
    nowServing: number;         // Incremented when staff calls the next patient
    bookedSlots: Record<string, string>; // e.g. { "09:30 AM": "doc-sarah_2026-09-22_18" }
    lastUpdatedAt?: number;
  }
  ```

### 2.6 `appointments/{appointmentId}`
* **Purpose**: Guaranteed sequential bookings with deterministic document IDs (`${doctorId}_${date}_${queueNumber}`).
* **Access**: Readable by the patient who owns the booking or any clinic staff member. Updates restricted to status transitions (`upcoming` -> `completed` / `cancelled`).

### 2.7 `announcements/{id}`
* **Purpose**: Hospital broadcast notices (e.g., pharmacy delays, triage updates).
* **Access**: Readable by all authenticated users; created and deleted only by staff.

### 2.8 `ratings/{appointmentId}` & `medicalRecords/{id}`
* **Purpose**: Patient visit feedback and clinical prescriptions/lab results.
* **Access**: Ratings created by patients for completed appointments; medical records authorable only by clinical staff.

---

## 3. Concurrency & Mathematical Formulas

The system implements the mathematical specification detailed in Section 6.1 of the architecture guidelines:

1. **People Ahead of You ($N_{\text{ahead}}$)**:
   $$\large N_{\text{ahead}} = \max(0, Q_{\text{patient}} - Q_{\text{serving}} - 1)$$
   *Example:* If your ticket is #18 and Doctor Sarah is serving #12:
   $$18 - 12 - 1 = 5 \text{ people ahead}$$

2. **Estimated Wait Time ($\text{ETA}$)**:
   $$\large \text{ETA}_{\text{minutes}} = N_{\text{ahead}} \times T_{\text{avg}}$$
   *Example:* For General Medicine ($T_{\text{avg}} = 5\text{ min}$): $5 \times 5 = 25\text{ minutes}$.

3. **Active Turn Condition**:
   $$\large \text{isPatientTurn} = (Q_{\text{patient}} > 0) \land (Q_{\text{patient}} = Q_{\text{serving}})$$

4. **Dynamic Open Slots Filtering**:
   $$\large \text{OpenSlots}(d, \text{date}) = d.\text{availableSlots} \setminus \{ a.\text{timeSlot} \mid a \in \text{Appointments}(d, \text{date}) \land a.\text{status} = \text{"upcoming"} \}$$

---

## 4. Security Rules Summary (`firestore.rules`)

All Firestore security rules are compiled into [firestore.rules](file:///home/elvin/Projects/tutorials/afyaque/firestore.rules).

| Collection | Action | Allowed Role | Key Validation Invariants |
| :--- | :--- | :--- | :--- |
| `users/{uid}` | `read` | Owner or Staff | Users see their own profile; staff can access for desk dispatch. |
| `users/{uid}` | `update` | Owner | `uid`, `email`, `role`, and `createdAt` are immutable. |
| `queueStatus/{id}` | `create/update` | Patient (Book) | `lastIssuedNumber == old + 1`, slot claimed in `bookedSlots`, appointment verified. |
| `queueStatus/{id}` | `update` | Patient (Cancel)| Removes slot from `bookedSlots`; cannot change `lastIssuedNumber` or `nowServing`. |
| `queueStatus/{id}` | `update` | Staff | May advance `nowServing` ($Q_{\text{serving}} \leftarrow Q_{\text{serving}} + 1$). |
| `appointments/{id}`| `create` | Patient / Staff | ID matches `${doctorId}_${date}_${queueNumber}`; queue status updated. |
| `appointments/{id}`| `update` | Patient | Status can only change from `upcoming` to `cancelled`. |
| `appointments/{id}`| `update` | Staff | Status can transition to `completed` or `cancelled`. |
| `doctors/{id}` | `update` | Patient (Rate) | Can only adjust rating aggregates (`rating`, `reviewCount`, `lastRatingId`). |
| `announcements/{id}`| `write`| Staff | Only staff members can post or dismiss broadcast notices. |
| `medicalRecords/{id}`| `write`| Staff | Clinical documentation cannot be forged or edited by patients. |

---

## 5. Local Emulation, Seeding & Testing

AfyaQueue supports full offline development using the **Firebase Local Emulator Suite**.

### 5.1 Starting the Emulators
```bash
# Starts Auth (9099), Firestore (8080), Functions (5001), and UI (4000)
npm run emulators
```

### 5.2 Seeding the Database
```bash
# Populates demo doctors, queues, announcements, and demo users
npm run seed
```

### 5.3 Automated Testing Suites
```bash
# 1. Run 31 Firestore security rules unit tests against the emulator
npm run test:rules

# 2. Run 11 queue mathematics specification unit tests
npm run test:math

# 3. TypeScript compilation & Expo linting
npx tsc --noEmit
npx expo lint
```
