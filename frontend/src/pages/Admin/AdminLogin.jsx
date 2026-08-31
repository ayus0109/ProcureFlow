import { useState, useEffect } from 'react';
import { ArrowLeft, ShieldCheck, Lock, CheckCircle2, ArrowRight, RefreshCw, KeyRound, Sparkles } from 'lucide-react';
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

export default function AdminLogin() {
  const { t } = useLanguage();
  const { user, isAdmin, loginAdmin } = useAuth();
  const navigate = useNavigate();

  // If already signed in as admin, redirect immediately to admin center
  useEffect(() => {
    if (isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [isAdmin, navigate]);

  const [form, setForm] = useState({ adminCode: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function fillDemo() {
    setForm({
      adminCode: 'ADMIN001',
      password: 'admin123',
    });
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await loginAdmin(form);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  async function handleGoogleWorkspaceLogin() {
    setBusy(true);
    try {
      await loginAdmin({ adminCode: 'ADMIN001', password: 'admin123' });
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <CenteredLayout>
      <div className="flex items-center justify-between mb-4">
        <Link
          to="/role"
          className="inline-flex items-center gap-2 rounded-xl py-1 px-2.5 -ml-2.5 text-sm font-bold text-[#156637] transition hover:bg-[#f0f7f2] hover:text-[#133e2b] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
        >
          <ArrowLeft className="h-4.5 w-4.5" aria-hidden="true" />
          <span>{t('role.heading')}</span>
        </Link>
        <span className="rounded-full bg-[#f0f7f2] border border-[#d1e7dd] px-3 py-1 text-xs font-bold text-[#133e2b]">
          APMC Staff Portal
        </span>
      </div>

      <div className="border-b border-slate-100 pb-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{t('auth.adminTitle')}</h1>
        <p className="mt-1 text-xs text-slate-600">{t('auth.adminSub')}</p>
      </div>

      {/* Quick 1-Click Demo Admin Credentials Chip */}
      <button
        type="button"
        onClick={fillDemo}
        className="mt-4 flex w-full items-center justify-between rounded-2xl border border-[#d1e7dd] bg-[#f0f7f2] p-3 text-left transition hover:border-[#156637] hover:shadow-2xs focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#156637] shrink-0" />
          <div>
            <span className="block text-xs font-black text-[#133e2b]">
              Demo Account: Suresh Kale (Pune APMC)
            </span>
            <span className="block text-[11px] font-mono text-[#156637]">
              ADMIN001 • admin123
            </span>
          </div>
        </div>
        <span className="rounded-lg bg-[#156637] px-2.5 py-1 text-[11px] font-extrabold text-white shadow-2xs">
          Auto-Fill
        </span>
      </button>

      <form onSubmit={submit} className="mt-4 space-y-3.5">
        <FormField
          id="adminCode"
          label={t('auth.adminCode')}
          value={form.adminCode}
          onChange={set('adminCode')}
          placeholder="e.g. ADMIN001"
          autoCapitalize="characters"
          autoComplete="username"
          required
        />
        <FormField
          id="password"
          label={t('auth.password')}
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={set('password')}
          autoComplete="current-password"
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
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#156637] hover:bg-[#133e2b] text-sm font-bold text-white shadow-md shadow-emerald-950/20 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:opacity-60"
        >
          {busy ? t('auth.working') : t('auth.signIn')}
          {!busy && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-4 flex items-center justify-center">
        <div className="w-full border-t border-slate-200" />
        <span className="absolute bg-white px-2 text-[11px] font-bold text-slate-400 uppercase">
          Or
        </span>
      </div>

      {/* Continue with Google Workspace Button */}
      <button
        type="button"
        onClick={handleGoogleWorkspaceLogin}
        className="flex min-h-11 w-full items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-[#156637] hover:bg-slate-50 focus:outline-none"
      >
        <GoogleIcon />
        <span>Continue with APMC Official Google Account</span>
      </button>
    </CenteredLayout>
  );
}
