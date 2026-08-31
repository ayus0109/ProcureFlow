import { Sprout } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext.jsx';

/**
 * Shared shell for entry/auth screens: Organic warm agricultural background,
 * clean brand header, and natural card.
 */
export default function CenteredLayout({ children }) {
  const { t } = useLanguage();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#f4f7f4] px-4 py-8 text-slate-900">
      <header className="relative z-10 mb-6 flex flex-col items-center text-center">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#133e2b] border border-[#206346] text-[#a3e635] shadow-xs">
            <Sprout className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="text-3xl font-black tracking-tight text-[#133e2b]">
            {t('app.name')}
          </span>
        </div>
        <p className="mt-2 text-sm font-semibold text-slate-600 max-w-sm">{t('app.tagline')}</p>
      </header>

      <main className="relative z-10 w-full max-w-md rounded-3xl border border-[#e2e8e0] bg-white p-6 shadow-sm sm:p-8">
        {children}
      </main>
    </div>
  );
}
