/**
 * FarmerChatbot.jsx
 *
 * Kisan Sahayak / Farmer Help & Support AI Chatbot.
 * Answers any questions, doubts, or issues regarding APMC procurement, MSP rates,
 * slot booking, DBT payments, moisture norms, required documents, and mandi operations.
 *
 * Multilingual: Marathi (मराठी), Hindi (हिंदी), and English.
 * Features:
 * - Smart NLP knowledge retrieval
 * - Voice Input (Speech-to-Text)
 * - Voice Readout (High-Definition Neural Text-to-Speech)
 * - Quick suggestion prompt chips
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
  const { lang, t } = useLanguage();
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

  // Initial Bot Welcome Greeting
  const initChat = useCallback(() => {
    let welcomeText = '';
    if (lang === 'mr') {
      welcomeText =
        `नमस्कार! 🙏 मी **'किसान सहाय्यक' (Kisan Sahayak)** आहे — तुमचा २४/७ शासकीय APMC खरेदी मदतनीस.\n\n` +
        `तुम्हाला शासकीय हमीभाव, स्लॉट बुकिंग, DBT बँक पेमेंट, आवश्यक कागदपत्रे किंवा आर्द्रता नियमांबाबत काहीही अडचण किंवा प्रश्न असल्यास मला विचारा!`;
    } else if (lang === 'hi') {
      welcomeText =
        `नमस्ते! 🙏 मैं **'किसान सहायक' (Kisan Sahayak)** हूँ — आपका २४/७ सरकारी मंडी खरीद सहायक।\n\n` +
        `आपको न्यूनतम समर्थन मूल्य (MSP), स्लॉट बुकिंग, बैंक भुगतान, आवश्यक दस्तावेज या नमी मानकों से जुड़ा कोई भी प्रश्न या समस्या हो, तो बेझिझक पूछें!`;
    } else {
      welcomeText =
        `Hello! 🙏 I am **'Kisan Sahayak'** — your 24/7 APMC Procurement AI Assistant.\n\n` +
        `Ask me anything about Government MSP rates, slot booking, DBT payments, required documents, or moisture and quality guidelines!`;
    }

    setMessages([
      {
        id: 'welcome',
        from: 'bot',
        text: welcomeText,
        suggestions: SUGGESTIONS[lang] || SUGGESTIONS.en,
      },
    ]);
  }, [lang]);

  useEffect(() => {
    if (open && messages.length === 0) {
      initChat();
    }
  }, [open, initChat, messages.length]);

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

  // Simple Markdown-style bold & bullet point renderer
  const renderMessageContent = (text) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1 text-xs leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;

          // Parse **bold** parts
          const parts = line.split(/(\*\*.*?\*\*)/g);
          const formattedLine = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-extrabold text-slate-950">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            if (part.startsWith('*') && part.endsWith('*')) {
              return (
                <em key={pIdx} className="italic text-slate-600">
                  {part.slice(1, -1)}
                </em>
              );
            }
            return part;
          });

          return (
            <p key={idx} className="text-slate-800">
              {formattedLine}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Floating Trigger Widget (Bottom Right) */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-5 z-50 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 py-3.5 px-5 text-white shadow-2xl shadow-emerald-950/40 ring-4 ring-emerald-300/40 transition-all hover:scale-105 active:scale-95 group"
          aria-label="Kisan Sahayak Chatbot"
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <span className="absolute h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
            <Bot className="h-5 w-5 text-white" />
          </span>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-black leading-tight tracking-wide">
              {lang === 'mr' ? 'किसान सहाय्यक' : lang === 'hi' ? 'किसान सहायक' : 'Kisan Sahayak'}
            </p>
            <p className="text-[10px] text-emerald-200 font-semibold">
              {lang === 'mr' ? 'मदत व शंका निवारण' : lang === 'hi' ? 'मदद एवं समाधान' : 'Doubts & Help AI'}
            </p>
          </div>
          <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-slate-950 shadow-2xs">
            AI
          </span>
        </button>
      )}

      {/* Interactive Chat Window Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs sm:items-center sm:justify-center sm:p-4 animate-fadeIn">
          <div className="flex h-[92vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl sm:h-[660px] sm:max-w-md sm:rounded-3xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-emerald-900/20 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 px-4 py-3.5 text-white">
              <div className="flex items-center gap-3">
                <div className="relative grid h-10 w-10 place-items-center rounded-2xl bg-white/20 shadow-inner backdrop-blur-md">
                  <Bot className="h-6 w-6 text-white" />
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-emerald-900" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-wide flex items-center gap-1.5">
                    <span>{lang === 'mr' ? 'किसान सहाय्यक AI' : lang === 'hi' ? 'किसान सहायक AI' : 'Kisan Sahayak AI'}</span>
                    <span className="rounded-full bg-emerald-500/40 px-1.5 py-0.2 text-[9px] font-extrabold uppercase text-emerald-100">
                      Online
                    </span>
                  </h3>
                  <p className="text-[11px] font-medium text-emerald-200">
                    {lang === 'mr' ? 'सरकारी APMC मदत व शंका निवारण' : lang === 'hi' ? 'सरकारी APMC सहायता केंद्र' : 'APMC Procurement Helpdesk'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    stopAudio();
                    initChat();
                  }}
                  title="Reset Chat"
                  className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-emerald-100 hover:bg-white/20 transition"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopAudio();
                    setOpen(false);
                  }}
                  className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-emerald-100 hover:bg-white/20 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Quick Context Banner */}
            <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold border-b border-slate-100 bg-emerald-50/70 text-emerald-900">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
                <span>{lang === 'mr' ? 'कोणतीही शंका विचारा (गहू, हमीभाव, DBT)' : lang === 'hi' ? 'कोई भी प्रश्न पूछें (गेहूं, MSP, DBT)' : 'Ask any doubt (MSP, Slots, DBT, Docs)'}</span>
              </div>
              <span className="font-mono text-[10px] text-emerald-700 bg-white px-1.5 py-0.5 rounded-md border border-emerald-200">
                GovTech AI
              </span>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${m.from === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {m.from === 'bot' && (
                    <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] space-y-2`}>
                    <div
                      className={`rounded-2xl px-4 py-3 shadow-2xs ${
                        m.from === 'user'
                          ? 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white rounded-tr-xs text-xs font-semibold'
                          : 'bg-white text-slate-900 border border-slate-200/90 rounded-tl-xs'
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
                          className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[11px] font-bold text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-800 transition shadow-2xs"
                        >
                          {playingAudioId === m.id ? (
                            <>
                              <VolumeX className="h-3 w-3 text-rose-600" />
                              <span className="text-rose-700">थांबवा (Stop Audio)</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-3 w-3 text-emerald-700" />
                              <span>ऐका (Listen)</span>
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
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-800 px-3.5 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-emerald-900 transition"
                      >
                        <span>{m.action.label}</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {/* Suggested Follow-up Questions Chips */}
                    {m.suggestions && m.suggestions.length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-1.5">
                        {m.suggestions.map((s, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => handleSend(s)}
                            className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 text-[11px] font-bold text-emerald-950 hover:bg-emerald-100 transition shadow-2xs text-left"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Bot typing loading state */}
              {loading && (
                <div className="flex items-center gap-2.5 text-xs text-slate-500">
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-emerald-100 text-emerald-800">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl bg-white p-3 border border-slate-200 shadow-2xs">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
                    <span className="font-semibold">{lang === 'mr' ? 'माहिती शोधत आहे…' : lang === 'hi' ? 'उत्तर तैयार कर रहा है…' : 'Finding answer…'}</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar with Textbox + Mic + Send */}
            <div className="border-t border-slate-200 bg-white p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                {/* Voice Input Mic Button */}
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border transition ${
                    isListening
                      ? 'border-rose-500 bg-rose-50 text-rose-600 animate-pulse ring-4 ring-rose-200'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                  title={isListening ? 'Stop Listening' : 'Speak your question'}
                >
                  <Mic className={`h-5 w-5 ${isListening ? 'animate-bounce' : ''}`} />
                </button>

                {/* Text Input */}
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isListening
                      ? (lang === 'mr' ? 'ऐकत आहे... बोला...' : lang === 'hi' ? 'सुन रहा हूँ... बोलिए...' : 'Listening... Speak now...')
                      : (lang === 'mr' ? 'तुमचा प्रश्न इथे विचारा...' : lang === 'hi' ? 'अपना प्रश्न यहाँ लिखें...' : 'Ask your doubt here...')
                  }
                  className="h-11 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-md hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  title="Send"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
