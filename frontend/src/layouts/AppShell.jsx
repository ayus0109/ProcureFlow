import { LogOut, Building2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import KisanLogo, { KisanLogoMark } from '../components/KisanLogo.jsx';

/**
 * Shell for signed-in screens: Humanized Light Green Theme,
 * custom handcrafted KisanSathi logo, live language switcher, and clean trusted layout.
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
    <div className="flex min-h-screen flex-col bg-[#f3f8f4] text-[#1b4332]">
      {/* Top Header - Refreshing Light Sage Green */}
      <header className="sticky top-0 z-40 border-b border-[#d5ead8] bg-white/95 backdrop-blur-md text-[#1b4332] shadow-2xs">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <KisanLogo size="md" theme="light" subtitleText={t('app.tagline')} />
          </div>

          {/* Controls: Persona Pill, Language, Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* User Pill */}
            {user && (
              <div className="hidden items-center gap-1.5 rounded-xl border border-[#d5ead8] bg-[#f0f7f2] px-2.5 py-1 text-xs font-semibold text-[#1b4332] md:flex">
                {role === 'admin' ? (
                  <Building2 className="h-3.5 w-3.5 text-[#2d6a4f]" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-[#52b788]" />
                )}
                <span className="max-w-28 truncate font-bold text-[#1b4332]">
                  {user.name?.split(' ')[0]}
                </span>
                <span className="rounded bg-[#e2f0e4] px-1.5 py-0.2 text-[9px] text-[#2d6a4f] uppercase font-mono font-bold">
                  {role}
                </span>
              </div>
            )}

            {/* Language Selector */}
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              aria-label={t('lang.change')}
              className="h-8 sm:h-9 cursor-pointer rounded-xl border border-[#d5ead8] bg-[#f0f7f2] px-2 text-xs font-bold text-[#1b4332] shadow-2xs outline-none transition hover:bg-[#e2f0e4] focus:border-[#52b788] focus:ring-2 focus:ring-[#52b788]/20"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code} className="bg-white text-[#1b4332]">
                  {l.native}
                </option>
              ))}
            </select>

            {/* Logout Button */}
            <button
              type="button"
              onClick={signOut}
              title={t('common.logout')}
              className="inline-flex h-8 sm:h-9 items-center gap-1 rounded-xl border border-[#d5ead8] bg-white px-2.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{t('common.logout')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-3 sm:px-4 py-4 sm:py-6">
        <div className="mb-4 sm:mb-5 flex flex-wrap items-baseline justify-between gap-2 border-b border-[#dce8dd] pb-3">
          <div>
            <h1 className="text-xl font-black tracking-tight text-[#1b4332] sm:text-2xl">{title}</h1>
            {subtitle && <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-600">{subtitle}</p>}
          </div>
        </div>

        <div className="space-y-4 sm:space-y-5">{children}</div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#dce8dd] bg-white px-4 py-4 text-center text-xs text-slate-500">
        <p>{t('app.footer')}</p>
      </footer>
    </div>
  );
}
