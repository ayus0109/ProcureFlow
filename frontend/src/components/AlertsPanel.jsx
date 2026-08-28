import { AlertTriangle, BellRing, CheckCircle2, Info, Bell, CheckCheck } from 'lucide-react';
import { api } from '../services/api';
import { usePoll } from '../hooks/usePoll.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';

const TYPES = {
  ACTION: { Icon: BellRing, tint: 'bg-amber-100 text-amber-900 ring-1 ring-amber-300' },
  SUCCESS: { Icon: CheckCircle2, tint: 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300' },
  ALERT: { Icon: AlertTriangle, tint: 'bg-rose-100 text-rose-900 ring-1 ring-rose-300' },
  INFO: { Icon: Info, tint: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200' },
};

const clock = (s) => (typeof s === 'string' ? s.slice(11, 16) : '');

export default function AlertsPanel() {
  const { t } = useLanguage();
  const { data, loading, setData } = usePoll(() => api('/notifications'), 5000, []);

  const items = data ? data.items : [];
  const unread = data ? data.unread : 0;

  async function markRead() {
    try {
      setData(await api('/notifications/read', { method: 'POST' }));
    } catch {
      // Ignored
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-800">
            <Bell className="h-4 w-4" />
          </span>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold tracking-wider text-slate-800 uppercase">
              {t('alerts.title')}
            </h2>
            {unread > 0 && (
              <span className="rounded-full bg-emerald-700 px-2 py-0.2 text-[10px] font-bold text-white shadow-xs animate-pulse">
                {unread} {t('alerts.new')}
              </span>
            )}
          </div>
        </div>

        {unread > 0 && (
          <button
            type="button"
            onClick={markRead}
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:underline"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            {t('alerts.markRead')}
          </button>
        )}
      </div>

      {loading && items.length === 0 && (
        <p className="mt-4 text-xs text-slate-500 animate-pulse">{t('common.loading')}</p>
      )}

      {!loading && items.length === 0 && (
        <p className="mt-4 py-4 text-center text-xs text-slate-500">{t('alerts.empty')}</p>
      )}

      {items.length > 0 && (
        <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
          {items.map((item) => {
            const { Icon, tint } = TYPES[item.type] || TYPES.INFO;
            return (
              <li
                key={item.id}
                className={`flex items-start gap-3 rounded-2xl p-3 text-xs transition ${
                  item.is_read
                    ? 'bg-white border border-slate-100 text-slate-700'
                    : 'bg-emerald-50/70 border border-emerald-200/80 text-emerald-950 font-medium shadow-2xs'
                }`}
              >
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-xl ${tint}`}>
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="leading-relaxed">{item.message}</p>
                  <span className="mt-1 inline-block text-[10px] font-mono text-slate-400">
                    {clock(item.created_at)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
