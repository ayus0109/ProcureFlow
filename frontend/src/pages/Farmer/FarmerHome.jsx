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
  History,
  Smartphone,
  ShieldCheck,
  Building2,
  User,
  Users,
  Phone,
  FileCheck2,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AppShell from '../../layouts/AppShell.jsx';
import AlertsPanel from '../../components/AlertsPanel.jsx';
import SeasonTracker from '../../components/SeasonTracker.jsx';
import StageStepper from '../../components/StageStepper.jsx';
import KisanHelplineCard from '../../components/KisanHelplineCard.jsx';
import VoiceAssistant from '../../components/VoiceAssistant.jsx';
import DisputeButton from '../../components/DisputeButton.jsx';
import HelperAccountModal from '../../components/HelperAccountModal.jsx';
import SpeakButton from '../../components/ui/SpeakButton.jsx';
import OnlineStatus from '../../components/ui/OnlineStatus.jsx';
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

function DetailRow({ label, value, highlight = false, icon: Icon }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 gap-1 border-b border-slate-100 last:border-0 text-sm">
      <dt className="text-slate-500 font-semibold flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-slate-400 shrink-0" />}
        <span>{label}</span>
      </dt>
      <dd className={`text-base font-bold ${highlight ? 'text-emerald-900' : 'text-slate-900'}`}>
        {value}
      </dd>
    </div>
  );
}

