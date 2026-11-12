# AfyaQueue — Architecture Implementation Progress & Production Roadmap Report

**Project:** AfyaQueue (Moi Teaching and Referral Hospital Outpatient & Queue Dispatch System)  
**Target Platform:** Mobile (Android & iOS) via Expo SDK 58 (React Native + TypeScript + Expo Router)  
**Application ID:** `com.moiuniversity.afyaqueue`  
**Design Reference:** `screen_designs/afyaqueue_clinical_motion/DESIGN.md` & 14 Screen Mockups  
**Verification Status:** `tsc --noEmit` Passed (0 errors) • `expo-doctor` Passed (20/20 checks passed) • Mathematical Specification Tests (11/11 passed)  

---

## 1. Architectural Foundation & Design System Alignment

AfyaQueue is built on an institutional healthcare design language (**AfyaQueue Clinical Motion**) tailored for Moi Teaching and Referral Hospital (MTRH Eldoret). The implementation balances clinical precision with modern consumer mobility:

### 1.1 Color Tokens & Semantic Roles
- **Brand Forest Green (`#1E7A46` / `#006032`):** Primary institutional brand anchor, operational readiness, verified medical practitioner badges, and positive active states.
- **Royal Blue (`#2752B7` / `#2E58BD`):** System-level context, active queue monitors, live session tokens, and informational focus states.
- **Vibrant Orange CTA (`#F27438` / `#C1541A`):** The exclusive conversion and dispatch trigger (reserved strictly for decisive actions: `Confirm Booking`, `Call Next Patient`, `Log In to AfyaQueue`).
- **Canvas Base Neutral (`#F8FAFC` / `#F7F9FB`):** Sanitized, glare-reducing clinical canvas.
- **Brand Navy (`#16264A`):** High-contrast typography and oversized numerical displays visible in outdoor hospital environments.
- **Soft Tonal Stratification:** Fills container backgrounds for "Now Serving" (`#E6F4EC`) and informational callouts/counters (`#EBF1FF`).

### 1.2 Typography & Custom Font Integration
- **Plus Jakarta Sans (Display, Headlines, Labels, Overlines):** 500 Medium, 600 SemiBold, 700 Bold, 800 ExtraBold.
- **Inter (Body Copy, Instructions, Dense Metadata):** 400 Regular, 500 Medium, 600 SemiBold, 700 Bold.
- **JetBrains Mono (Monospace Codes, Telemetry):** 500 Medium, 700 Bold.
- **Material Symbols Outlined & Filled:** Complete glyph map (`92KB` codepoint map in `src/components/ui/material-symbols-glyphs.json` + TTF asset files in `assets/fonts/`).

---

## 2. Completed Reusable Component Library (`src/components/ui/`)

All primitives are implemented to match the styling and geometry rules in `DESIGN.md`:

| Component | File Path | Description & Fidelity Characteristics |
| :--- | :--- | :--- |
| **`AppText`** | `src/components/ui/app-text.tsx` | Resolves custom font weight variants with Android font padding disabled (`includeFontPadding: false`) matching web designs. |
| **`PressableScale`** | `src/components/ui/pressable-scale.tsx` | Micro-interaction engine with active scale transitions (`active:scale-95` / `0.98`) and haptic tactile feedback. |
| **`Button`** | `src/components/ui/button.tsx` | Full-width and auto-width variants: `primary` (orange `#F27438`), `blue`, `green`, `rust`, `secondary`, `outline`, `danger`, `ghost`. Minimum height 48px. |
| **`Input` / `TextField`** | `src/components/ui/input.tsx` | Height 48px, leading Material Symbols icon, focus states, password visibility toggle button, prefix badge (`+254`), error caption. |
| **`Card` & `Divider`** | `src/components/ui/card.tsx` | Level-1 contained surface (pure white, 1px `#E2E8F0` hairline border, 12px radius, soft ambient bloom). |
| **`Badge` / `Pill`** | `src/components/ui/badge.tsx` | Full pill rounding (`rounded-full`), status variants: `success` (`#E6F4EC`), `info` (`#EBF1FF`), `warning`, `danger`, `royal`. |
| **`ScreenHeader`** | `src/components/ui/screen-header.tsx` | Top hospital affiliation bar (`MTRH Outpatient Portal`, pulsating `Triage Live` badge), back button, trailing actions. Supports dual styling: default surface and Deep Royal Blue `#2752B7` with subtitle telemetry matching `patient_live_queue_tracker`. |
| **`ModalSheet`** | `src/components/ui/modal-sheet.tsx` | Standard institutional bottom sheet primitive featuring 44px drag handle, title, optional leading circle icon, close button, body slot, and sticky footer action bar. |
| **`QueueCenterpiece`** | `src/components/ui/queue-centerpiece.tsx` | Signature component: 180px × 180px circular centerpiece with `#EBF1FF` fill, 4px `#2752B7` ring, giant display number `#18`, and alarm ETA subtitle. |
| **`TurnAlertBanner`** | `src/components/ui/turn-alert-banner.tsx` | Dual-mode: Upcoming warning vs persistent `#E6F4EC` pinned card with 1.5px `#1E7A46` border when turn is active (*"It's your turn — please proceed to Room 14"*). |
| **`BottomNavBar`** | `src/components/ui/bottom-nav-bar.tsx` | Fixed 5-tab dock (`Live Queue`, `Book`, `Records`, `Desk`, `Profile`) with active queue number pill badge (`18`) and normalized route group matching (`/discover`, `/`, `/(tabs)/discover`). |
| **`DoctorCard`** | `src/components/ui/doctor-card.tsx` | Horizontal doctor card with local circular avatar thumbnail, verified practitioner badge, fee (`KSh 500`), rating, remaining open slots counter (`6 slots left`), availability status, and booking trigger. |

