import { IndianRupee, Wallet, TrendingUp, CheckCircle, Clock, Award } from 'lucide-react';
import { api } from '../services/api';
import { usePoll } from '../hooks/usePoll.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { money } from '../utils/money.js';

function adjustment(factor) {
  if (!factor || factor === 1) return '';
  const pct = Math.round(Math.abs(1 - factor) * 100);
  return `${factor > 1 ? '+' : '−'}${pct}%`;
}

export default function SeasonTracker() {
  const { t } = useLanguage();
  const { data } = usePoll(() => api('/bookings/summary'), 10000, []);

  if (!data || data.sales === 0) return null;

  const paidPct = data.earned > 0 ? Math.round((data.paid / data.earned) * 100) : 100;

  return (
    <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-800">
            <Wallet className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-bold tracking-wider text-slate-800 uppercase">
              {t('tracker.title')}
            </h2>
            <p className="text-xs text-slate-500">Official seasonal sales & DBT payout ledger</p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
          Kharif / Rabi 2026
        </span>
      </div>

      <div className="mt-4 space-y-4">
        {/* Total Revenue Hero Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-4 sm:p-5 text-white shadow-md">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-200 uppercase tracking-wider truncate">
              <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="truncate">{t('tracker.earned')}</span>
            </span>
            <span className="font-mono text-[11px] sm:text-xs text-emerald-200 bg-emerald-950/60 px-2 py-0.5 rounded shrink-0">
              {data.sales} Confirmed Sale{data.sales > 1 ? 's' : ''}
            </span>
          </div>
          <p className="mt-2 font-mono text-2xl sm:text-4xl font-black tracking-tight truncate">
            {money(data.earned)}
          </p>

          {/* Payout Progress Bar */}
          <div className="mt-3 sm:mt-4">
            <div className="flex flex-wrap justify-between text-[11px] sm:text-xs font-medium text-emerald-100 mb-1 gap-1">
              <span className="truncate">Paid Out: <strong>{money(data.paid)}</strong> ({paidPct}%)</span>
              <span className="truncate">Awaiting: <strong>{money(data.awaiting)}</strong></span>
            </div>
            <div className="h-2 w-full rounded-full bg-emerald-950/80 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-500"
                style={{ width: `${paidPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3 text-center overflow-hidden">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase block truncate">{t('tracker.paid')}</span>
            <p className="mt-0.5 font-mono text-xs sm:text-base font-extrabold text-emerald-900 truncate" title={money(data.paid)}>{money(data.paid)}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3 text-center overflow-hidden">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase block truncate">{t('tracker.awaiting')}</span>
            <p className={`mt-0.5 font-mono text-xs sm:text-base font-extrabold truncate ${data.awaiting > 0 ? 'text-amber-700' : 'text-slate-700'}`} title={money(data.awaiting)}>
              {money(data.awaiting)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3 text-center overflow-hidden">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase block truncate">{t('tracker.sales')}</span>
            <p className="mt-0.5 font-mono text-xs sm:text-base font-extrabold text-slate-900 truncate">{data.sales}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3 text-center overflow-hidden">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase block truncate">{t('tracker.qtlSold')}</span>
            <p className="mt-0.5 font-mono text-xs sm:text-base font-extrabold text-slate-900 truncate">
              {Number(data.qtlSold || 0).toLocaleString('en-IN', { maximumFractionDigits: 1 })} qtl
            </p>
          </div>
        </div>

        {/* Grade-wise Breakdown */}
        {data.byGrade.length > 0 && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5">
            <h3 className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              <Award className="h-3.5 w-3.5 text-emerald-700" />
              {t('tracker.byGrade')} (Quality Distribution)
            </h3>
            <ul className="divide-y divide-slate-200/60 text-xs">
              {data.byGrade.map((g) => (
                <li key={g.grade} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-white px-2 py-0.5 font-bold text-slate-900 border border-slate-200">
                      {g.grade}
                    </span>
                    {adjustment(g.factor) && (
                      <span className={`font-bold ${g.factor > 1 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {adjustment(g.factor)}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 font-medium">
                      {Number(g.qtlSold || 0).toLocaleString('en-IN', { maximumFractionDigits: 1 })} {t('booking.qtl')}
                    </span>
                    <span className="font-mono font-bold text-slate-900 ml-2">{money(g.earned)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
