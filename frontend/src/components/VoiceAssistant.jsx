/**
 * VoiceAssistant.jsx
 *
 * True 2-Way Interactive Voice & Touch Assistant for Procurement Slot Booking.
 * Supports Hindi, Marathi, and English natively using Web Speech APIs.
 *
 * Key Architecture Highlights:
 * 1. True 2-Way Turn Taking:
 *    - Turn 1: Bot Speaks (Microphone is paused to prevent audio feedback loop)
 *    - Turn 2: User Speaks (Microphone opens with live audio waves & real-time caption preview)
 * 2. Instant Interrupt: Tapping "Tap to Speak" immediately cuts off bot audio and listens.
 * 3. Fail-Proof: Never infinite loops on silence. Option chips always available.
 * 4. Multi-Slot Aware: Allows booking up to 3 active slots per farmer.
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
    askCentre: 'Welcome! Which procurement centre would you like to visit?',
    askCrop: 'Which crop are you bringing for procurement?',
    askQty: 'How many quintals would you like to book?',
    askDate: 'Which date do you prefer? Today or Tomorrow?',
    askSlot: 'Which time slot suits you?',
    confirm: 'Please confirm: {centre}, {crop}, {qty} quintals, on {date} at {slot}. Say YES to confirm or NO to cancel.',
    booking: 'Submitting your slot booking, please wait…',
    done: 'Your slot has been successfully booked! Your token is {token}. You can book up to 3 active slots.',
    error: 'Booking failed. Please check details and try again.',
    cancelled: 'Booking cancelled. Tap Start anytime to try again.',
    notUnderstood: "I didn't catch that clearly. Please say your choice or tap an option below.",
    yesKeywords: ['yes', 'haan', 'ha', 'haa', 'confirm', 'book', 'ok', 'okay', 'sure', 'right', 'correct'],
    noKeywords: ['no', 'nahi', 'nahin', 'cancel', 'stop', 'back', 'wrong'],
    todayKeywords: ['today', 'aaj', 'aj'],
    tomorrowKeywords: ['tomorrow', 'kal', 'udya'],
  },
  hi: {
    askCentre: 'नमस्ते! आप किस खरीद केंद्र (मंडी) का चयन करना चाहते हैं?',
    askCrop: 'आप कौन सी फसल की तुलाई के लिए लाना चाहते हैं?',
    askQty: 'आप कितने क्विंटल अनाज लाना चाहते हैं?',
    askDate: 'आप कौन सी तारीख चुनना चाहते हैं? आज या कल?',
    askSlot: 'आप कौन सा समय स्लॉट पसंद करेंगे?',
    confirm: 'कृपया पुष्टि करें: {centre}, {crop}, {qty} क्विंटल, {date} को {slot} बजे। पुष्टि के लिए हाँ कहें या रद्द करने के लिए नहीं।',
    booking: 'आपका स्लॉट बुक किया जा रहा है, कृपया प्रतीक्षा करें…',
    done: 'आपका स्लॉट सफलतापूर्वक बुक हो गया! आपका टोकन नंबर है {token}। आप 3 स्लॉट तक बुक कर सकते हैं।',
    error: 'बुकिंग में त्रुटि हुई। कृपया पुनः प्रयास करें।',
    cancelled: 'बुकिंग रद्द कर दी गई। शुरू करने के लिए कभी भी बटन दबाएं।',
    notUnderstood: 'स्पष्ट सुनाई नहीं दिया। कृपया नीचे से विकल्प चुनें या दोबारा बोलें।',
    yesKeywords: ['हाँ', 'हां', 'हा', 'yes', 'haan', 'haa', 'ok', 'theek', 'theek hai', 'sahi', 'book'],
    noKeywords: ['नहीं', 'नही', 'no', 'nahi', 'nahin', 'cancel', 'mat karo', 'ruko'],
    todayKeywords: ['आज', 'today', 'aaj'],
    tomorrowKeywords: ['कल', 'tomorrow', 'kal'],
  },
  mr: {
    askCentre: 'नमस्कार! तुम्हाला कोणत्या खरेदी केंद्राची (बाजार समिती) निवड करायची आहे?',
    askCrop: 'तुम्ही कोणते पीक विक्रीसाठी आणणार आहात?',
    askQty: 'तुम्ही किती क्विंटल धान्य आणणार आहात?',
    askDate: 'तुम्हाला कोणती तारीख हवी आहे? आज किंवा उद्या?',
    askSlot: 'तुम्हाला कोणता वेळ स्लॉट सोयीचा आहे?',
    confirm: 'कृपया खात्री करा: {centre}, {crop}, {qty} क्विंटल, {date} रोजी {slot} वाजता. पुष्टीसाठी हो म्हणा किंवा रद्द करण्यासाठी नाही.',
    booking: 'तुमचा स्लॉट बुक केला जात आहे, कृपया थांबा…',
    done: 'तुमचा स्लॉट यशस्वीरित्या बुक झाला आहे! तुमचा टोकन नंबर {token} आहे. तुम्ही 3 स्लॉट पर्यंत बुक करू शकता.',
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
  const [turnState, setTurnState] = useState('IDLE'); // 'BOT_SPEAKING' | 'USER_LISTENING' | 'IDLE'
  const [liveHeardTranscript, setLiveHeardTranscript] = useState('');
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
  const stepRef = useRef(step);
  stepRef.current = step;

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, step, turnState, liveHeardTranscript]);

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

  // Stop everything (speech synth & recognition)
  const stopAll = useCallback(() => {
    window.speechSynthesis?.cancel();
    clearTimeout(fallbackTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
    setTurnState('IDLE');
    setLiveHeardTranscript('');
  }, []);

  // True 2-Way: Bot Speaks, then triggers user listening turn
  const botSpeakAndPrompt = useCallback(
    (text, onFinishedSpeaking) => {
      stopAll();
      addMessage('bot', text);

      if (!('speechSynthesis' in window)) {
        if (onFinishedSpeaking) onFinishedSpeaking();
        return;
      }

      setTurnState('BOT_SPEAKING');
      const utterance = new SpeechSynthesisUtterance(text);
      const targetLang = SPEECH_LANG_MAP[lang] || 'hi-IN';
      utterance.lang = targetLang;
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

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
        clearTimeout(fallbackTimerRef.current);
        window._activeSpeechUtterance = null;
        setTurnState('IDLE');
        if (onFinishedSpeaking) onFinishedSpeaking();
      };

      utterance.onend = finish;
      utterance.onerror = finish;

      const estTimeMs = Math.max(1500, (text.length / 10) * 1000 + 1000);
      fallbackTimerRef.current = setTimeout(finish, estTimeMs);

      window.speechSynthesis.speak(utterance);
    },
    [lang, stopAll, addMessage]
  );

  // User Listening Turn
  const startUserTurn = useCallback(
    (onTextHeard) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        setTurnState('IDLE');
        return;
      }

      // Stop speech synth so it never hears itself
      window.speechSynthesis?.cancel();
      clearTimeout(fallbackTimerRef.current);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SR();
      recognition.lang = SPEECH_LANG_MAP[lang] || 'hi-IN';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setTurnState('USER_LISTENING');
        setLiveHeardTranscript('');
      };

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';
        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setLiveHeardTranscript(interim || final);

        if (final.trim()) {
          setTurnState('IDLE');
          addMessage('farmer', final.trim());
          onTextHeard(final.trim());
        }
      };

      recognition.onerror = () => {
        setTurnState('IDLE');
      };

      recognition.onend = () => {
        setTurnState('IDLE');
      };

      try {
        recognition.start();
      } catch {
        setTurnState('IDLE');
      }
    },
    [lang, addMessage]
  );

  // ── Conversation Step Handlers ──────────────────────────────────────────────

  const askCentre = useCallback(() => {
    setStep('CENTRE');
    botSpeakAndPrompt(script.askCentre, () => {
      startUserTurn((heard) => {
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
          botSpeakAndPrompt(script.notUnderstood, () => {
            // Keep option chips open, do not infinite loop
          });
        }
      });
    });
  }, [centres, script, botSpeakAndPrompt, startUserTurn]);

  const handleSelectCentre = (centre) => {
    stopAll();
    setSelectedCentre(centre);
    addMessage('farmer', centre.name);
    askCrop(centre);
  };

  const askCrop = useCallback(
    (centre) => {
      setStep('CROP');
      botSpeakAndPrompt(script.askCrop, () => {
        startUserTurn((heard) => {
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
            botSpeakAndPrompt(script.notUnderstood, () => {});
          }
        });
      });
    },
    [script, botSpeakAndPrompt, startUserTurn]
  );

  const handleSelectCrop = (cropKey, centre) => {
    stopAll();
    const targetCentre = centre || selectedCentre;
    const label = CROP_LABELS[cropKey]?.[lang] || cropKey;
    setSelectedCrop({ key: cropKey, label });
    addMessage('farmer', label);
    askQty(targetCentre, cropKey);
  };

  const askQty = useCallback(
    (centre, cropKey) => {
      setStep('QTY');
      const maxLimit = centre?.max_qty_per_farmer || 50;
      const promptText =
        lang === 'hi'
          ? `${centre.name} में अधिकतम ${maxLimit} क्विंटल की सीमा है। आप कितने क्विंटल अनाज लाना चाहते हैं?`
          : lang === 'mr'
          ? `${centre.name} मध्ये जास्तीत जास्त ${maxLimit} क्विंटल मर्यादा आहे. तुम्ही किती क्विंटल धान्य आणणार आहात?`
          : `${centre.name} accepts up to ${maxLimit} quintals. How many quintals would you like to book?`;

      botSpeakAndPrompt(promptText, () => {
        startUserTurn((heard) => {
          const match = heard.match(/[\d.]+/);
          const val = match ? parseFloat(match[0]) : null;
          if (val && val > 0 && val <= maxLimit) {
            handleSelectQty(val, centre, cropKey);
          } else if (val && val > maxLimit) {
            const overText =
              lang === 'hi'
                ? `यह संख्या इस केंद्र की ${maxLimit} क्विंटल सीमा से अधिक है। कृपया ${maxLimit} या उससे कम बताएं।`
                : lang === 'mr'
                ? `ही संख्या ${maxLimit} क्विंटल मर्यादेपेक्षा जास्त आहे. कृपया ${maxLimit} किंवा कमी सांगा.`
                : `That exceeds the ${maxLimit} quintal limit for this centre. Please choose ${maxLimit} or less.`;
            botSpeakAndPrompt(overText, () => askQty(centre, cropKey));
          } else {
            botSpeakAndPrompt(script.notUnderstood, () => {});
          }
        });
      });
    },
    [lang, script, botSpeakAndPrompt, startUserTurn]
  );

  const handleSelectQty = (qtyNum, centre, cropKey) => {
    stopAll();
    const targetCentre = centre || selectedCentre;
    const targetCrop = cropKey || selectedCrop?.key;
    setSelectedQty(qtyNum);
    addMessage('farmer', `${qtyNum} quintals`);
    askDate(targetCentre, targetCrop, qtyNum);
  };

  const askDate = useCallback(
    (centre, cropKey, qtyNum) => {
      setStep('DATE');
      botSpeakAndPrompt(script.askDate, () => {
        startUserTurn((heard) => {
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
            botSpeakAndPrompt(script.notUnderstood, () => {});
          }
        });
      });
    },
    [reference, lang, script, botSpeakAndPrompt, startUserTurn]
  );

  const handleSelectDate = (dateObj, centre, cropKey, qtyNum) => {
    stopAll();
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
        botSpeakAndPrompt(script.askSlot, () => {
          startUserTurn((heard) => {
            const norm = normalize(heard);
            const match = availableSlots.find((s) => norm.includes(normalize(s.slot)) || norm.includes(s.slot.split(':')[0]));
            if (match) {
              handleSelectSlot(match, centre, cropKey, qtyNum, dateObj);
            } else if (availableSlots[0]) {
              handleSelectSlot(availableSlots[0], centre, cropKey, qtyNum, dateObj);
            } else {
              botSpeakAndPrompt(script.notUnderstood, () => {});
            }
          });
        });
      }, 300);
    },
    [availableSlots, script, botSpeakAndPrompt, startUserTurn]
  );

  const handleSelectSlot = (slotObj, centre, cropKey, qtyNum, dateObj) => {
    stopAll();
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

      botSpeakAndPrompt(confirmText, () => {
        startUserTurn((heard) => {
          const norm = normalize(heard);
          const isYes = script.yesKeywords.some((k) => norm.includes(normalize(k)));
          const isNo = script.noKeywords.some((k) => norm.includes(normalize(k)));
          if (isYes) {
            submitBooking(centre, cropKey, qtyNum, dateObj, slotObj);
          } else if (isNo) {
            botSpeakAndPrompt(script.cancelled, () => {});
            setStep('IDLE');
          } else {
            botSpeakAndPrompt(script.notUnderstood, () => {});
          }
        });
      });
    },
    [lang, script, botSpeakAndPrompt, startUserTurn]
  );

  const submitBooking = useCallback(
    async (centre, cropKey, qtyNum, dateObj, slotObj) => {
      setStep('BOOKING');
      stopAll();
      botSpeakAndPrompt(script.booking);

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
        botSpeakAndPrompt(doneText, () => {
          setTimeout(() => {
            setOpen(false);
            navigate('/farmer', { replace: true });
          }, 3500);
        });
      } catch (err) {
        setStep('ERROR');
        botSpeakAndPrompt(script.error);
        addMessage('bot', err.message || 'Server error');
      }
    },
    [script, stopAll, botSpeakAndPrompt, addMessage, navigate]
  );

  // Manual Trigger Button for user to speak at any step
  const handleManualMicClick = () => {
    if (turnState === 'USER_LISTENING') {
      stopAll();
    } else {
      stopAll();
      // Start listening directly for the active step
      startUserTurn((heard) => {
        const norm = normalize(heard);
        if (step === 'CENTRE') {
          const match = centres.find(
            (c) =>
              norm.includes(normalize(c.name)) ||
              normalize(c.name).includes(norm) ||
              norm.includes(normalize(c.district)) ||
              normalize(c.district).includes(norm)
          );
          if (match) handleSelectCentre(match);
        } else if (step === 'CROP') {
          let matchedKey = null;
          for (const [cropKey, keywords] of Object.entries(CROP_MATCHERS)) {
            if (keywords.some((k) => norm.includes(normalize(k)) || normalize(k).includes(norm))) {
              matchedKey = cropKey;
              break;
            }
          }
          if (matchedKey) handleSelectCrop(matchedKey, selectedCentre);
        } else if (step === 'QTY') {
          const match = heard.match(/[\d.]+/);
          const val = match ? parseFloat(match[0]) : null;
          if (val && val > 0 && val <= 200) handleSelectQty(val, selectedCentre, selectedCrop?.key);
        } else if (step === 'DATE') {
          const isToday = script.todayKeywords.some((k) => norm.includes(normalize(k)));
          const isTom = script.tomorrowKeywords.some((k) => norm.includes(normalize(k)));
          const dates = reference?.dates || [];
          if (isToday && dates[0]) {
            handleSelectDate({ iso: dates[0], label: lang === 'en' ? 'Today' : lang === 'hi' ? 'आज' : 'आज' }, selectedCentre, selectedCrop?.key, selectedQty);
          } else if (isTom && dates[1]) {
            handleSelectDate({ iso: dates[1], label: lang === 'en' ? 'Tomorrow' : lang === 'hi' ? 'कल' : 'उद्या' }, selectedCentre, selectedCrop?.key, selectedQty);
          }
        } else if (step === 'SLOT') {
          const match = availableSlots.find((s) => norm.includes(normalize(s.slot)) || norm.includes(s.slot.split(':')[0]));
          if (match) handleSelectSlot(match, selectedCentre, selectedCrop?.key, selectedQty, selectedDate);
        } else if (step === 'CONFIRM') {
          const isYes = script.yesKeywords.some((k) => norm.includes(normalize(k)));
          const isNo = script.noKeywords.some((k) => norm.includes(normalize(k)));
          if (isYes) submitBooking(selectedCentre, selectedCrop?.key, selectedQty, selectedDate, selectedSlot);
          else if (isNo) {
            botSpeakAndPrompt(script.cancelled);
            setStep('IDLE');
          }
        } else {
          startConversation();
        }
      });
    }
  };

  const startConversation = () => {
    setMessages([]);
    setSelectedCentre(null);
    setSelectedCrop(null);
    setSelectedQty(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setBookedToken(null);
    askCentre();
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
          <div className="flex h-[92vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl sm:h-[660px] sm:max-w-md sm:rounded-3xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-emerald-800/20 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 px-5 py-3.5 text-white">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/20 shadow-inner backdrop-blur-md">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-wide">{t('va.assistantTitle')}</h3>
                  <p className="text-[11px] font-medium text-emerald-200">2-Way Voice & Touch Booking</p>
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

            {/* Turn-Taking Status Strip */}
            <div className="flex items-center justify-between px-4 py-2 text-xs font-bold border-b border-slate-100 bg-slate-50">
              {turnState === 'BOT_SPEAKING' ? (
                <div className="flex items-center gap-2 text-emerald-800">
                  <Volume2 className="h-4 w-4 animate-bounce text-emerald-700" />
                  <span>Assistant is speaking… (Tap mic to speak)</span>
                </div>
              ) : turnState === 'USER_LISTENING' ? (
                <div className="flex items-center gap-2 text-rose-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-600 animate-ping" />
                  <span>🎙️ Your turn — Speak now!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-500">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Speak or tap choices below</span>
                </div>
              )}

              <span className="text-[11px] text-slate-400 font-mono">
                {step !== 'IDLE' && step !== 'DONE' && step !== 'ERROR' ? `Step: ${step}` : ''}
              </span>
            </div>

            {/* Chat Conversation History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
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

              {/* Real-time live transcript caption while user speaks */}
              {turnState === 'USER_LISTENING' && (
                <div className="flex flex-col gap-1.5 rounded-2xl bg-rose-50/90 p-3 border border-rose-200 text-xs font-semibold text-rose-900 animate-pulse">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
                    <span>Listening to your voice…</span>
                  </div>
                  {liveHeardTranscript && (
                    <p className="font-mono text-slate-800 bg-white/90 p-2 rounded-xl border border-rose-100">
                      "{liveHeardTranscript}"
                    </p>
                  )}
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
                    {(() => {
                      const maxL = selectedCentre?.max_qty_per_farmer || 50;
                      const options = [
                        Math.max(1, Math.min(maxL, Math.round(maxL * 0.2))),
                        Math.max(2, Math.min(maxL, Math.round(maxL * 0.5))),
                        Math.max(5, Math.min(maxL, Math.round(maxL * 0.8))),
                        maxL,
                      ].filter((v, i, a) => a.indexOf(v) === i && v > 0);

                      return (
                        <>
                          <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold px-0.5">
                            <span>Centre: {selectedCentre?.name}</span>
                            <span className="text-emerald-800 font-bold">Max Limit: {maxL} qtl</span>
                          </div>

                          <div className="flex gap-1.5">
                            {options.map((q) => (
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
                        </>
                      );
                    })()}
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder={`Max ${selectedCentre?.max_qty_per_farmer || 50} quintals...`}
                        value={customQtyInput}
                        onChange={(e) => setCustomQtyInput(e.target.value)}
                        className="h-8 flex-1 rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-emerald-600"
                      />
                      {customQtyInput && (
                        <button
                          type="button"
                          onClick={() => {
                            const val = parseFloat(customQtyInput);
                            const maxL = selectedCentre?.max_qty_per_farmer || 50;
                            if (val > maxL) {
                              alert(`Maximum allowed limit for this centre is ${maxL} quintals.`);
                            } else {
                              handleSelectQty(val, selectedCentre, selectedCrop?.key);
                            }
                          }}
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
                        botSpeakAndPrompt(script.cancelled);
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

            {/* Bottom 2-Way Push/Tap-to-Speak Control Button */}
            <div className="border-t border-slate-100 bg-slate-50 p-3">
              <button
                type="button"
                onClick={handleManualMicClick}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white shadow-md transition ${
                  turnState === 'USER_LISTENING'
                    ? 'bg-rose-600 shadow-rose-900/30 animate-pulse ring-4 ring-rose-200'
                    : turnState === 'BOT_SPEAKING'
                    ? 'bg-amber-600 hover:bg-amber-700 ring-2 ring-amber-200'
                    : 'bg-gradient-to-r from-emerald-700 to-teal-700 hover:brightness-110'
                }`}
              >
                <Mic className="h-5 w-5" />
                <span>
                  {turnState === 'USER_LISTENING'
                    ? 'Listening… (Tap to Stop & Process)'
                    : turnState === 'BOT_SPEAKING'
                    ? 'Tap to Speak Now (Interrupt Bot)'
                    : t('va.tapToSpeak')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
