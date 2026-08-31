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
import { formatLogMessage } from '../utils/localizedMessages.js';

export function SmsDispatchModal({ farmerId, onClose }) {
  const { t, lang } = useLanguage();
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

  const footerNotes = {
    hi: '💡 स्लॉट बुकिंग, काउंटर बुलावा और डीबीटी भुगतान जारी होने पर स्वचालित रूप से संदेश भेजे जाते हैं।',
    mr: '💡 स्लॉट बुकिंग, काऊंटर बोलावणे आणि डीबीटी पेमेंट मंजुरीवर स्वयंचलित संदेश पाठवले जातात.',
    pa: '💡 ਸਲਾਟ ਬੁਕਿੰਗ, ਕਾਊਂਟਰ ਬੁਲਾਉਣ ਅਤੇ ਡੀਬੀਟੀ ਭੁਗਤਾਨ ਜਾਰੀ ਹੋਣ ਤੇ ਆਪਣੇ ਆਪ ਸੁਨੇਹੇ ਭੇਜੇ ਜਾਂਦੇ ਹਨ।',
    gu: '💡 સ્લોટ બુકિંગ, કાઉન્ટર બોલાવવા અને ડીબીટી ચુકવણી રિલીઝ પર આપમેળે સંદેશાઓ મોકલવામાં આવે છે.',
    te: '💡 స్లాట్ బుకింగ్, కౌంటర్ కాల్ మరియు డిబిటి చెల్లింపు విడుదలపై ఆటోమేటిక్ సందేశాలు పంపబడతాయి.',
    kn: '💡 ಸ್ಲಾಟ್ ಬುಕಿಂಗ್, ಕೌಂಟರ್ ಕರೆ ಮತ್ತು ಡಿಬಿಟಿ ಪಾವತಿ ಬಿಡುಗಡೆಯಾದಾಗ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಸಂದೇಶಗಳು ಕಳುಹಿಸಲ್ಪಡುತ್ತವೆ.',
    en: '💡 Messages are triggered automatically on Slot Booking, Counter Calling & DBT Payment releases.',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#0d2a1d] bg-[#2d6a4f] px-5 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#1c563c] border border-[#2b7956] text-[#a3e635]">
              <Smartphone className="h-5 w-5" />
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
                {lang === 'mr'
                  ? 'स्लॉट बुक केल्यावर किंवा रांग पुढे सरकल्यावर स्वयंचलित SMS संदेश येथे दिसतील.'
                  : lang === 'hi'
                  ? 'स्लॉट बुक करने या कतार आगे बढ़ने पर स्वचालित SMS संदेश यहाँ दिखाई देंगे।'
                  : 'Book a slot or advance queue to trigger automated SMS dispatches.'}
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

              {/* Message text - Localized in active language */}
              <p className="text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-line">
                {formatLogMessage(log, lang, t)}
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
          {footerNotes[lang] || footerNotes.en}
        </div>
      </div>
    </div>
  );
}
