import { Check, Languages, ArrowRight, UserCheck, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext.jsx';
import { useAuth } from '../../auth/AuthContext.jsx';
import CenteredLayout from '../../layouts/CenteredLayout.jsx';

/** First screen: Interactive language selector with humanized light green regional styling */
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
      <div className="mb-5 flex items-center justify-between border-b border-[#e4eee5] pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#eef7f0] text-[#2d6a4f] border border-[#d5ead8]">
            <Languages className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[#1b4332]">{t('lang.heading')}</h1>
            <p className="text-xs text-slate-500">{t('lang.sub')}</p>
          </div>
        </div>
      </div>

      {/* Active Session Banner (if already logged in) */}
      {user && (
        <div className="mb-4 rounded-2xl border border-[#d5ead8] bg-[#eef7f0] p-3 text-xs flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <UserCheck className="h-4 w-4 text-[#2d6a4f] shrink-0" />
            <div className="truncate">
              <span className="font-bold text-[#1b4332] block truncate">
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
            className="inline-flex items-center gap-1 rounded-xl bg-[#2d6a4f] px-3 py-1.5 font-bold text-white shadow-xs hover:bg-[#1b4332] transition shrink-0"
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
                    ? 'border-[#52b788] bg-[#eef7f0] shadow-xs'
                    : 'border-[#dce8dd] bg-white hover:border-[#52b788] hover:bg-[#f6fbf7]'
                }`}
              >
                <div>
                  <span className="block text-lg font-extrabold text-[#1b4332] group-hover:text-[#081c15]">
                    {l.native}
                  </span>
                  <span className="block text-[11px] font-medium text-slate-500">
                    {l.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {active ? (
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-[#2d6a4f] text-white shadow-xs">
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  ) : (
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-[#f3f8f4] text-slate-400 group-hover:bg-[#eef7f0] group-hover:text-[#2d6a4f]">
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
