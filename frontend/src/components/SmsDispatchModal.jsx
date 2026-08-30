import { useState, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Phone,
  CheckCheck,
  Smartphone,
  Share2,
  RefreshCw,
  Send,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext.jsx';

export function SmsDispatchModal({ farmerId, onClose }) {
  const { t } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = () => {
    setLoading(true);
    api('/notifications/sms-logs')
      .then((data) => setLogs(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [farmerId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-800/20 bg-gradient-to-r from-emerald-800 to-teal-900 px-5 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/20">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold">{t('smsModal.title')}</h3>
              <p className="text-[11px] text-emerald-200 font-medium">
                {t('smsModal.sub')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchLogs}
              className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-white hover:bg-white/20"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Message Log List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60">
          {logs.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-500">
              <MessageSquare className="mx-auto h-10 w-10 text-slate-300 mb-2" />
              <p className="font-bold text-sm text-slate-700">{t('smsModal.empty')}</p>
              <p className="text-xs text-slate-400 mt-1">
                Book a slot or advance queue to trigger automated SMS dispatches.
              </p>
            </div>
          )}

          {logs.map((log) => (
            <div
              key={log.id}
              className={`rounded-2xl p-4 shadow-xs border ${
                log.channel === 'WHATSAPP'
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs pb-2 mb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold">
                  {log.channel === 'WHATSAPP' ? (
                    <span className="flex items-center gap-1 text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-lg text-[10px]">
                      📲 WhatsApp
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded-lg text-[10px]">
                      💬 SMS Dispatch
                    </span>
                  )}
                  <span className="font-mono text-slate-600 text-[11px]">To: {log.phone}</span>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                  <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{log.status}</span>
                </div>
              </div>

              {/* Message text */}
              <p className="text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-line">
                {log.message}
              </p>

              <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Type: {log.type}</span>
                <span>{log.sent_at}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer info note */}
        <div className="border-t border-slate-200 bg-white p-3.5 text-center text-xs text-slate-500 font-medium">
          💡 Messages are triggered automatically on Slot Booking, Counter Calling & DBT Payment releases.
        </div>
      </div>
    </div>
  );
}
