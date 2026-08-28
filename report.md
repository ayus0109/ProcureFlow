# ProcureFlow — Project Progress Report

**Date:** August 28, 2026  
**Project:** ProcureFlow — Digital Agricultural Procurement & Queue Management System  
**Version:** 1.0.0 (Prototype / SIH Demonstration Edition)  
**Status:** ✅ Fully Functional, Built, Verified & Running Live  

---

## 1. Executive Summary

**ProcureFlow** is a modern, transparent digital procurement and queue management platform designed for agricultural market yards (APMCs) and government procurement centres. It directly tackles the critical challenges of long wait lines, lack of slot predictability, quality dispute risks, and opaque payout workflows for farmers.

### Expected Solution
Develop a platform that:
- **Enables farmer registration and slot booking**: Multi-lingual mobile-friendly registration and self-service procurement slot reservation across designated date/time windows.
- **Provides real-time queue management**: Dynamic queue tracking, live position calculation, automated turn-calling, and transparent counter stage advancement.
- **Sends SMS/app notifications**: Instant notifications for booking confirmations, turn alerts ("Your turn — go to counter"), quality test results, and payment updates.
- **Tracks procurement and payment status**: Real-time digital receipts, server-computed MSP payouts with grade adjustments, and a comprehensive season ledger.
- **Reduces congestion and waiting time at procurement centres**: Window capacity limits, advised arrival times, and live centre congestion visibility (`LOW`, `MODERATE`, `HIGH`) to prevent crowding.

---

## 2. Current System Status

| Component | Status | Port / URL | Details |
|---|---|---|---|
| **Backend API** | 🟢 Running | `http://localhost:4000` | Node.js 24 + Express 5 + `node:sqlite` |
| **Frontend Dev Server** | 🟢 Running | `http://localhost:5173` | React 19 + Vite 8 + Tailwind CSS v4 |
| **Database** | 🟢 Seeded | `backend/data/procureflow.db` | 5 Centres, 20 Farmers, 242 Bookings, 2 Payments |
| **Test Suite** | 🟢 42/42 Passed | `node demo-check.js` | 100% rehearsal pass rate |
| **Production Build** | 🟢 Verified | `dist/` | Vite build clean in 3.82s |

---

## 3. Progress Milestones Achieved

### Phase 1: Problem Definition & Architectural Design ✅
- [x] Defined core domain model for APMC slot booking, queue progression, quality grading, and payments.
- [x] Established high-trust engineering rules:
  - Derived queue positions (no drifting).
  - Server-side pricing calculations (tamper-proof MSP and grade factors).
  - ACID transactions for all procurement and payout events.
  - Multi-centre role isolation.

### Phase 2: Database Design & Zero-Dependency Native Storage ✅
- [x] Implemented schema with 7 normalized tables: `centres`, `farmers`, `admins`, `bookings`, `procurements`, `payments`, and `notifications`.
- [x] Configured SQLite generated virtual columns for unique tokens (`PF-1024+`) and transaction references (`PF-TXN-1000+`).
- [x] Built reproducible database seeder (`backend/db/seed.js`) generating realistic demo data for 5 districts across Maharashtra (Pune, Nashik, Nagpur, Aurangabad, Kolhapur).

### Phase 3: Backend API & Service Layer Implementation ✅
- [x] **Auth Service** (`services/authService.js`): Role-based login and token issuance for Farmers and Centre Admins.
- [x] **Booking Service** (`services/bookingService.js`): Dynamic slot window availability checks, 1-active-booking constraint, token issuance, arrival time advisor.
- [x] **Queue Service** (`services/queueService.js`): `ROW_NUMBER()` dynamic queue computation, forward stage advancement (`BOOKED` → `WAITING` → `CALLED` → `CHECKED_IN` → `ASSAYING` → `WEIGHMENT`).
- [x] **ETA Service** (`services/etaService.js`): Multi-counter wait time forecasting formula with delay adjustments and congestion banding (`LOW`, `MODERATE`, `HIGH`).
- [x] **Procurement Service** (`services/procurementService.js`): Server-enforced quality assays (`Grade A (+5%)`, `FAQ (100%)`, `Grade B (-5%)`, `Below FAQ (-10%)`), moisture validation, atomic transaction handling, and lot rejection.
- [x] **Payment Service** (`services/paymentService.js`): Payout lifecycle tracking (`PENDING` → `PROCESSING` → `PAID`) and notification dispatch.
- [x] **Season Tracker Service** (`services/trackerService.js`): Real-time read-time aggregation of farmer seasonal metrics (sales count, quintals sold, earned, paid, awaiting).

