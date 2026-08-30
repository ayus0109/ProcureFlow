import { useState } from 'react';
import {
  ArrowLeft,
  Phone,
  Lock,
  ArrowRight,
  User,
  ShieldCheck,
  Building2,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import CenteredLayout from '../../layouts/CenteredLayout.jsx';
import FormField from '../../components/FormField.jsx';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useLanguage } from '../../i18n/LanguageContext.jsx';

export default function FarmerLogin() {
  const { t } = useLanguage();
  const { loginFarmer, registerFarmer } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', phone: '', village: '', password: '', aadhaarNo: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function switchMode() {
    setMode(isRegister ? 'login' : 'register');
    setError('');
  }

  function fillDemo() {
    setForm((f) => ({
      ...f,
      phone: '9999990001',
      password: 'farmer123',
    }));
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (isRegister) {
        await registerFarmer(form);
      } else {
        await loginFarmer({ phone: form.phone.trim(), password: form.password });
      }
      navigate('/farmer', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setBusy(false);
    }
  }

  return (
    <CenteredLayout>
      {/* Top Header & Role Badge */}
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
          {isRegister ? t('auth.registerFarmer') : t('auth.farmerTitle')}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium">
          {isRegister ? 'Create your official farmer account to book slots' : t('auth.farmerSub')}
        </p>
      </div>

      {/* Quick 1-Click Demo Credentials Chip */}
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

      {/* Main Clean Form */}
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
            <FormField
              id="aadhaarNo"
              label="12-Digit Aadhaar Number"
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
          {busy ? t('auth.working') : t(isRegister ? 'auth.register' : 'auth.signIn')}
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
