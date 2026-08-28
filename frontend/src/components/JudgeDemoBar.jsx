import { useState } from 'react';
import {
  Sparkles,
  User,
  ShieldCheck,
  Languages,
  ChevronUp,
  ChevronDown,
  ArrowRightCircle,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { api } from '../services/api.js';

export default function JudgeDemoBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const { user, role, loginFarmer, loginAdmin } = useAuth();
  const { lang, setLang, languages } = useLanguage();
  const navigate = useNavigate();

  async function switchFarmer() {
    setBusy(true);
    setMsg('');
    try {
      await loginFarmer({ phone: '9999990001', password: 'farmer123' });
      navigate('/farmer');
      setMsg('Switched to Farmer: Ramesh Patil');
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function switchAdminPune() {
    setBusy(true);
    setMsg('');
    try {
      await loginAdmin({ adminCode: 'ADMIN001', password: 'admin123' });
      navigate('/admin');
      setMsg('Switched to Admin: Pune Center');
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function switchAdminNashik() {
    setBusy(true);
    setMsg('');
    try {
      await loginAdmin({ adminCode: 'ADMIN002', password: 'admin123' });
      navigate('/admin');
      setMsg('Switched to Admin: Nashik Center');
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function advanceNextInQueue() {
    setBusy(true);
    setMsg('');
    try {
      // Fetch queue items
      const q = await api('/queue');
      const nextBooking = (q?.queue || []).find((b) => b.nextStatus);
      if (nextBooking) {
        await api(`/queue/${nextBooking.id}/advance`, { method: 'POST' });
        setMsg(`Advanced Token ${nextBooking.token} → ${nextBooking.nextStatus}`);
      } else {
        setMsg('No pending queue step found to advance.');
      }
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside aria-label="Demo Controls" className="fixed bottom-3 right-3 z-50 max-w-sm sm:bottom-4 sm:right-4">
      <div className="overflow-hidden rounded-2xl border border-emerald-300/80 bg-white/95 shadow-xl backdrop-blur-md ring-1 ring-emerald-950/10">
        {/* Bar Header / Toggle */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between gap-3 bg-gradient-to-r from-emerald-900 to-teal-900 px-3.5 py-2.5 text-left text-xs font-semibold text-white transition hover:brightness-110"
        >
          <span className="flex items-center gap-1.5 font-mono tracking-wide">
            <Sparkles className="h-4 w-4 text-emerald-300 animate-pulse" />
            <span>JUDGE / DEMO TOOLKIT</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="rounded bg-emerald-700/80 px-1.5 py-0.5 text-[10px] text-emerald-100 uppercase">
              {role ? `${role}: ${user?.name?.split(' ')[0]}` : 'Guest'}
            </span>
            {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </span>
        </button>

        {/* Expanded Panel */}
        {isOpen && (
          <div className="p-3.5 space-y-3 text-xs">
            {msg && (
              <div className="rounded-lg bg-emerald-50 px-2.5 py-1.5 font-medium text-emerald-900 ring-1 ring-emerald-200 animate-fadeIn">
                {msg}
              </div>
            )}

            {/* Quick Switch Personas */}
            <div>
              <p className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] mb-1.5">
                Instant Persona Switch
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={switchFarmer}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-left font-medium text-slate-800 transition hover:border-emerald-500 hover:bg-emerald-50 disabled:opacity-50"
                >
                  <User className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                  <span className="truncate">Farmer (Ramesh)</span>
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={switchAdminPune}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-left font-medium text-slate-800 transition hover:border-emerald-500 hover:bg-emerald-50 disabled:opacity-50"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                  <span className="truncate">Admin (Pune)</span>
                </button>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={switchAdminNashik}
                className="mt-1.5 w-full flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-left font-medium text-slate-800 transition hover:border-emerald-500 hover:bg-emerald-50 disabled:opacity-50 text-[11px]"
              >
                <span>Admin (Nashik - Cross Centre Isolation Demo)</span>
                <ArrowRightCircle className="h-3 w-3 text-slate-400" />
              </button>
            </div>

            {/* Live Queue Action (If Admin) */}
            {role === 'admin' && (
              <div className="pt-1 border-t border-slate-100">
                <p className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                  Live Queue Control
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={advanceNextInQueue}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50 shadow-sm"
                >
                  <RefreshCw className={`h-3 w-3 ${busy ? 'animate-spin' : ''}`} />
                  Step Next Farmer in Queue
                </button>
              </div>
            )}

            {/* Instant Language Switch */}
            <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-1 text-slate-600 font-medium">
                <Languages className="h-3.5 w-3.5 text-emerald-700" />
                Language
              </span>
              <div className="flex gap-1">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setLang(l.code)}
                    className={`rounded px-2 py-0.5 text-[11px] font-semibold transition ${
                      lang === l.code
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {l.native}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
