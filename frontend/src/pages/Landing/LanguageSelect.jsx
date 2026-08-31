import { Check, Languages, ArrowRight, UserCheck, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext.jsx';
import { useAuth } from '../../auth/AuthContext.jsx';
import CenteredLayout from '../../layouts/CenteredLayout.jsx';

/** First screen: Interactive language selector with regional styling */
export default function LanguageSelect() {
  const { lang, setLang, languages, t } = useLanguage();
  const { user, isFarmer, isAdmin } = useAuth();
  const navigate = useNavigate();

  function choose(code) {
    setLang(code);
    if (isFarmer) {
      navigate('/farmer');
    } else if (isAdmin) {
      navigate('/admin');
    } else {
      navigate('/role');
    }
  }

  function continueToDashboard() {
    if (isFarmer) navigate('/farmer');
    else if (isAdmin) navigate('/admin');
    else navigate('/role');
  }

  return (
    <CenteredLayout>
      <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f0f7f2] text-[#156637] border border-[#d1e7dd]">
            <Languages className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[#133e2b]">{t('lang.heading')}</h1>
            <p className="text-xs text-slate-500">{t('lang.sub')}</p>
          </div>
        </div>
      </div>

      {/* Active Session Banner (if already logged in) */}
      {user && (
        <div className="mb-4 rounded-2xl border border-[#d1e7dd] bg-[#f0f7f2] p-3 text-xs flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <UserCheck className="h-4 w-4 text-[#156637] shrink-0" />
            <div className="truncate">
              <span className="font-bold text-[#133e2b] block truncate">
                {user.name}
              </span>
              <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">
                {user.role} Account
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={continueToDashboard}
            className="inline-flex items-center gap-1 rounded-xl bg-[#156637] px-3 py-1.5 font-bold text-white shadow-xs hover:bg-[#133e2b] transition shrink-0"
          >
            <span>Continue</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

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
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-[#156637] text-white shadow-xs">
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  ) : (
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-slate-400 group-hover:bg-[#f0f7f2] group-hover:text-[#156637]">
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
