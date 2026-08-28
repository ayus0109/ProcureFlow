import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import CenteredLayout from '../layouts/CenteredLayout.jsx';

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <CenteredLayout>
      <h1 className="text-lg font-semibold text-slate-900">{t('notFound.heading')}</h1>
      <p className="mt-1 text-sm text-slate-600">{t('notFound.sub')}</p>
      <Link
        to="/"
        className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-green-700 px-5 text-sm font-semibold text-white transition hover:bg-green-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-200"
      >
        {t('notFound.home')}
      </Link>
    </CenteredLayout>
  );
}