### Phase 4: Frontend Development & UI/UX Design ✅
- [x] Built mobile-first responsive interface optimized for low-end rural smartphone browsers.
- [x] **Digital Gate Pass with Scannable QR Code**: Generated procedural SVG QR matrix and official e-Pass styling with printable gate pass slip.
- [x] **Visual Stage Progress Stepper**: 7-stage interactive pipeline (`BOOKED` → `WAITING` → `CALLED` → `CHECKED_IN` → `ASSAYING` → `WEIGHMENT` → `CONFIRMED`) with animated progress nodes and status icons.
- [x] **Judge & Evaluator Demo Toolkit**: Floating presenter toolbar (`JudgeDemoBar`) providing instant 1-click persona switching (Farmer Ramesh ↔ Admin Suresh ↔ Admin Nashik), instant queue advancement, and language switching.
- [x] **Live MSP & Gross Revenue Calculator**: Real-time revenue estimation on crop selection in slot booking.
- [x] **Dynamic Quality Assay & Payout Calculator**: Interactive modal in Admin view calculating base MSP, quality grade adjustments (+5% premium for Grade A, -5% for Grade B, -10% for Below FAQ), and instant net payable amount.
- [x] **Financial Analytics Ledger**: Visual seasonal progress bar (Paid vs Awaiting), quality grade distribution breakdown, and searchable payout settlements panel.
- [x] **GovTech Design Polish**: Emerald and jade theme, ambient background gradients, pulsing radar indicators on live sync, and official Ministry compliance headers.
- [x] Implemented comprehensive **3-Language Localization (i18n)** covering English, Hindi (हिंदी), and Marathi (मराठी).
- [x] Developed robust **HTTP Polling Synchronization** (`usePoll` hook) operating on 4s (Farmer) and 5s (Admin) intervals without WebSocket connectivity failure risks on rural 2G/3G networks.
- [x] Built intuitive interfaces:
  - **Language & Role Selection** (`LanguageSelect.jsx`, `RoleSelect.jsx`).
  - **Farmer Dashboard** (`FarmerHome.jsx`) with live queue badge, token details, estimated wait, advised arrival time, digital receipt, and season tracker.
  - **Slot Booking Portal** (`BookSlot.jsx`) with live centre congestion indicators and time window picker.
  - **Admin Control Centre** (`AdminHome.jsx`) with live queue controls, stage stepping, quality assay dialog, and payment management.
  - **Procurement & Payment Panels** (`ProcurementDialog.jsx`, `PaymentsPanel.jsx`, `SeasonTracker.jsx`, `AlertsPanel.jsx`).

### Phase 5: Verification, Rehearsal & End-to-End Testing ✅
- [x] Executed full Vite production build (`npm run build`) — successful with zero bundle or syntax issues.
- [x] Executed 42-stage automated rehearsal suite (`backend/demo-check.js`):
  1. Farmer sign in & clean state verification.
  2. Centre comparison & congestion calculation check.
  3. Afternoon slot booking & token issuance (`PF-1266`).
  4. Centre admin login & queue visibility.
  5. Multi-queue forward progression & ETA decrease verification.
  6. Call-to-counter notification triggers.
  7. Quality assay calculation & cross-centre permission denial testing.
  8. Digital receipt generation.
  9. Admin payment processing & duplicate payout rejection.
  10. Farmer season tracker aggregation & subsequent same-day re-booking.
- [x] Re-seeded database to ensure clean out-of-the-box state for live user evaluation.
- [x] Launched backend and frontend background daemons for immediate interactive testing.

---

