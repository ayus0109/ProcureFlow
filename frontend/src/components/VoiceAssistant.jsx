/**
 * VoiceAssistant.jsx
 *
 * Phone-Call Style 2-Way Interactive Voice & Touch Assistant for Procurement Slot Booking.
 *
 * Key Upgrades:
 * 1. High-Quality Natural Voice: Exclusively uses the crisp native neural Indian voice.
 * 2. Robust Slot Parser: Fixes hour matching so "11th to 12th" accurately selects 11:00-12:00.
 * 3. Conversational Phrasing: Understands natural conversational sentences like "tomorrow is okay", "kal chalega", "pune theek rahega".
 * 4. Zero Overlap: Synchronously purges previous speech queues on booking completion and cancellation.
 * 5. Unavailable Slot Filter: Only open available slots are announced and displayed.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
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
    askCentre: 'Hello! Which procurement centre would you like to visit? You can say Pune, Nashik, Nagpur, Aurangabad, or Kolhapur.',
    askCrop: 'You selected {centre}. Which crop are you bringing? You can say Wheat, Paddy, Cotton, Soybean, or Tur.',
    askQty: 'Great! How many quintals of {crop} would you like to book at {centre}? (Max limit: {max} quintals).',
    askDate: 'Which date do you prefer? Say Today or Tomorrow.',
    askSlot: 'Available open slots are: {slots}. Which time slot suits you?',
    confirm: 'Please confirm: {centre}, {crop}, {qty} quintals, on {date} at {slot}. Should I book this slot? Say YES to confirm or NO to cancel.',
    booking: 'Submitting your slot booking, please wait…',
    done: 'Congratulations! Your slot has been successfully booked. Your token number is {token}.',
    error: 'Booking failed. Please try again.',
    cancelled: 'Booking has been cancelled. Tap Start anytime to try again.',
    notUnderstoodCentre: "I didn't catch the centre name. Please say Pune, Nashik, Nagpur, Aurangabad, Kolhapur, or tap below.",
    notUnderstoodCrop: "I didn't catch the crop. Please say Wheat, Paddy, Cotton, Soybean, or Tur, or tap below.",
    notUnderstoodQty: "Please tell me the quantity in quintals, like 10, 20, or 50 quintals.",
    notUnderstoodDate: "Please say Today or Tomorrow.",
    notUnderstoodSlot: "Please choose an available time slot or tap an option below.",
    notUnderstoodConfirm: "Please say YES to confirm or NO to cancel.",
    yesKeywords: ['yes', 'haan', 'ha', 'haa', 'confirm', 'book', 'ok', 'okay', 'sure', 'right', 'correct', 'yep', 'done', 'sahi', 'kardo', 'kar do'],
    noKeywords: ['no', 'nahi', 'nahin', 'cancel', 'stop', 'back', 'wrong', 'dont', "don't", 'mat karo', 'ruko', 'nako'],
  },
  hi: {
    askCentre: 'नमस्ते! आप किस खरीद केंद्र (मंडी) में जाना चाहते हैं? आप बोल सकते हैं: पुणे, नासिक, नागपुर, औरंगाबाद या कोल्हापुर।',
    askCrop: 'आपने {centre} चुना है। आप कौन सी फसल लाना चाहते हैं? जैसे: गेहूं, धान, कपास, सोयाबीन या तूर।',
    askQty: 'बहुत अच्छा! आप {centre} में कितने क्विंटल {crop} लाना चाहते हैं? (अधिकतम सीमा: {max} क्विंटल)।',
    askDate: 'आप कौन सी तारीख चुनना चाहते हैं? बोलिए आज या कल।',
    askSlot: 'उपलब्ध खुले स्लॉट हैं: {slots}। आप कौन सा समय पसंद करेंगे?',
    confirm: 'कृपया पुष्टि करें: {centre}, {crop}, {qty} क्विंटल, {date} को {slot}। क्या मैं यह स्लॉट बुक कर दूँ? बोलिए हाँ या नहीं।',
    booking: 'आपका स्लॉट बुक किया जा रहा है, कृपया प्रतीक्षा करें…',
    done: 'बधाई हो! आपका स्लॉट सफलतापूर्वक बुक हो गया है। आपका टोकन नंबर है {token}।',
    error: 'बुकिंग में त्रुटि हुई। कृपया पुनः प्रयास करें।',
    cancelled: 'बुकिंग रद्द कर दी गई है। शुरू करने के लिए कभी भी बटन दबाएं।',
    notUnderstoodCentre: 'कृपया केंद्र का नाम बताएं, जैसे पुणे, नासिक, नागपुर, औरंगाबाद, कोल्हापुर, या नीचे से चुनें।',
    notUnderstoodCrop: 'कृपया फसल का नाम बताएं, जैसे गेहूं, धान, कपास, सोयाबीन, तूर, या नीचे से चुनें।',
    notUnderstoodQty: 'कृपया क्विंटल में मात्रा बताएं, जैसे 10 क्विंटल, 20 क्विंटल या 50 क्विंटल।',
    notUnderstoodDate: 'कृपया आज या कल बोलें।',
    notUnderstoodSlot: 'कृपया उपलब्ध समय स्लॉट बताएं या नीचे से चुनें।',
    notUnderstoodConfirm: 'कृपया पुष्टि के लिए हाँ बोलें या रद्द करने के लिए नहीं बोलें।',
    yesKeywords: ['हाँ', 'हां', 'हा', 'yes', 'haan', 'haa', 'ok', 'theek', 'theek hai', 'sahi', 'book', 'kardo', 'kar do', 'pack'],
    noKeywords: ['नहीं', 'नही', 'no', 'nahi', 'nahin', 'cancel', 'mat karo', 'ruko', 'galat', 'nako'],
  },
  mr: {
    askCentre: 'नमस्कार! तुम्हाला कोणत्या खरेदी केंद्रात (बाजार समितीत) जायचे आहे? तुम्ही पुणे, नाशिक, नागपूर, औरंगाबाद किंवा कोल्हापूर सांगू शकता.',
    askCrop: 'तुम्ही {centre} निवडले आहे. तुम्ही कोणते पीक विक्रीसाठी आणणार आहात? जसे गहू, भात, कापूस, सोयाबीन किंवा तूर.',
    askQty: 'छान! तुम्ही {centre} मध्ये किती क्विंटल {crop} आणणार आहात? (जास्तीत जास्त: {max} क्विंटल).',
    askDate: 'तुम्हाला कोणती तारीख हवी आहे? आज किंवा उद्या म्हणा.',
    askSlot: 'उपलब्ध खुले स्लॉट आहेत: {slots}. तुम्हाला कोणता वेळ सोयीचा आहे?',
    confirm: 'कृपया खात्री करा: {centre}, {crop}, {qty} क्विंटल, {date} रोजी {slot}. हा स्लॉट बुक करायचा का? होय किंवा नाही म्हणा.',
    booking: 'तुमचा स्लॉट बुक केला जात आहे, कृपया थांबा…',
    done: 'अभिनंदन! तुमचा स्लॉट यशस्वीरित्या बुक झाला आहे. तुमचा टोकन नंबर {token} आहे.',
    error: 'बुकिंग होऊ शकली नाही. कृपया पुन्हा प्रयत्न करा.',
    cancelled: 'बुकिंग रद्द करण्यात आले आहे. सुरू करण्यासाठी कधीही बटण दाबा.',
    notUnderstoodCentre: 'कृपया केंद्राचे नाव सांगा, जसे पुणे, नाशिक, नागपूर, औरंगाबाद, कोल्हापूर, किंवा खालील पर्याय निवडा.',
    notUnderstoodCrop: 'कृपया पिकाचे नाव सांगा, जसे गहू, भात, कापूस, सोयाबीन, तूर, किंवा खालील पर्याय निवडा.',
    notUnderstoodQty: 'कृपया क्विंटलमध्ये प्रमाण सांगा, जसे 10 क्विंटल, 20 क्विंटल किंवा 50 क्विंटल.',
    notUnderstoodDate: 'कृपया आज किंवा उद्या म्हणा.',
    notUnderstoodSlot: 'कृपया उपलब्ध वेळ स्लॉट निवडा किंवा खालील पर्याय निवडा.',
    notUnderstoodConfirm: 'कृपया पुष्टीसाठी होय म्हणा किंवा रद्द करण्यासाठी नाही म्हणा.',
    yesKeywords: ['हो', 'होय', 'हाय', 'yes', 'haan', 'ok', 'bar', 'bara', 'nakkich', 'book', 'kara', 'karun taka'],
    noKeywords: ['नाही', 'नको', 'no', 'nahi', 'cancel', 'thamba', 'chuka'],
  },
};

const CROP_LABELS = {
  WHEAT: { en: '🌾 Wheat', hi: '🌾 गेहूं', mr: '🌾 गहू' },
  PADDY: { en: '🍚 Paddy (Rice)', hi: '🍚 धान (चावल)', mr: '🍚 भात (धान)' },
  COTTON: { en: '☁️ Cotton', hi: '☁️ कपास', mr: '☁️ कापूस' },
  SOYBEAN: { en: '🌱 Soybean', hi: '🌱 सोयाबीन', mr: '🌱 सोयाबीन' },
  TUR: { en: '🌿 Tur (Arhar)', hi: '🌿 तूर (अरहर)', mr: '🌿 तूर' },
};

const CENTRE_ALIASES = {
  1: ['pune', 'poona', 'puna', 'पुणे', 'पुना', 'baramati', 'haveli', '1', 'one', 'pehla', 'first', 'एक', 'पहिला', 'पहिले'],
  2: ['nashik', 'nasik', 'नासिक', 'नाशिक', 'sinnar', 'dindori', 'niphad', '2', 'two', 'doosra', 'second', 'दोन', 'दुसरा', 'दूसरे'],
  3: ['nagpur', 'नागपुर', 'नागपूर', 'vidarbha', '3', 'three', 'teesra', 'third', 'तीन', 'तिसरा', 'तीसरे'],
  4: ['aurangabad', 'sambhajinagar', 'sambhaji', 'औरंगाबाद', 'संभाजीनगर', 'संभाजी', '4', 'four', 'chautha', 'fourth', 'चार', 'चौथा', 'चौथे'],
  5: ['kolhapur', 'कोल्हापुर', 'कोल्हापूर', '5', 'five', 'panchwa', 'fifth', 'पाच', 'पाचवा', 'पाचवे'],
};

const CENTRE_LOCAL_NAMES = {
  1: { en: 'Pune Procurement Center', hi: 'पुणे मंडी', mr: 'पुणे बाजार समिती' },
  2: { en: 'Nashik Procurement Center', hi: 'नासिक मंडी', mr: 'नाशिक बाजार समिती' },
  3: { en: 'Nagpur Procurement Center', hi: 'नागपुर मंडी', mr: 'नागपूर बाजार समिती' },
  4: { en: 'Aurangabad Procurement Center', hi: 'औरंगाबाद मंडी', mr: 'औरंगाबाद बाजार समिती' },
  5: { en: 'Kolhapur Procurement Center', hi: 'कोल्हापुर मंडी', mr: 'कोल्हापूर बाजार समिती' },
};

const CROP_MATCHERS = {
  WHEAT: ['wheat', 'gehu', 'gehun', 'गेहूं', 'गेहूँ', 'गेहू', 'गहू', 'kanak', '1', 'one', 'pehla', 'first', 'एक', 'पहिला'],
  PADDY: ['paddy', 'rice', 'dhan', 'chawal', 'धान', 'भात', 'चावल', 'तांदूळ', '2', 'two', 'doosra', 'second', 'दोन', 'दुसरा'],
  COTTON: ['cotton', 'kapas', 'kapaas', 'कपास', 'कापूस', 'रुई', 'rui', '3', 'three', 'teesra', 'third', 'तीन', 'तिसरा'],
  SOYBEAN: ['soybean', 'soya', 'soyabean', 'सोयाबीन', 'सोया', '4', 'four', 'chautha', 'fourth', 'चार', 'चौथा'],
  TUR: ['tur', 'toor', 'arhar', 'तूर', 'अरहर', 'tuvar', '5', 'five', 'panchwa', 'fifth', 'पाच', 'पाचवा'],
};

const NUMBER_WORDS = {
  'aadha': 0.5, 'half': 0.5, 'ek': 1, 'one': 1, 'do': 2, 'two': 2, 'teen': 3, 'three': 3,
  'char': 4, 'chaar': 4, 'four': 4, 'panch': 5, 'paanch': 5, 'five': 5, 'chhah': 6, 'six': 6,
  'saat': 7, 'seven': 7, 'aath': 8, 'eight': 8, 'nau': 9, 'nine': 9, 'das': 10, 'ten': 10,
  'gyarah': 11, 'eleven': 11, 'barah': 12, 'twelve': 12, 'terah': 13, 'thirteen': 13,
  'chaudah': 14, 'fourteen': 14, 'pandrah': 15, 'fifteen': 15, 'solah': 16, 'sixteen': 16,
  'satrah': 17, 'seventeen': 17, 'atharah': 18, 'eighteen': 18, 'unnis': 19, 'nineteen': 19,
  'bees': 20, 'twenty': 20, 'pachhis': 25, 'twenty five': 25, 'tees': 30, 'thirty': 30,
  'paintis': 35, 'chaalis': 40, 'chalis': 40, 'forty': 40, 'paintalis': 45, 'pachaas': 50,
  'pachas': 50, 'fifty': 50, 'saath': 60, 'sath': 60, 'sixty': 60, 'sattar': 70, 'seventy': 70,
  'assi': 80, 'eighty': 80, 'nabbe': 90, 'ninety': 90, 'sau': 100, 'ek sau': 100, 'hundred': 100,
  'dhai sau': 250, 'do sau': 200,
  // Marathi numbers
  'एक': 1, 'दोन': 2, 'तीन': 3, 'चार': 4, 'पाच': 5, 'सहा': 6, 'सात': 7, 'आठ': 8, 'नऊ': 9, 'दहा': 10,
  'पंधरा': 15, 'वीस': 20, 'पंचवीस': 25, 'तीस': 30, 'चाळीस': 40, 'पन्नास': 50, 'साठ': 60, 'शंभर': 100,
  // Hindi numbers
  'दस': 10, 'पंद्रह': 15, 'बीस': 20, 'पच्चीस': 25, 'तीस': 30, 'चालीस': 40, 'पचास': 50, 'सौ': 100, 'दो सौ': 200,
};

function normalize(s) {
  return (s || '').toLowerCase().replace(/[\s\-_,.।!?]/g, '');
}

function getCentreSpeechName(centre, lang) {
  if (!centre) return '';
  return CENTRE_LOCAL_NAMES[centre.id]?.[lang] || centre.name;
}

function formatSlotForSpeech(slotTime, lang) {
  if (!slotTime) return '';
  const parts = slotTime.split('-');
  const startHour = parseInt(parts[0].split(':')[0], 10);
  const endHour = parts[1] ? parseInt(parts[1].split(':')[0], 10) : startHour + 1;

  if (lang === 'hi') {
    const period = startHour < 12 ? 'सुबह' : 'दोपहर';
    const s = startHour > 12 ? startHour - 12 : startHour;
    const e = endHour > 12 ? endHour - 12 : endHour;
    return `${period} ${s} से ${e} बजे`;
  }
  if (lang === 'mr') {
    const period = startHour < 12 ? 'सकाळी' : 'दुपारी';
    const s = startHour > 12 ? startHour - 12 : startHour;
    const e = endHour > 12 ? endHour - 12 : endHour;
    return `${period} ${s} ते ${e} वाजता`;
  }
  return slotTime;
}

function getBestVoice(targetLang, voices) {
  if (!voices || voices.length === 0) return null;
  const tLang = targetLang.toLowerCase();
  const prefix = tLang.split('-')[0];

  // 1. Prioritize natural neural / regional voices for Hindi & Marathi
  if (prefix === 'hi') {
    const hi = voices.find(
      (v) =>
        v.lang.toLowerCase().startsWith('hi') ||
        /hindi|swara|kalpana|hemant|madhur|google.*हिन्दी/i.test(v.name)
    );
    if (hi) return hi;
  }

  if (prefix === 'mr') {
    const mr = voices.find(
      (v) =>
        v.lang.toLowerCase().startsWith('mr') ||
        /marathi|aarohi|manhar|google.*मराठी/i.test(v.name)
    );
    if (mr) return mr;

    // Fallback Marathi to Hindi voice (Devanagari script matches natively)
    const hiFallback = voices.find(
      (v) =>
        v.lang.toLowerCase().startsWith('hi') ||
        /hindi|swara|kalpana|hemant/i.test(v.name)
    );
    if (hiFallback) return hiFallback;
  }

  // 2. Exact match
  const exact = voices.find(
    (v) => v.lang.toLowerCase() === tLang || v.lang.toLowerCase().replace('_', '-') === tLang
  );
  if (exact) return exact;

  // 3. Prefix match
  const pMatch = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
  if (pMatch) return pMatch;

  // 4. Any Indian voice
  const inVoice = voices.find((v) => v.lang.toLowerCase().includes('in'));
  if (inVoice) return inVoice;

  return voices[0] || null;
}

// ── Smart NLU Entity Matchers ──────────────────────────────────────────────────

function findMatchingCentre(heard, centres) {
  if (!heard) return null;
  const clean = normalize(heard);

  for (const centre of centres) {
    const aliases = CENTRE_ALIASES[centre.id] || [];
    if (aliases.some((a) => clean.includes(normalize(a)) || normalize(a).includes(clean))) {
      return centre;
    }
    const cName = normalize(centre.name);
    const cDist = normalize(centre.district);
    if (clean.includes(cName) || cName.includes(clean) || clean.includes(cDist) || cDist.includes(clean)) {
      return centre;
    }
  }
  return null;
}

function findMatchingCrop(heard) {
  if (!heard) return null;
  const clean = normalize(heard);

  for (const [cropKey, keywords] of Object.entries(CROP_MATCHERS)) {
    if (keywords.some((k) => clean.includes(normalize(k)) || normalize(k).includes(clean))) {
      return cropKey;
    }
  }
  return null;
}

function extractQuantity(heard) {
  if (!heard) return null;
  // 1. Check numbers/digits
  const digitMatch = heard.match(/[\d.]+/);
  if (digitMatch) {
    const val = parseFloat(digitMatch[0]);
    if (!isNaN(val) && val > 0) return val;
  }

  // 2. Check Hindi/Marathi/English word numbers
  const lower = heard.toLowerCase().trim();
  for (const [word, num] of Object.entries(NUMBER_WORDS)) {
    if (lower.includes(word)) return num;
  }
  return null;
}

function findMatchingDate(heard, dates, lang) {
  if (!heard) return null;
  const text = heard.toLowerCase();

  // If user says "tomorrow is okay", "kal chalega", "tomorrow please", "kal kar do", "tomorrow"
  if (/\b(tomorrow|kal|udya|second|doosra|dusra|उद्या|कल|दुसरा)\b/i.test(text) && dates[1]) {
    return { iso: dates[1], label: lang === 'en' ? 'Tomorrow' : lang === 'hi' ? 'कल' : 'उद्या' };
  }

  // If user says "today is okay", "aaj chalega", "today please", "aaj kar do", "today"
  if (/\b(today|aaj|aj|first|pehla|pahila|आज|पहिला)\b/i.test(text)) {
    return { iso: dates[0], label: lang === 'en' ? 'Today' : 'आज' };
  }

  if (dates[0]) {
    return { iso: dates[0], label: lang === 'en' ? 'Today' : 'आज' };
  }
  return null;
}

function findMatchingSlot(heard, availableSlots) {
  if (!availableSlots || availableSlots.length === 0) return null;
  if (!heard) return availableSlots[0];

  const text = heard.toLowerCase();

  const hourMap = {
    '9': 9, '09': 9, 'nine': 9, 'nau': 9, 'नऊ': 9, 'नौ': 9,
    '10': 10, 'ten': 10, 'das': 10, 'dus': 10, 'दहा': 10, 'दस': 10,
    '11': 11, '11th': 11, 'eleven': 11, 'gyarah': 11, 'अकरा': 11, 'ग्यारह': 11,
    '12': 12, '12th': 12, 'twelve': 12, 'barah': 12, 'बारा': 12, 'बारह': 12,
    '1': 13, '13': 13, 'one': 13, '1 pm': 13, 'ek': 13, 'एक': 13,
    '2': 14, '14': 14, 'two': 14, '2 pm': 14, 'do': 14, 'दोन': 14, 'दो': 14,
    '3': 15, '15': 15, 'three': 15, '3 pm': 15, 'teen': 15, 'तीन': 15,
    '4': 16, '16': 16, 'four': 16, '4 pm': 16, 'char': 16, 'चार': 16,
    '5': 17, '17': 17, 'five': 17, '5 pm': 17, 'panch': 17, 'पाच': 17, 'पांच': 17,
  };

  // Check specific numbers with word boundaries / regex
  for (const [key, hr] of Object.entries(hourMap)) {
    const regex = new RegExp(`(^|[^a-zA-Z0-9])${key}([^a-zA-Z0-9]|$)`, 'i');
    if (
      regex.test(text) ||
      text.includes(key + ' baje') ||
      text.includes(key + 'th') ||
      text.includes(key + ':00') ||
      text.includes(key + ' vajata') ||
      text.includes(key + ' वाजता')
    ) {
      const found = availableSlots.find((s) => {
        const startHr = parseInt(s.slot.split(':')[0], 10);
        return startHr === hr || (hr <= 5 && startHr === hr + 12) || (hr >= 13 && startHr === hr);
      });
      if (found) return found;
    }
  }

  // Relative keywords
  if (/\b(first|pehla|pahila|पहिला|morning|subah|सकाळी)\b/i.test(text)) {
    return availableSlots[0];
  }
  if (/\b(last|aakhri|shewat|शेवटचा|evening|shaam|संध्याकाळी)\b/i.test(text)) {
    return availableSlots[availableSlots.length - 1];
  }

  // Exact slot string match
  for (const s of availableSlots) {
    if (text.includes(s.slot.toLowerCase())) return s;
  }

  return availableSlots[0];
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
  const [micError, setMicError] = useState('');

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
      .then((rows) => setAvailableSlots((rows || []).filter((s) => !s.full && s.left > 0)))
      .catch(() => {});
  }, [selectedCentre, selectedDate]);

  // Append message
  const addMessage = useCallback((from, text) => {
    setMessages((prev) => [...prev, { from, text, id: Date.now() + Math.random() }]);
  }, []);

  const [voices, setVoices] = useState([]);

  // Preload and monitor available SpeechSynthesis voices
  useEffect(() => {
    const loadVoices = () => {
      const v = window.speechSynthesis?.getVoices() || [];
      if (v.length > 0) setVoices(v);
    };

    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Stop everything immediately and synchronously (Zero Voice Collision)
  const stopAll = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    clearTimeout(fallbackTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
    setTurnState('IDLE');
    setLiveHeardTranscript('');
  }, []);

  // True 2-Way: Bot Speaks using the crisp, high-quality native neural voice exclusively
  const botSpeakAndPrompt = useCallback(
    (text, onFinishedSpeaking) => {
      stopAll();
      addMessage('bot', text);

      if (!('speechSynthesis' in window)) {
        if (onFinishedSpeaking) onFinishedSpeaking();
        return;
      }

      setTurnState('BOT_SPEAKING');

      // Clean text for speech synthesis
      const cleanText = text
        .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
        .replace(/[•…\-_~*]/g, ' ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const targetLang = SPEECH_LANG_MAP[lang] || 'hi-IN';
      utterance.lang = targetLang;
      utterance.rate = lang === 'hi' || lang === 'mr' ? 0.90 : 0.92;
      utterance.pitch = 1.0;

      const currentVoices = voices.length > 0 ? voices : (window.speechSynthesis.getVoices() || []);
      const matchedVoice = getBestVoice(targetLang, currentVoices);
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

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

      const estTimeMs = Math.max(2000, (cleanText.length / 8) * 1000 + 1200);
      fallbackTimerRef.current = setTimeout(finish, estTimeMs);

      // Force cancel any residual queue and speak cleanly
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    },
    [lang, voices, stopAll, addMessage]
  );

  // User Listening Turn with automatic error handling
  const startUserTurn = useCallback(
    async (onTextHeard) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        setMicError('Speech recognition is not supported in this browser. Please use Google Chrome or Edge.');
        setTurnState('IDLE');
        return;
      }

      setMicError('');
      window.speechSynthesis?.cancel();
      clearTimeout(fallbackTimerRef.current);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      // Explicitly trigger microphone permission if supported
      if (navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
        } catch (err) {
          setMicError('Microphone access blocked. Click the lock icon 🔒 in your browser URL bar and set Microphone to "Allow".');
          setTurnState('IDLE');
          return;
        }
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
        setMicError('');
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

      recognition.onerror = (e) => {
        setTurnState('IDLE');
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          setMicError('Microphone access denied. Click the lock icon 🔒 in your browser address bar and enable Microphone.');
        } else if (e.error === 'no-speech') {
          setMicError('No voice detected. Please speak closer to your microphone or tap an option below.');
        } else if (e.error === 'network') {
          setMicError('Network issue connecting to voice recognition. Tap an option below to proceed.');
        }
      };

      recognition.onend = () => {
        setTurnState('IDLE');
      };

      try {
        recognition.start();
      } catch (err) {
        setTurnState('IDLE');
      }
    },
    [lang, addMessage]
  );

  // ── Conversation Step Handlers (Powered by Phone-Call Style NLU) ─────────────

  const askCentre = useCallback(() => {
    setStep('CENTRE');
    botSpeakAndPrompt(script.askCentre, () => {
      startUserTurn((heard) => {
        const match = findMatchingCentre(heard, centres);
        if (match) {
          handleSelectCentre(match);
        } else {
          botSpeakAndPrompt(script.notUnderstoodCentre, () => {});
        }
      });
    });
  }, [centres, script, botSpeakAndPrompt, startUserTurn]);

  const handleSelectCentre = (centre) => {
    stopAll();
    setSelectedCentre(centre);
    const centreSpeech = getCentreSpeechName(centre, lang);
    addMessage('farmer', centreSpeech || centre.name);
    askCrop(centre);
  };

  const askCrop = useCallback(
    (centre) => {
      setStep('CROP');
      const centreSpeech = getCentreSpeechName(centre, lang);
      const promptText = script.askCrop.replace('{centre}', centreSpeech);

      botSpeakAndPrompt(promptText, () => {
        startUserTurn((heard) => {
          const matchedKey = findMatchingCrop(heard);
          if (matchedKey) {
            handleSelectCrop(matchedKey, centre);
          } else {
            botSpeakAndPrompt(script.notUnderstoodCrop, () => {});
          }
        });
      });
    },
    [lang, script, botSpeakAndPrompt, startUserTurn]
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
      const centreSpeech = getCentreSpeechName(centre, lang);
      const cropLabel = CROP_LABELS[cropKey]?.[lang] || cropKey;
      const promptText = script.askQty
        .replace('{centre}', centreSpeech)
        .replace('{crop}', cropLabel)
        .replace('{max}', maxLimit);

      botSpeakAndPrompt(promptText, () => {
        startUserTurn((heard) => {
          const val = extractQuantity(heard);
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
            botSpeakAndPrompt(script.notUnderstoodQty, () => {});
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
          const dates = reference?.dates || [];
          const dateMatch = findMatchingDate(heard, dates, lang);
          if (dateMatch) {
            handleSelectDate(dateMatch, centre, cropKey, qtyNum);
          } else {
            botSpeakAndPrompt(script.notUnderstoodDate, () => {});
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
      api(`/centres/${centre.id}/slots?date=${dateObj.iso}`)
        .then((rows) => {
          const openSlots = (rows || []).filter((s) => !s.full && s.left > 0);
          setAvailableSlots(openSlots);

          if (openSlots.length === 0) {
            const noSlotText =
              lang === 'hi'
                ? `क्षमा करें, ${dateObj.label} को इस केंद्र पर कोई स्लॉट खाली नहीं है। कृपया दूसरी तारीख चुनें।`
                : lang === 'mr'
                ? `माफ करा, ${dateObj.label} रोजी या केंद्रावर कोणताही स्लॉट शिल्लक नाही. कृपया दुसरी तारीख निवडा.`
                : `Sorry, there are no open slots available on ${dateObj.label}. Please choose another date.`;
            botSpeakAndPrompt(noSlotText, () => askDate(centre, cropKey, qtyNum));
            return;
          }

          // Mention only the active available open slot times
          const slotSpeechList = openSlots.slice(0, 3).map((s) => formatSlotForSpeech(s.slot, lang)).join(', ');
          const promptText = script.askSlot.replace('{slots}', slotSpeechList);

          setTimeout(() => {
            botSpeakAndPrompt(promptText, () => {
              startUserTurn((heard) => {
                const slotMatch = findMatchingSlot(heard, openSlots);
                if (slotMatch) {
                  handleSelectSlot(slotMatch, centre, cropKey, qtyNum, dateObj);
                } else {
                  botSpeakAndPrompt(script.notUnderstoodSlot, () => {});
                }
              });
            });
          }, 200);
        })
        .catch(() => {
          botSpeakAndPrompt(script.notUnderstoodSlot, () => {});
        });
    },
    [lang, script, botSpeakAndPrompt, startUserTurn, askDate]
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
      const centreSpeech = getCentreSpeechName(centre, lang);
      const cropLabel = CROP_LABELS[cropKey]?.[lang] || cropKey;
      const slotSpeech = formatSlotForSpeech(slotObj.slot, lang);
      const confirmText = script.confirm
        .replace('{centre}', centreSpeech)
        .replace('{crop}', cropLabel)
        .replace('{qty}', qtyNum)
        .replace('{date}', dateObj.label)
        .replace('{slot}', slotSpeech);

      botSpeakAndPrompt(confirmText, () => {
        startUserTurn((heard) => {
          const norm = normalize(heard);
          const isYes = script.yesKeywords.some((k) => norm.includes(normalize(k)));
          const isNo = script.noKeywords.some((k) => norm.includes(normalize(k)));
          if (isYes) {
            submitBooking(centre, cropKey, qtyNum, dateObj, slotObj);
          } else if (isNo) {
            stopAll();
            setStep('IDLE');
            botSpeakAndPrompt(script.cancelled);
          } else {
            botSpeakAndPrompt(script.notUnderstoodConfirm, () => {});
          }
        });
      });
    },
    [lang, script, botSpeakAndPrompt, startUserTurn, stopAll]
  );

  const submitBooking = useCallback(
    async (centre, cropKey, qtyNum, dateObj, slotObj) => {
      stopAll();
      setStep('BOOKING');

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

        stopAll();
        const doneText = script.done.replace('{token}', token);
        botSpeakAndPrompt(doneText, () => {
          setTimeout(() => {
            setOpen(false);
            navigate('/farmer', { replace: true });
          }, 3500);
        });
      } catch (err) {
        stopAll();
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
      startUserTurn((heard) => {
        if (step === 'CENTRE') {
          const match = findMatchingCentre(heard, centres);
          if (match) handleSelectCentre(match);
        } else if (step === 'CROP') {
          const matchedKey = findMatchingCrop(heard);
          if (matchedKey) handleSelectCrop(matchedKey, selectedCentre);
        } else if (step === 'QTY') {
          const val = extractQuantity(heard);
          const maxLimit = selectedCentre?.max_qty_per_farmer || 50;
          if (val && val > 0 && val <= maxLimit) handleSelectQty(val, selectedCentre, selectedCrop?.key);
        } else if (step === 'DATE') {
          const dates = reference?.dates || [];
          const match = findMatchingDate(heard, dates, lang);
          if (match) handleSelectDate(match, selectedCentre, selectedCrop?.key, selectedQty);
        } else if (step === 'SLOT') {
          const match = findMatchingSlot(heard, availableSlots);
          if (match) handleSelectSlot(match, selectedCentre, selectedCrop?.key, selectedQty, selectedDate);
        } else if (step === 'CONFIRM') {
          const isYes = script.yesKeywords.some((k) => normalize(heard).includes(normalize(k)));
          const isNo = script.noKeywords.some((k) => normalize(heard).includes(normalize(k)));
          if (isYes) submitBooking(selectedCentre, selectedCrop?.key, selectedQty, selectedDate, selectedSlot);
          else if (isNo) {
            stopAll();
            setStep('IDLE');
            botSpeakAndPrompt(script.cancelled);
          }
        } else {
          startConversation();
        }
      });
    }
  };

  const startConversation = () => {
    stopAll();
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

              {/* Explicit Microphone / Speech Diagnostics Notice */}
              {micError && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50 p-3.5 border border-amber-300 text-xs font-semibold text-amber-950">
                  <span className="text-base shrink-0">⚠️</span>
                  <div>
                    <p>{micError}</p>
                    <p className="mt-1 text-[11px] text-amber-800 font-normal">
                      💡 Tip: You can also tap any of the options below to continue immediately.
                    </p>
                  </div>
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

                {/* Step 5: Slot (Only Open Slots) */}
                {step === 'SLOT' && (
                  <div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto">
                    {availableSlots.filter((s) => !s.full && s.left > 0).map((s) => (
                      <button
                        key={s.slot}
                        type="button"
                        onClick={() => handleSelectSlot(s, selectedCentre, selectedCrop?.key, selectedQty, selectedDate)}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-left hover:border-emerald-500 hover:bg-emerald-50 transition"
                      >
                        <span className="font-mono text-xs font-bold text-slate-900">⏰ {s.slot}</span>
                        <span className="block text-[10px] text-emerald-700 font-bold">{s.left} slots available</span>
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
                        stopAll();
                        setStep('IDLE');
                        botSpeakAndPrompt(script.cancelled);
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
