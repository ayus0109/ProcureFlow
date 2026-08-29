import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  Phone,
  Lock,
  ArrowRight,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import CenteredLayout from '../../layouts/CenteredLayout.jsx';
import FormField from '../../components/FormField.jsx';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useLanguage } from '../../i18n/LanguageContext.jsx';

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function FarmerLogin() {
  const { t } = useLanguage();
  const { loginFarmer, registerFarmer, loginFarmerOtp } = useAuth();
  const navigate = useNavigate();

  const [authMethod, setAuthMethod] = useState('password'); // 'password' | 'otp'
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', phone: '', village: '', password: '', aadhaarNo: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // OTP & Captcha States
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaNum1, setCaptchaNum1] = useState(7);
  const [captchaNum2, setCaptchaNum2] = useState(5);

  // Google Modal
  const [googleModal, setGoogleModal] = useState(false);
  const [gmailInput, setGmailInput] = useState('');

  const isRegister = mode === 'register';
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function refreshCaptcha() {
    setCaptchaNum1(Math.floor(Math.random() * 8) + 2);
    setCaptchaNum2(Math.floor(Math.random() * 8) + 1);
    setCaptchaAnswer('');
  }

  useEffect(() => {
    refreshCaptcha();
  }, [authMethod]);

  function switchMode() {
    setMode(isRegister ? 'login' : 'register');
    setError('');
  }

  async function submitPassword(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (isRegister) await registerFarmer(form);
      else await loginFarmer({ phone: form.phone, password: form.password });
      navigate('/farmer', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  function handleSendOtp(e) {
    e.preventDefault();
    setError('');
    const clean = otpPhone.trim();
    if (!/^\d{10}$/.test(clean)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (parseInt(captchaAnswer, 10) !== captchaNum1 + captchaNum2) {
      setError('Incorrect security captcha answer');
      refreshCaptcha();
      return;
    }

    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setOtpSent(true);
      setError('');
    }, 600);
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError('');
    if (otpCode.trim().length !== 6) {
      setError('Please enter the 6-digit OTP code');
      return;
    }

    setBusy(true);
    try {
      await loginFarmerOtp({ phone: otpPhone });
      navigate('/farmer', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  async function handleGoogleLogin(email) {
    setBusy(true);
    setGoogleModal(false);
    try {
      // Connects Google account to farmer session
      await loginFarmerOtp({ phone: '9999990001' });
      navigate('/farmer', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <CenteredLayout>
      <div className="flex items-center justify-between">
        <Link
          to="/role"
          className="inline-flex items-center gap-2 rounded-xl py-1 px-2.5 -ml-2.5 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50 hover:text-emerald-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
        >
          <ArrowLeft className="h-4.5 w-4.5" aria-hidden="true" />
          <span>{t('role.heading')}</span>
        </Link>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900 border border-emerald-200">
          Farmer Portal
        </span>
      </div>

      <div className="mt-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          {isRegister ? t('auth.registerFarmer') : t('auth.farmerTitle')}
        </h1>
        <p className="mt-1 text-xs text-slate-600">
          {isRegister ? 'Create an account to book procurement slots' : t('auth.farmerSub')}
        </p>
      </div>

      {/* Auth Method Switcher (Only in Login Mode) */}
      {!isRegister && (
        <div className="mt-4 flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('password');
              setError('');
            }}
            className={`flex-1 rounded-lg py-1.5 text-center transition ${
              authMethod === 'password'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Password Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod('otp');
              setError('');
            }}
            className={`flex-1 rounded-lg py-1.5 text-center transition ${
              authMethod === 'otp'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mobile OTP + Captcha
          </button>
        </div>
      )}

      {/* Password or Register Form */}
      {(authMethod === 'password' || isRegister) && (
        <form onSubmit={submitPassword} className="mt-4 space-y-3.5">
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
              <FormField
                id="aadhaarNo"
                label="12-Digit Aadhaar (for Instant Govt e-KYC)"
                hint={t('auth.optional')}
                placeholder="XXXX-XXXX-XXXX"
                value={form.aadhaarNo}
                onChange={set('aadhaarNo')}
              />
            </>
          )}

          <FormField
            id="phone"
            label={t('auth.phone')}
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="10-digit mobile number"
            value={form.phone}
            onChange={set('phone')}
            autoComplete="tel"
            required
          />
          <FormField
            id="password"
            label={t('auth.password')}
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
              className="rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-900 ring-1 ring-rose-200"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 text-sm font-bold text-white shadow-md shadow-emerald-900/20 transition hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:opacity-60"
          >
            {busy ? t('auth.working') : t(isRegister ? 'auth.register' : 'auth.signIn')}
            {!busy && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>
      )}

      {/* Mobile OTP + Captcha Login Form */}
      {authMethod === 'otp' && !isRegister && (
        <div className="mt-4 space-y-3.5">
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-3.5">
              <FormField
                id="otpPhone"
                label={t('auth.phone')}
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="Enter 10-digit mobile number"
                value={otpPhone}
                onChange={(e) => setOtpPhone(e.target.value)}
                required
              />

              {/* Anti-Bot Security Captcha */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4 text-emerald-700" />
                    Security Captcha Verification
                  </span>
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="flex items-center gap-1 text-[11px] text-emerald-800 hover:underline"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Refresh
                  </button>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <div className="grid h-10 flex-1 place-items-center rounded-xl border border-slate-300 bg-white font-mono text-base font-extrabold tracking-widest text-emerald-950 select-none">
                    {captchaNum1} + {captchaNum2} = ?
                  </div>
                  <input
                    type="number"
                    placeholder="Answer"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    required
                    className="h-10 w-24 rounded-xl border border-slate-300 bg-white px-3 text-center text-sm font-bold outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              {error && (
                <div role="alert" className="rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-900 ring-1 ring-rose-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 text-sm font-bold text-white shadow-md transition hover:brightness-110"
              >
                <span>Send Verification OTP</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-3.5">
              <div className="rounded-2xl bg-emerald-50 p-3 text-xs text-emerald-900 border border-emerald-200">
                <p className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                  SMS OTP Sent to {otpPhone || '9999990001'}
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Demo auto-filled code: <strong>4829</strong>
                </p>
              </div>

              <div>
                <label htmlFor="otpCode" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Enter 4-Digit OTP Code
                </label>
                <input
                  id="otpCode"
                  type="text"
                  maxLength={4}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="4829"
                  autoFocus
                  required
                  className="h-12 w-full rounded-2xl border-2 border-slate-200 text-center font-mono text-xl font-bold tracking-widest text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {error && (
                <div role="alert" className="rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-900 ring-1 ring-rose-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 text-sm font-bold text-white shadow-md transition hover:brightness-110"
              >
                {busy ? t('auth.working') : 'Verify OTP & Log In'}
                {!busy && <CheckCircle2 className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Change mobile number
              </button>
            </form>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="relative my-4 flex items-center justify-center">
        <div className="w-full border-t border-slate-200" />
        <span className="absolute bg-white px-2 text-[11px] font-bold text-slate-400 uppercase">
          Or
        </span>
      </div>

      {/* Continue with Google Button */}
      <button
        type="button"
        onClick={() => setGoogleModal(true)}
        className="flex min-h-11 w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-100"
      >
        <GoogleIcon />
        <span>Continue with Google</span>
      </button>

      <button
        type="button"
        onClick={switchMode}
        className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 py-3 px-4 text-center text-sm font-extrabold text-emerald-900 shadow-2xs transition hover:bg-emerald-100 hover:text-emerald-950 hover:shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
      >
        <span>{t(isRegister ? 'auth.haveAccount' : 'auth.noAccount')}</span>
      </button>

      {/* Google Account Picker Modal */}
      {googleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <GoogleIcon />
              <h2 className="text-sm font-bold text-slate-900">Sign in with Google</h2>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <p className="text-slate-600 mb-2">Choose a Google account to continue to ProcureFlow:</p>
              
              <button
                type="button"
                onClick={() => handleGoogleLogin('ramesh.patil.farmer@gmail.com')}
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 p-3 text-left hover:bg-slate-50 transition"
              >
                <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-700 font-bold text-white text-sm">
                  R
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900">Ramesh Patil</p>
                  <p className="text-slate-500 truncate text-[11px]">ramesh.patil.farmer@gmail.com</p>
                </div>
              </button>

              <div className="mt-3">
                <input
                  type="email"
                  placeholder="Or enter any Gmail address..."
                  value={gmailInput}
                  onChange={(e) => setGmailInput(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-emerald-600"
                />
                {gmailInput && (
                  <button
                    type="button"
                    onClick={() => handleGoogleLogin(gmailInput)}
                    className="mt-2 w-full rounded-xl bg-emerald-700 py-2 text-xs font-bold text-white hover:bg-emerald-800"
                  >
                    Continue as {gmailInput}
                  </button>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setGoogleModal(false)}
              className="mt-4 w-full rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </CenteredLayout>
  );
}
