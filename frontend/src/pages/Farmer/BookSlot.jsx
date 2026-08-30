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
  ShieldCheck,
  AlertCircle,
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

  // Load reference metadata on mount
  useEffect(() => {
    let alive = true;
    api('/reference')
      .then((ref) => {
        if (!alive) return;
        setReference(ref);
        if (ref.dates && ref.dates.length > 0) {
          setDate(ref.dates[0]);
        }
      })
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, []);

  // Reload centres whenever date changes so slot counts & wait times match the chosen date
  useEffect(() => {
    let alive = true;
    api(`/centres?date=${date || ''}`)
      .then((centreList) => {
        if (!alive) return;
        setCentres(centreList);
      })
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [date]);

  // Reload available slot windows when centre or date changes
  useEffect(() => {
    if (!centreId || !date) return undefined;
    let alive = true;
    setSlot('');
    api(`/centres/${centreId}/slots?date=${date}`)
      .then((rows) => {
        if (!alive) return;
        setSlots(rows);
      })
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [centreId, date]);

  // Auto-adjust crop selection when selected centre changes
  useEffect(() => {
    if (!centreId) return;
    const selectedC = centres.find((c) => String(c.id) === String(centreId));
    if (!selectedC) return;

    const accepted = selectedC.accepted_crops_list || ['WHEAT', 'PADDY', 'COTTON', 'SOYBEAN', 'TUR'];
    if (!crop || !accepted.includes(crop)) {
      setCrop(accepted[0] || '');
    }
  }, [centreId, centres]);

  function dateLabel(iso, index) {
    if (index === 0) return t('book.today');
    if (index === 1) return t('book.tomorrow');
    return new Date(`${iso}T00:00:00`).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      weekday: 'short',
    });
  }

  const selectedCentre = centres.find((c) => String(c.id) === String(centreId));
  const acceptedCrops = selectedCentre?.accepted_crops_list || ['WHEAT', 'PADDY', 'COTTON', 'SOYBEAN', 'TUR'];

  const availableCrops = (reference?.crops || []).filter((c) => {
    if (!selectedCentre) return true;
    return acceptedCrops.includes(c.key);
  });

  const selectedCropObj = reference?.crops?.find((c) => c.key === crop);
  const estimatedGross = selectedCropObj && Number(quantity) > 0
    ? Number(quantity) * selectedCropObj.ratePerQtl
    : null;

  const maxAllowedQty = selectedCentre?.max_qty_per_farmer || 50;
  const isOverLimit = Number(quantity) > maxAllowedQty;
  const ready = centreId && crop && Number(quantity) > 0 && !isOverLimit && date && slot;

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
        {/* 1. Date Selection */}
        <Section label={t('book.date')} icon={Calendar} badge={`${t('common.step')} 1`}>
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
                    {i === 0 ? t('book.today') : i === 1 ? t('book.tomorrow') : (lang === 'mr' ? '३ रा दिवस' : lang === 'hi' ? 'तीसरा दिन' : 'Day 3')}
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

        {/* 2. Centre Selection */}
        <Section label={t('book.centre')} icon={Building2} badge={`${t('common.step')} 2`}>
          <div className="grid gap-3 sm:grid-cols-2">
            {centres.map((c) => {
              const isSelected = String(c.id) === centreId;
              const centreName = t(`centre.${c.id}`) || c.name;
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
                      <span className="font-bold text-slate-900 text-sm">{centreName}</span>
                      <CongestionBadge level={c.congestion} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500 font-medium">
                      {c.district} District • {c.active_counters}/{c.total_counters} Counters Active
                    </p>

                    {/* Accepted Crops Badges */}
                    <div className="mt-2 flex flex-wrap items-center gap-1 text-[10px]">
                      <span className="font-bold text-slate-500">Procures:</span>
                      {(c.accepted_crops_list || []).map((ck) => (
                        <span
                          key={ck}
                          className="rounded-md bg-emerald-100/80 px-1.5 py-0.5 font-bold text-emerald-950 border border-emerald-200"
                        >
                          {CROP_ICONS[ck] || '🌾'} {t(`crop.${ck}`)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Capacity Bar & Quota Details */}
                  <div className="mt-3 border-t border-slate-100 pt-2 text-xs space-y-1">
                    <div className="flex justify-between font-semibold text-slate-700">
                      <span>{t('book.wait')}: ~{c.waitLabel}</span>
                      <span className="text-emerald-800 font-bold">
                        {c.slotsLeft} {t('book.slotsAvailable')}
                      </span>
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                      <span>🎯 Target: {c.daily_target_qtl || 500} {t('booking.qtl')}</span>
                      <span className="font-semibold text-emerald-900 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                        Max {c.max_qty_per_farmer || 50} {t('booking.qtl')}/farmer
                      </span>
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

        {/* 3. Crop & Quantity Selection (Dynamically Filtered by Selected Centre) */}
        <Section label={t('book.crop')} icon={Wheat} badge={`${t('common.step')} 3`}>
          {selectedCentre && (
            <div className="mb-3 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-xs border border-emerald-200">
              <span className="font-bold text-emerald-950">
                📍 {t(`centre.${selectedCentre.id}`) || selectedCentre.name}
              </span>
              <span className="font-medium text-emerald-800">
                {availableCrops.length} {t('book.crop')}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
            {availableCrops.map((c) => {
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
                    ₹{c.ratePerQtl}/{t('booking.qtl')}
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
                max={maxAllowedQty}
                step="0.5"
                placeholder={`Max ${maxAllowedQty} ${t('booking.qtl')}`}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
              {selectedCentre && (
                <p className={`mt-1 text-[11px] font-semibold ${isOverLimit ? 'text-rose-700 font-bold' : 'text-slate-500'}`}>
                  {isOverLimit
                    ? `⚠️ Exceeds ${t(`centre.${selectedCentre.id}`) || selectedCentre.name} limit of ${maxAllowedQty} ${t('booking.qtl')}!`
                    : `ℹ️ ${t(`centre.${selectedCentre.id}`) || selectedCentre.name} limit: ${maxAllowedQty} ${t('booking.qtl')}`}
                </p>
              )}
            </div>

            {estimatedGross && (
              <div className="flex-1 min-w-44 rounded-xl bg-emerald-100/60 border border-emerald-300/60 p-3 text-xs">
                <span className="font-semibold text-emerald-800 uppercase tracking-wider text-[10px]">
                  {t('book.estAmount')}
                </span>
                <p className="text-lg font-black text-emerald-950">
                  {money(estimatedGross)}
                </p>
                <span className="text-[11px] text-emerald-700">
                  {quantity} {t('booking.qtl')} × ₹{selectedCropObj.ratePerQtl}
                </span>
              </div>
            )}
          </div>
        </Section>

        {/* 4. Time Window Selection */}
        <Section label={t('book.slot')} icon={Clock} badge={`${t('common.step')} 4`}>
          {!centreId ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-xs font-medium text-slate-500">
              {t('book.pickCentreFirst')}
            </div>
          ) : (
            <div>
              <div className="mb-3 flex items-center justify-between text-xs text-slate-600">
                <span>
                  {t('book.showingSlots')} <strong>{t(`centre.${selectedCentre?.id}`) || selectedCentre?.name}</strong> (<strong>{date}</strong>)
                </span>
                <span className="font-bold text-emerald-800">
                  {t('book.totalSlots').replace('{n}', slots.reduce((sum, s) => sum + s.left, 0))}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {slots.map((s) => {
                  const isSelected = slot === s.slot;
                  const isFull = s.full || s.left <= 0;
                  return (
                    <button
                      key={s.slot}
                      type="button"
                      disabled={isFull}
                      onClick={() => setSlot(s.slot)}
                      aria-pressed={isSelected}
                      className={`flex flex-col justify-between rounded-2xl border-2 p-3 text-left transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 ${
                        isFull
                          ? 'cursor-not-allowed border-slate-200 bg-slate-100/70 text-slate-400 opacity-60'
                          : isSelected
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs ring-1 ring-emerald-500/30'
                          : 'border-slate-200 bg-white hover:border-emerald-300'
                      }`}
                    >
                      <span className="font-mono text-sm font-bold">{s.slot}</span>
                      <span
                        className={`mt-1 inline-block text-[11px] font-bold ${
                          isFull
                            ? 'text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 w-fit'
                            : 'text-emerald-800 font-extrabold'
                        }`}
                      >
                        {isFull ? t('book.full') : `${s.left} ${t('book.left')}`}
                      </span>
                    </button>
                  );
                })}
              </div>
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
