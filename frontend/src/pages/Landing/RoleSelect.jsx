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
      iconBg: 'bg-[#133e2b] text-[#a3e635] border border-[#206346]',
      badge: t('role.farmerBadge'),
    },
    {
      to: '/admin/login',
      Icon: ClipboardCheck,
      title: t('role.admin'),
      desc: t('role.adminDesc'),
      iconBg: 'bg-[#1e3a47] text-cyan-300 border border-[#2e5363]',
      badge: t('role.staffBadge'),
    },
  ];

  return (
    <CenteredLayout>
      <div className="mb-5">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#133e2b]">
          {t('role.heading')}
        </h1>
        <p className="text-sm font-medium text-slate-600 mt-1">
          {t('role.sub')}
        </p>
      </div>

      <div className="space-y-3.5">
        {roles.map(({ to, Icon, title, desc, iconBg, badge }) => (
          <Link
            key={to}
            to={to}
            className="group relative flex min-h-22 items-center gap-4 rounded-2xl border border-[#e2e8e0] bg-white p-4 transition-all duration-150 hover:border-[#156637] hover:bg-[#fafcfa] hover:shadow-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
          >
            <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${iconBg} shadow-xs`}>
              <Icon className="h-7 w-7" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="mb-0.5 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
                {badge}
              </span>
              <span className="block text-base font-bold text-slate-900 group-hover:text-[#133e2b]">
                {title}
              </span>
              <span className="block text-xs text-slate-500 line-clamp-1">
                {desc}
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-[#156637]" aria-hidden="true" />
          </Link>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-200/80 pt-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm font-bold text-emerald-800 hover:bg-emerald-50 hover:text-emerald-950 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{t('lang.change')}</span>
        </button>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
          {t('common.step')} 2 {t('common.of')} 2
        </span>
      </div>
    </CenteredLayout>
  );
}
