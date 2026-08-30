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
  ChevronRight,
  ChevronLeft,
  Check,
  Scale,
  CreditCard,
  MapPin,
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

export default function BookSlot() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const locale = LOCALES[lang] || 'en-IN';

  // 3-Step Wizard Navigation State: 1 = Centre, 2 = Crop & Qty, 3 = Date & Time Slot
  const [step, setStep] = useState(1);

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

  // Reload centres whenever date changes so slot counts match
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
  const isStep2Valid = crop && Number(quantity) > 0 && !isOverLimit;
  const isStep3Valid = date && slot;

  const handleQuickAddQty = (val) => {
    setQuantity(String(val));
  };

  async function submit(event) {
    if (event) event.preventDefault();
    if (!centreId || !crop || !quantity || !date || !slot) return;
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
      {/* 🧭 STEP INDICATOR PROGRESS BAR (1 -> 2 -> 3) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {/* Step 1 Pill */}
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 rounded-2xl p-2.5 sm:p-3 text-left transition-all ${
              step === 1
                ? 'bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-600/30'
                : centreId
                ? 'bg-emerald-50 text-emerald-950 border border-emerald-200 hover:bg-emerald-100/70'
                : 'bg-slate-50 text-slate-400'
            }`}
          >
            <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-xl font-black text-xs ${
              step === 1 ? 'bg-white text-emerald-950' : centreId ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {centreId && step !== 1 ? <Check className="h-4 w-4" /> : '1'}
            </div>
            <div className="min-w-0 hidden xs:block sm:block">
              <span className="block text-[10px] font-bold uppercase tracking-wider opacity-80">
                {t('common.step')} 1
              </span>
              <span className="block text-xs font-black truncate">
                {selectedCentre ? (t(`centre.${selectedCentre.id}`) || selectedCentre.name).split(' ')[0] : t('book.centre')}
              </span>
            </div>
          </button>

          {/* Step 2 Pill */}
          <button
            type="button"
            disabled={!centreId}
            onClick={() => centreId && setStep(2)}
            className={`flex items-center gap-2 rounded-2xl p-2.5 sm:p-3 text-left transition-all ${
              step === 2
                ? 'bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-600/30'
                : isStep2Valid
                ? 'bg-emerald-50 text-emerald-950 border border-emerald-200 hover:bg-emerald-100/70'
                : 'bg-slate-50 text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed'
            }`}
          >
            <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-xl font-black text-xs ${
              step === 2 ? 'bg-white text-emerald-950' : isStep2Valid ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {isStep2Valid && step !== 2 ? <Check className="h-4 w-4" /> : '2'}
            </div>
            <div className="min-w-0 hidden xs:block sm:block">
              <span className="block text-[10px] font-bold uppercase tracking-wider opacity-80">
                {t('common.step')} 2
              </span>
              <span className="block text-xs font-black truncate">
                {crop && quantity ? `${t(`crop.${crop}`)} (${quantity}q)` : t('book.crop')}
              </span>
            </div>
          </button>

          {/* Step 3 Pill */}
          <button
            type="button"
            disabled={!centreId || !isStep2Valid}
            onClick={() => centreId && isStep2Valid && setStep(3)}
            className={`flex items-center gap-2 rounded-2xl p-2.5 sm:p-3 text-left transition-all ${
              step === 3
                ? 'bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-600/30'
                : isStep3Valid
                ? 'bg-emerald-50 text-emerald-950 border border-emerald-200'
                : 'bg-slate-50 text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed'
            }`}
          >
            <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-xl font-black text-xs ${
              step === 3 ? 'bg-white text-emerald-950' : isStep3Valid ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {isStep3Valid && step !== 3 ? <Check className="h-4 w-4" /> : '3'}
            </div>
            <div className="min-w-0 hidden xs:block sm:block">
              <span className="block text-[10px] font-bold uppercase tracking-wider opacity-80">
                {t('common.step')} 3
              </span>
              <span className="block text-xs font-black truncate">
                {slot ? `${slot}` : t('book.slot')}
              </span>
            </div>
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-900 ring-1 ring-rose-200">
          {error}
        </div>
      )}

      {/* 🌟 STEP 1: SELECT PROCUREMENT CENTRE */}
      {step === 1 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="rounded-3xl border border-emerald-100 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-700" />
                  <span>{t('book.step1Title')}</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Tap to choose the nearest government APMC centre
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {centres.map((c) => {
                const isSelected = String(c.id) === centreId;
                const centreName = t(`centre.${c.id}`) || c.name;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCentreId(String(c.id));
                      setStep(2);
                    }}
                    aria-pressed={isSelected}
                    className={`relative flex flex-col justify-between rounded-2xl border-2 p-4 text-left transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 ${
                      isSelected
                        ? 'border-emerald-600 bg-gradient-to-br from-emerald-50/90 to-teal-50/50 shadow-md ring-2 ring-emerald-500/40'
                        : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">{centreName}</span>
                          {isSelected && (
                            <span className="rounded-full bg-emerald-700 p-0.5 text-white">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </div>
                        <CongestionBadge level={c.congestion} />
                      </div>
                      <p className="mt-1 text-xs text-slate-500 font-medium">
                        {c.district} District • {c.active_counters}/{c.total_counters} Counters Active
                      </p>

                      {/* Accepted Crops Badges */}
                      <div className="mt-2 flex flex-wrap items-center gap-1 text-[10px]">
                        <span className="font-bold text-slate-400">Procures:</span>
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

                    {/* Capacity & Quota Details */}
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
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Strip */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <Link
              to="/farmer"
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t('book.back')}</span>
            </Link>

            <button
              type="button"
              disabled={!centreId}
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 px-6 py-3.5 text-xs sm:text-sm font-black text-white shadow-md hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{t('book.nextStep')}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 🌾 STEP 2: CHOOSE CROP & QUANTITY */}
      {step === 2 && (
        <div className="space-y-4 animate-fadeIn">
          {/* Selected Centre Summary Pill */}
          <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-2.5 border border-emerald-200 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-black text-emerald-950">
                📍 {t(`centre.${selectedCentre?.id}`) || selectedCentre?.name}
              </span>
              <span className="text-emerald-700 font-medium">({selectedCentre?.district} District)</span>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="font-bold text-emerald-800 underline hover:text-emerald-950"
            >
              Change Centre
            </button>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-white p-5 sm:p-6 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Wheat className="h-5 w-5 text-emerald-700" />
                <span>{t('book.step2Title')}</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Select your harvest and enter weight in quintals
              </p>
            </div>

            {/* 1. Crop Selection Grid */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Select Crop:
              </label>
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
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs ring-2 ring-emerald-500/30 font-bold scale-102'
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
            </div>

            {/* 2. Quantity Input & Quick Chips */}
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                        ? `⚠️ Exceeds limit of ${maxAllowedQty} ${t('booking.qtl')}!`
                        : `ℹ️ ${t(`centre.${selectedCentre.id}`) || selectedCentre.name} limit: ${maxAllowedQty} ${t('booking.qtl')}`}
                    </p>
                  )}
                </div>

                {/* Quick selection buttons */}
                <div className="flex-1">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1.5">{t('book.quickAdd')}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[5, 10, 15, 20, 30, 50].filter(v => v <= maxAllowedQty).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => handleQuickAddQty(v)}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-mono font-bold transition ${
                          Number(quantity) === v
                            ? 'bg-emerald-800 text-white border-emerald-800'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {v} qtl
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Estimated Gross MSP Earnings */}
              {estimatedGross && (
                <div className="rounded-xl bg-emerald-100/70 border border-emerald-300/80 p-3.5 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-800 uppercase tracking-wider text-[10px] block">
                      {t('book.estAmount')}
                    </span>
                    <p className="text-xl font-black text-emerald-950">
                      {money(estimatedGross)}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-900 bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {quantity} {t('booking.qtl')} × ₹{selectedCropObj?.ratePerQtl}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action Strip */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>{t('book.prevStep')}</span>
            </button>

            <button
              type="button"
              disabled={!isStep2Valid}
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 px-6 py-3.5 text-xs sm:text-sm font-black text-white shadow-md hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{t('book.nextStep')}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ⏰ STEP 3: SELECT DATE & TIME SLOT AND CONFIRM */}
      {step === 3 && (
        <form onSubmit={submit} className="space-y-4 animate-fadeIn">
          {/* Summary Badge of Steps 1 & 2 */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-emerald-50 px-4 py-2.5 border border-emerald-200 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-950">
                📍 {t(`centre.${selectedCentre?.id}`) || selectedCentre?.name}
              </span>
              <span>•</span>
              <span className="font-bold text-emerald-900">
                {CROP_ICONS[crop] || '🌾'} {t(`crop.${crop}`)} ({quantity} {t('booking.qtl')})
              </span>
              <span>•</span>
              <span className="font-black text-emerald-950">{estimatedGross ? money(estimatedGross) : ''}</span>
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="font-bold text-emerald-800 underline hover:text-emerald-950"
            >
              Edit Crop/Qty
            </button>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-white p-5 sm:p-6 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-700" />
                <span>{t('book.step3Title')}</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Pick your preferred day and time slot window
              </p>
            </div>

            {/* 1. Date Selection Pills */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                1. Select Date:
              </label>
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
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs ring-2 ring-emerald-500/30'
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
            </div>

            {/* 2. Time Window Slots */}
            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  2. Select Time Window:
                </label>
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
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs ring-2 ring-emerald-500/30'
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

            {/* 3. Final Summary Confirmation Box */}
            {slot && (
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-slate-50 p-4 border border-emerald-300/80 shadow-2xs space-y-2 text-xs">
                <span className="font-black text-emerald-950 uppercase tracking-wider text-[11px] block">
                  📋 {t('book.passSummary')}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700 pt-1">
                  <div>
                    <span className="text-slate-400 block">Centre:</span>
                    <strong className="text-slate-900">{t(`centre.${selectedCentre?.id}`) || selectedCentre?.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Crop & Weight:</span>
                    <strong className="text-slate-900">{t(`crop.${crop}`)} ({quantity} Qtl)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Date & Slot:</span>
                    <strong className="text-slate-900">{date} ({slot})</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Est. MSP Value:</span>
                    <strong className="text-emerald-950 font-mono text-sm">{estimatedGross ? money(estimatedGross) : ''}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Strip */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>{t('book.prevStep')}</span>
            </button>

            <button
              type="submit"
              disabled={!isStep3Valid || busy}
              className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 px-7 py-3.5 text-xs sm:text-sm font-black text-white shadow-lg shadow-emerald-900/20 hover:brightness-110 transition disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
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
          </div>
        </form>
      )}
    </AppShell>
  );
}
