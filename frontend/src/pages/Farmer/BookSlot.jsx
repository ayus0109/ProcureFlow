import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Building2,
  Wheat,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../../layouts/AppShell.jsx';
import CongestionBadge from '../../components/CongestionBadge.jsx';
import FormField from '../../components/FormField.jsx';
import { api } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext.jsx';
import { money } from '../../utils/money.js';

const LOCALES = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };

const CROP_ICONS = {
  WHEAT: '🌾',
  PADDY: '🍚',
  COTTON: '☁️',
  SOYBEAN: '🌱',
  TUR: '🌿',
};

function Section({ label, icon: Icon, badge, children }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          {Icon && (
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-800">
              <Icon className="h-4 w-4" />
            </span>
          )}
          <h2 className="text-sm font-bold tracking-wider text-slate-800 uppercase">
            {label}
          </h2>
        </div>
        {badge && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

export default function BookSlot() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const locale = LOCALES[lang] || 'en-IN';

  const [centres, setCentres] = useState([]);
  const [reference, setReference] = useState(null);
  const [slots, setSlots] = useState([]);

  const [centreId, setCentreId] = useState('');
  const [crop, setCrop] = useState('');
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([api('/centres'), api('/reference')])
      .then(([centreList, ref]) => {
        if (!alive) return;
        setCentres(centreList);
        setReference(ref);
        setDate(ref.dates[0]);
      })
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, []);

  // Reload available windows when centre or date changes
  useEffect(() => {
    if (!centreId || !date) return undefined;
    let alive = true;
    setSlot('');
    api(`/centres/${centreId}/slots?date=${date}`)
      .then((rows) => alive && setSlots(rows))
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [centreId, date]);

  function dateLabel(iso, index) {
    if (index === 0) return t('book.today');
    if (index === 1) return t('book.tomorrow');
    return new Date(`${iso}T00:00:00`).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      weekday: 'short',
    });
  }

  const selectedCropObj = reference?.crops?.find((c) => c.key === crop);
  const estimatedGross = selectedCropObj && Number(quantity) > 0
    ? Number(quantity) * selectedCropObj.ratePerQtl
    : null;

  const ready = centreId && crop && Number(quantity) > 0 && date && slot;

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/bookings', {
        method: 'POST',
        body: {
          centreId: Number(centreId),
          crop,
          quantityQtl: Number(quantity),
          slotDate: date,
          slotTime: slot,
        },
      });
      navigate('/farmer', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <AppShell title={t('book.title')} subtitle={t('book.sub')}>
      <Link
        to="/farmer"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('book.back')}
      </Link>

      <form onSubmit={submit} className="space-y-5">
        {/* 1. Centre Selection */}
        <Section label={t('book.centre')} icon={Building2} badge="Step 1">
          <div className="grid gap-3 sm:grid-cols-2">
            {centres.map((c) => {
              const isSelected = String(c.id) === centreId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCentreId(String(c.id))}
                  aria-pressed={isSelected}
                  className={`relative flex flex-col justify-between rounded-2xl border-2 p-4 text-left transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 ${
                    isSelected
                      ? 'border-emerald-600 bg-gradient-to-br from-emerald-50/90 to-teal-50/50 shadow-md ring-1 ring-emerald-500/30'
                      : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-slate-900 text-sm">{c.name}</span>
                      <CongestionBadge level={c.congestion} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500 font-medium">
                      {c.district} District • {c.active_counters}/{c.total_counters} Counters Active
                    </p>
                  </div>

                  {/* Capacity Bar */}
                  <div className="mt-3 border-t border-slate-100 pt-2 text-xs">
                    <div className="flex justify-between font-semibold text-slate-700">
                      <span>Wait: ~{c.waitLabel}</span>
                      <span className="text-emerald-800">{c.slotsLeft} slots remaining</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          c.congestion === 'HIGH' ? 'bg-rose-500' : c.congestion === 'MODERATE' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, c.utilisationPct || 20)}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        {/* 2. Crop & Quantity Selection */}
        <Section label={t('book.crop')} icon={Wheat} badge="Step 2">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
            {(reference?.crops || []).map((c) => {
              const isSelected = crop === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCrop(c.key)}
                  aria-pressed={isSelected}
                  className={`flex flex-col items-center rounded-2xl border-2 p-3.5 text-center transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs ring-1 ring-emerald-500/30 font-bold scale-102'
                      : 'border-slate-200 bg-white text-slate-800 hover:border-emerald-300 hover:bg-emerald-50/30'
                  }`}
                >
                  <span className="text-2xl">{CROP_ICONS[c.key] || '🌾'}</span>
                  <span className="mt-1 text-sm font-bold">{t(`crop.${c.key}`)}</span>
                  <span className="mt-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    ₹{c.ratePerQtl}/qtl
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/60">
            <div className="w-full max-w-xs">
              <FormField
                id="quantity"
                label={t('book.quantity')}
                type="number"
                inputMode="decimal"
                min="0.5"
                max="200"
                step="0.5"
                placeholder="e.g. 20"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            {estimatedGross && (
              <div className="flex-1 min-w-44 rounded-xl bg-emerald-100/60 border border-emerald-300/60 p-3 text-xs">
                <span className="font-semibold text-emerald-800 uppercase tracking-wider text-[10px]">
                  Estimated MSP Value (FAQ Baseline)
                </span>
                <p className="text-lg font-black text-emerald-950">
                  {money(estimatedGross)}
                </p>
                <span className="text-[11px] text-emerald-700">
                  {quantity} qtl × ₹{selectedCropObj.ratePerQtl}
                </span>
              </div>
            )}
          </div>
        </Section>

        {/* 3. Date Selection */}
        <Section label={t('book.date')} icon={Calendar} badge="Step 3">
          <div className="grid grid-cols-3 gap-2.5">
            {(reference?.dates || []).map((d, i) => {
              const isSelected = date === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDate(d)}
                  aria-pressed={isSelected}
                  className={`flex flex-col items-center rounded-2xl border-2 p-3 text-center transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs ring-1 ring-emerald-500/30'
                      : 'border-slate-200 bg-white hover:border-emerald-300'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-500 uppercase">
                    {i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : 'Day 3'}
                  </span>
                  <span className="mt-0.5 text-sm font-extrabold text-slate-900">
                    {dateLabel(d, i)}
                  </span>
                  <span className="mt-0.5 font-mono text-[10px] text-slate-400">{d}</span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* 4. Time Window Selection */}
        <Section label={t('book.slot')} icon={Clock} badge="Step 4">
          {!centreId ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-xs font-medium text-slate-500">
              {t('book.pickCentreFirst')}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {slots.map((s) => {
                const isSelected = slot === s.slot;
                const isFull = s.full;
                return (
                  <button
                    key={s.slot}
                    type="button"
                    disabled={isFull}
                    onClick={() => setSlot(s.slot)}
                    aria-pressed={isSelected}
                    className={`flex flex-col justify-between rounded-2xl border-2 p-3 text-left transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 ${
                      isFull
                        ? 'cursor-not-allowed border-slate-100 bg-slate-100/60 text-slate-400 opacity-60'
                        : isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs ring-1 ring-emerald-500/30'
                        : 'border-slate-200 bg-white hover:border-emerald-300'
                    }`}
                  >
                    <span className="font-mono text-sm font-bold">{s.slot}</span>
                    <span
                      className={`mt-1 inline-block text-[11px] font-semibold ${
                        isFull ? 'text-rose-600 font-bold' : 'text-emerald-700'
                      }`}
                    >
                      {isFull ? t('book.full') : `${s.left} ${t('book.left')}`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </Section>

        {error && (
          <div
            role="alert"
            className="rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-900 ring-1 ring-rose-200"
          >
            {error}
          </div>
        )}

        {/* Submit Booking Button */}
        <button
          type="submit"
          disabled={!ready || busy}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 px-6 text-base font-bold text-white shadow-lg shadow-emerald-900/20 transition-all hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          {busy ? (
            <span>{t('book.booking')}</span>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5" />
              <span>{t('book.confirm')}</span>
            </>
          )}
        </button>
      </form>
    </AppShell>
  );
}
