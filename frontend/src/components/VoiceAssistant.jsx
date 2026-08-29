/**
 * VoiceAssistant.jsx
 *
 * Conversational AI voice assistant for slot booking.
 * Uses 100% browser-native Web Speech APIs — no external service needed.
 *
 * Flow: IDLE → ASK_CENTRE → ASK_CROP → ASK_QUANTITY → ASK_DATE → ASK_SLOT → CONFIRM → BOOKING → DONE
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, X, Volume2, Bot, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { useNavigate } from 'react-router-dom';

// ─── Language config ─────────────────────────────────────────────────────────

const SPEECH_LANG = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };

const SCRIPTS = {
  en: {
    greeting:     "Hello! I am your booking assistant. Let me help you book a slot.",
    askCentre:    "Which procurement centre do you want? Available centres are: {centres}",
    askCrop:      "Which crop are you bringing? Available crops are: {crops}",
    askQuantity:  "How many quintals?",
    askDate:      "Which date? Say today or tomorrow.",
    askSlot:      "Which time slot? Available slots are: {slots}",
    confirm:      "Booking summary: {centre}, {crop}, {qty} quintals, {date}, {slot}. Say YES to confirm or NO to change.",
    booking:      "Booking your slot, please wait.",
    done:         "Your slot is booked! Your token is {token}. Please note it down.",
    noSupport:    "Sorry, voice is not supported in this browser. Please use Chrome.",
    noMic:        "Microphone permission is needed. Please allow and try again.",
    notUnderstood:"I did not understand. Please say it again.",
    slotFull:     "That slot is full. Please choose another: {slots}",
    error:        "Booking failed. Please try again or use the form.",
    cancelled:    "Booking cancelled. Tap the mic whenever you want to try again.",
    yes:          ["yes", "haan", "haa", "confirm", "ok", "okay", "correct", "right", "book"],
    no:           ["no", "nahi", "nahin", "nai", "change", "wrong", "back"],
    today:        ["today", "aaj", "आज", "आजच"],
    tomorrow:     ["tomorrow", "kal", "कल", "उद्या", "kal", "next"],
  },
  hi: {
    greeting:     "नमस्ते! मैं आपका बुकिंग सहायक हूं। मैं आपका स्लॉट बुक करने में मदद करूंगा।",
    askCentre:    "आप किस खरीद केंद्र में जाना चाहते हैं? उपलब्ध केंद्र हैं: {centres}",
    askCrop:      "आप कौन सी फसल लाए हैं? उपलब्ध फसलें हैं: {crops}",
    askQuantity:  "कितने क्विंटल?",
    askDate:      "कौन सी तारीख? आज या कल बोलें।",
    askSlot:      "कौन सा समय स्लॉट? उपलब्ध स्लॉट हैं: {slots}",
    confirm:      "बुकिंग सारांश: {centre}, {crop}, {qty} क्विंटल, {date}, {slot}। पुष्टि करने के लिए हां कहें या बदलने के लिए नहीं।",
    booking:      "आपका स्लॉट बुक हो रहा है, कृपया प्रतीक्षा करें।",
    done:         "आपका स्लॉट बुक हो गया! आपका टोकन है {token}। इसे नोट करें।",
    noSupport:    "क्षमा करें, इस ब्राउज़र में आवाज़ काम नहीं करती। Chrome का उपयोग करें।",
    noMic:        "माइक्रोफोन की अनुमति चाहिए। कृपया अनुमति दें और दोबारा कोशिश करें।",
    notUnderstood:"मुझे समझ नहीं आया। कृपया दोबारा बोलें।",
    slotFull:     "वह स्लॉट भरा है। दूसरा चुनें: {slots}",
    error:        "बुकिंग नहीं हो सकी। दोबारा कोशिश करें।",
    cancelled:    "बुकिंग रद्द। जब चाहें माइक टैप करें।",
    yes:          ["हाँ", "हां", "हा", "हाँ", "ठीक है", "सही", "बुक करो", "yes", "haan", "haa", "ok"],
    no:           ["नहीं", "नही", "नहीं", "बदलो", "no", "nahi", "nahin"],
    today:        ["आज", "today", "aaj"],
    tomorrow:     ["कल", "kal", "tomorrow"],
  },
  mr: {
    greeting:     "नमस्कार! मी तुमचा बुकिंग सहाय्यक आहे. मी तुमचा स्लॉट बुक करण्यास मदत करतो.",
    askCentre:    "तुम्हाला कोणत्या खरेदी केंद्रात जायचे आहे? उपलब्ध केंद्रे: {centres}",
    askCrop:      "तुम्ही कोणते पीक आणले आहे? उपलब्ध पिके: {crops}",
    askQuantity:  "किती क्विंटल?",
    askDate:      "कोणती तारीख? आज किंवा उद्या सांगा.",
    askSlot:      "कोणता वेळ स्लॉट? उपलब्ध स्लॉट: {slots}",
    confirm:      "बुकिंग सारांश: {centre}, {crop}, {qty} क्विंटल, {date}, {slot}. पुष्टी करण्यासाठी हो सांगा, बदलण्यासाठी नाही.",
    booking:      "तुमचा स्लॉट बुक होत आहे, कृपया थांबा.",
    done:         "तुमचा स्लॉट बुक झाला! तुमचे टोकन आहे {token}. ते लिहून घ्या.",
    noSupport:    "माफ करा, या ब्राउझरमध्ये आवाज काम करत नाही. Chrome वापरा.",
    noMic:        "मायक्रोफोनची परवानगी हवी आहे. परवानगी द्या आणि पुन्हा प्रयत्न करा.",
    notUnderstood:"मला समजले नाही. कृपया पुन्हा सांगा.",
    slotFull:     "तो स्लॉट भरला आहे. दुसरा निवडा: {slots}",
    error:        "बुकिंग झाली नाही. पुन्हा प्रयत्न करा.",
    cancelled:    "बुकिंग रद्द. जेव्हा इच्छा असेल तेव्हा मायक्रोफोन टॅप करा.",
    yes:          ["हो", "हाय", "होय", "बरं", "yes", "haan", "ok", "ठीक"],
    no:           ["नाही", "नको", "बदल", "no", "nahi"],
    today:        ["आज", "today", "aaj"],
    tomorrow:     ["उद्या", "kal", "tomorrow"],
  },
};

// Crop names in all languages for recognition matching
const CROP_NAMES = {
  WHEAT:   ["wheat", "gehu", "गेहूं", "गेहूँ", "गेहू", "गहू", "ग़ेहूँ", "गेहूं"],
  PADDY:   ["paddy", "rice", "dhan", "धान", "भात", "धन"],
  COTTON:  ["cotton", "kapas", "kapas", "कपास", "कापूस", "रुई"],
  SOYBEAN: ["soybean", "soya", "सोयाबीन", "soya"],
  TUR:     ["tur", "toor", "arhar", "तूर", "अरहर", "दाल"],
};

const CROP_DISPLAY = {
  en: { WHEAT: "Wheat", PADDY: "Paddy", COTTON: "Cotton", SOYBEAN: "Soybean", TUR: "Tur" },
  hi: { WHEAT: "गेहूं", PADDY: "धान", COTTON: "कपास", SOYBEAN: "सोयाबीन", TUR: "तूर" },
  mr: { WHEAT: "गहू", PADDY: "भात", COTTON: "कापूस", SOYBEAN: "सोयाबीन", TUR: "तूर" },
};

// ─── Fuzzy helpers ────────────────────────────────────────────────────────────

function normalize(str) {
  return (str || '').toLowerCase().replace(/[\s\-_,.।]/g, '');
}

function fuzzyMatch(input, candidates) {
  const inp = normalize(input);
  // Exact
  for (const c of candidates) {
    if (normalize(c.label) === inp || normalize(c.alias || '') === inp) return c;
  }
  // Contains
  for (const c of candidates) {
    if (normalize(c.label).includes(inp) || inp.includes(normalize(c.label))) return c;
    if (c.alias && (normalize(c.alias).includes(inp) || inp.includes(normalize(c.alias)))) return c;
  }
  // Check extra keywords
  for (const c of candidates) {
    if (c.keywords && c.keywords.some(k => normalize(k).includes(inp) || inp.includes(normalize(k)))) return c;
  }
  return null;
}

function extractNumber(text) {
  const m = text.replace(/[,،]/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : null;
}

function extractSlotTime(text, availableSlots) {
  const inp = normalize(text);
  // Direct time match like "08:00" or "8 baje"
  for (const s of availableSlots) {
    if (inp.includes(normalize(s.slot))) return s;
    const hour = s.slot.split(':')[0];
    if (inp.includes(hour) || inp.includes(parseInt(hour, 10).toString())) return s;
  }
  // "subah" → morning (first available), "dopahar" → midday, "shaam" → afternoon
  const morning   = ["subah", "morning", "सुबह", "सकाळ", "8", "9", "10", "11"];
  const afternoon = ["dopahar", "afternoon", "दोपहर", "दुपार", "12", "13", "14", "1", "2"];
  const evening   = ["shaam", "evening", "शाम", "संध्याकाळ", "15", "16", "3", "4"];
  if (morning.some(k => inp.includes(normalize(k))))   return availableSlots.find(s => parseInt(s.slot) < 12) || availableSlots[0];
  if (afternoon.some(k => inp.includes(normalize(k)))) return availableSlots.find(s => { const h = parseInt(s.slot); return h >= 12 && h < 15; }) || availableSlots[0];
  if (evening.some(k => inp.includes(normalize(k))))   return availableSlots.find(s => parseInt(s.slot) >= 15) || availableSlots[0];
  return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────

const STEPS = ['IDLE', 'ASK_CENTRE', 'ASK_CROP', 'ASK_QUANTITY', 'ASK_DATE', 'ASK_SLOT', 'CONFIRM', 'BOOKING', 'DONE', 'ERROR'];

export default function VoiceAssistant() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const script = SCRIPTS[lang] || SCRIPTS.en;

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('IDLE');
  const [listening, setListening] = useState(false);
  const [messages, setMessages] = useState([]);
  const [supported, setSupported] = useState(true);

  // Booking data collected during conversation
  const [centres, setCentres] = useState([]);
  const [reference, setReference] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);

  const [selectedCentre, setSelectedCentre] = useState(null);  // { id, name }
  const [selectedCrop, setSelectedCrop]     = useState(null);  // { key, label }
  const [selectedQty, setSelectedQty]       = useState(null);
  const [selectedDate, setSelectedDate]     = useState(null);
  const [selectedSlot, setSelectedSlot]     = useState(null);  // { slot }
  const [bookedToken, setBookedToken]       = useState(null);

  const recognitionRef = useRef(null);
  const synthRef       = useRef(window.speechSynthesis);
  const messagesEndRef = useRef(null);
  const stepRef        = useRef(step);

  useEffect(() => { stepRef.current = step; }, [step]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check browser support
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) setSupported(false);
  }, []);

  // Fetch reference data when opened
  useEffect(() => {
    if (!open || centres.length > 0) return;
    Promise.all([api('/centres'), api('/reference')])
      .then(([centreList, ref]) => {
        setCentres(centreList);
        setReference(ref);
      })
      .catch(() => {});
  }, [open, centres.length]);

  // Fetch slots when centre+date selected
  useEffect(() => {
    if (!selectedCentre || !selectedDate) return;
    api(`/centres/${selectedCentre.id}/slots?date=${selectedDate.iso}`)
      .then(rows => setAvailableSlots(rows.filter(s => !s.full)))
      .catch(() => {});
  }, [selectedCentre, selectedDate]);

  // ── Speech synthesis ──────────────────────────────────────────────────────

  const speak = useCallback((text, onEnd) => {
    const synth = synthRef.current;
    if (!synth) { onEnd && onEnd(); return; }
    synth.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = SPEECH_LANG[lang] || 'en-IN';
    utt.rate = 0.9;
    utt.pitch = 1;
    // Try to use a local voice matching the language
    const voices = synth.getVoices();
    const preferred = voices.find(v => v.lang.startsWith(utt.lang.split('-')[0]));
    if (preferred) utt.voice = preferred;
    utt.onend = () => { onEnd && onEnd(); };
    synth.speak(utt);
  }, [lang]);

  // ── Chat helpers ──────────────────────────────────────────────────────────

  const addMsg = useCallback((from, text) => {
    setMessages(prev => [...prev, { from, text, id: Date.now() + Math.random() }]);
  }, []);

  const assistantSay = useCallback((text, onEnd) => {
    addMsg('bot', text);
    speak(text, onEnd);
  }, [addMsg, speak]);

  // ── Speech recognition ────────────────────────────────────────────────────

  const startListening = useCallback((onResult) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }

    const recognition = new SR();
    recognition.lang = SPEECH_LANG[lang] || 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;
    recognitionRef.current = recognition;

    recognition.onstart  = () => setListening(true);
    recognition.onend    = () => setListening(false);
    recognition.onerror  = (e) => {
      setListening(false);
      if (e.error === 'not-allowed') {
        assistantSay(script.noMic);
      }
    };
    recognition.onresult = (e) => {
      const results = Array.from(e.results[0]).map(r => r.transcript).join(' ');
      addMsg('farmer', results);
      onResult(results);
    };

    try {
      recognition.start();
    } catch {}
  }, [lang, addMsg, assistantSay, script.noMic]);

  // ── Conversation steps ────────────────────────────────────────────────────

  const goAskCrop = useCallback((centre) => {
    setStep('ASK_CROP');
    const cropNames = (reference?.crops || []).map(c => CROP_DISPLAY[lang]?.[c.key] || c.key).join(', ');
    const q = script.askCrop.replace('{crops}', cropNames);
    assistantSay(q, () => {
      startListening((heard) => {
        // Fuzzy match crop
        const candidates = (reference?.crops || []).map(c => ({
          key: c.key,
          label: CROP_DISPLAY[lang]?.[c.key] || c.key,
          keywords: CROP_NAMES[c.key] || [],
        }));
        const match = fuzzyMatch(heard, candidates);
        if (match) {
          const cropLabel = CROP_DISPLAY[lang]?.[match.key] || match.key;
          setSelectedCrop({ key: match.key, label: cropLabel });
          goAskQuantity({ key: match.key, label: cropLabel }, centre);
        } else {
          assistantSay(script.notUnderstood, () => goAskCrop(centre));
        }
      });
    });
  }, [reference, lang, script, assistantSay, startListening]);

  const goAskSlot = useCallback((date, centre, crop, qty) => {
    setStep('ASK_SLOT');
    // Wait a moment for slots to load
    setTimeout(() => {
      setAvailableSlots(prev => {
        const slots = prev.length > 0 ? prev : [];
        const slotLabels = slots.map(s => s.slot).join(', ') || 'subah 8, 9, 10';
        const q = script.askSlot.replace('{slots}', slotLabels);
        assistantSay(q, () => {
          startListening((heard) => {
            const match = extractSlotTime(heard, slots);
            if (match) {
              setSelectedSlot(match);
              goConfirm(match, date, centre, crop, qty);
            } else {
              assistantSay(script.notUnderstood, () => goAskSlot(date, centre, crop, qty));
            }
          });
        });
        return prev;
      });
    }, 800);
  }, [script, assistantSay, startListening]);

  const goConfirm = useCallback((slot, date, centre, crop, qty) => {
    setStep('CONFIRM');
    const dateLabel = lang === 'en' ? date.label : (date.iso === reference?.dates?.[0] ? script.today?.[0] : script.tomorrow?.[0]);
    const confirmText = script.confirm
      .replace('{centre}', centre.name)
      .replace('{crop}', crop.label)
      .replace('{qty}', qty)
      .replace('{date}', date.label)
      .replace('{slot}', slot.slot);
    assistantSay(confirmText, () => {
      startListening((heard) => {
        const inp = normalize(heard);
        const isYes = script.yes.some(y => inp.includes(normalize(y)));
        const isNo  = script.no.some(n => inp.includes(normalize(n)));
        if (isYes) {
          submitBooking(centre, crop, qty, date, slot);
        } else if (isNo) {
          assistantSay(script.cancelled);
          setStep('IDLE');
        } else {
          assistantSay(script.notUnderstood, () => goConfirm(slot, date, centre, crop, qty));
        }
      });
    });
  }, [lang, reference, script, assistantSay, startListening]);

  const goAskDate = useCallback((centre, crop, qty) => {
    setStep('ASK_DATE');
    assistantSay(script.askDate, () => {
      startListening((heard) => {
        const inp = normalize(heard);
        const isToday    = script.today.some(k => inp.includes(normalize(k)));
        const isTomorrow = script.tomorrow.some(k => inp.includes(normalize(k)));
        const dates = reference?.dates || [];
        let date = null;
        if (isToday && dates[0]) {
          date = { iso: dates[0], label: lang === 'en' ? 'Today' : lang === 'hi' ? 'आज' : 'आज' };
        } else if (isTomorrow && dates[1]) {
          date = { iso: dates[1], label: lang === 'en' ? 'Tomorrow' : lang === 'hi' ? 'कल' : 'उद्या' };
        } else if (dates[0]) {
          date = { iso: dates[0], label: lang === 'en' ? 'Today' : lang === 'hi' ? 'आज' : 'आज' };
        }
        if (date) {
          setSelectedDate(date);
          goAskSlot(date, centre, crop, qty);
        } else {
          assistantSay(script.notUnderstood, () => goAskDate(centre, crop, qty));
        }
      });
    });
  }, [reference, lang, script, assistantSay, startListening, goAskSlot]);

  const goAskQuantity = useCallback((crop, centre) => {
    setStep('ASK_QUANTITY');
    assistantSay(script.askQuantity, () => {
      startListening((heard) => {
        const qty = extractNumber(heard);
        if (qty && qty > 0 && qty <= 200) {
          setSelectedQty(qty);
          goAskDate(centre, crop, qty);
        } else {
          assistantSay(script.notUnderstood, () => goAskQuantity(crop, centre));
        }
      });
    });
  }, [script, assistantSay, startListening, goAskDate]);

  const goAskCentre = useCallback(() => {
    setStep('ASK_CENTRE');
    const centreNames = centres.map(c => c.name).join(', ');
    const q = script.askCentre.replace('{centres}', centreNames);
    assistantSay(q, () => {
      startListening((heard) => {
        const candidates = centres.map(c => ({
          key: c.id,
          label: c.name,
          alias: c.district,
          keywords: [c.district, c.name],
        }));
        const match = fuzzyMatch(heard, candidates);
        if (match) {
          const centre = centres.find(c => c.id === match.key);
          setSelectedCentre({ id: centre.id, name: centre.name });
          goAskCrop({ id: centre.id, name: centre.name });
        } else {
          assistantSay(script.notUnderstood, () => goAskCentre());
        }
      });
    });
  }, [centres, script, assistantSay, startListening, goAskCrop]);

  const submitBooking = useCallback(async (centre, crop, qty, date, slot) => {
    setStep('BOOKING');
    assistantSay(script.booking);
    try {
      const result = await api('/bookings', {
        method: 'POST',
        body: {
          centreId:    Number(centre.id),
          crop:        crop.key,
          quantityQtl: Number(qty),
          slotDate:    date.iso,
          slotTime:    slot.slot,
        },
      });
      const token = result?.token || result?.booking?.token || '';
      setBookedToken(token);
      setStep('DONE');
      const doneMsg = script.done.replace('{token}', token);
      assistantSay(doneMsg, () => {
        setTimeout(() => {
          setOpen(false);
          navigate('/farmer', { replace: true });
        }, 3000);
      });
    } catch (err) {
      setStep('ERROR');
      assistantSay(script.error);
      addMsg('bot', err.message || '');
    }
  }, [script, assistantSay, addMsg, navigate]);

  // ── Start conversation ────────────────────────────────────────────────────

  const startConversation = useCallback(() => {
    if (!supported) {
      addMsg('bot', script.noSupport);
      return;
    }
    // Reset state
    setMessages([]);
    setSelectedCentre(null);
    setSelectedCrop(null);
    setSelectedQty(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setBookedToken(null);
    setAvailableSlots([]);

    assistantSay(script.greeting, () => {
      if (centres.length === 0) {
        assistantSay("Loading centre data, please wait...", () => {
          setTimeout(() => goAskCentre(), 1500);
        });
      } else {
        goAskCentre();
      }
    });
  }, [supported, addMsg, script, assistantSay, centres, goAskCentre]);

  const handleOpen = () => {
    setOpen(true);
    setMessages([]);
    setStep('IDLE');
  };

  const handleClose = () => {
    synthRef.current?.cancel();
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }
    setListening(false);
    setOpen(false);
    setStep('IDLE');
  };

  // ── Step progress label ───────────────────────────────────────────────────

  const STEP_LABELS = {
    IDLE:         null,
    ASK_CENTRE:   '1/5 · Centre',
    ASK_CROP:     '2/5 · Crop',
    ASK_QUANTITY: '3/5 · Quantity',
    ASK_DATE:     '4/5 · Date',
    ASK_SLOT:     '5/5 · Time Slot',
    CONFIRM:      '✓ Confirm',
    BOOKING:      '⏳ Booking',
    DONE:         '✅ Done',
    ERROR:        '❌ Error',
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Floating trigger button */}
      {!open && (
        <button
          onClick={handleOpen}
          aria-label="Open voice booking assistant"
          className="fixed bottom-6 right-5 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 shadow-xl shadow-emerald-800/40 ring-4 ring-emerald-300/30 transition hover:scale-110 hover:brightness-110 active:scale-95"
        >
          <span className="absolute h-16 w-16 rounded-full bg-emerald-400/30 animate-ping" />
          <Volume2 className="relative h-7 w-7 text-white" />
          <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-white text-[10px] font-black text-emerald-800 shadow">
            AI
          </span>
        </button>
      )}

      {/* Assistant Panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/50 backdrop-blur-sm sm:items-flex-end sm:justify-end sm:p-4">
          <div className="flex h-full flex-col bg-white sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-sm sm:rounded-3xl sm:shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between gap-3 rounded-t-3xl bg-gradient-to-r from-emerald-700 to-teal-700 px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/20 backdrop-blur">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-extrabold tracking-wide">AI Booking Assistant</p>
                  {STEP_LABELS[step] && (
                    <p className="text-[11px] font-semibold text-emerald-200">{STEP_LABELS[step]}</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close assistant"
                className="grid h-8 w-8 place-items-center rounded-xl bg-white/20 transition hover:bg-white/30"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Progress bar */}
            {step !== 'IDLE' && step !== 'DONE' && step !== 'ERROR' && (
              <div className="h-1 bg-emerald-100">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${(['ASK_CENTRE','ASK_CROP','ASK_QUANTITY','ASK_DATE','ASK_SLOT','CONFIRM','BOOKING'].indexOf(step) + 1) / 7 * 100}%` }}
                />
              </div>
            )}

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && step === 'IDLE' && (
                <div className="mt-6 flex flex-col items-center gap-3 text-center">
                  <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 text-5xl shadow-inner">
                    🎙️
                  </div>
                  <p className="text-base font-bold text-slate-800">
                    Voice Slot Booking
                  </p>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-[200px]">
                    I'll ask you a few questions and book your slot — all by voice in Hindi, Marathi, or English!
                  </p>
                  {!supported && (
                    <p className="mt-1 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-800 ring-1 ring-rose-200">
                      ⚠️ Please use Chrome or Edge for voice support
                    </p>
                  )}
                </div>
              )}

              {messages.map(m => (
                <div
                  key={m.id}
                  className={`flex gap-2 ${m.from === 'farmer' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {m.from === 'bot' && (
                    <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-800">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-snug ${
                      m.from === 'bot'
                        ? 'bg-slate-100 text-slate-900 rounded-tl-none'
                        : 'bg-emerald-600 text-white rounded-tr-none'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {/* Listening indicator */}
              {listening && (
                <div className="flex items-center gap-2 px-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map(i => (
                      <span
                        key={i}
                        className="inline-block w-1 rounded-full bg-emerald-500"
                        style={{
                          height: `${12 + Math.random() * 16}px`,
                          animation: `bounce ${0.4 + i * 0.1}s ease-in-out infinite alternate`,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 animate-pulse">Listening…</span>
                </div>
              )}

              {/* Booking spinner */}
              {step === 'BOOKING' && (
                <div className="flex items-center gap-2 justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-800">Booking your slot…</span>
                </div>
              )}

              {/* Done */}
              {step === 'DONE' && bookedToken && (
                <div className="mt-2 flex flex-col items-center gap-2 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                  <p className="text-sm font-bold text-emerald-900">Slot Booked!</p>
                  <p className="font-mono text-2xl font-black text-emerald-950">{bookedToken}</p>
                  <p className="text-xs text-emerald-700">Your digital gate pass is ready</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom action */}
            <div className="border-t border-slate-100 p-4">
              {(step === 'IDLE' || step === 'ERROR') && (
                <button
                  onClick={startConversation}
                  disabled={!supported || centres.length === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-800/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Mic className="h-5 w-5" />
                  {centres.length === 0 ? 'Loading…' : 'Start Voice Booking'}
                </button>
              )}

              {listening && (
                <div className="flex items-center justify-center gap-3 py-2">
                  <div className="relative grid h-12 w-12 place-items-center rounded-full bg-red-50 ring-4 ring-red-200">
                    <span className="absolute h-12 w-12 rounded-full bg-red-200 animate-ping opacity-60" />
                    <Mic className="relative h-6 w-6 text-red-600" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">Listening — speak now…</span>
                </div>
              )}

              {!listening && step !== 'IDLE' && step !== 'ERROR' && step !== 'DONE' && step !== 'BOOKING' && (
                <p className="text-center text-xs text-slate-400">
                  Waiting for your response…
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          from { transform: scaleY(1); }
          to   { transform: scaleY(2.5); }
        }
      `}</style>
    </>
  );
}
