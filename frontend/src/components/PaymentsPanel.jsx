import { useState } from 'react';
import { IndianRupee, Wallet, CheckCircle2, Clock, Search, ArrowUpRight, Building2 } from 'lucide-react';
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
    <div className={`rounded-2xl border border-${tone}-200/80 bg-gradient-to-br from-${tone}-50/80 to-white p-4 shadow-xs`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-emerald-700" />}
      </div>
      <p className="mt-1 font-mono text-2xl font-black text-slate-900 tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
    </div>
  );
}

export default function PaymentsPanel() {
  const { t } = useLanguage();
  const { data, error, loading, setData } = usePoll(() => api('/payments'), 6000, []);
  const [busyId, setBusyId] = useState(0);
  const [actionError, setActionError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  const payments = data ? data.payments : [];
  const totals = data ? data.totals : null;

  async function release(paymentId) {
    setBusyId(paymentId);
    setActionError('');
    try {
      setData(await api(`/payments/${paymentId}/paid`, { method: 'POST' }));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(0);
    }
  }

  const filtered = payments.filter((p) => {
    const matchesSearch =
      p.token.toLowerCase().includes(search.toLowerCase()) ||
      p.farmer_name.toLowerCase().includes(search.toLowerCase()) ||
      p.txn_ref.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || (filter === 'PAID' ? p.status === 'PAID' : p.status !== 'PAID');
    return matchesSearch && matchesFilter;
  });

  const message = actionError || error;

  return (
    <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-800">
            <Wallet className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-bold tracking-wider text-slate-800 uppercase">
              {t('pay.title')}
            </h2>
            <p className="text-xs text-slate-500">DBT / PFMS Payout confirmation panel</p>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
          Today's Settlements
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
            sub={`${totals.pendingCount} ${t('pay.farmers')} awaiting release`}
            icon={Clock}
            tone="amber"
          />
          <TotalCard
            label={t('pay.paid')}
            value={money(totals.paidAmount)}
            sub={`${totals.paidCount} ${t('pay.farmers')} settled`}
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
            placeholder="Search token, name, txn ref..."
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
              {st === 'ALL' ? 'All' : st === 'PENDING' ? 'Awaiting Payout' : 'Paid'}
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
                </div>
                <p className="font-bold text-slate-900 mt-0.5">
                  {p.farmer_name}
                  {p.village && <span className="font-normal text-slate-500"> ({p.village})</span>}
                </p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  {t(`crop.${p.crop}`)} • {p.final_weight_qtl} qtl
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-mono font-extrabold text-sm text-slate-900">{money(p.amount)}</p>
                  <span className={`inline-block rounded px-2 py-0.5 text-[10px] ring-1 border ${PILL[p.status] || PILL.PENDING}`}>
                    {t(`payment.${p.status}`)}
                  </span>
                </div>

                {p.status !== 'PAID' && (
                  <button
                    type="button"
                    onClick={() => release(p.id)}
                    disabled={busyId === p.id}
                    className="inline-flex min-h-9 items-center gap-1 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 px-3.5 text-xs font-bold text-white shadow-xs transition hover:brightness-110 disabled:opacity-50"
                  >
                    <span>{busyId === p.id ? t('pay.releasing') : t('pay.markPaid')}</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
