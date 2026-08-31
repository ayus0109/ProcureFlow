import { ArrowLeft, ChevronRight, ClipboardCheck, Wheat, LogOut, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext.jsx';
import { useAuth } from '../../auth/AuthContext.jsx';
import CenteredLayout from '../../layouts/CenteredLayout.jsx';

/** Second screen: Farmer or Centre Admin with light green humanized styling */
export default function RoleSelect() {
  const { t } = useLanguage();
  const { user, isFarmer, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const roles = [
    {
      to: isFarmer ? '/farmer' : '/farmer/login',
      Icon: Wheat,
      title: t('role.farmer'),
      desc: t('role.farmerDesc'),
      iconBg: 'bg-[#eef7f0] text-[#2d6a4f] border border-[#d5ead8]',
      badge: t('role.farmerBadge'),
      isCurrent: isFarmer,
    },
    {
      to: isAdmin ? '/admin' : '/admin/login',
      Icon: ClipboardCheck,
      title: t('role.admin'),
      desc: t('role.adminDesc'),
      iconBg: 'bg-[#f0f4f8] text-[#1e3a47] border border-[#d2dfeb]',
      badge: t('role.staffBadge'),
      isCurrent: isAdmin,
    },
  ];

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <CenteredLayout>
      <div className="mb-5">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1b4332]">
          {t('role.heading')}
        </h1>
        <p className="text-sm font-medium text-slate-600 mt-1">
          {t('role.sub')}
        </p>
      </div>

      <div className="space-y-3.5">
        {roles.map(({ to, Icon, title, desc, iconBg, badge, isCurrent }) => (
          <Link
            key={title}
            to={to}
            className={`group relative flex min-h-22 items-center gap-4 rounded-2xl border-2 p-4 transition-all duration-150 shadow-2xs focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 ${
              isCurrent
                ? 'border-[#52b788] bg-[#eef7f0] ring-1 ring-[#52b788]/20 hover:bg-[#e4f3e7]'
                : 'border-[#dce8dd] bg-white hover:border-[#52b788] hover:bg-[#f6fbf7] hover:shadow-xs'
            }`}
          >
            <span className={`grid h-13 w-13 shrink-0 place-items-center rounded-2xl ${iconBg} shadow-2xs`}>
              <Icon className="h-6.5 w-6.5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="rounded-md bg-[#eef7f0] border border-[#d5ead8] px-1.5 py-0.5 text-[10px] font-bold text-[#2d6a4f] uppercase">
                  {badge}
                </span>
                {isCurrent && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#2d6a4f] px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Signed In ({user?.name?.split(' ')[0]})</span>
                  </span>
                )}
              </div>
              <span className="block text-base font-extrabold text-[#1b4332] group-hover:text-[#081c15]">
                {title}
              </span>
              <span className="block text-xs font-medium text-slate-500">
                {desc}
              </span>
            </span>
            <ChevronRight
              className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#2d6a4f]"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-[#e4eee5] pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#2d6a4f] hover:text-[#1b4332] transition"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{t('lang.change')}</span>
        </Link>

        {user && (
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-800 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </CenteredLayout>
  );
}
