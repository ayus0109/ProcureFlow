import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Phone,
  Lock,
  ArrowRight,
  User,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Edit2,
  Loader2,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import CenteredLayout from '../../layouts/CenteredLayout.jsx';
import FormField from '../../components/FormField.jsx';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useLanguage } from '../../i18n/LanguageContext.jsx';

export default function FarmerLogin() {
  const { t } = useLanguage();
  const { user, isFarmer, loginFarmer, registerFarmer } = useAuth();
  const navigate = useNavigate();

  // If already signed in as farmer, redirect immediately to dashboard
  useEffect(() => {
    if (isFarmer) {
      navigate('/farmer', { replace: true });
    }
  }, [isFarmer, navigate]);

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', phone: '', village: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // OTP Verification state for registration
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const isRegister = mode === 'register';
  const set = (key) => (e) => {
    if (key === 'phone') {
      // If farmer changes phone number, reset OTP verification status
      setOtpSent(false);
      setOtpVerified(false);
      setOtpCode('');
    }
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  function switchMode() {
    setMode(isRegister ? 'login' : 'register');
    setError('');
    setOtpSent(false);
    setOtpVerified(false);
    setOtpCode('');
  }

  function fillDemo() {
    setForm((f) => ({
      ...f,
      phone: '9999990001',
      password: 'farmer123',
    }));
    setError('');
  }

  function handleSendOtp() {
    setError('');
    const clean = form.phone.trim();
    if (!/^\d{10}$/.test(clean)) {
      setError('Please enter a valid 10-digit mobile number before requesting OTP');
      return;
    }

    setOtpLoading(true);
    setTimeout(() => {
      setOtpLoading(false);
      setOtpSent(true);
      setOtpCode('4829'); // Auto-fill demo OTP for effortless testing
      setError('');
    }, 400);
  }

  function handleVerifyOtp() {
    setError('');
    if (otpCode.trim() !== '4829' && otpCode.trim().length !== 4) {
      setError('Invalid OTP code. Please enter the 4-digit code (Demo code: 4829)');
      return;
    }
    setOtpVerified(true);
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    // In registration mode, enforce OTP phone verification
    if (isRegister && !otpVerified) {
      if (!otpSent) {
        handleSendOtp();
        return;
      }
      if (otpCode.trim() === '4829' || otpCode.trim().length === 4) {
        setOtpVerified(true);
      } else {
        setError('Please verify your mobile number with the OTP code first');
        return;
      }
    }

    setBusy(true);
    try {
      if (isRegister) {
        await registerFarmer({
          name: form.name,
          phone: form.phone.trim(),
          password: form.password,
          village: form.village,
        });
      } else {
        await loginFarmer({ phone: form.phone.trim(), password: form.password });
      }
      navigate('/farmer', { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
      setBusy(false);
    }
  }

  return (
    <CenteredLayout>
      {/* Top Header & Portal Badge */}
      <div className="flex items-center justify-between">
        <Link
          to="/role"
          className="inline-flex items-center gap-1.5 rounded-xl py-1 px-2 -ml-2 text-xs sm:text-sm font-bold text-emerald-800 transition hover:bg-emerald-50 hover:text-emerald-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{t('role.heading')}</span>
        </Link>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-900 border border-emerald-200">
          Farmer Portal
        </span>
      </div>

      <div className="mt-4">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          {isRegister ? (t('auth.registerFarmer') || 'Farmer Registration') : t('auth.farmerTitle')}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium">
          {isRegister ? (t('auth.registerFarmerSub') || 'Register your verified mobile number to book mandi slots') : t('auth.farmerSub')}
        </p>
      </div>

      {/* Quick 1-Click Demo Credentials Chip (Login Mode Only) */}
      {!isRegister && (
        <button
          type="button"
          onClick={fillDemo}
          className="mt-4 flex w-full items-center justify-between rounded-2xl border border-emerald-300/80 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-50 p-3 text-left transition hover:border-emerald-500 hover:shadow-2xs focus:outline-none"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-700 shrink-0" />
            <div>
              <span className="block text-xs font-black text-emerald-950">
                Demo Account: Ramesh Patil (Baramati)
              </span>
              <span className="block text-[11px] font-mono text-emerald-800">
                9999990001 • farmer123
              </span>
            </div>
          </div>
          <span className="rounded-lg bg-emerald-700 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-2xs">
            Auto-Fill
          </span>
        </button>
      )}

      {/* Main Registration & Sign In Form */}
      <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
        {isRegister && (
          <>
            <FormField
              id="name"
              label={t('auth.name')}
              value={form.name}
              onChange={set('name')}
              autoComplete="name"
              placeholder="e.g. Ramesh Patil"
              required
            />
            <FormField
              id="village"
              label={t('auth.village')}
              hint={t('auth.optional')}
              placeholder="e.g. Baramati"
              value={form.village}
              onChange={set('village')}
            />
          </>
        )}

        {/* Mobile Number Field */}
        <div>
          <label htmlFor="phone" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
            {t('auth.phone')}
          </label>
          <div className="relative">
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit mobile number"
              value={form.phone}
              onChange={set('phone')}
              autoComplete="tel"
              disabled={isRegister && otpVerified}
              required
              className={`h-12 w-full rounded-2xl border px-3.5 text-sm font-bold text-slate-900 transition outline-none ${
                isRegister && otpVerified
                  ? 'border-emerald-400 bg-emerald-50/50 text-emerald-950 pr-24'
                  : 'border-slate-300 bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100'
              }`}
            />

            {/* In Register Mode: "Get OTP" or "Verified" Pill */}
            {isRegister && (
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                {otpVerified ? (
                  <button
                    type="button"
                    onClick={() => {
                      setOtpVerified(false);
                      setOtpSent(false);
                    }}
                    className="flex items-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-1 text-xs font-black text-white hover:bg-emerald-700 transition shadow-2xs"
                    title="Change Phone Number"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Verified</span>
                    <Edit2 className="h-3 w-3 ml-0.5 opacity-80" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpLoading || form.phone.length !== 10}
                    className="flex items-center gap-1 rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs"
                  >
                    {otpLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Phone className="h-3 w-3" />}
                    <span>{otpSent ? t('auth.resendOtp') : t('auth.sendOtp')}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 📲 In Registration Mode: OTP Verification Box Below Phone Number */}
        {isRegister && otpSent && !otpVerified && (
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50/70 p-3.5 shadow-2xs space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                {t('auth.otpNotice')} +91 {form.phone}
              </span>
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtpCode('');
                }}
                className="text-[11px] text-emerald-800 font-bold hover:underline"
              >
                Change Number
              </button>
            </div>

            <p className="text-[11px] text-emerald-800">
              Enter 4-digit code (Demo code auto-filled: <strong>4829</strong>)
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={4}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="4829"
                className="h-11 flex-1 rounded-xl border border-emerald-400 bg-white text-center font-mono text-lg font-black tracking-widest text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
              />
              <button
                type="button"
                onClick={handleVerifyOtp}
                className="h-11 rounded-xl bg-emerald-800 px-4 text-xs font-black text-white hover:bg-emerald-900 transition shadow-2xs"
              >
                {t('auth.verifyOtp')}
              </button>
            </div>
          </div>
        )}

        {/* Password Field */}
        <FormField
          id="password"
          label={isRegister ? t('auth.password') : 'Password'}
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={set('password')}
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          required
        />

        {error && (
          <div
            role="alert"
            className="rounded-2xl bg-rose-50 p-3.5 text-xs font-bold text-rose-900 ring-1 ring-rose-200"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 text-sm font-black text-white shadow-md shadow-emerald-900/20 transition hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:opacity-60"
        >
          {busy ? t('auth.working') : (isRegister ? (t('auth.register') || 'Register & Create Account') : t('auth.signIn'))}
          {!busy && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>

      {/* Switch between Sign In and Register */}
      <button
        type="button"
        onClick={switchMode}
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white py-3 px-4 text-center text-xs sm:text-sm font-extrabold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
      >
        <span>{t(isRegister ? 'auth.haveAccount' : 'auth.noAccount')}</span>
      </button>
    </CenteredLayout>
  );
}
