import { Check, Languages, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext.jsx';
import CenteredLayout from '../../layouts/CenteredLayout.jsx';

/** First screen: Interactive language selector with regional styling */
export default function LanguageSelect() {
  const { lang, setLang, languages, t } = useLanguage();
  const navigate = useNavigate();

  function choose(code) {
    setLang(code);
    navigate('/role');
  }

  return (
    <CenteredLayout>
      <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-800">
          <Languages className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">{t('lang.heading')}</h1>
          <p className="text-xs text-slate-500">{t('lang.sub')}</p>
        </div>
      </div>

      <ul className="space-y-2">
        {languages.map((l) => {
          const active = lang === l.code;
          return (
            <li key={l.code}>
              <button
                type="button"
                onClick={() => choose(l.code)}
                lang={l.code}
                aria-current={active ? 'true' : undefined}
                className={`group flex min-h-14 w-full items-center justify-between rounded-2xl border-2 px-4 py-2.5 text-left transition-all duration-150 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 touch-manipulation ${
                  active
                    ? 'border-[#156637] bg-[#f0f7f2] shadow-xs'
                    : 'border-[#e2e8e0] bg-white hover:border-[#84a98c] hover:bg-[#f9fbf9]'
                }`}
              >
                <div>
                  <span className="block text-lg font-extrabold text-[#133e2b] group-hover:text-[#0d2a1d]">
                    {l.native}
                  </span>
                  <span className="block text-[11px] font-medium text-slate-500">
                    {l.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {active ? (
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-600 text-white shadow-xs">
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  ) : (
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-700">
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </CenteredLayout>
  );
}
