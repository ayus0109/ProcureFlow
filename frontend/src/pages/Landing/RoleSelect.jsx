import { ArrowLeft, ChevronRight, ClipboardCheck, Wheat, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext.jsx';
import CenteredLayout from '../../layouts/CenteredLayout.jsx';

/** Second screen: Farmer or Centre Admin with rich visual role cards */
export default function RoleSelect() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const roles = [
    {
      to: '/farmer/login',
      Icon: Wheat,
      title: t('role.farmer'),
      desc: t('role.farmerDesc'),
      color: 'from-emerald-500 to-green-600',
      badge: 'Farmer Portal',
    },
    {
      to: '/admin/login',
      Icon: ClipboardCheck,
      title: t('role.admin'),
      desc: t('role.adminDesc'),
      color: 'from-teal-600 to-cyan-700',
      badge: 'APMC Staff Portal',
    },
  ];

  return (
    <CenteredLayout>
      <div className="mb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">{t('role.heading')}</h1>
        <p className="text-xs text-slate-500 mt-0.5">{t('role.sub')}</p>
      </div>

      <div className="space-y-3.5">
        {roles.map(({ to, Icon, title, desc, color, badge }) => (
          <Link
            key={to}
            to={to}
            className="group relative flex min-h-22 items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500 hover:shadow-md hover:shadow-emerald-900/5 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
          >
            <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-md shadow-emerald-900/10`}>
              <Icon className="h-7 w-7" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="mb-0.5 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 uppercase">
                {badge}
              </span>
              <span className="block text-base font-bold text-slate-900 group-hover:text-emerald-950">
                {title}
              </span>
              <span className="block text-xs text-slate-500 line-clamp-1">
                {desc}
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-emerald-600" aria-hidden="true" />
          </Link>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold text-emerald-800 hover:text-emerald-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {t('lang.change')}
        </button>
        <span className="text-[11px] text-slate-400">Step 2 of 2</span>
      </div>
    </CenteredLayout>
  );
}
