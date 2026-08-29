import { useState, useCallback } from 'react';
import {
  BellRing,
  CalendarPlus,
  RefreshCw,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Wheat,
  Scale,
  CreditCard,
  Share2,
  History,
  Smartphone,
  ShieldCheck,
  FileCheck2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AppShell from '../../layouts/AppShell.jsx';
import AlertsPanel from '../../components/AlertsPanel.jsx';
import SeasonTracker from '../../components/SeasonTracker.jsx';
import StageStepper from '../../components/StageStepper.jsx';
import VoiceAssistant from '../../components/VoiceAssistant.jsx';
import { PrintableTokenPass } from '../../components/PrintableTokenPass.jsx';
import { SmsDispatchModal } from '../../components/SmsDispatchModal.jsx';
import { EkycModal } from '../../components/EkycModal.jsx';
import { BankDetailsModal } from '../../components/BankDetailsModal.jsx';
import { BookingHistoryModal } from '../../components/BookingHistoryModal.jsx';
import { api } from '../../services/api';
import { money } from '../../utils/money.js';
import { usePoll } from '../../hooks/usePoll.js';
import { useLiveEvents } from '../../hooks/useLiveEvents.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useLanguage } from '../../i18n/LanguageContext.jsx';

const STATUS_BADGES = {
  BOOKED: 'bg-blue-50 text-blue-800 ring-blue-300 border-blue-200',
  WAITING: 'bg-emerald-50 text-emerald-800 ring-emerald-300 border-emerald-200',
  CALLED: 'bg-amber-100 text-amber-950 ring-amber-400 border-amber-300 animate-pulse',
  CHECKED_IN: 'bg-teal-50 text-teal-800 ring-teal-300 border-teal-200',
  ASSAYING: 'bg-purple-50 text-purple-800 ring-purple-300 border-purple-200',
  WEIGHMENT: 'bg-indigo-50 text-indigo-800 ring-indigo-300 border-indigo-200',
  CONFIRMED: 'bg-emerald-700 text-white ring-emerald-700 border-emerald-800',
  REJECTED: 'bg-rose-50 text-rose-800 ring-rose-300 border-rose-200',
};

const PAYMENT_STYLES = {
  PENDING: 'bg-slate-100 text-slate-700 ring-slate-300',
  PROCESSING: 'bg-amber-100 text-amber-900 ring-amber-300',
  PAID: 'bg-emerald-100 text-emerald-900 ring-emerald-300 font-bold',
};

function Row({ label, value, highlight = false }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 text-sm">
      <dt className="text-slate-500 font-medium">{label}</dt>
      <dd className={`font-semibold ${highlight ? 'text-emerald-900 font-bold' : 'text-slate-900'}`}>{value}</dd>
    </div>
  );
}

