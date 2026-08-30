import { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  RefreshCw,
  Search,
  Users,
  Clock,
  Calendar,
  Layers,
  Sparkles,
  SlidersHorizontal,
  Building2,
  Phone,
  MapPin,
  Flame,
  X,
  BarChart3,
  Smartphone,
  CreditCard,
} from 'lucide-react';
import AppShell from '../../layouts/AppShell.jsx';
import CongestionBadge from '../../components/CongestionBadge.jsx';
import ProcurementDialog from '../../components/ProcurementDialog.jsx';
import PaymentsPanel from '../../components/PaymentsPanel.jsx';
import { AdminAnalytics } from '../../components/AdminAnalytics.jsx';
import { SmsDispatchModal } from '../../components/SmsDispatchModal.jsx';
import { api } from '../../services/api';
import { usePoll } from '../../hooks/usePoll.js';
import { useLiveEvents } from '../../hooks/useLiveEvents.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useLanguage } from '../../i18n/LanguageContext.jsx';
import { money } from '../../utils/money.js';

const STAGE_STYLES = {
  BOOKED: 'bg-blue-50 text-blue-800 ring-blue-200 border-blue-200',
  WAITING: 'bg-emerald-50 text-emerald-800 ring-emerald-200 border-emerald-200',
  CALLED: 'bg-amber-100 text-amber-950 ring-amber-300 border-amber-300 animate-pulse font-bold',
  CHECKED_IN: 'bg-teal-50 text-teal-800 ring-teal-200 border-teal-200',
  ASSAYING: 'bg-purple-50 text-purple-800 ring-purple-200 border-purple-200',
  WEIGHMENT: 'bg-indigo-50 text-indigo-800 ring-indigo-200 border-indigo-200',
};