---

## 3. Implemented Screen Matrix (14 Pixel-Perfect Workflows)

All 14 screens from the design mockups in `screen_designs/` have been constructed using Expo Router in `src/app/`:

| # | Screen Name | Design Mockup Directory | Expo Route | Implementation Status |
| :---: | :--- | :--- | :--- | :---: |
| **1** | **Splash & Token Router** | `the_vital_bypass_institutional_1.8s_splash_token_router` | `src/app/index.tsx` | **Done (100%)** |
| **2** | **Login Role Authentication** | `afyaqueue_login_role_authentication` | `src/app/auth/login.tsx` | **Done (100%)** |
| **3** | **Registration & Role Selection** | `afyaqueue_user_registration_role_selection` | `src/app/auth/register.tsx` | **Done (100%)** |
| **4** | **Patient Home & Doctor Discovery**| `patient_home_doctor_discovery` | `src/app/(tabs)/discover.tsx` | **Done (100%)** |
| **5** | **Doctor Detail & Time Slot Booking** | `doctor_detail_time_slot_booking` | `src/app/doctor/[id].tsx` | **Done (100%)** |
| **6** | **Patient Live Queue Tracker** | `patient_live_queue_tracker` | `src/app/(tabs)/queue.tsx` | **Done (100%)** |
| **7** | **My Appointments Upcoming & Past** | `my_appointments_upcoming_past` | `src/app/appointments/index.tsx` | **Done (100%)** |
| **8** | **Reschedule Appointment Modal Flow**| `reschedule_appointment_modal_flow` | `src/app/appointments/reschedule.tsx` | **Done (100%)** |
| **9** | **Doctor Rating & Visit Feedback** | `doctor_rating_visit_feedback` | `src/app/feedback/rating.tsx` | **Done (100%)** |
| **10**| **Patient Medical Records & Rx** | `patient_medical_records_prescriptions` | `src/app/(tabs)/records.tsx` | **Done (100%)** |
| **11**| **Staff Live Queue Management Desk**| `staff_live_queue_management_desk` | `src/app/(tabs)/desk.tsx` | **Done (100%)** |
| **12**| **Staff Add Doctor Service Desk** | `staff_add_doctor_service_desk` | `src/app/staff/add-doctor.tsx` | **Done (100%)** |
| **13**| **Facility Announcements Broadcast**| `clinic_facility_announcements_broadcasts` | `src/app/announcements/broadcast.tsx` | **Done (100%)** |
| **14**| **User Profile & Notifications** | `user_profile_notification_settings` | `src/app/(tabs)/profile.tsx` | **Done (100%)** |

---

## 4. State Management, Offline Persistence & Mathematical Core

### 4.1 Reactive Store & Concurrency Simulation (`src/store/app-context.tsx`)
- **Dual-Role Simulation:** Patients and Clinic Staff share synchronized in-memory and `@react-native-async-storage/async-storage` state.
- **Atomic Booking Logic:** Automatically computes consecutive unique queue numbers ($Q_{\text{next}} = Q_{\text{last}} + 1$), binds appointments to doctor and date, and persists the active pointer (`@afyaqueue:active_queue`).
- **Dynamic Slot Availability Formula 6.1.5:** Dynamically cross-references upcoming appointments for doctor and selected date, removing booked slots in real time.
- **Receptionist "Call Next Patient" Dispatch:** Front desk staff advance $Q_{\text{serving}}$ for the selected clinician's active clinic date, updating wait telemetry across patient views.
- **Rescheduling Workflow with Param Routing:** Accepts specific appointment IDs to reschedule any upcoming booking, releases the old token, and re-issues consecutive tokens.
- **Doctor Feedback with Param Routing:** Accepts specific doctor ID and appointment ID parameters to rate any visited clinician.

### 4.2 Mathematical Formulas (Section 6.1 Verification)
Automated test suite `scripts/verify-queue-math.test.ts` passed 11/11 assertions:
1. **Patients Ahead of You:** $N_{\text{ahead}} = \max(0, Q_{\text{patient}} - Q_{\text{serving}} - 1)$  
   *(Verified: $18 - 12 - 1 = 5$ people)*
