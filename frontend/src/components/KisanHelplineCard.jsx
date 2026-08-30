import { PhoneCall, HelpCircle, Headphones, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function KisanHelplineCard() {
  const { t } = useLanguage();

  return (
    <section className="overflow-hidden rounded-3xl border border-emerald-200/80 bg-white p-5 shadow-sm sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-100 text-emerald-800">
            <Headphones className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {t('advisory.faqTab')}
            </h2>
            <p className="text-xs text-slate-500">
              {t('advisory.faqSub')}
            </p>
          </div>
        </div>

        <a
          href="tel:18001801551"
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-800/20 transition hover:bg-emerald-800 hover:brightness-110"
        >
          <PhoneCall className="h-4 w-4" />
          <span>{t('advisory.callBtn')}</span>
        </a>
      </div>

      {/* Helpline Contact Banners */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                {t('advisory.kisanCenter')}
              </p>
              <p className="mt-1 font-mono text-lg font-extrabold text-emerald-950">
                {t('advisory.kisanPhone') || '1800-180-1551'}
              </p>
              <p className="mt-0.5 text-xs text-emerald-700">
                {t('advisory.kisanDesc')}
              </p>
            </div>
            <PhoneCall className="h-6 w-6 text-emerald-600 shrink-0" />
          </div>
        </div>

        <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-teal-800">
                {t('advisory.apmcDesk')}
              </p>
              <p className="mt-1 font-mono text-lg font-extrabold text-teal-950">
                {t('advisory.apmcPhone') || '1800-233-0244'}
              </p>
              <p className="mt-0.5 text-xs text-teal-700">
                {t('advisory.apmcDesc')}
              </p>
            </div>
            <ShieldCheck className="h-6 w-6 text-teal-600 shrink-0" />
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="mt-4 space-y-2.5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <HelpCircle className="h-4 w-4 text-emerald-700" />
            {t('advisory.faq1Q')}
          </h3>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed pl-5.5">
            {t('advisory.faq1A')}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <HelpCircle className="h-4 w-4 text-emerald-700" />
            {t('advisory.faq2Q')}
          </h3>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed pl-5.5">
            {t('advisory.faq2A')}
          </p>
        </div>
      </div>
    </section>
  );
}
