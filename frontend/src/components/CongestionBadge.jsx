import { useLanguage } from '../i18n/LanguageContext.jsx';

const STYLES = {
  LOW: {
    badge: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80 border-emerald-300/40',
    dot: 'bg-emerald-500',
    pulse: 'bg-emerald-400',
  },
  MODERATE: {
    badge: 'bg-amber-50 text-amber-900 ring-amber-200/80 border-amber-300/40',
    dot: 'bg-amber-500',
    pulse: 'bg-amber-400',
  },
  HIGH: {
    badge: 'bg-rose-50 text-rose-900 ring-rose-200/80 border-rose-300/40',
    dot: 'bg-rose-500',
    pulse: 'bg-rose-400',
  },
};

/** Colour-coded centre load badge with live pulsing radar dot */
export default function CongestionBadge({ level }) {
  const { t } = useLanguage();
  const theme = STYLES[level] ?? STYLES.LOW;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-xs ring-1 backdrop-blur-xs ${theme.badge}`}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${theme.pulse}`}
        />
        <span className={`relative inline-flex h-2 w-2 rounded-full ${theme.dot}`} />
      </span>
      <span>{t(`congestion.${level}`)}</span>
    </span>
  );
}
