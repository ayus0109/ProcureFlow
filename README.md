# 🌾 ProcureFlow — Smart Digital Agricultural Procurement & Dynamic Queue Management System

[![Node.js](https://img.shields.io/badge/Node.js-v24.0.0-339933?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19.0.0-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-v8.2.2-646CFF?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-node:sqlite-003B57?logo=sqlite)](https://nodejs.org/api/sqlite.html)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Smart India Hackathon (SIH) Solution**  
> An end-to-end, resilient GovTech platform designed to eliminate multi-hour farmer queues, ensure transparent Minimum Support Price (MSP) quality bonuses, provide 24/7 AI guidance, and automate Direct Benefit Transfer (DBT) payouts across Agricultural Produce Market Committees (APMCs).

---

## 📋 Table of Contents
1. [The Problem & Expected Solution](#-the-problem--expected-solution)
2. [Key Features & Innovations](#-key-features--innovations)
3. [Technical Workings & Flowcharts](#-technical-workings--flowcharts)
4. [User Flow & System Architecture](#-user-flow--system-architecture)
5. [Evaluation & Demo Credentials](#-evaluation--demo-credentials)
6. [Quick Start & Setup Guide](#-quick-start--setup-guide)
7. [Repository Structure](#-repository-structure)
8. [Automated Rehearsal & Verification (44 Tests)](#-automated-rehearsal--verification-44-tests)

---

## 🎯 The Problem & Expected Solution

### Problem Statement:
Traditional APMC mandis suffer from uncoordinated farmer arrivals resulting in 8–14 hour physical queues, extreme traffic congestion, price exploitation by middlemen, lack of moisture testing transparency, and delayed payment confirmations.

### Expected Solution Fulfillments:
- ✅ **Kisan Sahayak (किसान सहायक) 24/7 Multilingual AI Chatbot**: Interactive doubt-clearing assistant in **Marathi (मराठी)**, **Hindi (हिंदी)**, and **English** for instant resolution of MSP rates, DBT timelines, moisture guidelines, and mandatory documents with optional voice input and HD voice readout.
- ✅ **Zero-Scroll 3-Step Booking Wizard**: Fast, frictionless slot booking (1-tap centre selection $\rightarrow$ crop & weight with live gross MSP calculator $\rightarrow$ 6 operating slot windows) issuing an instant scannable Digital Gate Pass.
- ✅ **Dynamic Queue Management**: Transparent 7-stage FIFO state machine with explainable wait-time calculations and Server-Sent Events (SSE) live push sync.
- ✅ **Instant Farmer Dossier & Aadhaar Lookup**: Sub-50ms search by Farmer Name, 12-digit Aadhaar Number (`XXXX-XXXX-XXXX`), Phone, PM-Kisan ID, or Token number.
- ✅ **Executive APMC Centre Analytics**: Real-time capacity utilization tracking, quality grade distributions, and 1-click APMC CSV export.
- ✅ **Anti-Corruption Graded MSP & DBT**: Server-computed quality bonuses (+5% for Grade A) and direct PFMS bank account disbursement.

---

## 🌟 Key Features & Innovations

### 1. 🤖 Kisan Sahayak (किसान सहायक / शेतकरी सहाय्यक) 24/7 AI Help Chatbot
- **Comprehensive GovTech Domain Knowledge**: Answers farmer queries in natural language regarding:
  - **Government MSP Rates (2026)**: Wheat (₹2,425/qtl), Soybean (₹4,892/qtl), Cotton (₹7,521/qtl), Paddy (₹2,300/qtl), Tur (₹7,550/qtl).
  - **Direct Benefit Transfer (DBT)**: PFMS direct-to-bank credit timeline (24-48 hours), zero agent deductions, and UTR tracking.
  - **Quality & Moisture Norms**: Max 12.0% moisture threshold, Fair Average Quality (FAQ) vs Grade A +5% bonus criteria.
  - **Gate Documents Checklist**: Aadhaar Card, Satbara 7/12 Land Record, Bank Passbook, and Digital Gate Pass token.
- **Multilingual & Reactive**: Live instant switching across Marathi, Hindi, and English (synced with top bar and 1-tap in-chat pills).
- **Accessibility**: Voice-to-Text mic input and Neural Text-to-Speech (`/api/tts`) readout.
- **Touch-Friendly Suggestion Cards**: Large interactive cards with direct navigation links (e.g. `[📅 Book Slot Now]`).

### 2. 📅 Zero-Scroll 3-Step Farmer Booking Wizard
- **Step 1 — Centre**: 1-tap selection of nearest APMC centre (Pune, Nashik, Nagpur, Aurangabad, Kolhapur) with live congestion badges.
- **Step 2 — Crop & Weight**: Select harvest crop with live gross MSP amount estimator and quick-add quintal chips (`+5`, `+10`, `+20`, `+50`).
- **Step 3 — Date & Time Slot**: Pick Today or Tomorrow across 6 one-hour operating windows (`10:00-11:00`, `11:00-12:00`, `12:00-13:00`, `14:00-15:00`, `15:00-16:00`, `16:00-17:00`).
- **Instant Token Generation**: Allocates an ACID-compliant Digital Gate Pass token (e.g. `PF-1476`) with exact arrival time.

### 3. 🔍 Executive Analytics & Instant Farmer Dossier Lookup
- High-speed indexed search for APMC centre administrators.
- Type any **Farmer Name**, **Aadhaar Number** (`XXXX-XXXX-XXXX` or last 4 digits), **Mobile**, **PM-Kisan ID**, or **Token #** to pull:
  - UIDAI Verified Aadhaar status & Satbara 7/12 Land Holdings.
  - Linked Direct Benefit Transfer (DBT) Bank Account & IFSC.
  - Lifetime Procurement Summary (Total Qtl sold, Gross MSP earnings, Paid vs Pending DBT).
  - Complete historical transaction ledger with **Print / View Pass & Receipt** triggers.

### 4. 🎫 Digital APMC Gate Pass with Scannable QR Matrix
- Generates procedural SVG QR Code tokens (`PF-1024+`) for optical scanning at APMC entry gates.
- Printable gate pass slip with farmer details, crop type, quantity, slot timing, and mandi directions.

### 5. ⏱️ 7-Stage Visual Progression Pipeline
- Real-time stepper tracking:  
  $$\text{Booked} \longrightarrow \text{Waiting in Queue} \longrightarrow \text{Called to Counter} \longrightarrow \text{Checked In} \longrightarrow \text{Quality Assay} \longrightarrow \text{Weighment} \longrightarrow \text{Confirmed / Paid}$$

### 6. 🧮 Deterministic & Explainable Wait-Time Formula
- Real-time queue math engine calculated dynamically:
  $$\text{Estimated Wait (min)} = \left(\frac{\text{Farmers Ahead} \times \text{Avg Processing Time}}{\text{Active Counters}}\right) + \text{Delay}$$

### 7. 🔬 Anti-Corruption Graded MSP Pricing Engine
- Server-side atomic pricing calculator factoring in quality benchmarks:
  - **Grade A**: $+5\%$ Quality Bonus above MSP
  - **FAQ Standard**: $100\%$ Base MSP
  - **Grade B**: $-5\%$ Deduction
  - **Below FAQ**: $-10\%$ Deduction
  - Moisture tolerance validation ($<12\%$) and automatic net payable calculation.

---

## 🔄 Technical Workings & Flowcharts

### 1. Kisan Sahayak Multilingual AI Chatbot Flowchart

```mermaid
flowchart LR
    subgraph Step1 ["Step 1: Multilingual Query Input"]
        A["💬 Farmer Query Input<br/>(Text / Voice / Suggestion Card)<br/>Marathi · Hindi · English"] --> B["NLU & Intent Normalizer<br/>(Dialect & Romanized Keyword Parser)"]
    end

    subgraph Step2 ["Step 2: GovTech Knowledge Engine"]
        B --> C["Knowledge Base Resolution<br/>(MSP Rates · DBT · Docs · Moisture · Centres)"]
        C --> D["POST /api/chatbot/ask<br/>(Contextual Structured JSON Response)"]
    end

    subgraph Step3 ["Step 3: Interactive UI & Audio Output"]
        D --> E["Rich Formatted Markdown Reply<br/>(Bullet Points + Action Links)"]
        E --> F["🔊 Neural TTS Voice Readout<br/>(/api/tts Audio Stream)"]
    end

    style Step1 fill:#f0fdf4,stroke:#16a34a,stroke-width:2px
    style Step2 fill:#eff6ff,stroke:#2563eb,stroke-width:2px
    style Step3 fill:#faf5ff,stroke:#9333ea,stroke-width:2px
```

### 2. Real-Time Dynamic Queue Management & 3-Step Wizard Flowchart

```mermaid
flowchart LR
    subgraph Step1 ["Step 1: 3-Step Wizard Booking"]
        A["Zero-Scroll 3-Step Wizard<br/>(1-Tap Centre ➔ Crop & Qty ➔ Slot)"] --> B["Capacity & Quota Engine<br/>(Max 50 Qtl · 6 Slot Windows)"]
    end

    subgraph Step2 ["Step 2: 7-Stage Dynamic Queue"]
        B --> C["7-Stage FIFO Progression<br/>(WAITING ➔ CALLED ➔ WEIGHMENT)"]
        C --> D["Dynamic Wait Algorithm<br/>Wait = (Pos - 1) × Rate + Delay"]
    end

    subgraph Step3 ["Step 3: Real-Time Broadcast"]
        D --> E["⚡ Server-Sent Events (SSE)<br/>(Live UI Stepper Sync)"]
        D --> F["📱 SMS / WhatsApp Alert<br/>(Gate Call Notification)"]
    end

    style Step1 fill:#f0fdf4,stroke:#16a34a,stroke-width:2px
    style Step2 fill:#fffbeb,stroke:#d97706,stroke-width:2px
    style Step3 fill:#eff6ff,stroke:#2563eb,stroke-width:2px
```

### 3. Executive Analytical Dashboard & Instant Dossier Flowchart

```mermaid
flowchart LR
    subgraph Step1 ["Step 1: Multi-Index Query"]
        A["Admin Query Input<br/>(Name / Aadhaar / Phone / Token)"] --> B["Sub-50ms Search Index<br/>(Indexed SQL LIKE & Regex)"]
    end

    subgraph Step2 ["Step 2: Relational Ledger Aggregation"]
        B --> C["Multi-Table Join Engine<br/>(Farmers + Bookings + Payments)"]
        C --> D["Instant Farmer Dossier<br/>(UIDAI Status, Land, DBT History)"]
    end

    subgraph Step3 ["Step 3: Centre Intelligence & Export"]
        D --> E["Executive KPI Cockpit<br/>(Volume, Target %, Grade Assaying)"]
        D --> F["📥 Official APMC CSV Export<br/>(District Collector Report)"]
    end

    style Step1 fill:#f8fafc,stroke:#475569,stroke-width:2px
    style Step2 fill:#f0fdf4,stroke:#16a34a,stroke-width:2px
    style Step3 fill:#ecfdf5,stroke:#059669,stroke-width:2px
```

---

## 🏗️ 4-Tier System Architecture

```mermaid
graph TD
    subgraph L1["1. Presentation Tier (React 19 + Tailwind CSS v4)"]
        A["Mobile-First UI • 3 Languages (EN/HI/MR) • SVG QR Pass • Kisan Sahayak AI • 3-Step Wizard"]
    end
    
    subgraph L2["2. API & Security Tier (Express 5 REST API + SSE)"]
        B["Bearer JWT Authentication • Role Guards • Multi-Centre Isolation • Server-Sent Events"]
    end
    
    subgraph L3["3. Business Logic Engine (Node.js 24)"]
        C["Dynamic ETA Calculator • Queue State Machine • Graded MSP Pricing • AI Chatbot NLU"]
    end
    
    subgraph L4["4. Data Tier (Native node:sqlite Database)"]
        D["7 Relational Tables • Indexed Foreign Keys • ACID Transactions • Fast LIKE Indices"]
    end

    L1 --> L2 --> L3 --> L4
```

---

## 🔑 Evaluation & Demo Credentials

| Role | Access URL | Credentials | Context / Test Scope |
|---|---|---|---|
| **Farmer (Demo)** | [http://localhost:5173/farmer/login](http://localhost:5173/farmer/login) | **Phone:** `9999990001`<br>**Password:** `farmer123`<br>*(Or OTP `4829`)* | *Ramesh Patil* (Starts clean to test 3-step slot booking, Kisan Sahayak AI, and pass printing) |
| **Centre Officer (Pune)** | [http://localhost:5173/admin/login](http://localhost:5173/admin/login) | **Code:** `ADMIN001`<br>**Password:** `admin123` | *Suresh Kale* (Controls Pune APMC queue, assaying, farmer dossier search, and DBT payouts) |
| **Centre Officer (Nashik)** | [http://localhost:5173/admin/login](http://localhost:5173/admin/login) | **Code:** `ADMIN002`<br>**Password:** `admin123` | *Vaishali Deshmukh* (Demonstrates multi-centre security isolation) |

---

## ⚡ Quick Start & Setup Guide

### Prerequisites:
- Node.js 22+ or Node.js 24 (with native `node:sqlite` support)
- npm 10+

### 1. Install Dependencies
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 2. Seed Demo Database
```bash
cd backend
node db/seed.js
```

### 3. Run Development Servers
Open two terminal windows:

**Terminal 1 (Backend - Port 4000):**
```bash
cd backend
node server.js
```

**Terminal 2 (Frontend - Port 5173):**
```bash
cd frontend
npm run dev
```

Visit **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 📁 Repository Structure

```
ProcureFlow/
├── backend/
│   ├── config/constants.js        # Crops, MSP rates, grade factors, 6 slot windows, statuses
│   ├── data/procureflow.db        # SQLite database file
│   ├── db/
│   │   ├── index.js               # Database connection using native node:sqlite
│   │   ├── schema.js              # 7-table schema with indexes and virtual columns
│   │   └── seed.js                # Database seeder for demo state
│   ├── middleware/auth.js         # Bearer token verification & role enforcement
│   ├── routes/
│   │   ├── analytics.js           # Centre KPI metrics, instant farmer lookup, and CSV export
│   │   ├── auth.js                # Farmer & Admin authentication + OTP
│   │   ├── bookings.js            # Slot reservation, multi-slot support, and receipts
│   │   ├── centres.js             # APMC centre capacities and slots
│   │   ├── chatbot.js             # Kisan Sahayak AI knowledge & NLU engine
│   │   ├── notifications.js       # Live notifications and SSE event stream
│   │   ├── payments.js            # DBT disbursement and PFMS UTR generation
│   │   ├── queue.js               # 7-stage queue state machine and caller
│   │   └── tts.js                 # Neural Text-to-Speech audio proxy
│   ├── services/                  # Business logic (booking, ETA, queue, procurement, payments)
│   ├── demo-check.js              # 44-step automated rehearsal test suite
│   └── server.js                  # Main Express entrypoint (Port 4000)
│
├── frontend/
│   ├── src/
│   │   ├── auth/AuthContext.jsx   # Authentication context, OTP & Google login
│   │   ├── components/            # UI components (FarmerChatbot, AdminAnalytics, Stepper, Pass)
│   │   ├── hooks/                 # React hooks (usePoll, useLiveEvents)
│   │   ├── i18n/                  # 3-language dictionaries (EN, HI, MR) & LanguageContext
│   │   ├── layouts/               # Shell and responsive navigation layouts
│   │   ├── pages/                 # Landing, Farmer Dashboard, Admin Cockpit, 3-Step BookSlot
│   │   ├── services/api.js        # Central fetch client with Vite proxy integration
│   │   ├── App.jsx                # Application routes
│   │   └── main.jsx               # React entry point
│   ├── vite.config.js             # Vite 8 configuration with proxy forwarding
│   └── package.json               # React 19, Tailwind v4, Lucide dependencies
│
└── README.md                      # Master project README
```

---

## 🧪 Automated Rehearsal & Verification (44 Tests)

The project includes an automated end-to-end rehearsal script that verifies all 44 lifecycle steps:

```bash
cd backend
node demo-check.js
```

**Expected Result:**
```
==============================================
44 ok, 0 failed
==============================================
```

---

*Developed for Smart India Hackathon (SIH)*