2. **Estimated Wait Time:** $\text{ETA}_{\text{minutes}} = N_{\text{ahead}} \times T_{\text{avg}}$  
   *(Verified: $5 \times 5 = 25$ minutes)*
3. **Next in Line Boundary:** $Q_{\text{patient}} = 13, Q_{\text{serving}} = 12 \implies N_{\text{ahead}} = 0, \text{ETA} = 0\text{ min}$
4. **Active Turn Condition:** $\text{isPatientTurn} = (Q_{\text{patient}} > 0) \land (Q_{\text{patient}} = Q_{\text{serving}})$
5. **Already Served Condition:** $\text{isPatientTurnPast} = (Q_{\text{patient}} > 0) \land (Q_{\text{patient}} < Q_{\text{serving}})$
6. **Boundary with No Token:** $Q_{\text{patient}} = 0 \implies N_{\text{ahead}} = 0, \text{isPatientTurn} = \text{false}$
7. **Dynamic Wait Time (Pediatrics):** $T_{\text{avg}} = 7\text{ min}, N_{\text{ahead}} = 3 \implies \text{ETA} = 21\text{ min}$
8. **Staff Waiting Counter:** $N_{\text{waiting}} = \text{count}(\{ a \in \text{Appointments} \mid a.\text{status} = \text{"upcoming"} \land a.\text{queueNumber} > Q_{\text{serving}} \}) = 5$
9. **Open Slots Formula:** $\text{OpenSlots}(d, \text{date}) = d.\text{availableSlots} \setminus \{ a.\text{timeSlot} \mid a \in \text{Appointments}(d, \text{date}) \land a.\text{status} = \text{"upcoming"} \} = 3\text{ open slots}$
10. **Composite Firestore Document Key:** `doc-sarah-wanjiku_2026-09-22`
11. **Institutional Date Format:** `2026-09-22`

---

## 5. Comprehensive Done vs. Pending Audit

### ✅ What Has Been Completed (Done)
1. **Full Mobile Application Scaffold:** Initialized on Expo SDK 58, Expo Router, TypeScript, and React 19.
2. **Design Tokens & Typography Engine:** Colors, metrics, shadows, typography scale, and Material Symbols font glyph mapping.
3. **Bundled Image & Font Assets:** Local doctor avatar assets (`assets/images/doctors/`) and custom TTF fonts configured.
4. **12 Reusable UI Primitives:** `AppText`, `Button`, `Card`, `Divider`, `Input`, `Badge`, `ScreenHeader`, `ModalSheet`, `QueueCenterpiece`, `TurnAlertBanner`, `BottomNavBar`, `DoctorCard`.
5. **14 Pixel-Perfect Screen Implementations:** Fully routed and styled in matching fidelity to `screen_designs/`.
6. **Dynamic Real-Time Slot Filtering (Section 6.1.5):** Doctor detail dynamically checks upcoming appointments and excludes booked slots per date.
7. **Live Queue Telemetry in Appointments:** Dynamic computation of serving number, people ahead, and ETA.
8. **Multi-Clinician Stream Support on Staff Desk:** Clinic date matches clinician's active session rather than hardcoded string.
9. **Zero-Error Type Safety:** `node node_modules/typescript/bin/tsc --noEmit` compiles cleanly with zero diagnostics.
10. **Expo Project Health:** `npx expo-doctor` passed with 20/20 checks clean.
11. **Mathematical Verification:** Automated unit test suite verifying Section 6.1 queue formulas passed 11/11 checks.

---

### ⏳ What Remains Pending for Certified Cloud Production Readiness (Pending)

| Priority | Feature / Production Milestone | Target Solution | Pending Work Required |
| :---: | :--- | :--- | :--- |
| **P1** | **Live Cloud Firestore Integration** | Firebase JS SDK / Firestore Lite | Link `google-services.json` and `GoogleService-Info.plist`, configure `onSnapshot` real-time listeners to remote Firestore instead of local store. |
| **P1** | **Firebase Auth Cloud Verification** | Firebase Authentication | Connect SMS phone verification / email OTP verification with production MTRH domain whitelist. |
| **P2** | **Native Audio Chime Dispatch** | `expo-audio` | Play high-frequency 2-tone hospital chime when `isMyTurnActive` triggers or staff calls next patient. |
| **P2** | **Push Notification Service (FCM/APNs)** | `expo-notifications` | Register FCM push tokens on user login to notify patients when $N_{\text{ahead}} \le 2$ or turn is active while app is in background. |
| **P2** | **End-to-End Device Automation Tests** | Maestro / Detox | Multi-device automated test verifying that when Staff taps "Call Next Patient" on Device A, Patient Device B updates in under 2 seconds. |
| **P3** | **Biometric Native Authentication** | `expo-local-authentication` | Connect physical fingerprint / FaceID sensor for instant M-Pesa / Kenyan ID login bypass. |
| **P3** | **Production EAS Build & Signing** | EAS CLI (`eas build`) | Configure Android Keystore credentials and Apple Distribution Certificates for Google Play & App Store deployment. |