function StatCard({ label, value, sub, icon: Icon, color = 'emerald' }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
        {Icon && (
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-800">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl tabular-nums">
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[11px] font-medium text-slate-500">{sub}</p>}
    </div>
  );
}

function QueueRow({ row, t, onAdvance, onRecord, busy }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 p-4 transition hover:bg-slate-50/80">
      <div className="flex items-center gap-3">
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-sm font-black shadow-xs ${
            row.atCounter
              ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
              : 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white'
          }`}
          title={row.atCounter ? t('admin.atCounter') : undefined}
        >
          {row.atCounter ? '⚡' : `#${row.position}`}
        </span>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-extrabold text-emerald-950">{row.token}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 border ${
                STAGE_STYLES[row.status] || 'bg-slate-100 text-slate-700'
              }`}
            >
              {t(`stage.${row.status}`) || row.status}
            </span>
          </div>

          <p className="text-sm font-bold text-slate-900 mt-0.5">
            {row.farmer_name}
            {row.village && <span className="text-xs font-normal text-slate-500"> ({row.village})</span>}
          </p>

          <p className="text-xs text-slate-500 mt-0.5">
            {t(`crop.${row.crop}`)} • <span className="font-semibold text-slate-700">{row.quantity_qtl} {t('booking.qtl')}</span> • Slot: <span className="font-mono">{row.slot_time}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {row.nextStatus ? (
          <button
            type="button"
            onClick={() => onAdvance(row.id)}
            disabled={busy}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 px-4 text-xs font-bold text-white shadow-xs transition hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:opacity-50"
          >
            <span>{t(`action.${row.nextStatus}`) || `Advance to ${row.nextStatus}`}</span>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onRecord(row)}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 text-xs font-bold text-white shadow-xs transition hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200"
          >
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            <span>{t('admin.recordProcurement')}</span>
          </button>
        )}
      </div>
    </li>
  );
}

export default function AdminHome() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const { data, error, loading, setData } = usePoll(() => api('/queue'), 4000, []);
  const [busyId, setBusyId] = useState(0);
  const [actionError, setActionError] = useState('');
  const [dialogRow, setDialogRow] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const [grades, setGrades] = useState([]);
  const [gradeFactors, setGradeFactors] = useState({});
  const [activeTab, setActiveTab] = useState('QUEUE'); // 'QUEUE' | 'ANALYTICS' | 'PAYMENTS'
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [quotaModal, setQuotaModal] = useState(false);
  const [quotaForm, setQuotaForm] = useState({
    daily_target_qtl: 500,
    max_qty_per_farmer: 50,
    daily_capacity: 120,
    slot_capacity: 10,
    active_counters: 2,
    accepted_crops: ['WHEAT', 'PADDY', 'COTTON', 'SOYBEAN', 'TUR'],
    max_moisture_pct: 12.0,
    min_quality_grade: 'FAQ',
  });
  const [quotaSaving, setQuotaSaving] = useState(false);

  useEffect(() => {
    api('/reference')
      .then((ref) => {
        setGrades(ref.qualityGrades);
        setGradeFactors(ref.gradeFactors || {});
      })
      .catch(() => setGrades([]));
  }, []);

  // Real-time SSE listener (Item 8)
  useLiveEvents(
    useCallback(
      (event) => {
        if (event.type === 'QUEUE_UPDATED' || event.type === 'PAYMENT_UPDATED') {
          api('/queue')
            .then((res) => setData(res))
            .catch(() => {});
        }
      },
      [setData]
    )
  );

  const centre = data ? data.centre : null;
  const queue = data ? data.queue : [];

  async function advance(bookingId) {
    setBusyId(bookingId);
    setActionError('');
    try {
      setData(await api(`/queue/${bookingId}/advance`, { method: 'POST' }));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(0);
    }
  }

  function finish(result) {
    setData(result);
    setOutcome(result.completed || result.rejected || null);
    setDialogRow(null);
  }

  // Filtered queue items
  const filteredQueue = queue.filter((r) => {
    const matchesSearch =
      r.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.farmer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.village && r.village.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const message = actionError || error;

  return (
    <AppShell title={user.centre_name} subtitle={`Officer: ${user.name} • Code: ${user.admin_code}`}>
      {/* 🚀 ENLARGED & DEDUPLICATED EXECUTIVE NAVIGATION TABS */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-100/90 p-1.5 border border-slate-200/80 shadow-2xs">
          {/* 1. Live Queue */}
          <button
            type="button"
            onClick={() => setActiveTab('QUEUE')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-black transition-all ${
              activeTab === 'QUEUE'
                ? 'bg-white text-emerald-950 shadow-md ring-1 ring-slate-200/80'
                : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
            }`}
          >
            <Users className="h-4 w-4 text-emerald-700" />
            <span>Live Queue</span>
            {queue.length > 0 && (
              <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-mono font-black text-emerald-900 border border-emerald-200">
                {queue.length}
              </span>
            )}
          </button>

          {/* 2. APMC Analytics & CSV */}
          <button
            type="button"
            onClick={() => setActiveTab('ANALYTICS')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-black transition-all ${
              activeTab === 'ANALYTICS'
                ? 'bg-white text-emerald-950 shadow-md ring-1 ring-slate-200/80'
                : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
            }`}
          >
            <BarChart3 className="h-4 w-4 text-emerald-700" />
            <span>APMC Analytics & CSV</span>
          </button>

          {/* 3. DBT Payments */}
          <button
            type="button"
            onClick={() => setActiveTab('PAYMENTS')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-black transition-all ${
              activeTab === 'PAYMENTS'
                ? 'bg-white text-emerald-950 shadow-md ring-1 ring-slate-200/80'
                : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
            }`}
          >
            <CreditCard className="h-4 w-4 text-emerald-700" />
            <span>DBT Payments</span>
          </button>

          {/* 4. SMS & WhatsApp Log */}
          <button
            type="button"
            onClick={() => setShowSmsModal(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-black text-slate-700 hover:text-blue-950 hover:bg-white/60 transition-all"
          >
            <Smartphone className="h-4 w-4 text-blue-700" />
            <span>SMS & WhatsApp Log</span>
          </button>
        </div>
      </div>
      {/* Toast Announcement for completed/rejected sale */}
      {outcome && (
        <div
          role="status"
          className={`flex items-start gap-3 rounded-2xl p-4 shadow-sm ring-1 animate-fadeIn ${
            outcome.txnRef
              ? 'bg-emerald-50 text-emerald-900 ring-emerald-300'
              : 'bg-rose-50 text-rose-900 ring-rose-300'
          }`}
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">
              {outcome.txnRef ? t('proc.doneTitle') : t('proc.rejectedTitle')}
              {' — '}
              <span className="font-mono">{outcome.token}</span>
            </p>
            <p className="mt-0.5 text-xs">
              {outcome.txnRef
                ? `${outcome.netWeightQtl} qtl • ${outcome.qualityGrade} • ${money(outcome.totalAmount)} • Ref: ${outcome.txnRef}`
                : outcome.reason}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOutcome(null)}
            className="text-xs font-bold underline"
          >
            {t('common.dismiss')}
          </button>
        </div>
      )}

      {/* Tab Content: ANALYTICS */}
      {activeTab === 'ANALYTICS' && (
        <AdminAnalytics centreId={user.centre_id} />
      )}

      {/* Tab Content: PAYMENTS */}
      {activeTab === 'PAYMENTS' && (
        <PaymentsPanel />
      )}

      {/* Tab Content: QUEUE */}
      {activeTab === 'QUEUE' && (
        <>
          {/* Centre Cockpit Overview */}
          <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-700" />
                <h2 className="text-sm font-bold tracking-wider text-slate-800 uppercase">
                  {t('admin.today')}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {centre && <CongestionBadge level={centre.congestion} />}
                <button
                  type="button"
                  onClick={() => {
                    setQuotaForm({
                      daily_target_qtl: centre?.daily_target_qtl || 500,
                      max_qty_per_farmer: centre?.max_qty_per_farmer || 50,
                      daily_capacity: centre?.daily_capacity || 120,
                      slot_capacity: centre?.slot_capacity || 10,
                      active_counters: centre?.active_counters || 2,
                      accepted_crops: centre?.accepted_crops_list || ['WHEAT', 'PADDY', 'COTTON', 'SOYBEAN', 'TUR'],
                      max_moisture_pct: centre?.max_moisture_pct || 12.0,
                      min_quality_grade: centre?.min_quality_grade || 'FAQ',
                    });
                    setQuotaModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50/80 px-3 py-1 text-xs font-bold text-emerald-900 transition hover:bg-emerald-100"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>⚙️ Configure Centre Crops & Slots</span>
                </button>
              </div>
            </div>

            {message && (
              <div role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-900 ring-1 ring-rose-200">
                {message}
              </div>
            )}

            {loading && !centre && <p className="mt-3 text-xs text-slate-500 animate-pulse">{t('common.loading')}</p>}

            {centre && (
              <>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatCard label={t('admin.bookedToday')} value={centre.booked_today} sub="Total slots reserved" icon={Calendar} />
                  <StatCard label={t('admin.inQueue')} value={centre.in_queue} sub="Waiting for counter" icon={Users} />
                  <StatCard label={t('admin.wait')} value={centre.waitLabel} sub="Based on active counters" icon={Clock} />
                  <StatCard label={t('admin.slotsLeft')} value={centre.slotsLeft} sub={`Capacity: ${centre.daily_capacity} / day`} icon={Layers} />
                </div>

                {/* Live Configured Requirements Strip */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3.5 text-xs border border-slate-200/80">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                    <span>🌾 Accepted Crops:</span>
                    <div className="flex flex-wrap gap-1">
                      {(centre.accepted_crops_list || []).map((ck) => (
                        <span key={ck} className="rounded-md bg-emerald-100 px-1.5 py-0.5 font-bold text-emerald-950">
                          {t(`crop.${ck}`)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                    <span>🎯 Target:</span>
                    <span className="font-mono text-emerald-800">{centre.daily_target_qtl || 500} qtl</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                    <span>⚖️ Max / Farmer:</span>
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-mono text-emerald-950">
                      {centre.max_qty_per_farmer || 50} qtl
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                    <span>⏰ Slot Rate:</span>
                    <span className="font-mono text-slate-800">{centre.slot_capacity || 10} / hr</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                    <span>🔬 Max Moisture:</span>
                    <span className="font-mono text-amber-800">{centre.max_moisture_pct || 12.0}%</span>
                  </div>
                </div>
              </>
            )}
          </section>

          {/* Live Queue Management Table */}
          <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50/60 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-emerald-700" />
                    <h2 className="text-base font-bold text-slate-900">
                      {t('admin.queue')}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage farmer stages from entry to weighment and assaying
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>⚡ Instant Live Sync</span>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search token, farmer name, village..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                {/* Quick Status Filter Tabs */}
                <div className="flex gap-1 overflow-x-auto text-xs">
                  {['ALL', 'WAITING', 'CALLED', 'CHECKED_IN'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`rounded-lg px-2.5 py-1.5 font-bold transition ${
                        statusFilter === st
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {st === 'ALL' ? 'All' : st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {!loading && filteredQueue.length === 0 && (
              <div className="p-8 text-center text-xs font-medium text-slate-500">
                {queue.length === 0 ? t('admin.emptyQueue') : 'No bookings matched your search query.'}
              </div>
            )}

            {filteredQueue.length > 0 && (
              <ul className="divide-y divide-slate-100">
                {filteredQueue.map((row) => (
                  <QueueRow
                    key={row.id}
                    row={row}
                    t={t}
                    onAdvance={advance}
                    onRecord={setDialogRow}
                    busy={busyId === row.id}
                  />
                ))}
              </ul>
            )}
          </section>

          {/* Payments Ledger Panel */}
          <PaymentsPanel />
        </>
      )}

      {/* SMS & WhatsApp Dispatch Log Modal (Item 6) */}
      {showSmsModal && (
        <SmsDispatchModal onClose={() => setShowSmsModal(false)} />
      )}

      {/* Procurement Modal */}
      {dialogRow && (
        <ProcurementDialog
          row={dialogRow}
          grades={grades}
          gradeFactors={gradeFactors}
          onClose={() => setDialogRow(null)}
          onDone={finish}
        />
      )}

      {/* Centre Capacity & Quota Management Modal */}
      {quotaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl text-slate-900 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-2xl bg-emerald-100 text-emerald-800">
                  <SlidersHorizontal className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Centre Capacity & Quota Management</h3>
                  <p className="text-[11px] text-slate-500">Configure daily requirements, farmer limits & slot quotas</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuotaModal(false)}
                className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setQuotaSaving(true);
                try {
                  const updated = await api(`/centres/${user.centre_id}`, {
                    method: 'PATCH',
                    body: quotaForm,
                  });
                  setData((prev) => (prev ? { ...prev, centre: { ...prev.centre, ...updated } } : prev));
                  setQuotaModal(false);
                } catch (err) {
                  setActionError(err.message);
                } finally {
                  setQuotaSaving(false);
                }
              }}
              className="mt-4 space-y-4 text-xs"
            >
              {/* 1. Accepted Crops Configuration */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                  🌾 Accepted Procurement Crops (Mandatory for APMC)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'WHEAT', label: 'Wheat 🌾' },
                    { key: 'PADDY', label: 'Paddy 🍚' },
                    { key: 'COTTON', label: 'Cotton ☁️' },
                    { key: 'SOYBEAN', label: 'Soybean 🌱' },
                    { key: 'TUR', label: 'Tur 🌿' },
                  ].map((c) => {
                    const currentList = Array.isArray(quotaForm.accepted_crops)
                      ? quotaForm.accepted_crops
                      : (quotaForm.accepted_crops || '').split(',').map((s) => s.trim());
                    const isChecked = currentList.includes(c.key);

                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => {
                          const next = isChecked
                            ? currentList.filter((k) => k !== c.key)
                            : [...currentList, c.key];
                          if (next.length === 0) return; // Must accept at least one crop
                          setQuotaForm((f) => ({ ...f, accepted_crops: next }));
                        }}
                        className={`rounded-xl px-3 py-2 font-bold transition border text-xs flex items-center gap-1.5 ${
                          isChecked
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{isChecked ? '✓' : '+'}</span>
                        <span>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1 text-[10px] text-slate-500">
                  Farmers booking slots at this centre will only see and choose from these accepted crops
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    🎯 Daily Target Requirement (Quintals)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    step="10"
                    value={quotaForm.daily_target_qtl}
                    onChange={(e) => setQuotaForm((f) => ({ ...f, daily_target_qtl: Number(e.target.value) }))}
                    className="h-10 w-full rounded-xl border border-slate-300 px-3 font-mono font-bold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                    required
                  />
                  <p className="mt-0.5 text-[10px] text-slate-500">Total grain target for this APMC centre</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    ⚖️ Max Limit per Farmer (Quintals)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    step="1"
                    value={quotaForm.max_qty_per_farmer}
                    onChange={(e) => setQuotaForm((f) => ({ ...f, max_qty_per_farmer: Number(e.target.value) }))}
                    className="h-10 w-full rounded-xl border border-slate-300 px-3 font-mono font-bold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                    required
                  />
                  <p className="mt-0.5 text-[10px] text-slate-500">Max quintals allowed per individual booking</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    ⏰ Slot Rate (Farmers / Hour)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={quotaForm.slot_capacity}
                    onChange={(e) => setQuotaForm((f) => ({ ...f, slot_capacity: Number(e.target.value) }))}
                    className="h-10 w-full rounded-xl border border-slate-300 px-3 font-mono font-bold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                    required
                  />
                  <p className="mt-0.5 text-[10px] text-slate-500">Hourly window capacity</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    🔬 Max Permissible Moisture (%)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="25"
                    step="0.1"
                    value={quotaForm.max_moisture_pct}
                    onChange={(e) => setQuotaForm((f) => ({ ...f, max_moisture_pct: Number(e.target.value) }))}
                    className="h-10 w-full rounded-xl border border-slate-300 px-3 font-mono font-bold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                    required
                  />
                  <p className="mt-0.5 text-[10px] text-slate-500">Standard FAQ threshold (usually 12.0%)</p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    ⏱️ Active Weighbridge Counters
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setQuotaForm((f) => ({ ...f, active_counters: cnt }))}
                        className={`flex-1 rounded-xl py-2 font-bold transition border ${
                          quotaForm.active_counters === cnt
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {cnt} {cnt === 1 ? 'Counter' : 'Counters'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-2 border-t border-slate-100 pt-3">
                <button
                  type="submit"
                  disabled={quotaSaving}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 py-3 text-xs font-bold text-white shadow-md transition hover:brightness-110 disabled:opacity-60"
                >
                  {quotaSaving ? 'Saving Configuration…' : 'Save Centre Requirements & Quotas'}
                </button>
                <button
                  type="button"
                  onClick={() => setQuotaModal(false)}
                  className="rounded-2xl border border-slate-200 px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