function Stat({ label, value, sub, icon: Icon, color = 'emerald' }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-50 p-4 text-center border border-slate-200/80 shadow-2xs">
      <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
        {Icon && <Icon className="h-4 w-4 text-emerald-700" />}
        <span>{label}</span>
      </div>
      <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl tabular-nums">
        {value}
      </p>
      {sub && <p className="mt-1 text-xs font-medium text-slate-500">{sub}</p>}
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
      <div className="mt-4 rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-rose-900">
          <AlertTriangle className="h-6 w-6 text-rose-600 shrink-0" />
          <p className="text-base font-bold">{t('receipt.notAcceptedTitle')}</p>
        </div>
        <p className="mt-2 text-sm text-rose-800 bg-white/80 p-3 rounded-xl border border-rose-200">
          <strong>Reason:</strong> {p.remarks}
        </p>
        <dl className="mt-4 divide-y divide-rose-100 text-sm">
          <div className="flex justify-between py-2">
            <dt className="text-slate-600 font-medium">{t('receipt.grade')}</dt>
            <dd className="font-bold text-slate-900">{p.quality_grade}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-slate-600 font-medium">{t('receipt.moisture')}</dt>
            <dd className="font-bold text-slate-900">{p.moisture_pct}%</dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <div className="mt-5 overflow-hidden rounded-3xl border-2 border-emerald-600/30 bg-gradient-to-b from-emerald-50/80 to-white shadow-md">
      {/* Receipt Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 px-5 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            <span className="text-sm font-bold uppercase tracking-wider">
              {t('receipt.title')}
            </span>
          </div>
          <span className="font-mono text-xs font-bold text-emerald-200 bg-emerald-950/60 px-2.5 py-1 rounded-lg">
            {p.txn_ref}
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-emerald-100 pb-4">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t('receipt.amount')}
            </p>
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-emerald-950">
              {money(p.total_amount)}
            </p>
            <p className="mt-1 text-sm font-semibold text-emerald-700">{t('receipt.doneSub')}</p>
          </div>
          <div className="text-right">
            <span className={`inline-flex rounded-full px-3.5 py-1.5 text-xs font-extrabold ring-1 ${PAYMENT_STYLES[p.payment_status]}`}>
              {t(`payment.${p.payment_status}`)}
            </span>
          </div>
        </div>

        <dl className="mt-4 divide-y divide-slate-100 text-sm">
          <div className="flex justify-between py-2.5">
            <dt className="text-slate-600 font-medium">{t('receipt.grade')}</dt>
            <dd className="rounded-md bg-emerald-100 px-2.5 py-0.5 font-bold text-emerald-900">{p.quality_grade}</dd>
          </div>
          <div className="flex justify-between py-2.5">
            <dt className="text-slate-600 font-medium">{t('receipt.moisture')}</dt>
            <dd className="font-bold text-slate-900">{p.moisture_pct}%</dd>
          </div>
          <div className="flex justify-between py-2.5">
            <dt className="text-slate-600 font-medium">{t('receipt.weight')}</dt>
            <dd className="font-bold text-slate-900">{p.final_weight_qtl} {t('booking.qtl')}</dd>
          </div>
          {p.gradeFactor !== 1 && p.baseRatePerQtl && (
            <>
              <div className="flex justify-between py-2.5">
                <dt className="text-slate-600 font-medium">{t('receipt.baseRate')}</dt>
                <dd className="font-bold text-slate-900">{money(p.baseRatePerQtl)} / {t('booking.qtl')}</dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-slate-600 font-medium">{t('receipt.gradeAdj')}</dt>
                <dd className={`font-bold ${p.gradeFactor > 1 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {adjustment(p.gradeFactor)} ({p.gradeFactor > 1 ? 'Quality Bonus' : 'Deduction'})
                </dd>
              </div>
            </>
          )}
          <div className="flex justify-between py-2.5">
            <dt className="text-slate-600 font-medium">{t('receipt.rate')}</dt>
            <dd className="font-extrabold text-emerald-900 text-base">{money(p.rate_per_qtl)} / {t('booking.qtl')}</dd>
          </div>
          {p.credited_bank && (
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-600 font-medium">{t('receipt.dbtBank')}</dt>
              <dd className="font-bold text-emerald-950 flex items-center gap-1.5">
                <span>🏛️ {p.credited_bank}</span>
                <span className="font-mono text-xs text-slate-600">({p.credited_account || '••••4821'})</span>
              </dd>
            </div>
          )}
          {p.pfms_utr ? (
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-600 font-medium">{t('receipt.pfmsUtr')}</dt>
              <dd className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100/80 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                {p.pfms_utr}
              </dd>
            </div>
          ) : (
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-600 font-medium">{t('receipt.txn')}</dt>
              <dd className="font-mono text-xs font-bold text-slate-800">{p.txn_ref}</dd>
            </div>
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
              <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                {t('booking.token')}
              </p>
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                {t('booking.passBadge')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <p className="font-mono text-2xl font-extrabold tracking-tight text-emerald-950 sm:text-3xl">
                {booking.token}
              </p>
              <SpeakButton text={`Token ${booking.token}. Position ${booking.position}. Wait time ${booking.waitLabel}.`} />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 border ${STATUS_BADGES[booking.status] || 'bg-slate-100 text-slate-800'}`}>
            {t(`status.${booking.status}`)}
          </span>
          <button
            type="button"
            onClick={onOpenPass}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:underline"
          >
            <Printer className="h-4 w-4 text-emerald-700" />
            <span>{t('booking.printPass')}</span>
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
            sub={`${booking.farmersAhead || 0} ${t('booking.ahead')}`}
            icon={Clock}
          />
          <Stat
            label={t('booking.wait')}
            value={booking.waitLabel}
            sub={t('booking.waitSub')}
            icon={Clock}
          />
          <Stat
            label={t('booking.arriveBy')}
            value={booking.arriveBy || '—'}
            sub={t('booking.arriveBySub')}
            icon={Clock}
          />
        </div>
      )}

      {/* Booking Particulars */}
      <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/60">
        <dl className="divide-y divide-slate-200/60 text-sm">
          <div className="flex justify-between py-2">
            <dt className="text-slate-500 font-medium">{t('booking.centre')}</dt>
            <dd className="font-bold text-slate-900">{t(`centre.${booking.centre_id}`) || booking.centre_name}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-slate-500 font-medium">{t('booking.crop')}</dt>
            <dd className="font-bold text-slate-900">{t(`crop.${booking.crop}`)}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-slate-500 font-medium">{t('booking.quantity')}</dt>
            <dd className="font-bold text-slate-900">{booking.quantity_qtl} {t('booking.qtl')}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-slate-500 font-medium">{t('booking.when')}</dt>
            <dd className="font-bold text-slate-900">{booking.slot_date} · {booking.slot_time}</dd>
          </div>
        </dl>
      </div>

      {/* Completed Receipt */}
      {booking.procurement && <Receipt p={booking.procurement} t={t} />}

      {booking.status === 'REJECTED' && (
        <DisputeButton 
          bookingId={booking.id}
          currentStatus={booking.status}
          disputeStatus={booking.dispute_status}
          disputeResolution={booking.dispute_resolution}
        />
      )}

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
      <h2 className="mt-4 text-xl font-extrabold text-slate-900">{t('farmer.noSlotTitle')}</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600 leading-relaxed font-medium">
        {t('farmer.noSlotSub')}
      </p>
      <Link
        to="/farmer/book"
        className="mt-6 inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 px-7 text-base font-bold text-white shadow-md shadow-emerald-800/20 transition hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
      >
        <Sparkles className="h-5 w-5" />
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
  const [helperModalOpen, setHelperModalOpen] = useState(false);

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
      <div className="mb-4">
        <OnlineStatus />
      </div>
      {/* 🚀 ENLARGED Quick Actions Grid: All Bookings, Bank Account & DBT, SMS Log, e-KYC */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. All Bookings & History */}
        <button
          type="button"
          onClick={() => setShowHistoryModal(true)}
          className="flex items-center gap-3.5 rounded-3xl border-2 border-slate-200/80 bg-white p-4 text-left shadow-xs transition hover:border-emerald-500 hover:bg-emerald-50/40 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 group"
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-800 group-hover:scale-105 transition">
            <History className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold text-slate-900 group-hover:text-emerald-950">
              {t('action.allBookings')}
            </span>
            <span className="block text-xs font-medium text-slate-500 truncate">
              {t('action.allBookingsSub')}
            </span>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-emerald-600 transition" />
        </button>

        {/* 2. Bank Account & DBT */}
        <button
          type="button"
          onClick={() => setShowBankModal(true)}
          className="flex items-center gap-3.5 rounded-3xl border-2 border-emerald-300/80 bg-emerald-50/60 p-4 text-left shadow-xs transition hover:border-emerald-600 hover:bg-emerald-100/60 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 group"
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-700 text-white shadow-xs group-hover:scale-105 transition">
            <CreditCard className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold text-emerald-950">
              {t('action.bankDbt')}
            </span>
            <span className="block text-xs font-medium text-emerald-800 truncate">
              {user?.bank_account ? `🏛️ ${user.bank_name || t('action.bankDbtLinked')}` : `⚠️ ${t('action.bankDbtMissing')}`}
            </span>
          </div>
          <ChevronRight className="h-5 w-5 text-emerald-600 group-hover:translate-x-0.5 transition" />
        </button>

        {/* 3. SMS & WhatsApp Dispatch Log */}
        <button
          type="button"
          onClick={() => setShowSmsModal(true)}
          className="flex items-center gap-3.5 rounded-3xl border-2 border-slate-200/80 bg-white p-4 text-left shadow-xs transition hover:border-blue-500 hover:bg-blue-50/40 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 group"
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-100 text-blue-800 group-hover:scale-105 transition">
            <Smartphone className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold text-slate-900 group-hover:text-blue-950">
              {t('action.smsLog')}
            </span>
            <span className="block text-xs font-medium text-slate-500 truncate">
              {t('action.smsLogSub')}
            </span>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-blue-600 transition" />
        </button>

        {/* 4. Government e-KYC Verified */}
        <button
          type="button"
          onClick={() => setShowEkycModal(true)}
          className={`flex items-center gap-3.5 rounded-3xl border-2 p-4 text-left shadow-xs transition hover:shadow-md focus:outline-none focus-visible:ring-4 group ${
            user?.ekyc_verified
              ? 'border-emerald-300/80 bg-emerald-50/40 hover:border-emerald-500 hover:bg-emerald-100/50 focus-visible:ring-emerald-200'
              : 'border-amber-300/80 bg-amber-50/50 hover:border-amber-500 hover:bg-amber-100/60 focus-visible:ring-amber-200 animate-pulse'
          }`}
        >
          <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white shadow-xs group-hover:scale-105 transition ${
            user?.ekyc_verified ? 'bg-emerald-600' : 'bg-amber-500'
          }`}>
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className={`block text-sm font-extrabold ${user?.ekyc_verified ? 'text-emerald-950' : 'text-amber-950'}`}>
              {user?.ekyc_verified ? t('action.ekycVerified') : t('action.ekycPending')}
            </span>
            <span className="block text-xs font-medium text-slate-500 truncate">
              {user?.ekyc_verified ? t('action.ekycSubVerified') : t('action.ekycSubPending')}
            </span>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-0.5 transition" />
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
        <div className="flex items-center justify-between gap-2 overflow-x-auto rounded-2xl bg-slate-100 p-2">
          <div className="flex gap-2 overflow-x-auto">
            {allBookings.map((b, idx) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedSlotIdx(idx)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold transition ${
                  selectedSlotIdx === idx
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <span className="font-mono">{b.token}</span>
                <span className="text-xs font-medium opacity-85">({t(`crop.${b.crop}`)})</span>
              </button>
            ))}
          </div>

          <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-extrabold text-emerald-800 shrink-0">
            {activeCount}/3 {t('farmer.slotsActive')}
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
          className="flex min-h-13 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-400 bg-emerald-50/60 px-4 text-sm font-extrabold text-emerald-900 transition hover:bg-emerald-100/70"
        >
          <CalendarPlus className="h-5 w-5 text-emerald-700" />
          <span>+ {t('farmer.bookAnother')} ({activeCount}/3 {t('farmer.slotsActive')})</span>
        </Link>
      )}

      <AlertsPanel />

      <SeasonTracker />

      {/* 👤 ENLARGED Farmer Profile Summary with Simple, Clear Typography */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-100 text-emerald-800">
              <User className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                {t('farmer.yourDetails')}
              </h2>
              <p className="text-xs font-medium text-slate-500">
                {t('farmer.profileSub')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setHelperModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-900 hover:bg-blue-100 transition shadow-2xs"
            >
              <Users className="h-4 w-4 text-blue-700" />
              <span>Family Helpers</span>
            </button>
          </div>
        </div>

        <dl className="mt-2 divide-y divide-slate-100">
          <DetailRow label={t('auth.name')} value={user.name} icon={User} />
          <DetailRow label={t('auth.phone')} value={user.phone} icon={Phone} />
          {user.village && (
            <DetailRow label={t('auth.village')} value={`${user.village} (Maharashtra)`} icon={MapPin} />
          )}
          <DetailRow
            label={t('farmer.aadhaar')}
            icon={ShieldCheck}
            value={
              user.aadhaar_no ? (
                <span className="flex items-center gap-2">
                  <span className="font-mono text-slate-900 font-bold">{user.aadhaar_no}</span>
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-extrabold text-emerald-800 border border-emerald-200">
                    {t('common.verified')}
                  </span>
                </span>
              ) : (
                <span className="text-amber-800 font-bold">{t('common.notLinked')}</span>
              )
            }
          />
          <DetailRow
            label={t('farmer.bankDbt')}
            icon={CreditCard}
            value={
              user.bank_account ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-900">🏛️ {user.bank_name || 'State Bank of India'}</span>
                  <span className="font-mono text-sm text-emerald-900 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    ••••{user.bank_account.slice(-4)}
                  </span>
                  <span className="text-xs font-mono text-slate-500">IFSC: {user.ifsc_code}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowBankModal(true)}
                  className="font-bold text-emerald-700 underline text-sm"
                >
                  {t('farmer.addBankPrompt')}
                </button>
              )
            }
          />
          {user.pmkisan_id && (
            <DetailRow
              label={t('farmer.pmkisan')}
              icon={FileCheck2}
              value={<span className="font-mono font-bold text-slate-800">{user.pmkisan_id}</span>}
            />
          )}
          {user.land_acres && (
            <DetailRow
              label={t('farmer.landHolding')}
              icon={Building2}
              value={<span className="font-bold text-slate-900">{user.land_acres} {t('farmer.acres')}</span>}
            />
          )}
        </dl>
      </section>

      {/* Dedicated Kisan Helpline & Support Card positioned under Your details */}
      <KisanHelplineCard />

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

      {/* Printable Mandi Pass Modal */}
      {showPassModal && selectedPassBooking && (
        <PrintableTokenPass
          booking={selectedPassBooking}
          farmer={user}
          onClose={() => setShowPassModal(false)}
        />
      )}

      {/* SMS & WhatsApp Dispatch Log Modal */}
      {showSmsModal && (
        <SmsDispatchModal farmerId={user.id} onClose={() => setShowSmsModal(false)} />
      )}

      {/* Govt Aadhaar e-KYC Modal */}
      {showEkycModal && (
        <EkycModal
          farmer={user}
          onVerified={(updatedUser) => {
            if (setUser) setUser(updatedUser);
          }}
          onClose={() => setShowEkycModal(false)}
        />
      )}

      {/* All Bookings & History Modal */}
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

      {/* Helper Account Modal */}
      <HelperAccountModal open={helperModalOpen} onClose={() => setHelperModalOpen(false)} />

      {/* AI Voice Booking Assistant — floating over page */}
      <VoiceAssistant />
    </AppShell>
  );
}
