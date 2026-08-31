import { useState } from 'react';
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Info,
  Bell,
  CheckCheck,
  Smartphone,
  Check,
} from 'lucide-react';
import { api } from '../services/api';
import { usePoll } from '../hooks/usePoll.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { formatAlertMessage } from '../utils/localizedMessages.js';

const TYPES = {
  ACTION: { Icon: BellRing, tint: 'bg-amber-100 text-amber-900 ring-1 ring-amber-300' },
  SUCCESS: { Icon: CheckCircle2, tint: 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300' },
  ALERT: { Icon: AlertTriangle, tint: 'bg-rose-100 text-rose-900 ring-1 ring-rose-300' },
  INFO: { Icon: Info, tint: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200' },
};

const clock = (s) => (typeof s === 'string' ? s.slice(11, 16) : '');

export default function AlertsPanel({ onOpenSmsModal }) {
  const { t, lang } = useLanguage();
  const { data, loading, setData } = usePoll(() => api('/notifications'), 5000, []);
  const [marking, setMarking] = useState(false);
  const [justMarked, setJustMarked] = useState(false);

  const items = data ? data.items : [];
  const unread = data ? data.unread : 0;

  async function markRead() {
    if (marking) return;
    setMarking(true);
    try {
      const res = await api('/notifications/read', { method: 'POST' });
      setData(res);
      setJustMarked(true);
      setTimeout(() => setJustMarked(false), 3000);
    } catch {
      // Ignored
    } finally {
      setMarking(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white p-4 sm:p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-800">
            <Bell className="h-4 w-4" />
          </span>
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-bold tracking-wider text-slate-800 uppercase">
              {t('alerts.title')}
            </h2>
            {unread > 0 ? (
              <span className="rounded-full bg-emerald-700 px-2 py-0.2 text-[10px] font-bold text-white shadow-xs animate-pulse">
                {unread} {t('alerts.new')}
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2 py-0.2 text-[10px] font-bold text-slate-500">
                0 {t('alerts.new')}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls: Mark Read + View Full SMS Modal */}
        <div className="flex items-center gap-2">
          {unread > 0 ? (
            <button
              type="button"
              onClick={markRead}
              disabled={marking}
              className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs touch-manipulation disabled:opacity-50"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>{marking ? 'Marking…' : t('alerts.markRead')}</span>
            </button>
          ) : justMarked ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
              <Check className="h-3.5 w-3.5" /> All Read
            </span>
          ) : null}

          {onOpenSmsModal && (
            <button
              type="button"
              onClick={onOpenSmsModal}
              className="inline-flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 transition shadow-2xs touch-manipulation"
              title="Open full SMS & WhatsApp logs"
            >
              <Smartphone className="h-3.5 w-3.5 text-emerald-700" />
              <span>SMS Logs</span>
            </button>
          )}
        </div>
      </div>

      {loading && items.length === 0 && (
        <p className="mt-4 text-xs text-slate-500 animate-pulse">{t('common.loading')}</p>
      )}

      {!loading && items.length === 0 && (
        <div className="mt-4 py-6 text-center">
          <p className="text-xs text-slate-500 font-medium">{t('alerts.empty')}</p>
          {onOpenSmsModal && (
            <button
              type="button"
              onClick={onOpenSmsModal}
              className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 underline hover:text-emerald-900"
            >
              View SMS & WhatsApp Dispatch History →
            </button>
          )}
        </div>
      )}

      {items.length > 0 && (
        <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
          {items.map((item) => {
            const { Icon, tint } = TYPES[item.type] || TYPES.INFO;
            return (
              <li
                key={item.id}
                onClick={!item.is_read ? markRead : undefined}
                className={`flex items-start gap-3 rounded-2xl p-3 text-xs transition ${
                  item.is_read
                    ? 'bg-white border border-slate-100 text-slate-700'
                    : 'bg-emerald-50/70 border border-emerald-200/80 text-emerald-950 font-medium shadow-2xs cursor-pointer hover:bg-emerald-100/70'
                }`}
              >
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-xl ${tint}`}>
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="leading-relaxed">{formatAlertMessage(item.message, lang)}</p>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{clock(item.created_at)}</span>
                    {!item.is_read && (
                      <span className="font-sans font-bold text-emerald-700 text-[10px]">
                        ● {t('alerts.new')}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
