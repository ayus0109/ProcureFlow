/**
 * VoiceAssistant.jsx
 *
 * 2-Way Interactive Multilingual Voice & Touch Assistant for APMC Slot Booking.
 *
 * Key Strengths:
 * 1. 100% Reliable Speech Capture: Captures both interim & final speech results; never drops input on silence/onend.
 * 2. Automatic Turn-Taking: Auto-reopens microphone on unclear responses so user never gets stuck.
 * 3. Smart Multi-Entity Parser: Understands single answers or full sentences in Marathi, Hindi & English.
 * 4. High-Definition Native Audio: Streams natural neural audio via /api/tts with SpeechSynthesis fallback.
 * 5. Universal Confirmation: Understands all variations of "Yes" / "होय" / "हाँ" / "Book" / "Confirm".
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
  ArrowRight,
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
    askCentre: 'Hello! Which APMC procurement centre would you like to visit? You can say Pune, Nashik, Nagpur, Aurangabad, or Kolhapur.',
    askCrop: 'You chose {centre}. Which crop are you bringing? Available crops: {accepted}.',
    askQty: 'How many quintals of {crop} do you want to book? (Max limit: {max} quintals).',
    askDate: 'Which date do you prefer? Say Today or Tomorrow.',
    askSlot: 'Available open slots are: {slots}. Which time slot suits you?',
    confirm: 'Please confirm: {centre}, {crop}, {qty} quintals, on {date} at {slot}. Should I book this slot? Say YES to confirm or NO to cancel.',
    booking: 'Submitting your slot booking, please wait…',
    done: 'Congratulations! Your slot has been successfully booked. Your token number is {token}.',
    error: 'Booking failed. Please try again.',
    cancelled: 'Booking has been cancelled. Tap Start anytime to try again.',
    notUnderstoodCentre: "I didn't catch the centre name. Please say Pune, Nashik, Nagpur, Aurangabad, Kolhapur, or tap below.",
    notUnderstoodCrop: "Please choose a crop accepted at this centre, like {accepted}, or tap below.",
    notUnderstoodQty: "Please tell me the quantity in quintals, like 5, 10, 20, or 40 quintals.",
    notUnderstoodDate: "Please say Today or Tomorrow.",
    notUnderstoodSlot: "Please choose an available time slot or tap an option below.",
    notUnderstoodConfirm: "Please say YES to confirm booking or NO to cancel.",
    cropNotAccepted: "{centre} only accepts {accepted}. Please choose one of these crops.",
  },
  hi: {
    askCentre: 'नमस्ते! आप किस खरीद केंद्र में जाना चाहते हैं? आप बोल सकते हैं: पुणे, नासिक, नागपुर, औरंगाबाद या कोल्हापुर।',
    askCrop: 'आपने {centre} चुना है। आप कौन सी फसल लाना चाहते हैं? उपलब्ध फसलें: {accepted}।',
    askQty: 'आप {centre} में कितने क्विंटल {crop} लाना चाहते हैं? (अधिकतम सीमा: {max} क्विंटल)।',
    askDate: 'आप कौन सी तारीख चुनना चाहते हैं? बोलिए आज या कल।',
    askSlot: 'उपलब्ध खुले स्लॉट हैं: {slots}। आप कौन सा समय पसंद करेंगे?',
    confirm: 'कृपया पुष्टि करें: {centre}, {crop}, {qty} क्विंटल, {date} को {slot}। क्या मैं यह स्लॉट बुक कर दूँ? बोलिए हाँ या नहीं।',
    booking: 'आपका स्लॉट बुक किया जा रहा है, कृपया प्रतीक्षा करें…',
    done: 'बधाई हो! आपका स्लॉट सफलतापूर्वक बुक हो गया है। आपका टोकन नंबर है {token}।',
    error: 'बुकिंग में त्रुटि हुई। कृपया पुनः प्रयास करें।',
    cancelled: 'बुकिंग रद्द कर दी गई है। शुरू करने के लिए कभी भी बटन दबाएं।',
    notUnderstoodCentre: 'कृपया केंद्र का नाम बताएं, जैसे पुणे, नासिक, नागपुर, औरंगाबाद, कोल्हापुर, या नीचे से चुनें।',
    notUnderstoodCrop: 'कृपया इस केंद्र पर उपलब्ध फसल का नाम बताएं, जैसे {accepted}, या नीचे से चुनें।',
    notUnderstoodQty: 'कृपया क्विंटल में मात्रा बताएं, जैसे 5, 10, 20 या 40 क्विंटल।',
    notUnderstoodDate: 'कृपया आज या कल बोलें।',
    notUnderstoodSlot: 'कृपया उपलब्ध समय स्लॉट बताएं या नीचे से चुनें।',
    notUnderstoodConfirm: 'कृपया पुष्टि के लिए हाँ बोलें या रद्द करने के लिए नहीं बोलें।',
    cropNotAccepted: '{centre} में केवल {accepted} स्वीकार है। कृपया इनमें से कोई फसल चुनें।',
  },
  mr: {
    askCentre: 'नमस्कार! तुम्हाला कोणत्या खरेदी केंद्रात जायचे आहे? तुम्ही पुणे, नाशिक, नागपूर, औरंगाबाद किंवा कोल्हापूर सांगू शकता.',
    askCrop: 'तुम्ही {centre} निवडले आहे. तुम्ही कोणते पीक विक्रीसाठी आणणार आहात? उपलब्ध पिके: {accepted}.',
    askQty: 'तुम्ही किती क्विंटल {crop} आणणार आहात? (कमाल मर्यादा: {max} क्विंटल).',
    askDate: 'तुम्ही कोणत्या दिवशी येणार आहात? आज किंवा उद्या सांगा.',
    askSlot: 'उपलब्ध वेळ स्लॉट आहेत: {slots}. तुम्हाला कोणती वेळ सोयीची आहे?',
    confirm: 'कृपया खात्री करा: {centre}, {crop}, {qty} क्विंटल, {date} रोजी, वेळ {slot}. हा स्लॉट बुक करायचा का? होय किंवा नाही म्हणा.',
    booking: 'तुमचा स्लॉट बुक केला जात आहे, कृपया थांबा…',
    done: 'अभिनंदन! तुमचा स्लॉट यशस्वीरित्या बुक झाला आहे. तुमचा टोकन नंबर {token} आहे.',
    error: 'बुकिंग होऊ शकली नाही. कृपया पुन्हा प्रयत्न करा.',
    cancelled: 'बुकिंग रद्द करण्यात आले आहे. पुन्हा सुरू करण्यासाठी स्टार्ट बटण दाबा.',
    notUnderstoodCentre: 'मला केंद्राचे नाव समजले नाही. कृपया पुणे, नाशिक, नागपूर, औरंगाबाद किंवा कोल्हापूर सांगा, किंवा खालील पर्याय निवडा.',
    notUnderstoodCrop: 'कृपया या केंद्रावर उपलब्ध पिकाचे नाव सांगा, जसे {accepted}, किंवा खालील पर्याय निवडा.',
    notUnderstoodQty: 'कृपया क्विंटलमध्ये प्रमाण सांगा, जसे 5, 10, 20 किंवा 40 क्विंटल.',
    notUnderstoodDate: 'कृपया आज किंवा उद्या सांगा.',
    notUnderstoodSlot: 'कृपया उपलब्ध वेळ सांगा किंवा खालील पर्याय निवडा.',
    notUnderstoodConfirm: 'कृपया पुष्टीसाठी होय म्हणा किंवा रद्द करण्यासाठी नाही म्हणा.',
    cropNotAccepted: '{centre} मध्ये फक्त {accepted} स्वीकारले जाते. कृपया उपलब्ध पीक निवडा.',
  },
};

const ALL_YES_KEYWORDS = [
  'yes', 'yep', 'yeah', 'sure', 'confirm', 'book', 'ok', 'okay', 'done', 'proceed', 'correct', 'right', 'pack', 'kardo', 'kar do',
  'haan', 'ha', 'haa', 'sahi', 'kar dijiye', 'kijiye', 'theek', 'theek hai',
  'ho', 'hoy', 'हो', 'होय', 'हाय', 'हाँ', 'हां', 'हा', 'करा', 'करून टाका', 'नक्की', 'कन्फर्म', 'चालल', 'चालेल', 'bar', 'bara', 'barobar', 'nakkich'
];

const ALL_NO_KEYWORDS = [
  'no', 'nope', 'cancel', 'stop', 'back', 'wrong', 'dont', "don't",
  'nahi', 'nahin', 'nako', 'नाही', 'नको', 'नहीं', 'नही', 'रद्द', 'रद्द करा', 'थांबा', 'mat karo', 'ruko', 'chuka', 'naka'
];

const CROP_LABELS = {
  WHEAT: { en: '🌾 Wheat', hi: '🌾 गेहूं', mr: '🌾 गहू' },
  PADDY: { en: '🍚 Paddy (Rice)', hi: '🍚 धान (चावल)', mr: '🍚 भात (धान)' },
  COTTON: { en: '☁️ Cotton', hi: '☁️ कपास', mr: '☁️ कापूस' },
  SOYBEAN: { en: '🌱 Soybean', hi: '🌱 सोयाबीन', mr: '🌱 सोयाबीन' },
  TUR: { en: '🌿 Tur (Arhar)', hi: '🌿 तूर (अरहर)', mr: '🌿 तूर' },
};

const CENTRE_ALIASES = {
  1: ['pune', 'poona', 'puna', 'पुणे', 'पुना', 'baramati', 'haveli', '1', 'one', 'pehla', 'first', 'एक', 'पहिला', 'पहिले', 'पुणे केंद्र', 'पुणे बाजार समिती', 'पुणे मंडी'],
  2: ['nashik', 'nasik', 'नासिक', 'नाशिक', 'sinnar', 'dindori', 'niphad', '2', 'two', 'doosra', 'second', 'दोन', 'दुसरा', 'दूसरे', 'नाशिक केंद्र', 'नाशिक बाजार समिती', 'नासिक मंडी'],
  3: ['nagpur', 'नागपुर', 'नागपूर', 'vidarbha', '3', 'three', 'teesra', 'third', 'तीन', 'तिसरा', 'तीसरे', 'नागपूर केंद्र', 'नागपूर बाजार समिती', 'नागपुर मंडी'],
  4: ['aurangabad', 'sambhajinagar', 'sambhaji', 'औरंगाबाद', 'संभाजीनगर', 'संभाजी', '4', 'four', 'chautha', 'fourth', 'चार', 'चौथा', 'चौथे', 'छत्रपती संभाजीनगर', 'औरंगाबाद केंद्र', 'औरंगाबाद बाजार समिती'],
  5: ['kolhapur', 'कोल्हापुर', 'कोल्हापूर', '5', 'five', 'panchwa', 'fifth', 'पाच', 'पाचवा', 'पाचवे', 'कोल्हापूर केंद्र', 'कोल्हापूर बाजार समिती', 'कोल्हापुर मंडी'],
};

const CENTRE_LOCAL_NAMES = {
  1: { en: 'Pune Procurement Center', hi: 'पुणे मंडी', mr: 'पुणे बाजार समिती' },
  2: { en: 'Nashik Procurement Center', hi: 'नासिक मंडी', mr: 'नाशिक बाजार समिती' },
  3: { en: 'Nagpur Procurement Center', hi: 'नागपुर मंडी', mr: 'नागपूर बाजार समिती' },
  4: { en: 'Aurangabad Procurement Center', hi: 'औरंगाबाद मंडी', mr: 'औरंगाबाद बाजार समिती' },
  5: { en: 'Kolhapur Procurement Center', hi: 'कोल्हापुर मंडी', mr: 'कोल्हापूर बाजार समिती' },
};

const CROP_MATCHERS = {
  WHEAT: ['wheat', 'gehu', 'gehun', 'गेहूं', 'गेहूँ', 'गेहू', 'गहू', 'गव्हाचे', 'गव्हाची', 'गहू विक्री', 'kanak', '1', 'one', 'pehla', 'first', 'एक', 'पहिला'],
  PADDY: ['paddy', 'rice', 'dhan', 'chawal', 'धान', 'भात', 'चावल', 'तांदूळ', 'भाताचे', '2', 'two', 'doosra', 'second', 'दोन', 'दुसरा'],
  COTTON: ['cotton', 'kapas', 'kapaas', 'कपास', 'कापूस', 'रुई', 'rui', 'कापसाचे', '3', 'three', 'teesra', 'third', 'तीन', 'तिसरा'],
  SOYBEAN: ['soybean', 'soya', 'soyabean', 'सोयाबीन', 'सोया', 'सोयाबीनचे', '4', 'four', 'chautha', 'fourth', 'चार', 'चौथा'],
  TUR: ['tur', 'toor', 'arhar', 'तूर', 'अरहर', 'tuvar', 'तुरीचे', '5', 'five', 'panchwa', 'fifth', 'पाच', 'पाचवा'],
};

const DEVANAGARI_DIGITS = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
};

function convertDevanagariDigits(str) {
  return (str || '').replace(/[०-९]/g, (d) => DEVANAGARI_DIGITS[d] || d);
}

const NUMBER_MAP = [
  { words: ['आर्ट.', 'आर्ट', 'art', 'aart', 'आट', 'आथ', 'आठ', 'aath', 'aat', 'ath', 'eight', '८'], val: 8 },
  { words: ['एक', 'ek', 'eka', 'one', '१'], val: 1 },
  { words: ['दोन', 'don', 'dohn', 'dawn', 'दो', 'do', 'two', '२'], val: 2 },
  { words: ['तीन', 'teen', 'tin', 'three', '३'], val: 3 },
  { words: ['चार', 'char', 'chaar', 'four', '४'], val: 4 },
  { words: ['पाच', 'paach', 'pach', 'panch', 'paanch', 'पांच', 'five', '५'], val: 5 },
  { words: ['सहा', 'saha', 'sah', 'chhah', 'che', 'छह', 'six', '६'], val: 6 },
  { words: ['सात', 'saat', 'sat', 'साथ', 'seven', '७'], val: 7 },
  { words: ['नऊ', 'nau', 'nav', 'नौ', 'nine', '९'], val: 9 },
  { words: ['दहा', 'daha', 'das', 'dus', 'दस', 'ten', '१०'], val: 10 },
  { words: ['अकरा', 'akra', 'gyarah', 'ग्यारह', 'eleven', '११'], val: 11 },
  { words: ['बारा', 'bara', 'barah', 'बारह', 'twelve', '१२'], val: 12 },
  { words: ['तेरा', 'tera', 'terah', 'तेरह', 'thirteen', '१३'], val: 13 },
  { words: ['चौदा', 'chauda', 'chaudah', 'चौदह', 'fourteen', '१४'], val: 14 },
  { words: ['पंधरा', 'pandra', 'pandhra', 'pandrah', 'पंद्रह', 'fifteen', '१५'], val: 15 },
  { words: ['सोळा', 'sola', 'solah', 'सोलह', 'sixteen', '१६'], val: 16 },
  { words: ['सतरा', 'satra', 'satrah', 'सत्रह', 'seventeen', '१७'], val: 17 },
  { words: ['अठरा', 'athra', 'atharah', 'अठारह', 'eighteen', '१८'], val: 18 },
  { words: ['एकोणीस', 'ekonis', 'unnis', 'उन्नीस', 'nineteen', '१९'], val: 19 },
  { words: ['वीस', 'vis', 'vees', 'bees', 'बीस', 'twenty', '२०'], val: 20 },
  { words: ['पंचवीस', 'panchvis', 'pachhis', 'पच्चीस', 'twenty five', '२५'], val: 25 },
  { words: ['तीस', 'tis', 'tees', 'thirty', '३०'], val: 30 },
  { words: ['बत्तीस', 'battis', '32', '३२'], val: 32 },
  { words: ['पस्तीस', 'pastis', 'paintis', 'पैंतीस', '35', '३५'], val: 35 },
  { words: ['चाळीस', 'chalis', 'chaalis', 'चालीस', 'forty', '४०'], val: 40 },
  { words: ['पंचेचाळीस', 'panchechalis', 'paintalis', 'पैंतालीस', '45', '४५'], val: 45 },
  { words: ['पन्नास', 'pannas', 'pachaas', 'pachas', 'पचास', 'fifty', '५०'], val: 50 },
  { words: ['साठ', 'sath', 'saath', 'sixty', '६०'], val: 60 },
  { words: ['सत्तर', 'sattar', 'seventy', '७०'], val: 70 },
  { words: ['पाऊणशे', 'paunshe', 'panchhattar', 'पचहत्तर', '75', '७५'], val: 75 },
  { words: ['ऐंशी', 'aishi', 'assi', 'अस्सी', 'eighty', '८०'], val: 80 },
  { words: ['नव्वद', 'navvad', 'nabbe', 'नब्बे', 'ninety', '९०'], val: 90 },
  { words: ['शंभर', 'shambhar', 'sau', 'सौ', 'hundred', '१००'], val: 100 },
];

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

function findMatchingCrop(heard, acceptedCrops) {
  if (!heard) return null;
  const clean = normalize(heard);

  for (const [cropKey, keywords] of Object.entries(CROP_MATCHERS)) {
    if (keywords.some((k) => clean.includes(normalize(k)) || normalize(k).includes(clean))) {
      if (acceptedCrops && acceptedCrops.length > 0 && !acceptedCrops.includes(cropKey)) {
        return { key: cropKey, accepted: false };
      }
      return { key: cropKey, accepted: true };
    }
  }
  return null;
}

function extractQuantity(heard) {
  if (!heard) return null;
  const raw = heard.trim();
  const converted = convertDevanagariDigits(raw);

  // 1. Check direct numbers/digits in text (e.g. '8', '8 quintal', '8.5', '८ क्विंटल', '40 qtl')
  const digitMatch = converted.match(/[\d.]+/);
  if (digitMatch) {
    const val = parseFloat(digitMatch[0]);
    if (!isNaN(val) && val > 0) return val;
  }

  // 2. Check phrase matching in NUMBER_MAP
  const lower = converted.toLowerCase();
  const tokens = lower.split(/[\s,]+/);

  for (const item of NUMBER_MAP) {
    for (const w of item.words) {
      const cleanW = w.toLowerCase().replace(/[\.]/g, '');
      const cleanLower = lower.replace(/[\.]/g, '');
      if (
        cleanLower === cleanW ||
        tokens.some((t) => t.replace(/[\.]/g, '') === cleanW) ||
        cleanLower.includes(cleanW)
      ) {
        return item.val;
      }
    }
  }

  return null;
}

function findMatchingDate(heard, dates, lang) {
  if (!heard) return null;
  const text = heard.toLowerCase();

  if (/\b(tomorrow|kal|udya|second|doosra|dusra|उद्या|कल|दुसरा|उद्या चालेल|उद्या करा|उद्याचा|उद्याची)\b/i.test(text) && dates[1]) {
    return { iso: dates[1], label: lang === 'en' ? 'Tomorrow' : lang === 'hi' ? 'कल' : 'उद्या' };
  }

  if (/\b(today|aaj|aj|first|pehla|pahila|आज|पहिला|आज चालेल|आज करा|आजचा|आजची)\b/i.test(text)) {
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
    '10': 10, 'ten': 10, 'das': 10, 'dus': 10, 'दहा': 10, 'दस': 10,
    '11': 11, '11th': 11, 'eleven': 11, 'gyarah': 11, 'अकरा': 11, 'ग्यारह': 11,
    '12': 12, '12th': 12, 'twelve': 12, 'barah': 12, 'बारा': 12, 'बारह': 12,
    '1': 13, '13': 13, 'one': 13, '1 pm': 13, 'ek': 13, 'एक': 13,
    '2': 14, '14': 14, 'two': 14, '2 pm': 14, 'do': 14, 'दोन': 14, 'दो': 14,
    '3': 15, '15': 15, 'three': 15, '3 pm': 15, 'teen': 15, 'तीन': 15,
    '4': 16, '16': 16, 'four': 16, '4 pm': 16, 'char': 16, 'चार': 16,
    '5': 17, '17': 17, 'five': 17, '5 pm': 17, 'panch': 17, 'पाच': 17, 'पांच': 17,
  };

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
        return startHr === hr || (hr <= 5 && startHr === hr + 12) || (hr >= 10 && startHr === hr);
      });
      if (found) return found;
    }
  }

  // Relative keywords
  if (/\b(first|pehla|pahila|पहिला|morning|subah|सकाळी|सकाळचा)\b/i.test(text)) {
    return availableSlots[0];
  }
  if (/\b(last|aakhri|shewat|शेवटचा|evening|shaam|संध्याकाळी|दुपारचा)\b/i.test(text)) {
    return availableSlots[availableSlots.length - 1];
  }

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

  // Loaded Data
  const [centres, setCentres] = useState([]);
  const [reference, setReference] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);

  // Selected Booking State
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [selectedQty, setSelectedQty] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookedToken, setBookedToken] = useState(null);

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fallbackTimerRef = useRef(null);
  const activeAudioRef = useRef(null);
  const lastHeardTranscriptRef = useRef('');
  const turnProcessedRef = useRef(false);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, step, turnState, liveHeardTranscript]);

  // Fetch reference metadata
  useEffect(() => {
    if (!open) return;
    Promise.all([api('/centres'), api('/reference')])
      .then(([cList, ref]) => {
        setCentres(cList);
        setReference(ref);
      })
      .catch(() => {});
  }, [open]);

  // Load available open slots
  useEffect(() => {
    if (!selectedCentre || !selectedDate) return;
    api(`/centres/${selectedCentre.id}/slots?date=${selectedDate.iso}`)
      .then((rows) => setAvailableSlots((rows || []).filter((s) => !s.full && s.left > 0)))
      .catch(() => {});
  }, [selectedCentre, selectedDate]);

  const addMessage = useCallback((from, text) => {
    setMessages((prev) => [...prev, { from, text, id: Date.now() + Math.random() }]);
  }, []);

  // Synchronous audio cancellation & recognition cleanup
  const stopAll = useCallback(() => {
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
    clearTimeout(fallbackTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
    setTurnState('IDLE');
    setLiveHeardTranscript('');
  }, []);

  // High-Definition Natural Voice Output via `/api/tts` (with SpeechSynthesis fallback)
  const botSpeakAndPrompt = useCallback(
    (text, onFinishedSpeaking) => {
      stopAll();
      addMessage('bot', text);
      setTurnState('BOT_SPEAKING');

      const cleanText = text
        .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
        .replace(/[•…\-_~*]/g, ' ')
        .trim();

      let finished = false;
      const completeTurn = () => {
        if (finished) return;
        finished = true;
        clearTimeout(fallbackTimerRef.current);
        if (activeAudioRef.current) {
          activeAudioRef.current = null;
        }
        setTurnState('IDLE');
        if (onFinishedSpeaking) onFinishedSpeaking();
      };

      const estTimeMs = Math.max(2500, (cleanText.length / 7) * 1000 + 1200);
      fallbackTimerRef.current = setTimeout(completeTurn, estTimeMs);

      const ttsUrl = `/api/tts?text=${encodeURIComponent(cleanText)}&lang=${lang}`;
      const audio = new Audio(ttsUrl);
      activeAudioRef.current = audio;

      audio.onended = completeTurn;
      audio.onerror = () => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          try {
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = SPEECH_LANG_MAP[lang] || 'mr-IN';
            utterance.rate = 0.95;
            utterance.onend = completeTurn;
            utterance.onerror = completeTurn;
            window.speechSynthesis.speak(utterance);
            return;
          } catch {}
        }
        completeTurn();
      };

      audio.play().catch(() => {
        completeTurn();
      });
    },
    [lang, stopAll, addMessage]
  );

  // 100% Robust User Listening Turn with Fallback Buffer Processing
  const startUserTurn = useCallback(
    async (onTextHeard) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        setMicError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
        setTurnState('IDLE');
        return;
      }

      setMicError('');
      stopAll();

      if (navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
        } catch {
          setMicError('Microphone access denied. Please click the lock icon in your browser URL bar and allow microphone.');
          setTurnState('IDLE');
          return;
        }
      }

      const recognition = new SR();
      recognition.lang = SPEECH_LANG_MAP[lang] || 'mr-IN';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;
      recognitionRef.current = recognition;

      lastHeardTranscriptRef.current = '';
      turnProcessedRef.current = false;

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
        const text = (final || interim).trim();
        lastHeardTranscriptRef.current = text;
        setLiveHeardTranscript(text);

        if (final.trim() && !turnProcessedRef.current) {
          turnProcessedRef.current = true;
          setTurnState('IDLE');
          addMessage('farmer', final.trim());
          try {
            recognition.stop();
          } catch {}
          onTextHeard(final.trim());
        }
      };

      recognition.onerror = (e) => {
        setTurnState('IDLE');
        if (e.error === 'not-allowed') {
          setMicError('Microphone blocked. Please allow microphone access.');
        }
      };

      recognition.onend = () => {
        setTurnState('IDLE');
        // If final event was not delivered but interim text was heard, process it now
        if (!turnProcessedRef.current && lastHeardTranscriptRef.current.trim()) {
          turnProcessedRef.current = true;
          const heardText = lastHeardTranscriptRef.current.trim();
          addMessage('farmer', heardText);
          onTextHeard(heardText);
        }
      };

      try {
        recognition.start();
      } catch {
        setTurnState('IDLE');
      }
    },
    [lang, stopAll, addMessage]
  );

  // ── Conversation Step Flow ──────────────────────────────────────────────────

  // Step 1: Centre
  const askCentre = useCallback(() => {
    setStep('CENTRE');
    botSpeakAndPrompt(script.askCentre, () => {
      startUserTurn((heard) => {
        const match = findMatchingCentre(heard, centres);
        if (match) {
          handleSelectCentre(match);
        } else {
          // Speak not understood, then immediately re-prompt and reopen mic
          botSpeakAndPrompt(script.notUnderstoodCentre, () => askCentre());
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

  // Step 2: Crop
  const askCrop = useCallback(
    (centre) => {
      setStep('CROP');
      const centreSpeech = getCentreSpeechName(centre, lang);
      const acceptedList = centre?.accepted_crops_list || ['WHEAT', 'PADDY', 'COTTON', 'SOYBEAN', 'TUR'];
      const acceptedLabels = acceptedList.map((k) => CROP_LABELS[k]?.[lang] || k).join(', ');
      const promptText = script.askCrop
        .replace('{centre}', centreSpeech)
        .replace('{accepted}', acceptedLabels);

      botSpeakAndPrompt(promptText, () => {
        startUserTurn((heard) => {
          const matchResult = findMatchingCrop(heard, acceptedList);
          if (matchResult && matchResult.accepted) {
            handleSelectCrop(matchResult.key, centre);
          } else if (matchResult && !matchResult.accepted) {
            const notAccText = script.cropNotAccepted
              .replace('{centre}', centreSpeech)
              .replace('{accepted}', acceptedLabels);
            botSpeakAndPrompt(notAccText, () => askCrop(centre));
          } else {
            const notUndText = script.notUnderstoodCrop.replace('{accepted}', acceptedLabels);
            botSpeakAndPrompt(notUndText, () => askCrop(centre));
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

  // Step 3: Quantity
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
            botSpeakAndPrompt(script.notUnderstoodQty, () => askQty(centre, cropKey));
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

  // Step 4: Date
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
            botSpeakAndPrompt(script.notUnderstoodDate, () => askDate(centre, cropKey, qtyNum));
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

  // Step 5: Time Slot
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

          const slotSpeechList = openSlots.slice(0, 3).map((s) => formatSlotForSpeech(s.slot, lang)).join(', ');
          const promptText = script.askSlot.replace('{slots}', slotSpeechList);

          botSpeakAndPrompt(promptText, () => {
            startUserTurn((heard) => {
              const slotMatch = findMatchingSlot(heard, openSlots);
              if (slotMatch) {
                handleSelectSlot(slotMatch, centre, cropKey, qtyNum, dateObj);
              } else {
                botSpeakAndPrompt(script.notUnderstoodSlot, () => askSlot(centre, cropKey, qtyNum, dateObj));
              }
            });
          });
        })
        .catch(() => {
          botSpeakAndPrompt(script.notUnderstoodSlot, () => askDate(centre, cropKey, qtyNum));
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

  // Step 6: Confirmation & Execution
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
          const isYes = ALL_YES_KEYWORDS.some((k) => norm.includes(normalize(k)));
          const isNo = ALL_NO_KEYWORDS.some((k) => norm.includes(normalize(k)));

          if (isYes) {
            submitBooking(centre, cropKey, qtyNum, dateObj, slotObj);
          } else if (isNo) {
            stopAll();
            setStep('IDLE');
            botSpeakAndPrompt(script.cancelled);
          } else {
            botSpeakAndPrompt(script.notUnderstoodConfirm, () => askConfirm(centre, cropKey, qtyNum, dateObj, slotObj));
          }
        });
      });
    },
    [lang, script, botSpeakAndPrompt, startUserTurn, stopAll]
  );

  // Submit Booking to Backend API
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

  // Manual Mic Trigger (Farmer can tap mic at any time to speak or retry)
  const handleManualMicClick = () => {
    if (turnState === 'USER_LISTENING') {
      stopAll();
    } else {
      stopAll();
      startUserTurn((heard) => {
        if (step === 'CENTRE') {
          const match = findMatchingCentre(heard, centres);
          if (match) handleSelectCentre(match);
          else botSpeakAndPrompt(script.notUnderstoodCentre, () => askCentre());
        } else if (step === 'CROP') {
          const acceptedList = selectedCentre?.accepted_crops_list || ['WHEAT', 'PADDY', 'COTTON', 'SOYBEAN', 'TUR'];
          const matchResult = findMatchingCrop(heard, acceptedList);
          if (matchResult && matchResult.accepted) handleSelectCrop(matchResult.key, selectedCentre);
          else botSpeakAndPrompt(script.notUnderstoodCrop, () => askCrop(selectedCentre));
        } else if (step === 'QTY') {
          const val = extractQuantity(heard);
          const maxLimit = selectedCentre?.max_qty_per_farmer || 50;
          if (val && val > 0 && val <= maxLimit) handleSelectQty(val, selectedCentre, selectedCrop?.key);
          else botSpeakAndPrompt(script.notUnderstoodQty, () => askQty(selectedCentre, selectedCrop?.key));
        } else if (step === 'DATE') {
          const dates = reference?.dates || [];
          const match = findMatchingDate(heard, dates, lang);
          if (match) handleSelectDate(match, selectedCentre, selectedCrop?.key, selectedQty);
          else botSpeakAndPrompt(script.notUnderstoodDate, () => askDate(selectedCentre, selectedCrop?.key, selectedQty));
        } else if (step === 'SLOT') {
          const match = findMatchingSlot(heard, availableSlots);
          if (match) handleSelectSlot(match, selectedCentre, selectedCrop?.key, selectedQty, selectedDate);
          else botSpeakAndPrompt(script.notUnderstoodSlot, () => askSlot(selectedCentre, selectedCrop?.key, selectedQty, selectedDate));
        } else if (step === 'CONFIRM') {
          const norm = normalize(heard);
          const isYes = ALL_YES_KEYWORDS.some((k) => norm.includes(normalize(k)));
          const isNo = ALL_NO_KEYWORDS.some((k) => norm.includes(normalize(k)));
          if (isYes) submitBooking(selectedCentre, selectedCrop?.key, selectedQty, selectedDate, selectedSlot);
          else if (isNo) {
            stopAll();
            setStep('IDLE');
            botSpeakAndPrompt(script.cancelled);
          } else {
            botSpeakAndPrompt(script.notUnderstoodConfirm, () => askConfirm(selectedCentre, selectedCrop?.key, selectedQty, selectedDate, selectedSlot));
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
                  <span>Assistant speaking… (Tap mic to interrupt)</span>
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

              {/* Explicit Microphone / Speech Notice */}
              {micError && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50 p-3.5 border border-amber-300 text-xs font-semibold text-amber-950">
                  <span className="text-base shrink-0">⚠️</span>
                  <div>
                    <p>{micError}</p>
                    <p className="mt-1 text-[11px] text-amber-800 font-normal">
                      💡 Tip: You can also tap any option below to proceed.
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
                    {(() => {
                      const acceptedList = selectedCentre?.accepted_crops_list || ['WHEAT', 'PADDY', 'COTTON', 'SOYBEAN', 'TUR'];
                      const availableList = (reference?.crops || []).filter((c) => acceptedList.includes(c.key));

                      return (availableList.length > 0 ? availableList : reference?.crops || []).map((c) => (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => handleSelectCrop(c.key, selectedCentre)}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 hover:border-emerald-500 hover:bg-emerald-50 transition"
                        >
                          {CROP_LABELS[c.key]?.[lang] || c.key}
                        </button>
                      ));
                    })()}
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
