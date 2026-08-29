import { useState } from 'react';
import {
  CloudSun,
  Volume2,
  PhoneCall,
  HelpCircle,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Headphones,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function AgriServicesCard() {
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState('weather'); // 'weather' | 'mandi' | 'faq' | 'voice'
  const [voicePlaying, setVoicePlaying] = useState(false);

  function triggerVoiceGuidance() {
    setVoicePlaying(true);
    if ('speechSynthesis' in window) {
      const msgText =
        lang === 'mr'
          ? 'प्रोक्योरफ्लो मध्ये आपले स्वागत आहे. आपले टोकन आणि रांगेतील स्थान तपासा.'
          : lang === 'hi'
          ? 'प्रोक्योरफ्लो में आपका स्वागत है। अपना टोकन और कतार की स्थिति देखें।'
          : 'Welcome to ProcureFlow. Check your token pass, advised arrival time, and live queue status.';
      const utterance = new SpeechSynthesisUtterance(msgText);
      utterance.lang = lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.onend = () => setVoicePlaying(false);
      utterance.onerror = () => setVoicePlaying(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setVoicePlaying(false), 3000);
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-800">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-bold tracking-wider text-slate-800 uppercase">
              {t('advisory.title')}
            </h2>
            <p className="text-xs text-slate-500">{t('advisory.sub')}</p>
          </div>
        </div>

        {/* Voice Guidance Assistant Button */}
        <button
          type="button"
          onClick={triggerVoiceGuidance}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition shadow-xs ${
            voicePlaying
              ? 'bg-amber-500 text-white animate-pulse'
              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
          }`}
        >
          <Volume2 className="h-3.5 w-3.5" />
          <span>{voicePlaying ? t('advisory.speaking') : t('advisory.voice')}</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="mt-4 flex gap-1.5 overflow-x-auto text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('weather')}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition ${
            activeTab === 'weather'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <CloudSun className="h-3.5 w-3.5" />
          <span>{t('advisory.weatherTab')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mandi')}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition ${
            activeTab === 'mandi'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          <span>{t('advisory.mandiTab')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('faq')}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition ${
            activeTab === 'faq'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span>{t('advisory.faqTab')}</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="mt-4 text-xs">
        {activeTab === 'weather' && (
          <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-sky-900 uppercase">{t('advisory.weatherTitle')}</p>
                <p className="text-xl font-extrabold text-slate-900 mt-0.5">{t('advisory.weatherCondition')}</p>
                <p className="text-slate-600 mt-1">
                  {t('advisory.weatherDesc')}
                </p>
              </div>
              <CloudSun className="h-10 w-10 text-sky-500 shrink-0" />
            </div>
          </div>
        )}

        {activeTab === 'mandi' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-200 font-medium">
              <span>{t('advisory.mandiA')}</span>
              <span className="font-bold font-mono text-emerald-800">{t('advisory.mandiARate')}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-200 font-medium">
              <span>{t('advisory.mandiFaq')}</span>
              <span className="font-mono text-slate-700">{t('advisory.mandiFaqRate')}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-200 font-medium">
              <span>{t('advisory.mandiPvt')}</span>
              <span className="font-mono text-slate-500">{t('advisory.mandiPvtRate')}</span>
            </div>
          </div>
        )}

        {activeTab === 'faq' && (
          <div className="space-y-2.5">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-900 border border-emerald-200 flex items-center justify-between">
              <div>
                <p className="font-bold flex items-center gap-1.5">
                  <PhoneCall className="h-4 w-4 text-emerald-700" />
                  {t('advisory.kisanTitle')}
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">{t('advisory.kisanSub')}</p>
              </div>
              <a
                href="tel:18001801551"
                className="rounded-xl bg-emerald-700 px-3 py-1.5 font-bold text-white shadow-xs hover:bg-emerald-800"
              >
                {t('advisory.call')}
              </a>
            </div>

            <dl className="space-y-1.5 text-slate-700">
              <div className="rounded-xl border border-slate-200 p-2.5 bg-white">
                <dt className="font-bold text-slate-900">{t('advisory.faq1Q')}</dt>
                <dd className="text-slate-600 mt-0.5 text-[11px]">
                  {t('advisory.faq1A')}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-200 p-2.5 bg-white">
                <dt className="font-bold text-slate-900">{t('advisory.faq2Q')}</dt>
                <dd className="text-slate-600 mt-0.5 text-[11px]">
                  {t('advisory.faq2A')}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </section>
  );
}
