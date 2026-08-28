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
              Farmer Advisory & Support
            </h2>
            <p className="text-xs text-slate-500">Real-time weather, mandi comparisons & kisan help</p>
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
          <span>{voicePlaying ? 'Speaking...' : 'Voice Guidance'}</span>
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
          <span>Weather Forecast</span>
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
          <span>Mandi Rates Comparison</span>
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
          <span>Helpline & FAQs</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="mt-4 text-xs">
        {activeTab === 'weather' && (
          <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-sky-900 uppercase">District Weather Advisory</p>
                <p className="text-xl font-extrabold text-slate-900 mt-0.5">Pune & Baramati: 29°C, Clear Sky</p>
                <p className="text-slate-600 mt-1">
                  Optimal dry conditions for grain assaying and weighment. Moisture levels within FAQ limits (&lt;12%).
                </p>
              </div>
              <CloudSun className="h-10 w-10 text-sky-500 shrink-0" />
            </div>
          </div>
        )}

        {activeTab === 'mandi' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-200 font-medium">
              <span>🌾 Wheat (Grade A) — Pune APMC</span>
              <span className="font-bold font-mono text-emerald-800">₹2,546.25/qtl (Current Procurement)</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-200 font-medium">
              <span>🌾 Wheat (FAQ Standard) — Nashik APMC</span>
              <span className="font-mono text-slate-700">₹2,425.00/qtl</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-200 font-medium">
              <span>🌾 Wheat (Local Private Traders)</span>
              <span className="font-mono text-slate-500">₹2,280.00/qtl (Gov MSP is +₹145 higher)</span>
            </div>
          </div>
        )}

        {activeTab === 'faq' && (
          <div className="space-y-2.5">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-900 border border-emerald-200 flex items-center justify-between">
              <div>
                <p className="font-bold flex items-center gap-1.5">
                  <PhoneCall className="h-4 w-4 text-emerald-700" />
                  Kisan Call Centre (Toll-Free 24x7)
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">Dial 1800-180-1551 for agricultural procurement support</p>
              </div>
              <a
                href="tel:18001801551"
                className="rounded-xl bg-emerald-700 px-3 py-1.5 font-bold text-white shadow-xs hover:bg-emerald-800"
              >
                Call
              </a>
            </div>

            <dl className="space-y-1.5 text-slate-700">
              <div className="rounded-xl border border-slate-200 p-2.5 bg-white">
                <dt className="font-bold text-slate-900">How is my wait time calculated?</dt>
                <dd className="text-slate-600 mt-0.5 text-[11px]">
                  Wait time is automatically derived from the number of farmers ahead divided by the active counters operating at your centre.
                </dd>
              </div>
              <div className="rounded-xl border border-slate-200 p-2.5 bg-white">
                <dt className="font-bold text-slate-900">When will payment be credited?</dt>
                <dd className="text-slate-600 mt-0.5 text-[11px]">
                  Direct Benefit Transfer (DBT) is initiated within 24 to 48 hours directly to your Aadhaar-linked bank account.
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </section>
  );
}
