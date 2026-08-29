import { useState } from 'react';
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
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AppShell from '../../layouts/AppShell.jsx';
import AlertsPanel from '../../components/AlertsPanel.jsx';
import SeasonTracker from '../../components/SeasonTracker.jsx';
import StageStepper from '../../components/StageStepper.jsx';
import QRCode from '../../components/QRCode.jsx';
import AgriServicesCard from '../../components/AgriServicesCard.jsx';
import VoiceAssistant from '../../components/VoiceAssistant.jsx';
import { api } from '../../services/api';
import { money } from '../../utils/money.js';
import { usePoll } from '../../hooks/usePoll.js';
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
          <Row label={t('receipt.txn')} value={<span className="font-mono text-xs font-bold text-slate-800">{p.txn_ref}</span>} />
        </dl>
      </div>
    </div>
  );
}

/** Digital Gate Pass with Scannable QR & Stepper */
function BookingCard({ booking, t }) {
  const closed = booking.status === 'CONFIRMED' || booking.status === 'REJECTED';
  const [printModal, setPrintModal] = useState(false);

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
            onClick={() => setPrintModal(true)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 hover:underline"
          >
            <Printer className="h-3 w-3" />
            <span>Print Pass Slip</span>
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

      {/* QR Code + Booking Particulars Grid */}
      <div className="mt-4 flex flex-col gap-4 rounded-2xl bg-slate-50/70 p-4 ring-1 ring-slate-200/60 sm:flex-row sm:items-center sm:justify-between">
        <dl className="flex-1 divide-y divide-slate-200/60 text-xs">
          <Row label={t('booking.centre')} value={booking.centre_name} />
          <Row label={t('booking.crop')} value={t(`crop.${booking.crop}`)} />
          <Row label={t('booking.quantity')} value={`${booking.quantity_qtl} ${t('booking.qtl')}`} />
          <Row label={t('booking.when')} value={`${booking.slot_date} · ${booking.slot_time}`} />
        </dl>
        <button
          type="button"
          onClick={() => setPrintModal(true)}
          title="Click to view full Gate Pass & QR Code"
          className="group flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 transition hover:border-emerald-500 hover:shadow-xs border-t sm:border-t-0 sm:border-l sm:pl-4"
        >
          <QRCode text={booking.token} size={84} />
          <span className="mt-1 text-[10px] font-bold text-emerald-800 group-hover:underline">
            🔍 Scan at Gate (Click)
          </span>
        </button>
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

      {/* Printable Slip Modal */}
      {printModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-slate-900">
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <p className="text-xs font-bold tracking-widest text-emerald-800 uppercase">ProcureFlow e-Pass</p>
              <p className="text-lg font-extrabold text-slate-900">{booking.centre_name}</p>
              <p className="text-xs text-slate-500">Ministry of Agriculture Verified Token</p>
            </div>
            <div className="my-4 flex flex-col items-center justify-center">
              <QRCode text={booking.token} size={110} />
              <p className="mt-2 font-mono text-2xl font-black text-emerald-950">{booking.token}</p>
            </div>
            <dl className="space-y-1 text-xs border-t border-dashed border-slate-300 pt-3">
              <div className="flex justify-between"><dt className="text-slate-500">Farmer:</dt><dd className="font-bold">{booking.farmer_name || 'Ramesh Patil'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Crop:</dt><dd className="font-bold">{t(`crop.${booking.crop}`)} ({booking.quantity_qtl} qtl)</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Slot:</dt><dd className="font-bold">{booking.slot_date} ({booking.slot_time})</dd></div>
            </dl>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-800"
              >
                Print Slip
              </button>
              <button
                type="button"
                onClick={() => setPrintModal(false)}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
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
  const { user } = useAuth();
  const { t } = useLanguage();

  const { data: booking, error, loading } = usePoll(() => api('/bookings/mine'), 4000, []);

  return (
    <AppShell title={`${t('farmer.hello')}, ${user.name}`} subtitle={user.village ? `Village: ${user.village}` : undefined}>
      {loading && <p className="text-sm font-medium text-slate-500 animate-pulse">{t('common.loading')}</p>}

      {error && (
        <div role="alert" className="rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-900 ring-1 ring-rose-200">
          {error}
        </div>
      )}

      {/* High-priority announcement when called */}
      {booking?.status === 'CALLED' && (
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

      {!loading && !error && (booking ? <BookingCard booking={booking} t={t} /> : <EmptyState t={t} />)}

      {booking && !booking.procurement && (
        <div className="flex items-center justify-between px-2 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1.5">
            <RefreshCw className="h-3.5 w-3.5 text-emerald-600 animate-spin" aria-hidden="true" />
            {t('farmer.live')}
          </span>
          <span className="text-[11px] text-slate-400">Syncing queue every 4s</span>
        </div>
      )}

      <AlertsPanel />

      <SeasonTracker />

      <AgriServicesCard />

      {/* Profile summary card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
          {t('farmer.yourDetails')}
        </h2>
        <dl className="mt-2 divide-y divide-slate-100 text-xs">
          <Row label={t('auth.name')} value={user.name} />
          <Row label={t('auth.phone')} value={user.phone} />
          {user.village && <Row label={t('auth.village')} value={user.village} />}
        </dl>
      </section>

      {/* AI Voice Booking Assistant — floating over page */}
      <VoiceAssistant />
    </AppShell>
  );
}
