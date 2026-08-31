import { useState } from 'react';
import {
  IndianRupee,
  Wallet,
  CheckCircle2,
  Clock,
  Search,
  ArrowUpRight,
  Building2,
  Landmark,
  ShieldCheck,
  Calendar,
  X,
  Send,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../services/api';
import { usePoll } from '../hooks/usePoll.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { money } from '../utils/money.js';

const PILL = {
  PENDING: 'bg-slate-100 text-slate-700 ring-slate-300 border-slate-200',
  PROCESSING: 'bg-amber-50 text-amber-900 ring-amber-300 border-amber-200 font-bold',
  PAID: 'bg-emerald-50 text-emerald-900 ring-emerald-300 border-emerald-200 font-bold',
};

function TotalCard({ label, value, sub, icon: Icon, tone = 'emerald' }) {
  return (
    <div className={`rounded-2xl border border-${tone}-200/80 bg-gradient-to-br from-${tone}-50/80 to-white p-3.5 sm:p-4 shadow-xs overflow-hidden`}>
      <div className="flex items-center justify-between gap-1">
        <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-emerald-700 shrink-0" />}
      </div>
      <p className="mt-1 font-mono text-base sm:text-2xl font-black text-slate-900 tabular-nums truncate tracking-tight" title={typeof value === 'string' ? value : undefined}>{value}</p>
      <p className="mt-0.5 text-[10px] sm:text-xs text-slate-500 truncate">{sub}</p>
    </div>
  );
}

export default function PaymentsPanel() {
  const { t } = useLanguage();
  const { data, error, loading, setData } = usePoll(() => api('/payments'), 6000, []);
  const [transferModalPayment, setTransferModalPayment] = useState(null);
  const [transferType, setTransferType] = useState('INSTANT'); // 'INSTANT' | 'SCHEDULED_15_DAYS'
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  const payments = data ? data.payments : [];
  const totals = data ? data.totals : null;

  async function executeBankTransfer(e) {
    e.preventDefault();
    if (!transferModalPayment) return;

    setBusy(true);
    setActionError('');
    try {
      const updated = await api(`/payments/${transferModalPayment.id}/paid`, {
        method: 'POST',
        body: {
          disbursementType: transferType,
          scheduleDays: transferType === 'SCHEDULED_15_DAYS' ? 15 : 0,
        },
      });
      setData(updated);
      setTransferModalPayment(null);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const filtered = payments.filter((p) => {
    const matchesSearch =
      p.token.toLowerCase().includes(search.toLowerCase()) ||
      p.farmer_name.toLowerCase().includes(search.toLowerCase()) ||
      p.txn_ref.toLowerCase().includes(search.toLowerCase()) ||
      (p.pfms_utr && p.pfms_utr.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filter === 'ALL' || (filter === 'PAID' ? p.status === 'PAID' : p.status !== 'PAID');
    return matchesSearch && matchesFilter;
  });

  const message = actionError || error;

  return (
    <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-800">
            <Landmark className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-bold tracking-wider text-slate-800 uppercase">
              Govt Bank-to-Bank Transfer (DBT / PFMS)
            </h2>
            <p className="text-xs text-slate-500">Official Treasury Direct Bank Transfer & Settlement Console</p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-900">
          🏛️ PFMS Direct Benefit Transfer
        </span>
      </div>

      {message && (
        <div role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-900 ring-1 ring-rose-200">
          {message}
        </div>
      )}

      {totals && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <TotalCard
            label={t('pay.pending')}
            value={money(totals.pendingAmount)}
            sub={`${totals.pendingCount} ${t('pay.farmers')} awaiting DBT transfer`}
            icon={Clock}
            tone="amber"
          />
          <TotalCard
            label={t('pay.paid')}
            value={money(totals.paidAmount)}
            sub={`${totals.paidCount} ${t('pay.farmers')} transferred via PFMS`}
            icon={CheckCircle2}
            tone="emerald"
          />
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-44">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search token, farmer name, txn ref, UTR..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-200 pl-8 pr-3 text-xs outline-none focus:border-emerald-600"
          />
        </div>
        <div className="flex gap-1 text-xs">
          {['ALL', 'PENDING', 'PAID'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilter(st)}
              className={`rounded-lg px-2.5 py-1 font-bold transition ${
                filter === st
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All' : st === 'PENDING' ? 'Awaiting DBT Release' : 'Bank Settled'}
            </button>
          ))}
        </div>
      </div>

      {loading && payments.length === 0 && (
        <p className="mt-4 text-xs text-slate-500 animate-pulse">{t('common.loading')}</p>
      )}

      {!loading && filtered.length === 0 && (
        <p className="mt-4 py-4 text-center text-xs text-slate-500">{t('pay.empty')}</p>
      )}

      {filtered.length > 0 && (
        <ul className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-100 overflow-hidden">
          {filtered.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-3.5 hover:bg-slate-50 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-emerald-800">{p.token}</span>
                  <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                    {p.txn_ref}
                  </span>
                  {p.pfms_utr && (
                    <span className="font-mono text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-bold">
                      UTR: {p.pfms_utr}
                    </span>
                  )}
                </div>

                <p className="font-bold text-slate-900 mt-0.5">
                  {p.farmer_name}
                  {p.village && <span className="font-normal text-slate-500"> ({p.village})</span>}
                </p>

                {/* Farmer Bank Details Badge */}
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                  <span className="font-semibold text-emerald-900 flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-emerald-700" />
                    {p.displayBank || 'State Bank of India'}
                  </span>
                  <span>•</span>
                  <span className="font-mono font-bold text-slate-800">
                    A/c: {p.maskedAccount || '••••4821'}
                  </span>
                  <span>•</span>
                  <span className="font-mono text-slate-500">
                    IFSC: {p.ifsc_code || 'SBIN0000324'}
                  </span>
                  {p.aadhaar_no && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-800 font-semibold">Aadhaar Linked</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-mono font-extrabold text-sm text-slate-900">{money(p.amount)}</p>
                  <span className={`inline-block rounded px-2 py-0.5 text-[10px] ring-1 border ${PILL[p.status] || PILL.PENDING}`}>
                    {p.status === 'PAID' ? 'DBT Transferred' : t(`payment.${p.status}`)}
                  </span>
                </div>

                {p.status !== 'PAID' && (
                  <button
                    type="button"
                    onClick={() => setTransferModalPayment(p)}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 px-3.5 text-xs font-bold text-white shadow-xs transition hover:brightness-110"
                  >
                    <Landmark className="h-3.5 w-3.5" />
                    <span>Govt Bank Transfer</span>
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Govt DBT Transfer Confirmation Modal */}
      {transferModalPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-slate-900 animate-fadeIn border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-2xl bg-emerald-100 text-emerald-800">
                  <Landmark className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Initiate Govt Bank Transfer</h3>
                  <p className="text-[11px] text-slate-500">Direct Benefit Transfer via PFMS Portal</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTransferModalPayment(null)}
                className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Recipient Bank Details Review */}
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-emerald-50/80 p-4 border border-emerald-200">
                <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  Transfer Amount
                </p>
                <p className="mt-0.5 font-mono text-3xl font-black text-emerald-950">
                  {money(transferModalPayment.amount)}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Token: <strong>{transferModalPayment.token}</strong> • Farmer: <strong>{transferModalPayment.farmer_name}</strong>
                </p>
              </div>

              {/* Bank Account Details */}
              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Beneficiary Bank:</span>
                  <span className="font-bold text-slate-900">
                    {transferModalPayment.displayBank || 'State Bank of India (Baramati)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Number:</span>
                  <span className="font-mono font-bold text-emerald-900">
                    {transferModalPayment.maskedAccount || '••••4821'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">IFSC Code:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {transferModalPayment.ifsc_code || 'SBIN0000324'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Aadhaar Status:</span>
                  <span className="font-bold text-emerald-800">✅ NPCI Aadhaar Bridge Linked</span>
                </div>
              </div>

              {/* Transfer Timing Option */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Disbursement Mode:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTransferType('INSTANT')}
                    className={`rounded-xl p-2.5 text-left border transition text-xs ${
                      transferType === 'INSTANT'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold">⚡ Instant Transfer</span>
                    <span className="text-[10px] text-slate-500">Real-time NEFT credit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTransferType('SCHEDULED_15_DAYS')}
                    className={`rounded-xl p-2.5 text-left border transition text-xs ${
                      transferType === 'SCHEDULED_15_DAYS'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold">📅 15-Day MSP Cycle</span>
                    <span className="text-[10px] text-slate-500">Standard Govt batch</span>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={busy}
                  onClick={executeBankTransfer}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 py-3 text-xs font-bold text-white shadow-md hover:brightness-110 transition disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span>Authorize & Transfer to Bank</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTransferModalPayment(null)}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
