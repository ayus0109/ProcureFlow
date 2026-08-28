import { Sprout } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext.jsx';

/**
 * Shared shell for entry/auth screens: ambient gradient backdrop,
 * brand header, and centered glass card.
 */
export default function CenteredLayout({ children }) {
  const { t } = useLanguage();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-950/10 via-slate-50 to-teal-950/10 px-4 py-8 text-slate-900">
      {/* Background Decorative Rings */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-teal-300/20 blur-3xl" />
      </div>

      <header className="relative z-10 mb-6 flex flex-col items-center text-center">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-700/25 ring-4 ring-emerald-600/15">
            <Sprout className="h-7 w-7" aria-hidden="true" />
          </span>
          <span className="text-3xl font-extrabold tracking-tight text-emerald-950">
            {t('app.name')}
          </span>
        </div>
        <p className="mt-2 text-sm font-medium text-slate-600">{t('app.tagline')}</p>
        <span className="mt-1 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-300/50">
          Smart APMC Procurement Portal
        </span>
      </header>

      <main className="relative z-10 w-full max-w-md rounded-3xl border border-emerald-100/80 bg-white/95 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-md sm:p-8">
        {children}
      </main>
    </div>
  );
}
