import { useState } from 'react';
import {
  ShieldCheck,
  X,
  Lock,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext.jsx';

export function EkycModal({ farmer, onVerified, onClose }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(farmer?.ekyc_verified ? 'SUCCESS' : 'INPUT'); // 'INPUT' | 'OTP' | 'SUCCESS'
  const [aadhaar, setAadhaar] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = (e) => {
    e.preventDefault();
    const clean = aadhaar.replace(/\D/g, '');
    if (clean.length !== 12) {
      setError('Please enter a valid 12-digit Aadhaar number');
      return;
    }
    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setStep('OTP');
    }, 600);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const cleanOtp = otp.replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await api('/auth/farmer/ekyc', {
        method: 'POST',
        body: {
          aadhaarNo: aadhaar,
          otp: cleanOtp,
        },
      });

      setLoading(false);
      setStep('SUCCESS');
      if (onVerified) onVerified(res.user);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'e-KYC verification failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-800/20 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 px-5 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/20">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold">{t('ekycModal.title')}</h3>
              <p className="text-[11px] text-emerald-200 font-medium">{t('ekycModal.sub')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-800 border border-rose-200">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'SUCCESS' ? (
            <div className="text-center space-y-4 py-2">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div>
                <h4 className="text-base font-black text-slate-900">{t('ekycModal.success')}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  UIDAI / NPCI Direct Benefit Transfer (DBT) Active
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('auth.name')}:</span>
                  <span className="font-bold text-slate-900">{farmer?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('farmer.aadhaar')}:</span>
                  <span className="font-mono font-bold text-slate-900">{farmer?.aadhaar_no || 'XXXX-XXXX-4821'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('farmer.pmkisan')}:</span>
                  <span className="font-mono font-bold text-emerald-800">{farmer?.pmkisan_id || 'PMK-MH-2026-9812'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('farmer.landHolding')}:</span>
                  <span className="font-bold text-slate-900">{farmer?.land_acres || '4.5'} {t('farmer.acres')}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-2xl bg-emerald-700 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-800 transition"
              >
                {t('common.close')}
              </button>
            </div>
          ) : step === 'OTP' ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blue-100 text-blue-800 mb-2">
                  <Smartphone className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-900">{t('ekycModal.enterOtp')}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Demo OTP: <strong className="font-mono text-emerald-800">123456</strong>
                </p>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="• • • • • •"
                  className="w-full text-center text-2xl font-mono font-black tracking-widest rounded-2xl border border-slate-300 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 text-slate-900"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('INPUT')}
                  className="flex-1 rounded-2xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  {t('book.back')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-2 flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-800 transition disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  <span>{t('ekycModal.verifyOtp')}</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('ekycModal.aadhaarNo')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={14}
                    value={aadhaar}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 12);
                      const formatted = v.replace(/(\d{4})(?=\d)/g, '$1-');
                      setAadhaar(formatted);
                    }}
                    placeholder="XXXX-XXXX-XXXX"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-mono tracking-wider font-bold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                    required
                  />
                  <Lock className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-800/30 hover:brightness-110 transition disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
                <span>{t('ekycModal.sendOtp')}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
