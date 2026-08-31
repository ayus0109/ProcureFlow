import KisanLogo from '../components/KisanLogo.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';

/**
 * Shared shell for entry/auth screens: Soothing Light Green agricultural theme,
 * handcrafted brand logo, and warm humanized card.
 */
export default function CenteredLayout({ children }) {
  const { t } = useLanguage();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#f3f8f4] px-4 py-8 text-[#1b4332]">
      {/* Decorative subtle background shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#d5ead8]/40 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#e8f5e9]/60 blur-3xl" />
      </div>

      <header className="relative z-10 mb-6 flex flex-col items-center text-center">
        <KisanLogo size="lg" theme="light" subtitleText={t('app.tagline')} />
      </header>

      <main className="relative z-10 w-full max-w-md rounded-3xl border border-[#d5ead8] bg-white p-6 shadow-sm shadow-[#1b4332]/5 sm:p-8">
        {children}
      </main>
    </div>
  );
}
