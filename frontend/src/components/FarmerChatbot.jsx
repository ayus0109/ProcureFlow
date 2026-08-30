/**
 * FarmerChatbot.jsx
 *
 * Kisan Sahayak / Farmer Help & Support AI Chatbot.
 * Answers any questions, doubts, or issues regarding APMC procurement, MSP rates,
 * slot booking, DBT payments, moisture norms, required documents, and mandi operations.
 *
 * Multilingual: Marathi (मराठी), Hindi (हिंदी), and English.
 * Features:
 * - Highly visible, enlarged mobile floating trigger and modal window
 * - Instant reactive language switching (synced with global header & 1-tap in-chat switcher)
 * - Large, touch-friendly suggestion cards with high contrast for rural phone screens
 * - Voice Input (Speech-to-Text) & Voice Readout (Text-to-Speech)
 * - Direct navigation action buttons
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Mic,
  Volume2,
  VolumeX,
  Bot,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Loader2,
  ChevronRight,
  HelpCircle,
  Globe,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext.jsx';

const SPEECH_LANG_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
};

const SUGGESTIONS = {
  mr: [
    '🌾 चालू शासकीय हमीभाव दर काय आहेत?',
    '📋 खरेदी स्लॉट कसा बुक करावा?',
    '💳 बँक खात्यात पैसे कधी जमा होतात?',
    '📄 केंद्रावर कोणती कागदपत्रे आणावी?',
    '💧 कमाल आर्द्रता (Moisture) मर्यादा काय आहे?',
    '🏛️ कोणत्या केंद्रावर कमी गर्दी आहे?',
  ],
  hi: [
    '🌾 वर्तमान सरकारी न्यूनतम समर्थन मूल्य (MSP) क्या हैं?',
    '📋 सरकारी खरीद स्लॉट कैसे बुक करें?',
    '💳 DBT बैंक खाते में पैसे कब तक आएंगे?',
    '📄 मंडी में कौन-से दस्तावेज ले जाने हैं?',
    '💧 अधिकतम नमी (Moisture) सीमा क्या है?',
    '🏛️ किस खरीद केंद्र पर कम भीड़ है?',
  ],
  en: [
    '🌾 What are the current government MSP rates?',
    '📋 How do I book a procurement slot?',
    '💳 When and how will I receive DBT payment?',
    '📄 What documents must I bring to the mandi?',
    '💧 What is the maximum moisture percentage allowed?',
    '🏛️ Which procurement centres have low waiting times?',
  ],
};

export default function FarmerChatbot() {
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const activeAudioRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Initial Bot Welcome Greeting Generator
  const getWelcomeMessage = useCallback((currentLang) => {
    let welcomeText = '';
    if (currentLang === 'mr') {
      welcomeText =
        `नमस्कार! 🙏 मी **'किसान सहाय्यक' (Kisan Sahayak)** आहे — तुमचा २४/७ शासकीय APMC खरेदी मदतनीस.\n\n` +
        `तुम्हाला शासकीय हमीभाव, स्लॉट बुकिंग, DBT बँक पेमेंट, आवश्यक कागदपत्रे किंवा आर्द्रता नियमांबाबत काहीही अडचण किंवा प्रश्न असल्यास मला विचारा!`;
    } else if (currentLang === 'hi') {
      welcomeText =
        `नमस्ते! 🙏 मैं **'किसान सहायक' (Kisan Sahayak)** हूँ — आपका २४/७ सरकारी मंडी खरीद सहायक।\n\n` +
        `आपको न्यूनतम समर्थन मूल्य (MSP), स्लॉट बुकिंग, बैंक भुगतान, आवश्यक दस्तावेज या नमी मानकों से जुड़ा कोई भी प्रश्न या समस्या हो, तो बेझिझक पूछें!`;
    } else {
      welcomeText =
        `Hello! 🙏 I am **'Kisan Sahayak'** — your 24/7 APMC Procurement AI Assistant.\n\n` +
        `Ask me anything about Government MSP rates, slot booking, DBT payments, required documents, or moisture and quality guidelines!`;
    }

    return {
      id: `welcome-${currentLang}`,
      from: 'bot',
      text: welcomeText,
      suggestions: SUGGESTIONS[currentLang] || SUGGESTIONS.en,
    };
  }, []);

  // Initialize or update welcome greeting whenever `lang` or `open` changes
  useEffect(() => {
    if (open) {
      setMessages((prev) => {
        if (prev.length <= 1) {
          return [getWelcomeMessage(lang)];
        }
        return prev;
      });
    }
  }, [open, lang, getWelcomeMessage]);

  // Stop active speech audio
  const stopAudio = useCallback(() => {
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch {}
      activeAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    setPlayingAudioId(null);
  }, []);

  // Play HD Text-to-Speech audio for message
  const playSpeech = (msgId, text) => {
    if (playingAudioId === msgId) {
      stopAudio();
      return;
    }

    stopAudio();
    setPlayingAudioId(msgId);

    const cleanText = text
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/[•…\-_~*]/g, ' ')
      .trim();

    const ttsUrl = `/api/tts?text=${encodeURIComponent(cleanText)}&lang=${lang}`;
    const audio = new Audio(ttsUrl);
    activeAudioRef.current = audio;

    audio.onended = () => {
      setPlayingAudioId(null);
      activeAudioRef.current = null;
    };

    audio.onerror = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.lang = SPEECH_LANG_MAP[lang] || 'mr-IN';
          utterance.rate = 0.95;
          utterance.onend = () => setPlayingAudioId(null);
          utterance.onerror = () => setPlayingAudioId(null);
          window.speechSynthesis.speak(utterance);
          return;
        } catch {}
      }
      setPlayingAudioId(null);
    };

    audio.play().catch(() => setPlayingAudioId(null));
  };

  // Voice Input (Speech-to-Text)
  const toggleSpeechRecognition = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    stopAudio();
    const recognition = new SR();
    recognition.lang = SPEECH_LANG_MAP[lang] || 'mr-IN';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let final = '';
      let interim = '';
      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      const heard = final || interim;
      if (heard) {
        setInput(heard);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Send query to AI backend
  const handleSend = async (queryText) => {
    const q = (queryText || input).trim();
    if (!q || loading) return;

    stopAudio();
    setInput('');
    const userMsgId = Date.now();

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, from: 'user', text: q },
    ]);
    setLoading(true);

    try {
      const res = await api('/chatbot/ask', {
        method: 'POST',
        body: { query: q, lang },
      });

      const botMsgId = Date.now() + 1;
      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          from: 'bot',
          text: res.reply || 'I am here to help you. Please ask any doubt.',
          suggestions: res.suggestions || [],
          action: res.action || null,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          from: 'bot',
          text:
            lang === 'mr'
              ? 'माफ करा, सर्व्हरशी संपर्क होऊ शकला नाही. कृपया थोड्या वेळाने प्रयत्न करा.'
              : lang === 'hi'
              ? 'क्षमा करें, सर्वर से संपर्क नहीं हो पाया। कृपया पुनः प्रयास करें।'
              : 'Sorry, could not connect to server. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Markdown-style bold & bullet point renderer
  const renderMessageContent = (text) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 text-sm sm:text-base leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1.5" />;

          // Parse **bold** parts
          const parts = line.split(/(\*\*.*?\*\*)/g);
          const formattedLine = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-black text-slate-950">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            if (part.startsWith('*') && part.endsWith('*')) {
              return (
                <em key={pIdx} className="italic text-slate-700">
                  {part.slice(1, -1)}
                </em>
              );
            }
            return part;
          });

          return (
            <p key={idx} className="text-slate-900">
              {formattedLine}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* 🚀 PROMINENT, LARGE FLOATING TRIGGER WIDGET (FULLY VISIBLE ON PHONE & DESKTOP) */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-3 rounded-full bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 py-3.5 px-5 sm:py-4 sm:px-6 text-white shadow-2xl shadow-emerald-950/60 ring-4 ring-emerald-300/50 transition-all hover:scale-105 active:scale-95 group"
          aria-label="Kisan Sahayak Chatbot"
        >
          <span className="relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-white/20">
            <span className="absolute h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
            <Bot className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </span>
          <div className="text-left">
            <p className="text-sm sm:text-base font-black leading-tight tracking-wide">
              {lang === 'mr' ? 'किसान सहाय्यक AI' : lang === 'hi' ? 'किसान सहायक AI' : 'Kisan Sahayak AI'}
            </p>
            <p className="text-xs text-emerald-200 font-bold">
              {lang === 'mr' ? 'मदत व शंका निवारण' : lang === 'hi' ? 'मदद एवं समाधान' : 'Doubts & Help AI'}
            </p>
          </div>
          <span className="rounded-full bg-amber-400 px-2.5 py-1 text-xs font-black text-slate-950 shadow-sm ml-1">
            AI
          </span>
        </button>
      )}

      {/* 🚀 HIGH-VISIBILITY INTERACTIVE CHAT WINDOW MODAL */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs sm:items-center sm:justify-center sm:p-4 animate-fadeIn">
          <div className="flex h-[95dvh] w-full flex-col rounded-t-3xl bg-white shadow-2xl sm:h-[700px] sm:max-w-xl sm:rounded-3xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-emerald-900/20 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 px-4 sm:px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/20 shadow-inner backdrop-blur-md">
                  <Bot className="h-7 w-7 text-white" />
                  <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-emerald-900" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-wide flex items-center gap-2">
                    <span>{lang === 'mr' ? 'किसान सहाय्यक AI' : lang === 'hi' ? 'किसान सहायक AI' : 'Kisan Sahayak AI'}</span>
                    <span className="rounded-full bg-emerald-500/40 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-100 border border-emerald-400/40">
                      Online
                    </span>
                  </h3>
                  <p className="text-xs font-medium text-emerald-200">
                    {lang === 'mr' ? 'सरकारी APMC मदत व शंका निवारण' : lang === 'hi' ? 'सरकारी APMC सहायता केंद्र' : 'APMC Procurement Helpdesk'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    stopAudio();
                    setMessages([getWelcomeMessage(lang)]);
                  }}
                  title="Reset Chat"
                  className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15 text-emerald-100 hover:bg-white/25 transition shadow-2xs"
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopAudio();
                    setOpen(false);
                  }}
                  className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15 text-emerald-100 hover:bg-white/25 transition shadow-2xs"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* In-Chat 1-Tap Language Switcher Strip */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-b border-slate-200 bg-emerald-50/90 text-xs sm:text-sm font-bold text-emerald-950">
              <div className="flex items-center gap-1.5 text-xs text-emerald-900">
                <Sparkles className="h-4 w-4 text-emerald-700" />
                <span>{lang === 'mr' ? 'भाषा निवडा:' : lang === 'hi' ? 'भाषा चुनें:' : 'Language:'}</span>
              </div>

              {/* 1-Tap Language Switcher Pills */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-emerald-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    setLang('mr');
                    setMessages([getWelcomeMessage('mr')]);
                  }}
                  className={`rounded-lg px-3 py-1 text-xs font-black transition-all ${
                    lang === 'mr'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-50'
                  }`}
                >
                  मराठी
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLang('hi');
                    setMessages([getWelcomeMessage('hi')]);
                  }}
                  className={`rounded-lg px-3 py-1 text-xs font-black transition-all ${
                    lang === 'hi'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-50'
                  }`}
                >
                  हिंदी
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLang('en');
                    setMessages([getWelcomeMessage('en')]);
                  }}
                  className={`rounded-lg px-3 py-1 text-xs font-black transition-all ${
                    lang === 'en'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-50'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/60">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 ${m.from === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {m.from === 'bot' && (
                    <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                      <Bot className="h-5 w-5" />
                    </div>
                  )}

                  <div className={`max-w-[90%] sm:max-w-[85%] space-y-3`}>
                    <div
                      className={`rounded-3xl p-4 sm:p-4.5 shadow-xs ${
                        m.from === 'user'
                          ? 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white rounded-tr-xs text-sm sm:text-base font-semibold'
                          : 'bg-white text-slate-900 border-2 border-slate-200/90 rounded-tl-xs'
                      }`}
                    >
                      {m.from === 'bot' ? renderMessageContent(m.text) : m.text}
                    </div>

                    {/* Audio Speaker Readout Button on Bot Replies */}
                    {m.from === 'bot' && (
                      <div className="flex items-center gap-2 pl-1">
                        <button
                          type="button"
                          onClick={() => playSpeech(m.id, m.text)}
                          className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs sm:text-sm font-black text-slate-700 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-900 transition shadow-2xs"
                        >
                          {playingAudioId === m.id ? (
                            <>
                              <VolumeX className="h-4 w-4 text-rose-600 animate-pulse" />
                              <span className="text-rose-700">थांबवा (Stop Audio)</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-4 w-4 text-emerald-700" />
                              <span>{lang === 'mr' ? '🔊 आवाजात ऐका' : lang === 'hi' ? '🔊 आवाज में सुनें' : '🔊 Listen Aloud'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Direct Action Link in reply */}
                    {m.action && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          navigate(m.action.link);
                        }}
                        className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 px-5 py-3 text-sm font-black text-white shadow-md hover:brightness-110 transition"
                      >
                        <span>{m.action.label}</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}

                    {/* 🚀 ENLARGED, TOUCH-FRIENDLY SUGGESTION CARDS */}
                    {m.suggestions && m.suggestions.length > 0 && (
                      <div className="pt-2 flex flex-col gap-2.5 w-full">
                        <p className="text-xs font-black uppercase tracking-wider text-slate-500 px-1">
                          {lang === 'mr' ? '👇 महत्त्वाचे प्रश्न (टॅप करा):' : lang === 'hi' ? '👇 मुख्य प्रश्न (टैप करें):' : '👇 Common Questions (Tap to ask):'}
                        </p>
                        {m.suggestions.map((s, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => handleSend(s)}
                            className="w-full rounded-2xl border-2 border-emerald-200/90 bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-white p-3.5 sm:p-4 text-xs sm:text-sm font-extrabold text-emerald-950 hover:border-emerald-500 hover:bg-emerald-100 shadow-xs hover:shadow-sm transition-all active:scale-98 flex items-center justify-between text-left group"
                          >
                            <span className="leading-snug pr-2">{s}</span>
                            <ChevronRight className="h-5 w-5 shrink-0 text-emerald-700 group-hover:translate-x-1 transition-transform" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Bot typing loading state */}
              {loading && (
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-emerald-800">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
                    <span className="font-bold text-slate-800">
                      {lang === 'mr' ? 'माहिती शोधत आहे…' : lang === 'hi' ? 'उत्तर तैयार कर रहा है…' : 'Finding answer…'}
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar with Textbox + Mic + Send */}
            <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2.5"
              >
                {/* Voice Input Mic Button */}
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`grid h-13 w-13 sm:h-14 sm:w-14 shrink-0 place-items-center rounded-2xl border-2 transition ${
                    isListening
                      ? 'border-rose-500 bg-rose-50 text-rose-600 animate-pulse ring-4 ring-rose-200'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                  title={isListening ? 'Stop Listening' : 'Speak your question'}
                >
                  <Mic className={`h-6 w-6 ${isListening ? 'animate-bounce' : ''}`} />
                </button>

                {/* Text Input */}
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isListening
                      ? (lang === 'mr' ? 'ऐकत आहे... बोला...' : lang === 'hi' ? 'सुन रहा हूँ... बोलिए...' : 'Listening... Speak now...')
                      : (lang === 'mr' ? 'तुमचा प्रश्न इथे विचारा (गहू, हमीभाव, DBT)...' : lang === 'hi' ? 'अपना प्रश्न यहाँ लिखें (गेहूं, MSP, DBT)...' : 'Ask your doubt here (MSP, Slots, DBT)...')
                  }
                  className="h-13 sm:h-14 flex-1 rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 text-sm sm:text-base font-bold text-slate-900 outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100 placeholder:font-medium placeholder:text-slate-400"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="grid h-13 w-13 sm:h-14 sm:w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-md hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  title="Send"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
