/**
 * Official APMC Procurement & Quality Assay Dialog
 *
 * Real-time dynamic math calculator showing base rate, quality grade adjustment
 * (+5% premium for Grade A, -5% for Grade B, -10% for Below FAQ), net weight,
 * and server-enforced total payable amount.
 */

import { useEffect, useState } from 'react';
import { Ban, Check, X, FlaskConical, Scale, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { money } from '../utils/money.js';

const round2 = (n) => Math.round(n * 100) / 100;

export default function ProcurementDialog({ row, grades, gradeFactors, onClose, onDone }) {
  const { t } = useLanguage();

  const [grade, setGrade] = useState(grades[0] || 'FAQ');
  const [moisture, setMoisture] = useState('');
  const [weight, setWeight] = useState(String(row.quantity_qtl));
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const ceiling = round2(row.quantity_qtl * 1.1);
  const qty = Number(weight);
  const factor = (gradeFactors && gradeFactors[grade]) ?? 1;
  const gradedRate = round2(row.ratePerQtl * factor);
  const amount = qty > 0 ? round2(qty * gradedRate) : 0;
  const rateDiff = round2(gradedRate - row.ratePerQtl);

  async function submit(kind) {
    setBusy(kind);
    setError('');
    try {
      const data = await api(`/queue/${row.id}/${kind}`, {
        method: 'POST',
        body: {
          qualityGrade: grade,
          moisturePct: moisture,
          netWeightQtl: weight,
          remarks,
        },
      });
      onDone(data);
    } catch (err) {
      setError(err.message);
      setBusy('');
    }
  }

  const field =
    'min-h-12 w-full rounded-2xl border-2 border-slate-200 bg-white px-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={t('proc.title')}
    >
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-emerald-200 bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-800">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">{t('proc.title')}</h2>
              <p className="text-xs text-slate-500 font-medium">
                Token <span className="font-mono font-bold text-emerald-800">{row.token}</span> • {row.farmer_name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('proc.cancel')}
            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Quality Grade Selector */}
        <fieldset className="mt-4">
          <legend className="mb-2 text-xs font-bold tracking-wider text-slate-700 uppercase">
            {t('proc.grade')} (Quality Assay)
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {grades.map((g) => {
              const f = gradeFactors[g] ?? 1;
              const isSelected = grade === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrade(g)}
                  aria-pressed={isSelected}
                  className={`flex flex-col items-start rounded-2xl border-2 p-3 text-left transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 shadow-xs ring-1 ring-emerald-500/30'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="text-sm font-bold">{g}</span>
                  <span
                    className={`mt-0.5 text-[11px] font-semibold ${
                      f > 1 ? 'text-emerald-700' : f < 1 ? 'text-amber-700' : 'text-slate-500'
                    }`}
                  >
                    {f === 1 ? 'Full MSP' : f > 1 ? '+5% Quality Premium' : `${Math.round((f - 1) * 100)}% Deduction`}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Moisture & Weight Fields */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="moisture" className="mb-1 block text-xs font-bold text-slate-700 uppercase">
              {t('proc.moisture')}
            </label>
            <input
              id="moisture"
              type="number"
              inputMode="decimal"
              min="0"
              max="30"
              step="0.1"
              required
              autoFocus
              placeholder="e.g. 11.5"
              value={moisture}
              onChange={(e) => setMoisture(e.target.value)}
              className={field}
            />
          </div>

          <div>
            <label htmlFor="weight" className="mb-1 block text-xs font-bold text-slate-700 uppercase">
              {t('proc.weight')}
            </label>
            <input
              id="weight"
              type="number"
              inputMode="decimal"
              min="0"
              max={ceiling}
              step="0.1"
              required
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className={field}
            />
          </div>
        </div>

        <p className="mt-1 text-[11px] text-slate-500">
          Booked: <strong>{row.quantity_qtl} qtl</strong> (Max allowable with tolerance: {ceiling} qtl)
        </p>

        {/* Live Calculation Preview Card */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-teal-50/50 p-4">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Base MSP Rate ({t(`crop.${row.crop}`)}):</span>
            <span className="font-semibold">{money(row.ratePerQtl)}/qtl</span>
          </div>

          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-slate-600">Assay Adjustment ({grade}):</span>
            <span className={`font-bold ${factor > 1 ? 'text-emerald-700' : factor < 1 ? 'text-amber-700' : 'text-slate-700'}`}>
              {rateDiff > 0 ? `+${money(rateDiff)}` : rateDiff < 0 ? money(rateDiff) : '₹0.00'}/qtl
            </span>
          </div>

          <div className="mt-1 flex items-center justify-between text-xs font-semibold text-emerald-900 border-t border-emerald-200/60 pt-1.5">
            <span>Final Graded Rate:</span>
            <span className="font-mono text-sm font-bold">{money(gradedRate)}/qtl</span>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between border-t-2 border-emerald-300/80 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-950">
              Total Amount Payable:
            </span>
            <span className="font-mono text-2xl font-black text-emerald-950">
              {money(amount)}
            </span>
          </div>
        </div>

        {/* Remarks / Rejection Reason */}
        <div className="mt-3">
          <label htmlFor="remarks" className="mb-1 flex items-baseline justify-between gap-2 text-xs font-bold text-slate-700 uppercase">
            <span>{t('proc.remarks')}</span>
            <span className="text-[10px] font-normal text-slate-500">{t('proc.remarksHint')}</span>
          </label>
          <textarea
            id="remarks"
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder={t('proc.remarksPlaceholder')}
            className="w-full rounded-2xl border-2 border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          />
        </div>

        {error && (
          <div role="alert" className="mt-3 rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-900 ring-1 ring-rose-200">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 space-y-2">
          <button
            type="button"
            onClick={() => submit('complete')}
            disabled={Boolean(busy)}
            className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 px-5 text-sm font-bold text-white shadow-md shadow-emerald-800/20 transition hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:opacity-60"
          >
            <Check className="h-5 w-5" aria-hidden="true" />
            {busy === 'complete' ? t('proc.saving') : t('proc.confirm')}
          </button>

          <button
            type="button"
            onClick={() => submit('reject')}
            disabled={Boolean(busy)}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border-2 border-rose-200 px-5 text-xs font-bold text-rose-700 transition hover:bg-rose-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-100 disabled:opacity-60"
          >
            <Ban className="h-4 w-4" aria-hidden="true" />
            {busy === 'reject' ? t('proc.saving') : t('proc.reject')}
          </button>
        </div>
      </div>
    </div>
  );
}
