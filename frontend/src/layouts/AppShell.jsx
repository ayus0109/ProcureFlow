import { LogOut, Sprout, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';

/**
 * Shell for signed-in screens: GovTech styling, live language switcher,
 * user persona chip, and interactive Judge Demo toolkit.
 */
export default function AppShell({ title, subtitle, children }) {
  const { user, role, logout } = useAuth();
  const { t, lang, setLang, languages } = useLanguage();
  const navigate = useNavigate();

  function signOut() {
    logout();
    navigate('/', { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-emerald-950/5 via-slate-50 to-slate-100 text-slate-900">
      {/* Main Header - Mobile Optimized */}
      <header className="sticky top-0 z-40 border-b border-emerald-100/80 bg-white/95 shadow-xs backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <span className="grid h-9 w-9 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-700/20 ring-2 ring-emerald-600/20">
              <Sprout className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-emerald-950 truncate">
                  {t('app.name')}
                </span>
                <span className="hidden xs:inline-block rounded-md bg-emerald-100 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-800 uppercase">
                  {t('app.govMandi')}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 hidden sm:block">
                {t('app.tagline')}
              </p>
            </div>
          </div>

          {/* Controls: Persona Pill, Language, Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* User Pill */}
            {user && (
              <div className="hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 md:flex">
                {role === 'admin' ? (
                  <Building2 className="h-3.5 w-3.5 text-teal-700" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                )}
                <span className="max-w-28 truncate font-bold text-slate-900">
                  {user.name?.split(' ')[0]}
                </span>
                <span className="rounded-md bg-slate-200 px-1 py-0.2 text-[9px] text-slate-600 uppercase font-mono font-bold">
                  {role}
                </span>
              </div>
            )}

            {/* Language Selector */}
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              aria-label={t('lang.change')}
              className="h-8 sm:h-9 cursor-pointer rounded-xl border border-slate-300 bg-white px-2 text-xs font-bold text-slate-800 shadow-2xs outline-none transition hover:border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.native}
                </option>
              ))}
            </select>

            {/* Logout Button */}
            <button
              type="button"
              onClick={signOut}
              title={t('common.logout')}
              className="inline-flex h-8 sm:h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{t('common.logout')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-5 sm:py-6">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200/80 pb-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm font-medium text-slate-600">{subtitle}</p>}
          </div>
        </div>

        <div className="space-y-5">{children}</div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-500">
        <p>{t('app.footer')}</p>
      </footer>
    </div>
  );
}
