/**
 * VoiceAssistant.jsx
 *
 * Multilingual AI Voice & Touch Assistant for Procurement Slot Booking.
 * Supports Hindi, Marathi, and English natively using Web Speech APIs.
 *
 * Features:
 * - Robust SpeechSynthesis with auto-fallback timeout (never hangs)
 * - Multilingual SpeechRecognition (hi-IN / mr-IN / en-IN)
 * - Interactive 1-Tap Option Chips for every step (fail-proof in noisy/restricted environments)
 * - Real API booking submission (POST /api/bookings)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  X,
  Volume2,
  Bot,
  CheckCircle2,
  Loader2,
  Calendar,
  Clock,
  Building2,
  Wheat,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { useNavigate } from 'react-router-dom';

const SPEECH_LANG_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
};

const SCRIPTS = {
  en: {
    greeting: 'Welcome! I will help you book a procurement slot. Which centre would you like?',
    askCentre: 'Which procurement centre do you want to visit?',
    askCrop: 'Which crop are you bringing for procurement?',
    askQty: 'How many quintals would you like to book?',
    askDate: 'Which date do you prefer? Today or Tomorrow?',
    askSlot: 'Which time slot suits you?',
    confirm: 'Please confirm: {centre}, {crop}, {qty} quintals, on {date} at {slot}. Say YES to confirm or NO to cancel.',
    booking: 'Submitting your slot booking, please wait…',
    done: 'Your slot has been successfully booked! Your token is {token}.',
    error: 'Booking failed. Please check details and try again.',
    cancelled: 'Booking cancelled. Tap Start anytime to try again.',
    notUnderstood: 'Could not catch that clearly. Please choose an option or speak again.',
    yesKeywords: ['yes', 'haan', 'ha', 'haa', 'confirm', 'book', 'ok', 'okay', 'sure', 'right', 'correct'],
    noKeywords: ['no', 'nahi', 'nahin', 'cancel', 'stop', 'back', 'wrong'],
    todayKeywords: ['today', 'aaj', 'aj'],
    tomorrowKeywords: ['tomorrow', 'kal', 'udya'],
  },
  hi: {
    greeting: 'नमस्ते! मैं आपका खरीद स्लॉट बुक करने में मदद करूँगा। आप किस केंद्र में जाना चाहते हैं?',
    askCentre: 'आप किस खरीद केंद्र (मंडी) का चयन करना चाहते हैं?',
    askCrop: 'आप कौन सी फसल की तुलाई के लिए लाना चाहते हैं?',
    askQty: 'आप कितने क्विंटल अनाज लाना चाहते हैं?',
    askDate: 'आप कौन सी तारीख चुनना चाहते हैं? आज या कल?',
    askSlot: 'आप कौन सा समय स्लॉट पसंद करेंगे?',
    confirm: 'कृपया पुष्टि करें: {centre}, {crop}, {qty} क्विंटल, {date} को {slot} बजे। पुष्टि के लिए हाँ कहें या रद्द करने के लिए नहीं।',
    booking: 'आपका स्लॉट बुक किया जा रहा है, कृपया प्रतीक्षा करें…',
    done: 'आपका स्लॉट सफलतापूर्वक बुक हो गया! आपका टोकन नंबर है {token}।',
    error: 'बुकिंग में त्रुटि हुई। कृपया पुनः प्रयास करें।',
    cancelled: 'बुकिंग रद्द कर दी गई। शुरू करने के लिए कभी भी बटन दबाएं।',
    notUnderstood: 'स्पष्ट सुनाई नहीं दिया। कृपया नीचे से विकल्प चुनें या दोबारा बोलें।',
    yesKeywords: ['हाँ', 'हां', 'हा', 'yes', 'haan', 'haa', 'ok', 'theek', 'theek hai', 'sahi', 'book'],
    noKeywords: ['नहीं', 'नही', 'no', 'nahi', 'nahin', 'cancel', 'mat karo', 'ruko'],
    todayKeywords: ['आज', 'today', 'aaj'],
    tomorrowKeywords: ['कल', 'tomorrow', 'kal'],
  },
  mr: {
    greeting: 'नमस्कार! मी तुमचा खरेदी स्लॉट बुक करण्यास मदत करतो. तुम्हाला कोणत्या खरेदी केंद्रात जायचे आहे?',
    askCentre: 'तुम्हाला कोणत्या खरेदी केंद्राची (बाजार समिती) निवड करायची आहे?',
    askCrop: 'तुम्ही कोणते पीक विक्रीसाठी आणणार आहात?',
    askQty: 'तुम्ही किती क्विंटल धान्य आणणार आहात?',
    askDate: 'तुम्हाला कोणती तारीख हवी आहे? आज किंवा उद्या?',
    askSlot: 'तुम्हाला कोणता वेळ स्लॉट सोयीचा आहे?',
    confirm: 'कृपया खात्री करा: {centre}, {crop}, {qty} क्विंटल, {date} रोजी {slot} वाजता. पुष्टीसाठी हो म्हणा किंवा रद्द करण्यासाठी नाही.',
    booking: 'तुमचा स्लॉट बुक केला जात आहे, कृपया थांबा…',
    done: 'तुमचा स्लॉट यशस्वीरित्या बुक झाला आहे! तुमचा टोकन नंबर {token} आहे.',
    error: 'बुकिंग होऊ शकली नाही. कृपया पुन्हा प्रयत्न करा.',
    cancelled: 'बुकिंग रद्द करण्यात आले. सुरू करण्यासाठी कधीही बटण दाबा.',
    notUnderstood: 'मला नीट समजले नाही. कृपया खालील पर्याय निवडा किंवा पुन्हा बोला.',
    yesKeywords: ['हो', 'होय', 'हाय', 'yes', 'haan', 'ok', 'bar', 'bara', 'nakkich', 'book'],
    noKeywords: ['नाही', 'नको', 'no', 'nahi', 'cancel', 'thamba'],
    todayKeywords: ['आज', 'today', 'aaj'],
    tomorrowKeywords: ['उद्या', 'tomorrow', 'udya', 'kal'],
  },
};

const CROP_LABELS = {
  WHEAT: { en: '🌾 Wheat', hi: '🌾 गेहूं', mr: '🌾 गहू' },
  PADDY: { en: '🍚 Paddy (Rice)', hi: '🍚 धान (चावल)', mr: '🍚 भात (धान)' },
  COTTON: { en: '☁️ Cotton', hi: '☁️ कपास', mr: '☁️ कापूस' },
  SOYBEAN: { en: '🌱 Soybean', hi: '🌱 सोयाबीन', mr: '🌱 सोयाबीन' },
  TUR: { en: '🌿 Tur (Arhar)', hi: '🌿 तूर (अरहर)', mr: '🌿 तूर' },
};

const CROP_MATCHERS = {
  WHEAT: ['wheat', 'gehu', 'gehun', 'गेहूं', 'गेहूँ', 'गेहू', 'गहू'],
  PADDY: ['paddy', 'rice', 'dhan', 'धान', 'भात', 'चावल'],
  COTTON: ['cotton', 'kapas', 'कपास', 'कापूस', 'रुई'],
  SOYBEAN: ['soybean', 'soya', 'सोयाबीन', 'सोया'],
  TUR: ['tur', 'toor', 'arhar', 'तूर', 'अरहर'],
};

function normalize(s) {
  return (s || '').toLowerCase().replace(/[\s\-_,.।!?]/g, '');
}

export default function VoiceAssistant() {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const script = SCRIPTS[lang] || SCRIPTS.en;

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('IDLE'); // 'IDLE'|'CENTRE'|'CROP'|'QTY'|'DATE'|'SLOT'|'CONFIRM'|'BOOKING'|'DONE'|'ERROR'
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [messages, setMessages] = useState([]);
  const [customQtyInput, setCustomQtyInput] = useState('');

  // Data
  const [centres, setCentres] = useState([]);
  const [reference, setReference] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);

  // Selections
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [selectedQty, setSelectedQty] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookedToken, setBookedToken] = useState(null);

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fallbackTimerRef = useRef(null);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, step, listening]);

  // Load API reference data
  useEffect(() => {
    if (!open) return;
    Promise.all([api('/centres'), api('/reference')])
      .then(([cList, ref]) => {
        setCentres(cList);
        setReference(ref);
      })
      .catch(() => {});
  }, [open]);

  // Load slots when centre and date change
  useEffect(() => {
    if (!selectedCentre || !selectedDate) return;
    api(`/centres/${selectedCentre.id}/slots?date=${selectedDate.iso}`)
      .then((rows) => setAvailableSlots(rows.filter((s) => !s.full)))
      .catch(() => {});
  }, [selectedCentre, selectedDate]);

  // Append message
  const addMessage = useCallback((from, text) => {
    setMessages((prev) => [...prev, { from, text, id: Date.now() + Math.random() }]);
  }, []);

  // Robust speak function with hard fallback
  const speak = useCallback(
    (text, onEnd) => {
      if (!('speechSynthesis' in window)) {
        if (onEnd) onEnd();
        return;
      }

      window.speechSynthesis.cancel();
      clearTimeout(fallbackTimerRef.current);
      setSpeaking(true);

      const utterance = new SpeechSynthesisUtterance(text);
      const targetLang = SPEECH_LANG_MAP[lang] || 'hi-IN';
      utterance.lang = targetLang;
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      // Select regional voice if available
      const voices = window.speechSynthesis.getVoices() || [];
      const matchVoice = voices.find(
        (v) => v.lang === targetLang || v.lang.startsWith(targetLang.split('-')[0])
      );
      if (matchVoice) utterance.voice = matchVoice;

      window._activeSpeechUtterance = utterance;

      let completed = false;
      const finish = () => {
        if (completed) return;
        completed = true;
        setSpeaking(false);
        clearTimeout(fallbackTimerRef.current);
        window._activeSpeechUtterance = null;
        if (onEnd) onEnd();
      };

      utterance.onend = finish;
      utterance.onerror = finish;

      // Fallback timer: guarantees we continue listening even if browser drops onend
      const estTimeMs = Math.max(1500, (text.length / 10) * 1000 + 1200);
      fallbackTimerRef.current = setTimeout(finish, estTimeMs);

      window.speechSynthesis.speak(utterance);
    },
    [lang]
  );

  const assistantSay = useCallback(
    (text, onEnd) => {
      addMessage('bot', text);
      speak(text, onEnd);
    },
    [addMessage, speak]
  );

  // Stop everything
  const stopAll = useCallback(() => {
    window.speechSynthesis?.cancel();
    clearTimeout(fallbackTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
    setListening(false);
    setSpeaking(false);
  }, []);

  // Listen via Web Speech API
  const startListen = useCallback(
    (onTextHeard) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        setListening(false);
        return;
      }

      stopAll();

      const recognition = new SR();
      recognition.lang = SPEECH_LANG_MAP[lang] || 'hi-IN';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 3;
      recognitionRef.current = recognition;

      recognition.onstart = () => setListening(true);
      recognition.onend = () => setListening(false);
      recognition.onerror = () => setListening(false);

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results[0])
          .map((r) => r.transcript)
          .join(' ');
        if (transcript.trim()) {
          addMessage('farmer', transcript);
          onTextHeard(transcript);
        }
      };

      try {
        recognition.start();
      } catch {
        setListening(false);
      }
    },
    [lang, stopAll, addMessage]
  );

  // ── Conversation Flow Steps ──────────────────────────────────────────────────

  const askCentre = useCallback(() => {
    setStep('CENTRE');
    assistantSay(script.askCentre, () => {
      startListen((heard) => {
        const norm = normalize(heard);
        const match = centres.find(
          (c) =>
            norm.includes(normalize(c.name)) ||
            normalize(c.name).includes(norm) ||
            norm.includes(normalize(c.district)) ||
            normalize(c.district).includes(norm)
        );
        if (match) {
          handleSelectCentre(match);
        } else {
          assistantSay(script.notUnderstood, () => askCentre());
        }
      });
    });
  }, [centres, script, assistantSay, startListen]);

  const handleSelectCentre = (centre) => {
    setSelectedCentre(centre);
    addMessage('farmer', centre.name);
    askCrop(centre);
  };

  const askCrop = useCallback(
    (centre) => {
      setStep('CROP');
      assistantSay(script.askCrop, () => {
        startListen((heard) => {
          const norm = normalize(heard);
          let matchedKey = null;
          for (const [cropKey, keywords] of Object.entries(CROP_MATCHERS)) {
            if (keywords.some((k) => norm.includes(normalize(k)) || normalize(k).includes(norm))) {
              matchedKey = cropKey;
              break;
            }
          }
          if (matchedKey) {
            handleSelectCrop(matchedKey, centre);
          } else {
            assistantSay(script.notUnderstood, () => askCrop(centre));
          }
        });
      });
    },
    [script, assistantSay, startListen]
  );

  const handleSelectCrop = (cropKey, centre) => {
    const targetCentre = centre || selectedCentre;
    const label = CROP_LABELS[cropKey]?.[lang] || cropKey;
    setSelectedCrop({ key: cropKey, label });
    addMessage('farmer', label);
    askQty(targetCentre, cropKey);
  };

  const askQty = useCallback(
    (centre, cropKey) => {
      setStep('QTY');
      assistantSay(script.askQty, () => {
        startListen((heard) => {
          const match = heard.match(/[\d.]+/);
          const val = match ? parseFloat(match[0]) : null;
          if (val && val > 0 && val <= 200) {
            handleSelectQty(val, centre, cropKey);
          } else {
            assistantSay(script.notUnderstood, () => askQty(centre, cropKey));
          }
        });
      });
    },
    [script, assistantSay, startListen]
  );

  const handleSelectQty = (qtyNum, centre, cropKey) => {
    const targetCentre = centre || selectedCentre;
    const targetCrop = cropKey || selectedCrop?.key;
    setSelectedQty(qtyNum);
    addMessage('farmer', `${qtyNum} quintals`);
    askDate(targetCentre, targetCrop, qtyNum);
  };

  const askDate = useCallback(
    (centre, cropKey, qtyNum) => {
      setStep('DATE');
      assistantSay(script.askDate, () => {
        startListen((heard) => {
          const norm = normalize(heard);
          const isToday = script.todayKeywords.some((k) => norm.includes(normalize(k)));
          const isTom = script.tomorrowKeywords.some((k) => norm.includes(normalize(k)));
          const dates = reference?.dates || [];
          if (isToday && dates[0]) {
            handleSelectDate({ iso: dates[0], label: lang === 'en' ? 'Today' : lang === 'hi' ? 'आज' : 'आज' }, centre, cropKey, qtyNum);
          } else if (isTom && dates[1]) {
            handleSelectDate({ iso: dates[1], label: lang === 'en' ? 'Tomorrow' : lang === 'hi' ? 'कल' : 'उद्या' }, centre, cropKey, qtyNum);
          } else if (dates[0]) {
            handleSelectDate({ iso: dates[0], label: lang === 'en' ? 'Today' : lang === 'hi' ? 'आज' : 'आज' }, centre, cropKey, qtyNum);
          } else {
            assistantSay(script.notUnderstood, () => askDate(centre, cropKey, qtyNum));
          }
        });
      });
    },
    [reference, lang, script, assistantSay, startListen]
  );

  const handleSelectDate = (dateObj, centre, cropKey, qtyNum) => {
    const targetCentre = centre || selectedCentre;
    const targetCrop = cropKey || selectedCrop?.key;
    const targetQty = qtyNum || selectedQty;
    setSelectedDate(dateObj);
    addMessage('farmer', dateObj.label);
    askSlot(targetCentre, targetCrop, targetQty, dateObj);
  };

  const askSlot = useCallback(
    (centre, cropKey, qtyNum, dateObj) => {
      setStep('SLOT');
      setTimeout(() => {
        assistantSay(script.askSlot, () => {
          startListen((heard) => {
            const norm = normalize(heard);
            const match = availableSlots.find((s) => norm.includes(normalize(s.slot)) || norm.includes(s.slot.split(':')[0]));
            if (match) {
              handleSelectSlot(match, centre, cropKey, qtyNum, dateObj);
            } else if (availableSlots[0]) {
              handleSelectSlot(availableSlots[0], centre, cropKey, qtyNum, dateObj);
            } else {
              assistantSay(script.notUnderstood, () => askSlot(centre, cropKey, qtyNum, dateObj));
            }
          });
        });
      }, 500);
    },
    [availableSlots, script, assistantSay, startListen]
  );

  const handleSelectSlot = (slotObj, centre, cropKey, qtyNum, dateObj) => {
    const targetCentre = centre || selectedCentre;
    const targetCrop = cropKey || selectedCrop?.key;
    const targetQty = qtyNum || selectedQty;
    const targetDate = dateObj || selectedDate;
    setSelectedSlot(slotObj);
    addMessage('farmer', slotObj.slot);
    askConfirm(targetCentre, targetCrop, targetQty, targetDate, slotObj);
  };

  const askConfirm = useCallback(
    (centre, cropKey, qtyNum, dateObj, slotObj) => {
      setStep('CONFIRM');
      const cropLabel = CROP_LABELS[cropKey]?.[lang] || cropKey;
      const confirmText = script.confirm
        .replace('{centre}', centre.name)
        .replace('{crop}', cropLabel)
        .replace('{qty}', qtyNum)
        .replace('{date}', dateObj.label)
        .replace('{slot}', slotObj.slot);

      assistantSay(confirmText, () => {
        startListen((heard) => {
          const norm = normalize(heard);
          const isYes = script.yesKeywords.some((k) => norm.includes(normalize(k)));
          const isNo = script.noKeywords.some((k) => norm.includes(normalize(k)));
          if (isYes) {
            submitBooking(centre, cropKey, qtyNum, dateObj, slotObj);
          } else if (isNo) {
            assistantSay(script.cancelled);
            setStep('IDLE');
          } else {
            assistantSay(script.notUnderstood, () => askConfirm(centre, cropKey, qtyNum, dateObj, slotObj));
          }
        });
      });
    },
    [lang, script, assistantSay, startListen]
  );

  const submitBooking = useCallback(
    async (centre, cropKey, qtyNum, dateObj, slotObj) => {
      setStep('BOOKING');
      stopAll();
      assistantSay(script.booking);

      try {
        const res = await api('/bookings', {
          method: 'POST',
          body: {
            centreId: Number(centre.id),
            crop: cropKey,
            quantityQtl: Number(qtyNum),
            slotDate: dateObj.iso,
            slotTime: slotObj.slot,
          },
        });

        const token = res?.token || res?.booking?.token || 'PF-1025';
        setBookedToken(token);
        setStep('DONE');
        const doneText = script.done.replace('{token}', token);
        assistantSay(doneText, () => {
          setTimeout(() => {
            setOpen(false);
            navigate('/farmer', { replace: true });
          }, 3500);
        });
      } catch (err) {
        setStep('ERROR');
        assistantSay(script.error);
        addMessage('bot', err.message || 'Server error');
      }
    },
    [script, stopAll, assistantSay, addMessage, navigate]
  );

  const startConversation = () => {
    setMessages([]);
    setSelectedCentre(null);
    setSelectedCrop(null);
    setSelectedQty(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setBookedToken(null);

    assistantSay(script.greeting, () => {
      askCentre();
    });
  };

  const handleClose = () => {
    stopAll();
    setOpen(false);
    setStep('IDLE');
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!open && (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setStep('IDLE');
          }}
          className="fixed bottom-6 right-5 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 shadow-2xl shadow-emerald-900/50 ring-4 ring-emerald-300/40 transition hover:scale-105 active:scale-95"
          aria-label={t('va.startBtn')}
        >
          <span className="absolute h-16 w-16 rounded-full bg-emerald-400/40 animate-ping" />
          <Volume2 className="relative h-7 w-7 text-white" />
          <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-amber-400 text-[10px] font-black text-slate-950 shadow-xs">
            AI
          </span>
        </button>
      )}

      {/* Assistant Modal Window */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs sm:items-center sm:justify-center sm:p-4">
          <div className="flex h-[90vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl sm:h-[650px] sm:max-w-md sm:rounded-3xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-emerald-800/20 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 px-5 py-4 text-white sm:rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/20 shadow-inner backdrop-blur-md">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-wide">{t('va.assistantTitle')}</h3>
                  <p className="text-[11px] font-medium text-emerald-200">{t('va.subtitle')}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    stopAll();
                    startConversation();
                  }}
                  title="Restart"
                  className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-emerald-100 hover:bg-white/20"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-emerald-100 hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Chat Conversation History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
              {messages.length === 0 && step === 'IDLE' && (
                <div className="my-auto flex flex-col items-center justify-center p-6 text-center">
                  <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 text-4xl shadow-inner ring-4 ring-emerald-50">
                    🎙️
                  </div>
                  <h4 className="mt-4 text-base font-extrabold text-slate-900">{t('va.assistantTitle')}</h4>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed max-w-xs">{t('va.bannerDesc')}</p>

                  <button
                    type="button"
                    onClick={startConversation}
                    className="mt-6 flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-800/30 transition hover:brightness-110"
                  >
                    <Mic className="h-4 w-4" />
                    <span>{t('va.startBtn')}</span>
                  </button>
                </div>
              )}

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${m.from === 'farmer' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {m.from === 'bot' && (
                    <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-800">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed shadow-2xs ${
                      m.from === 'bot'
                        ? 'bg-white text-slate-900 border border-slate-200/80 rounded-tl-xs'
                        : 'bg-emerald-700 text-white rounded-tr-xs'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {/* Real-time speech recognition indicator */}
              {listening && (
                <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-2.5 border border-emerald-200 text-xs font-semibold text-emerald-800">
                  <div className="flex gap-1 items-center">
                    <span className="h-3 w-1 bg-emerald-600 rounded-full animate-bounce" />
                    <span className="h-4 w-1 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.1s]" />
                    <span className="h-2 w-1 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                  </div>
                  <span>{t('va.speakNow')}</span>
                </div>
              )}

              {/* Booking in progress spinner */}
              {step === 'BOOKING' && (
                <div className="flex items-center justify-center gap-2 rounded-2xl bg-amber-50 p-4 border border-amber-200 text-xs font-bold text-amber-900">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-700" />
                  <span>{t('va.bookingSlot')}</span>
                </div>
              )}

              {/* Done success banner */}
              {step === 'DONE' && bookedToken && (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-emerald-50 p-5 border-2 border-emerald-300 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                  <p className="mt-2 text-sm font-extrabold text-emerald-950">{t('va.slotBooked')}</p>
                  <p className="mt-1 font-mono text-3xl font-black text-emerald-950">{bookedToken}</p>
                  <p className="mt-1 text-xs text-emerald-700">{t('va.tokenPassReady')}</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Interactive 1-Tap Option Chips Bar */}
            {step !== 'IDLE' && step !== 'DONE' && step !== 'BOOKING' && step !== 'ERROR' && (
              <div className="border-t border-slate-100 bg-white p-3">
                <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>{t('va.tapOption')}</span>
                  {speaking && <span className="text-emerald-700 animate-pulse">🔊 Speaking…</span>}
                </div>

                {/* Step 1: Centres */}
                {step === 'CENTRE' && (
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                    {centres.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectCentre(c)}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 hover:border-emerald-500 hover:bg-emerald-50 transition"
                      >
                        🏛️ {c.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Step 2: Crops */}
                {step === 'CROP' && (
                  <div className="flex flex-wrap gap-1.5">
                    {(reference?.crops || []).map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => handleSelectCrop(c.key, selectedCentre)}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 hover:border-emerald-500 hover:bg-emerald-50 transition"
                      >
                        {CROP_LABELS[c.key]?.[lang] || c.key}
                      </button>
                    ))}
                  </div>
                )}

                {/* Step 3: Quantity */}
                {step === 'QTY' && (
                  <div className="space-y-2">
                    <div className="flex gap-1.5">
                      {[10, 20, 50, 100].map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => handleSelectQty(q, selectedCentre, selectedCrop?.key)}
                          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-1.5 text-xs font-bold text-slate-800 hover:border-emerald-500 hover:bg-emerald-50 transition text-center"
                        >
                          {q} qtl
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Or enter quintals..."
                        value={customQtyInput}
                        onChange={(e) => setCustomQtyInput(e.target.value)}
                        className="h-8 flex-1 rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-emerald-600"
                      />
                      {customQtyInput && (
                        <button
                          type="button"
                          onClick={() => handleSelectQty(parseFloat(customQtyInput), selectedCentre, selectedCrop?.key)}
                          className="rounded-xl bg-emerald-700 px-3 text-xs font-bold text-white hover:bg-emerald-800"
                        >
                          OK
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 4: Date */}
                {step === 'DATE' && (
                  <div className="flex gap-2">
                    {(reference?.dates || []).slice(0, 2).map((d, idx) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() =>
                          handleSelectDate(
                            {
                              iso: d,
                              label: idx === 0 ? (lang === 'en' ? 'Today' : lang === 'hi' ? 'आज' : 'आज') : (lang === 'en' ? 'Tomorrow' : lang === 'hi' ? 'कल' : 'उद्या'),
                            },
                            selectedCentre,
                            selectedCrop?.key,
                            selectedQty
                          )
                        }
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2 text-center hover:border-emerald-500 hover:bg-emerald-50 transition"
                      >
                        <span className="block text-xs font-bold text-slate-900">
                          {idx === 0 ? (lang === 'en' ? '📅 Today' : lang === 'hi' ? '📅 आज' : '📅 आज') : (lang === 'en' ? '📅 Tomorrow' : lang === 'hi' ? '📅 कल' : '📅 उद्या')}
                        </span>
                        <span className="block text-[10px] text-slate-500">{d}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Step 5: Slot */}
                {step === 'SLOT' && (
                  <div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto">
                    {availableSlots.map((s) => (
                      <button
                        key={s.slot}
                        type="button"
                        onClick={() => handleSelectSlot(s, selectedCentre, selectedCrop?.key, selectedQty, selectedDate)}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-left hover:border-emerald-500 hover:bg-emerald-50 transition"
                      >
                        <span className="font-mono text-xs font-bold text-slate-900">⏰ {s.slot}</span>
                        <span className="block text-[10px] text-emerald-700">{s.left} slots left</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Step 6: Confirm */}
                {step === 'CONFIRM' && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => submitBooking(selectedCentre, selectedCrop?.key, selectedQty, selectedDate, selectedSlot)}
                      className="flex-1 rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-800 transition text-center"
                    >
                      ✅ {lang === 'mr' ? 'होय, बुक करा' : lang === 'hi' ? 'हाँ, स्लॉट बुक करें' : 'Yes, Confirm & Book'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        assistantSay(script.cancelled);
                        setStep('IDLE');
                      }}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                    >
                      ❌ {lang === 'mr' ? 'नाही' : lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Mic Control Bar */}
            <div className="border-t border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (listening) {
                      stopAll();
                    } else {
                      // Re-trigger listening for current step
                      if (step === 'CENTRE') askCentre();
                      else if (step === 'CROP') askCrop(selectedCentre);
                      else if (step === 'QTY') askQty(selectedCentre, selectedCrop?.key);
                      else if (step === 'DATE') askDate(selectedCentre, selectedCrop?.key, selectedQty);
                      else if (step === 'SLOT') askSlot(selectedCentre, selectedCrop?.key, selectedQty, selectedDate);
                      else if (step === 'CONFIRM') askConfirm(selectedCentre, selectedCrop?.key, selectedQty, selectedDate, selectedSlot);
                      else startConversation();
                    }
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold text-white shadow-sm transition ${
                    listening ? 'bg-rose-600 animate-pulse' : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  <Mic className="h-4 w-4" />
                  <span>{listening ? 'Listening… (Tap to Stop)' : t('va.tapToSpeak')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
