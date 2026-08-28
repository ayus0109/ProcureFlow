# 🌾 ProcureFlow — Frontend Client

Modern, mobile-first GovTech interface for digital agricultural procurement, built with React 19, Vite 8, and Tailwind CSS v4.

---

## 🚀 Key Features

- **Digital APMC Gate Pass**: Authentic SVG QR matrix pass (`<QRCode />`) with printable slip modal.
- **7-Stage Visual Stepper**: Live progression pipeline (`<StageStepper />`) from booking to final DBT settlement.
- **Dynamic Slot & Revenue Calculator**: Real-time MSP revenue computation on quintal input with load meters.
- **Mandi Gate Optical QR Scanner**: One-click APMC entry gate verification and stage advance modal on Admin cockpit.
- **Smart Advisory & Services Widget**: Weather forecast, mandi price comparisons, speech synthesis voice assistant, and toll-free helpline (`<AgriServicesCard />`).
- **3-Language Localization (i18n)**: English, Hindi (हिंदी), and Marathi (मराठी).
- **Flexible Authentication**: Mobile OTP + Anti-bot Security Captcha, Continue with Google, and standard passwords.
- **Resilient Polling Engine**: Built-in `usePoll` hook operating on 4–6s intervals with sub-10KB payloads for 2G/3G stability.

---

## 📋 Expected Solution Fulfillments

- **Farmer Registration & Slot Booking**: Multi-lingual, icon-led registration and time-window booking interface (`/farmer/book`).
- **Real-Time Queue Management**: Live queue status with token display, dynamically derived position, and estimated wait times (`/farmer`, `/admin`).
- **SMS & App Notifications**: Real-time alerts feed with high-priority call-to-counter banners (`AlertsPanel`).
- **Procurement & Payment Tracking**: Live digital receipt with server-computed MSP and seasonal ledger (`SeasonTracker`, `PaymentsPanel`).
- **Congestion Reduction**: Center comparison with live congestion badges (`LOW`, `MODERATE`, `HIGH`) and advised arrival times.

---

## 🛠️ Running Locally

```bash
# Install dependencies
npm install

# Start Vite development server (Port 5173 with proxy -> :4000)
npm run dev

# Build for production
npm run build
```