## 4. Architectural Summary

```
ProcureFlow/
├── backend/
│   ├── config/constants.js        # Crops, MSP rates, grade factors, slot windows, statuses
│   ├── data/procureflow.db        # SQLite database file
│   ├── db/
│   │   ├── index.js               # Database connection using native node:sqlite
│   │   ├── schema.js              # 7-table schema with indexes and virtual columns
│   │   └── seed.js                # Database seeder for demo state
│   ├── middleware/auth.js         # Bearer token verification & role enforcement
│   ├── routes/                    # Express route controllers (auth, bookings, centres, etc.)
│   ├── services/                  # Business logic (booking, ETA, queue, procurement, payments)
│   ├── utils/                     # Formatting helpers (dates, money, http)
│   ├── demo-check.js              # 42-step automated rehearsal test suite
│   └── server.js                  # Main Express entrypoint (Port 4000)
│
├── frontend/
│   ├── src/
│   │   ├── auth/AuthContext.jsx   # Authentication context & storage
│   │   ├── components/            # UI components (Alerts, Badges, Dialogs, Payments, Tracker)
│   │   ├── hooks/usePoll.js       # Background HTTP polling hook (4-6s interval)
│   │   ├── i18n/                  # Language context & dictionaries (EN, HI, MR)
│   │   ├── layouts/               # Shell and centered responsive layouts
│   │   ├── pages/                 # Landing, Farmer, Admin, and NotFound pages
│   │   ├── services/api.js        # Central fetch client with Vite proxy integration
│   │   ├── App.jsx                # Application routes
│   │   └── main.jsx               # React entry point
│   ├── vite.config.js             # Vite 8 config with proxy forwarding /api -> :4000
│   └── package.json               # React 19, Tailwind v4, Lucide dependencies
│
├── SIH-PPT-CONTENT.md             # Hackathon presentation content and slide notes
└── report.md                      # Comprehensive project progress report
```

---

## 5. Preconfigured Credentials for Evaluation

| Role | Access URL | Credentials | Context |
|---|---|---|---|
| **Farmer (Demo)** | [http://localhost:5173/farmer/login](http://localhost:5173/farmer/login) | **Phone:** `9999990001`<br>**Password:** `farmer123` | *Ramesh Patil* (Starts with no active bookings to demonstrate slot booking flow) |
| **Admin (Pune)** | [http://localhost:5173/admin/login](http://localhost:5173/admin/login) | **Code:** `ADMIN001`<br>**Password:** `admin123` | *Suresh Kale* (Controls Pune Procurement Center queue) |
| **Admin (Nashik)** | [http://localhost:5173/admin/login](http://localhost:5173/admin/login) | **Code:** `ADMIN002`<br>**Password:** `admin123` | *Vaishali Deshmukh* (Demonstrates multi-centre security isolation) |

---

## 6. Key Commands for Maintenance

- **Reset Demo Data:**  
  ```bash
  cd backend && npm run seed
  ```
- **Run Automated Test Suite:**  
  ```bash
  cd backend && node demo-check.js
  ```
- **Run Backend:**  
  ```bash
  cd backend && npm start
  ```
- **Run Frontend:**  
  ```bash
  cd frontend && npm run dev
  ```
- **Compile Production Bundle:**  
  ```bash
  cd frontend && npm run build
  ```

---

## 7. Strategic Solution Improvements & Future Roadmap

### Solution to Improve-

1. Build stable lightweight application.
2. Scalable backend infrastructure.
3. Simply authentication.
4. Multilingual instructor, visual guidance.
5. Add file validation, compression msgs.
6. Improve location/centre selection 
7. SMS confirmation with booking id
8. Ticket tracking, FAQS, support system.
9. Provide real-time approval tracking.
10. Use very simple Ui, multi lingual, voice assistant

### Can Improve in Our App-

1. Huge Product catalogue.
2. Expert advice.
3. Crop diagnosis.
4. Weather
5. Farmer Community
6. Multilingual from start
7. Offline Working
8. Customer support
9. Voice-Based Assistant
10. Mandi Comparison
11. Automatic reminders