function Stat({ label, value, sub, icon: Icon, color = 'emerald' }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-${color}-50 to-white p-3.5 text-center ring-1 ring-${color}-200/80 shadow-xs`}>
      <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
        {Icon && <Icon className="h-3.5 w-3.5 text-emerald-700" />}
        <span>{label}</span>
      </div>
      <p className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl tabular-nums">
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[10px] font-medium text-slate-500">{sub}</p>}
    </div>
  );
}

function adjustment(factor) {
  const pct = Math.round(Math.abs(1 - factor) * 100);
  return `${factor > 1 ? '+' : '−'}${pct}%`;
}

/** Official Digital Receipt Card */
function Receipt({ p, t }) {
  if (!p.accepted) {
    return (
      <div className="mt-4 rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-rose-900">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
          <p className="text-sm font-bold">{t('receipt.notAcceptedTitle')}</p>
        </div>
        <p className="mt-1.5 text-xs text-rose-800 bg-white/80 p-2.5 rounded-lg border border-rose-200">
          <strong>Reason:</strong> {p.remarks}
        </p>
        <dl className="mt-3 divide-y divide-rose-100 text-xs">
          <Row label={t('receipt.grade')} value={p.quality_grade} />
          <Row label={t('receipt.moisture')} value={`${p.moisture_pct}%`} />
        </dl>
      </div>
    );
  }

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border-2 border-emerald-600/30 bg-gradient-to-b from-emerald-50/80 to-white shadow-md">
      {/* Receipt Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Official Digital Procurement Receipt
            </span>
          </div>
          <span className="font-mono text-xs text-emerald-200 bg-emerald-950/60 px-2 py-0.5 rounded">
            {p.txn_ref}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-emerald-100 pb-3">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t('receipt.amount')}
            </p>
            <p className="text-3xl font-extrabold tracking-tight text-emerald-950">
              {money(p.total_amount)}
            </p>
            <p className="mt-0.5 text-xs font-medium text-emerald-700">{t('receipt.doneSub')}</p>
          </div>
          <div className="text-right">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${PAYMENT_STYLES[p.payment_status]}`}>
              {t(`payment.${p.payment_status}`)}
            </span>
          </div>
        </div>

        <dl className="mt-3 divide-y divide-slate-100">
          <Row label={t('receipt.grade')} value={<span className="rounded bg-emerald-100 px-2 py-0.5 font-bold text-emerald-900">{p.quality_grade}</span>} />
          <Row label={t('receipt.moisture')} value={`${p.moisture_pct}%`} />
          <Row label={t('receipt.weight')} value={`${p.final_weight_qtl} ${t('booking.qtl')}`} />
          {p.gradeFactor !== 1 && p.baseRatePerQtl && (
            <>
              <Row label={t('receipt.baseRate')} value={`${money(p.baseRatePerQtl)} / ${t('booking.qtl')}`} />
              <Row
                label={t('receipt.gradeAdj')}
                value={
                  <span className={`font-bold ${p.gradeFactor > 1 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {adjustment(p.gradeFactor)} ({p.gradeFactor > 1 ? 'Quality Bonus' : 'Deduction'})
                  </span>
                }
              />
            </>
          )}
          <Row label={t('receipt.rate')} value={`${money(p.rate_per_qtl)} / ${t('booking.qtl')}`} highlight />
          {p.credited_bank && (
            <Row
              label="Govt DBT Bank"
              value={
                <span className="font-bold text-emerald-950 flex items-center gap-1">
                  🏛️ {p.credited_bank} ({p.credited_account || '••••4821'})
                </span>
              }
            />
          )}
          {p.pfms_utr ? (
            <Row
              label="PFMS Govt UTR"
              value={<span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100/70 px-2 py-0.5 rounded">{p.pfms_utr}</span>}
            />
          ) : (
            <Row label={t('receipt.txn')} value={<span className="font-mono text-xs font-bold text-slate-800">{p.txn_ref}</span>} />
          )}
        </dl>
      </div>
    </div>
  );
}

/** Digital Gate Pass with Scannable QR & Stepper */
function BookingCard({ booking, t, onOpenPass }) {
  const closed = booking.status === 'CONFIRMED' || booking.status === 'REJECTED';

  return (
    <section className="relative overflow-hidden rounded-3xl border border-emerald-200/80 bg-white p-5 shadow-lg shadow-slate-200/40 sm:p-6">
      {/* Top Pass Brand Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200">
            <Wheat className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                {t('booking.token')}
              </p>
              <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                Digital Gate Pass
              </span>
            </div>
            <p className="font-mono text-2xl font-extrabold tracking-tight text-emerald-950 sm:text-3xl">
              {booking.token}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 border ${STATUS_BADGES[booking.status] || 'bg-slate-100 text-slate-800'}`}>
            {t(`status.${booking.status}`)}
          </span>
          <button
            type="button"
            onClick={onOpenPass}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 hover:underline"
          >
            <Printer className="h-3.5 w-3.5 text-emerald-700" />
            <span>Print Mandi Pass (PDF)</span>
          </button>
        </div>
      </div>

      {/* Interactive Stage Stepper */}
      <div className="mt-4 border-b border-slate-100 pb-4">
        <StageStepper currentStatus={booking.status} />
      </div>

      {/* Live Stats: Queue Position, Estimated Wait, Advised Arrival */}
      {!closed && (
        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          <Stat
            label={t('booking.position')}
            value={booking.position ?? '—'}
            sub={`${booking.farmersAhead || 0} ahead of you`}
            icon={Clock}
          />
          <Stat
            label={t('booking.wait')}
            value={booking.waitLabel}
            sub="Live estimated wait"
            icon={Clock}
          />
          <Stat
            label={t('booking.arriveBy')}
            value={booking.arriveBy || '—'}
            sub="Advised at gate"
            icon={Clock}
          />
        </div>
      )}

      {/* Booking Particulars */}
      <div className="mt-4 rounded-2xl bg-slate-50/70 p-4 ring-1 ring-slate-200/60">
        <dl className="divide-y divide-slate-200/60 text-xs">
          <Row label={t('booking.centre')} value={booking.centre_name} />
          <Row label={t('booking.crop')} value={t(`crop.${booking.crop}`)} />
          <Row label={t('booking.quantity')} value={`${booking.quantity_qtl} ${t('booking.qtl')}`} />
          <Row label={t('booking.when')} value={`${booking.slot_date} · ${booking.slot_time}`} />
        </dl>
      </div>

      {/* Completed Receipt */}
      {booking.procurement && <Receipt p={booking.procurement} t={t} />}

      {/* Book Another Slot Button if closed */}
      {closed && (
        <Link
          to="/farmer/book"
          className="mt-5 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 px-6 text-base font-bold text-white shadow-md shadow-emerald-800/20 transition hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
        >
          <CalendarPlus className="h-5 w-5" />
          {t('farmer.bookAnother')}
        </Link>
      )}
    </section>
  );
}

function EmptyState({ t }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border-2 border-dashed border-emerald-300 bg-gradient-to-b from-emerald-50/50 via-white to-white p-8 text-center shadow-xs">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-700/20 ring-4 ring-emerald-100">
        <CalendarPlus className="h-8 w-8" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-lg font-bold text-slate-900">{t('farmer.noSlotTitle')}</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600 leading-relaxed">
        {t('farmer.noSlotSub')}
      </p>
      <Link
        to="/farmer/book"
        className="mt-6 inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 px-7 text-base font-bold text-white shadow-md shadow-emerald-800/20 transition hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
      >
        <Sparkles className="h-4 w-4" />
        {t('farmer.bookSlot')}
      </Link>
    </section>
  );
}

