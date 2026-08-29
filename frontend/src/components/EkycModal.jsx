/**
 * EkycModal.jsx
 *
 * Aadhaar e-KYC Verification & DigiLocker / PM-Kisan Linker.
 *
 * Features:
 * - 12-Digit Aadhaar format validation
 * - Instant simulated OTP dispatch to Aadhaar-linked mobile
 * - Govt e-KYC verification with auto-linked PM-Kisan ID & Land records
 */

import { useState } from 'react';
import {
  ShieldCheck,
  X,
  Lock,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileCheck2,
  Wheat,
} from 'lucide-react';
import { api } from '../services/api';

export function EkycModal({ farmer, onVerified, onClose }) {
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
              <h3 className="text-sm font-extrabold">Govt Aadhaar e-KYC</h3>
              <p className="text-[11px] text-emerald-200 font-medium">DigiLocker & PM-Kisan Integration</p>
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

          {step === 'INPUT' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="rounded-2xl bg-emerald-50/70 p-3.5 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
                <FileCheck2 className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Verify your identity with Aadhaar to unlock direct mandi DBT payments and higher quota limits.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  12-Digit Aadhaar Number
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

              <div className="text-[11px] text-slate-500 font-medium">
                🔒 Data secured via UIDAI encrypted gateway standards.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-800/30 hover:brightness-110 transition disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
                <span>Send Aadhaar OTP</span>
              </button>
            </form>
          )}

          {step === 'OTP' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center">
                <p className="text-xs text-slate-600">
                  Enter the 6-digit OTP sent to your mobile linked with Aadhaar ending in{' '}
                  <strong className="font-mono">{aadhaar.slice(-4)}</strong>.
                </p>
                <p className="mt-1 text-[11px] font-mono text-emerald-800 bg-emerald-50 py-1 px-3 rounded-full inline-block font-bold">
                  Demo OTP: 123456
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 text-center">
                  Verification Code (OTP)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full text-center tracking-[0.5em] rounded-2xl border border-slate-300 py-3 text-lg font-mono font-black text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-800/30 hover:brightness-110 transition disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                <span>Verify & Complete e-KYC</span>
              </button>

              <button
                type="button"
                onClick={() => setStep('INPUT')}
                className="w-full text-xs font-bold text-slate-500 hover:text-slate-700 text-center"
              >
                ← Change Aadhaar Number
              </button>
            </form>
          )}

          {step === 'SUCCESS' && (
            <div className="text-center space-y-4 py-2">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div>
                <h4 className="text-base font-black text-slate-900">Govt e-KYC Verified!</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your profile is authenticated and linked with PM-Kisan & Land Records.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Aadhaar Status:</span>
                  <span className="font-bold text-emerald-800">✅ Linked & Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">PM-Kisan Beneficiary:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {farmer?.pmkisan_id || 'PMK-MH-948201'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Verified Land Holding:</span>
                  <span className="font-bold text-slate-800">4.2 Acres (Maharashtra 7/12)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-2xl bg-emerald-700 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-800 transition"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
