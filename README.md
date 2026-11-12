# AfyaQueue 🩺

> **Real-Time Healthcare Appointment & Queue Management Platform for Moi Teaching & Referral Hospital (MTRH Eldoret).**  
> *"Skip the wait. See a doctor."*

AfyaQueue is an institutional mobile application built with **Expo SDK 58**, **React Native**, **TypeScript**, and **Expo Router**. It digitizes the patient appointment booking lifecycle, assigns guaranteed consecutive queue numbers, and provides synchronized real-time queue dispatching between patients and clinic reception staff.

---

## 🌟 Key Features

### For Patients
- **Doctor & Specialty Discovery:** Search clinicians across General Medicine, Pediatrics, Dental Surgery, ENT, etc.
- **Dynamic Time Slot Booking:** Automatically hides booked slots per clinician and date, assigning consecutive queue tokens.
- **Live Queue Tracker:** Real-time telemetry (`Your Number`, `Now Serving`, `People Ahead`, and dynamic `Estimated Wait`).
- **Turn Reached Alerts:** High-visibility banner and haptic feedback when your token is called to the consultation room.
- **My Appointments:** Manage upcoming and past clinic visits with rescheduling and cancellation workflows.
- **Medical Records & Prescriptions:** Track pharmacy tokens, triage vitals, and consultation slips.
- **Visit Rating & Feedback:** Submit verified 1–5 star reviews for visited physicians.

### For Clinic Staff (Receptionists & Triage Nurses)
- **Today's Live Queue Management:** Stream patients per physician, monitor `Serving` and `Waiting` metrics in real time.
- **Call Next Patient Dispatch:** Advance the active token with instant synchronization across all connected devices.
- **Add Doctor / Service Desk:** Register new clinic units, duty dates, and customize time slot allocations.
- **Facility Announcements Broadcast:** Post real-time urgent updates across outpatient halls and patient cards.

---

## 🛠️ Tech Stack & Architecture

- **Framework:** [Expo](https://expo.dev/) (SDK 58) with New Architecture support
- **Routing:** [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation with typed routes)
- **Language:** TypeScript 6.0 (Strict mode)
- **UI & Design System:** *AfyaQueue Clinical Motion* (Custom theme tokens, Material Symbols, Plus Jakarta Sans, Inter, JetBrains Mono)
- **Local Persistence & Caching:** `@react-native-async-storage/async-storage` & `expo-secure-store`
- **Backend / Real-time Sync:** Cloud Firestore & Firebase Auth architecture (with robust offline persistence)

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) LTS (v20+)
- [Bun](https://bun.sh/) or npm

### 2. Installation
```bash
npm install
```

### 3. Running the App
```bash
# Start Metro bundler
npx expo start

# Open Android Emulator
npx expo start --android

# Open iOS Simulator
npx expo start --ios

# Open Web Preview
npx expo start --web
```

### 4. Verification & Testing
```bash
# Typecheck
npx tsc --noEmit

# Lint
npx expo lint

# Diagnostic check
npx expo-doctor

# Run Mathematical Queue Specification Tests
npm run test:math
```

---

## 📁 Project Structure

```
├── assets/
│   ├── fonts/               # Material Symbols Outlined & Filled TTF fonts
│   └── images/              # Doctor portraits, launcher & adaptive icons
├── screen_designs/          # High-fidelity design mockups and HTML references
├── scripts/
│   └── verify-queue-math.test.ts  # Queue mathematics test suite
├── src/
│   ├── app/                 # Expo Router file-based screens
│   │   ├── (tabs)/          # 5-tab persistent bottom dock
│   │   ├── announcements/   # Broadcast facility announcements
│   │   ├── appointments/    # Appointments list and reschedule flow
│   │   ├── auth/            # Dual-role Login & Registration
│   │   ├── doctor/          # Doctor profile & atomic slot booking
│   │   ├── feedback/        # Doctor rating & visit feedback
│   │   └── staff/           # Add Doctor / Service desk
│   ├── components/ui/       # 12 design-system primitives
│   ├── store/               # Dual-role reactive state & persistence layer
│   ├── theme/               # Colors, typography, metrics, shadows
│   └── types/               # Core data models and interfaces
└── afyaqueue_progress_and_production_roadmap.md # Detailed progress report
```

---

## 📄 License

Private & Institutional — Moi University / Moi Teaching and Referral Hospital.