export default function FarmerHome() {
  const { user, setUser } = useAuth();
  const { t } = useLanguage();
  const [selectedSlotIdx, setSelectedSlotIdx] = useState(0);

  // Modals state
  const [showPassModal, setShowPassModal] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [showEkycModal, setShowEkycModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedPassBooking, setSelectedPassBooking] = useState(null);

  const { data: booking, error, loading, setData: setBookingData } = usePoll(
    () => api('/bookings/mine'),
    5000,
    []
  );

  // Real-time SSE push listener (Item 8)
  useLiveEvents(
    useCallback(
      (event) => {
        if (event.type === 'QUEUE_UPDATED' || event.type === 'PAYMENT_UPDATED') {
          api('/bookings/mine')
            .then((data) => setBookingData(data))
            .catch(() => {});
        }
      },
      [setBookingData]
    )
  );

  const allBookings = booking?.allBookings || (booking ? [booking] : []);
  const activeCount = booking?.activeCount || (booking && booking.status !== 'CONFIRMED' && booking.status !== 'REJECTED' ? 1 : 0);
  const currentBooking = allBookings[selectedSlotIdx] || allBookings[0] || booking;

  const handleOpenActivePass = () => {
    setSelectedPassBooking(currentBooking);
    setShowPassModal(true);
  };

  return (
    <AppShell title={`${t('farmer.hello')}, ${user.name}`} subtitle={user.village ? `Village: ${user.village}` : undefined}>
      {/* Top Quick Actions Grid: All Bookings, Bank Account & DBT, SMS Log, e-KYC */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setShowHistoryModal(true)}
          className="flex items-center gap-3.5 rounded-2xl border-2 border-slate-200 bg-white p-4 text-left shadow-xs transition hover:border-emerald-500 hover:shadow-md hover:bg-emerald-50/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-800">
            <History className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-slate-900">
              All Bookings & History
            </span>
            <span className="block text-xs text-slate-500 font-medium truncate">
              Past tokens & receipts
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setShowBankModal(true)}
          className="flex items-center gap-3.5 rounded-2xl border-2 border-emerald-300 bg-emerald-50/70 p-4 text-left shadow-xs transition hover:border-emerald-600 hover:shadow-md hover:bg-emerald-100/60 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-700 text-white">
            <CreditCard className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold text-emerald-950">
              Bank Account & DBT
            </span>
            <span className="block text-xs text-emerald-800 font-medium truncate">
              {user.bank_account ? `🏛️ ••••${user.bank_account.slice(-4)}` : 'Link bank for payments'}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setShowSmsModal(true)}
          className="flex items-center gap-3.5 rounded-2xl border-2 border-slate-200 bg-white p-4 text-left shadow-xs transition hover:border-blue-500 hover:shadow-md hover:bg-blue-50/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-800">
            <Smartphone className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-slate-900">
              SMS & WhatsApp Alerts
            </span>
            <span className="block text-xs text-slate-500 font-medium truncate">
              Message dispatch logs
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setShowEkycModal(true)}
          className={`flex items-center gap-3.5 rounded-2xl border-2 p-4 text-left shadow-xs transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 ${
            user?.ekyc_verified
              ? 'border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/50 hover:border-emerald-500'
              : 'border-amber-300 bg-amber-50/70 hover:bg-amber-100/60 hover:border-amber-500 animate-pulse'
          }`}
        >
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
            user?.ekyc_verified ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
          }`}>
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <span className={`block text-sm font-bold ${
              user?.ekyc_verified ? 'text-emerald-950' : 'text-amber-950'
            }`}>
              {user?.ekyc_verified ? 'Govt e-KYC Verified' : 'Complete Aadhaar e-KYC'}
            </span>
            <span className="block text-xs text-slate-500 font-medium truncate">
              {user?.ekyc_verified ? 'UIDAI & PM-Kisan Linked' : 'Click to verify Aadhaar'}
            </span>
          </div>
        </button>
      </div>

      {loading && <p className="text-sm font-medium text-slate-500 animate-pulse">{t('common.loading')}</p>}

      {error && (
        <div role="alert" className="rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-900 ring-1 ring-rose-200">
          {error}
        </div>
      )}

      {/* Multi-Slot Switcher Tabs (when farmer holds multiple bookings) */}
      {allBookings.length > 1 && (
        <div className="flex items-center justify-between gap-2 overflow-x-auto rounded-2xl bg-slate-100 p-1.5">
          <div className="flex gap-1.5 overflow-x-auto">
            {allBookings.map((b, idx) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedSlotIdx(idx)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  selectedSlotIdx === idx
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <span className="font-mono">{b.token}</span>
                <span className="text-[10px] opacity-80">({t(`crop.${b.crop}`)})</span>
              </button>
            ))}
          </div>

          <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 shrink-0">
            {activeCount}/3 Slots
          </span>
        </div>
      )}

      {/* High-priority announcement when called */}
      {currentBooking?.status === 'CALLED' && (
        <div
          role="status"
          className="flex items-start gap-4 rounded-3xl bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white shadow-lg ring-4 ring-amber-300/50 animate-bounce"
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/20 backdrop-blur-md">
            <BellRing className="h-7 w-7 text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg font-black">{t('farmer.calledTitle')}</p>
            <p className="mt-0.5 text-sm font-medium text-amber-50 leading-snug">{t('farmer.calledSub')}</p>
          </div>
        </div>
      )}

      {!loading && !error && (
        currentBooking ? (
          <BookingCard
            booking={currentBooking}
            t={t}
            onOpenPass={handleOpenActivePass}
          />
        ) : (
          <EmptyState t={t} />
        )
      )}

      {/* Multi-Slot Action: Add another slot when < 3 */}
      {currentBooking && activeCount < 3 && (
        <Link
          to="/farmer/book"
          className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-400 bg-emerald-50/60 px-4 text-xs font-bold text-emerald-900 transition hover:bg-emerald-100/70"
        >
          <CalendarPlus className="h-4 w-4 text-emerald-700" />
          <span>+ Book Another Slot ({activeCount}/3 slots active)</span>
        </Link>
      )}

      {currentBooking && !currentBooking.procurement && (
        <div className="flex items-center justify-between px-2 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1.5">
            <RefreshCw className="h-3.5 w-3.5 text-emerald-600 animate-spin" aria-hidden="true" />
            <span className="text-emerald-800 font-bold">⚡ Live Instant Sync</span>
          </span>
          <span className="text-[11px] text-slate-400">Server-Sent Events Active</span>
        </div>
      )}

      <AlertsPanel />

      <SeasonTracker />

      {/* Profile summary card with e-KYC, Bank DBT, and PM-Kisan Details */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-slate-900">
              {t('farmer.yourDetails')}
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Registered profile, government Aadhaar & bank records
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBankModal(true)}
              className="rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-950 hover:bg-emerald-100 transition shadow-2xs"
            >
              ⚙️ Manage Bank Account
            </button>
            <button
              type="button"
              onClick={() => setShowEkycModal(true)}
              className="rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-950 hover:bg-emerald-100 transition shadow-2xs"
            >
              {user?.ekyc_verified ? 'View e-KYC' : 'Verify e-KYC'}
            </button>
          </div>
        </div>

        <dl className="mt-4 divide-y divide-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm sm:text-base">
            <dt className="text-slate-600 font-medium">{t('auth.name')}</dt>
            <dd className="font-bold text-slate-900">{user.name}</dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm sm:text-base">
            <dt className="text-slate-600 font-medium">{t('auth.phone')}</dt>
            <dd className="font-mono font-bold text-slate-900">{user.phone}</dd>
          </div>
          {user.village && (
            <div className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm sm:text-base">
              <dt className="text-slate-600 font-medium">{t('auth.village')}</dt>
              <dd className="font-bold text-slate-900">{user.village}</dd>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm sm:text-base">
            <dt className="text-slate-600 font-medium">Aadhaar Number</dt>
            <dd className="font-bold text-slate-900">
              {user.aadhaar_no ? (
                <span className="font-mono text-emerald-950 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {user.aadhaar_no}
                </span>
              ) : (
                <span className="text-amber-800 font-semibold">Not Linked</span>
              )}
            </dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm sm:text-base">
            <dt className="text-slate-600 font-medium">Bank Account (DBT)</dt>
            <dd className="font-bold text-slate-900">
              {user.bank_account ? (
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-900">🏛️ {user.bank_name || 'State Bank of India'}</span>
                  <span className="font-mono text-emerald-950 font-extrabold bg-emerald-100/80 px-2 py-0.5 rounded-lg border border-emerald-300">
                    ••••{user.bank_account.slice(-4)}
                  </span>
                  <span className="text-slate-500 text-xs font-mono">({user.ifsc_code})</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowBankModal(true)}
                  className="font-bold text-emerald-800 underline hover:text-emerald-950"
                >
                  + Add Bank Account for DBT Payouts
                </button>
              )}
            </dd>
          </div>
          {user.pmkisan_id && (
            <div className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm sm:text-base">
              <dt className="text-slate-600 font-medium">PM-Kisan Beneficiary ID</dt>
              <dd className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                {user.pmkisan_id}
              </dd>
            </div>
          )}
        </dl>
      </section>

      {/* Bank Details Modal */}
      {showBankModal && (
        <BankDetailsModal
          farmer={user}
          onSaved={(updatedUser) => {
            if (setUser) setUser(updatedUser);
          }}
          onClose={() => setShowBankModal(false)}
        />
      )}

      {/* Printable Mandi Pass Modal (Item 9) */}
      {showPassModal && selectedPassBooking && (
        <PrintableTokenPass
          booking={selectedPassBooking}
          farmer={user}
          onClose={() => setShowPassModal(false)}
        />
      )}

      {/* SMS & WhatsApp Dispatch Log Modal (Item 6) */}
      {showSmsModal && (
        <SmsDispatchModal farmerId={user.id} onClose={() => setShowSmsModal(false)} />
      )}

      {/* Govt Aadhaar e-KYC Modal (Item 7) */}
      {showEkycModal && (
        <EkycModal
          farmer={user}
          onVerified={(updatedUser) => {
            if (setUser) setUser(updatedUser);
          }}
          onClose={() => setShowEkycModal(false)}
        />
      )}

      {/* All Bookings & History Modal (Item 13) */}
      {showHistoryModal && (
        <BookingHistoryModal
          onClose={() => setShowHistoryModal(false)}
          onSelectPass={(b) => {
            setSelectedPassBooking(b);
            setShowHistoryModal(false);
            setShowPassModal(true);
          }}
        />
      )}

      {/* AI Voice Booking Assistant — floating over page */}
      <VoiceAssistant />
    </AppShell>
  );
}

