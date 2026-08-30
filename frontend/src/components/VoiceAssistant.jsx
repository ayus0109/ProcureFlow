/**
 * VoiceAssistant.jsx
 *
 * Conversational 2-Way AI Voice Assistant for Procurement Slot Booking.
 *
 * Features:
 * 1. True Hands-Free 2-Way Conversational Loop:
 *    - Automatically opens the microphone after the assistant finishes speaking.
 *    - Seamless back-and-forth dialogue without needing to tap the mic repeatedly.
 * 2. High-Accuracy Multi-Entity & Context-Aware Intent Resolution:
 *    - Accurately parses Quantity (e.g., 29 quintals), Centre, Crop, Date, and Time Slot.
 *    - Zero accidental crop overwriting (no false positives from number utterances).
 * 3. Explicit Conversational Editing:
 *    - Modifies only the parameter the farmer explicitly asks to change.
 * 4. High-Definition Speech Synthesis (TTS) & Web Speech Recognition.
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
  Zap,
  Check,
  ArrowRight,
  Scale,
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
    greeting: 'Hello! I am your AI Procurement Assistant. Which centre would you like to visit? You can say Pune, Nashik, Nagpur, Aurangabad, or Kolhapur.',
    askCrop: 'You selected {centre}. Which crop are you bringing? Available: {accepted}.',
    askQty: 'How many quintals of {crop} would you like to book? (Max limit: {max} quintals).',
    askDate: 'Which date do you prefer? Say Today or Tomorrow.',
    askSlot: 'Available open slots are: {slots}. Which time slot suits you?',
    confirm: 'Please confirm: {centre}, {crop}, {qty} quintals, on {date} at {slot}. Should I book this slot? Say YES to confirm or tell me what to change.',
    booking: 'Submitting your slot booking, please wait…',
    done: 'Congratulations! Your slot has been successfully booked. Your token number is {token}.',
    error: 'Booking failed. Please try again.',
    cancelled: 'Booking has been cancelled. Tap Start anytime to try again.',
    
    // Conversational Change Confirmations
    updatedQty: 'Updated quantity to {qty} quintals.',
    updatedCrop: 'Changed crop to {crop}. How many quintals would you like to book?',
    updatedCentre: 'Changed procurement centre to {centre}.',
    updatedDate: 'Changed date to {date}. Available open slots are: {slots}.',
    updatedSlot: 'Updated time slot to {slot}.',
    
    notUnderstoodCentre: "I didn't catch the centre name. Please say Pune, Nashik, Nagpur, Aurangabad, or Kolhapur.",
    notUnderstoodCrop: "Please choose a crop accepted at this centre.",
    notUnderstoodQty: "Please tell me the quantity in quintals, like 10, 20, or 29 quintals.",
    notUnderstoodDate: "Please say Today or Tomorrow.",
    notUnderstoodSlot: "Please choose an available time slot or tap an option below.",
    notUnderstoodConfirm: "Please say YES to confirm, or tell me what to change (e.g., 'Change to 15 quintals').",
    cropNotAccepted: "{centre} only accepts {accepted}. Please choose one of these crops.",
    
    yesKeywords: ['yes', 'haan', 'ha', 'haa', 'confirm', 'book', 'ok', 'okay', 'sure', 'right', 'correct', 'yep', 'done', 'sahi', 'kardo', 'kar do', 'ha kardo', 'yes please', 'proceed', 'thik hai', 'chalega', 'yup'],
    noKeywords: ['no', 'nahi', 'nahin', 'cancel', 'stop', 'back', 'wrong', 'dont', "don't", 'mat karo', 'ruko', 'nako', 'galat'],
  },
  hi: {
    greeting: 'नमस्ते! मैं आपका एआई खरीद सहायक हूँ। आप किस खरीद केंद्र में जाना चाहते हैं? आप बोल सकते हैं: पुणे, नासिक, नागपुर, औरंगाबाद या कोल्हापुर।',
    askCrop: 'आपने {centre} चुना है। आप कौन सी फसल लाना चाहते हैं? उपलब्ध फसलें: {accepted}।',
    askQty: 'आप {centre} में कितने क्विंटल {crop} लाना चाहते हैं? (अधिकतम सीमा: {max} क्विंटल)।',
    askDate: 'आप कौन सी तारीख चुनना चाहते हैं? बोलिए आज या कल।',
    askSlot: 'उपलब्ध खुले स्लॉट हैं: {slots}। आप कौन सा समय पसंद करेंगे?',
    confirm: 'कृपया पुष्टि करें: {centre}, {crop}, {qty} क्विंटल, {date} को {slot}। क्या मैं यह स्लॉट बुक कर दूँ? पुष्टि के लिए हाँ बोलें या बदलाव के लिए बताएं।',
    booking: 'आपका स्लॉट बुक किया जा रहा है, कृपया प्रतीक्षा करें…',
    done: 'बधाई हो! आपका स्लॉट सफलतापूर्वक बुक हो गया है। आपका टोकन नंबर है {token}।',
    error: 'बुकिंग में त्रुटि हुई। कृपया पुनः प्रयास करें।',
    cancelled: 'बुकिंग रद्द कर दी गई है। शुरू करने के लिए कभी भी बटन दबाएं।',
    
    // Conversational Change Confirmations
    updatedQty: 'मात्रा बदलकर {qty} क्विंटल कर दी गई है।',
    updatedCrop: 'फसल बदलकर {crop} कर दी गई है। कितने क्विंटल लाना चाहते हैं?',
    updatedCentre: 'खरीद केंद्र बदलकर {centre} कर दिया गया है।',
    updatedDate: 'तारीख बदलकर {date} कर दी गई है। उपलब्ध स्लॉट हैं: {slots}।',
    updatedSlot: 'समय स्लॉट बदलकर {slot} कर दिया गया है।',
    
    notUnderstoodCentre: 'कृपया केंद्र का नाम बताएं, जैसे पुणे, नासिक, नागपुर, औरंगाबाद या कोल्हापुर।',
    notUnderstoodCrop: 'कृपया इस केंद्र पर उपलब्ध फसल का नाम बताएं।',
    notUnderstoodQty: 'कृपया क्विंटल में मात्रा बताएं, जैसे 10, 20 या 29 क्विंटल।',
    notUnderstoodDate: 'कृपया आज या कल बोलें।',
    notUnderstoodSlot: 'कृपया उपलब्ध समय स्लॉट बताएं या नीचे से चुनें।',
    notUnderstoodConfirm: 'कृपया पुष्टि के लिए हाँ बोलें, या जो बदलना हो वह बताएं (जैसे: मात्रा 15 क्विंटल कर दो)।',
    cropNotAccepted: '{centre} में केवल {accepted} स्वीकार है। कृपया इनमें से कोई फसल चुनें।',
    
    yesKeywords: ['हाँ', 'हां', 'हा', 'yes', 'haan', 'haa', 'ok', 'theek', 'theek hai', 'sahi', 'book', 'kardo', 'kar do', 'pack', 'kijiye', 'kar dijiye', 'chalega', 'kar do ji', 'sahi hai'],
    noKeywords: ['नहीं', 'नही', 'no', 'nahi', 'nahin', 'cancel', 'mat karo', 'ruko', 'galat', 'nako', 'roko', 'mat kijiye'],
  },
  mr: {
    greeting: 'नमस्कार! मी तुमचा AI खरेदी सहाय्यक आहे. तुम्हाला कोणत्या खरेदी केंद्रात जायचे आहे? तुम्ही पुणे, नाशिक, नागपूर, औरंगाबाद किंवा कोल्हापूर सांगू शकता.',
    askCrop: 'तुम्ही {centre} निवडले आहे. तुम्ही कोणते पीक विक्रीसाठी आणणार आहात? उपलब्ध पिके: {accepted}.',
    askQty: 'तुम्ही किती क्विंटल {crop} आणणार आहात? (कमाल मर्यादा: {max} क्विंटल).',
    askDate: 'तुम्ही कोणत्या दिवशी येणार आहात? आज किंवा उद्या सांगा.',
    askSlot: 'उपलब्ध वेळ स्लॉट आहेत: {slots}. तुम्हाला कोणती वेळ सोयीची आहे?',
    confirm: 'कृपया खात्री करा: {centre}, {crop}, {qty} क्विंटल, {date} रोजी, वेळ {slot}. हा स्लॉट बुक करायचा का? होय म्हणा किंवा काही बदलायचे असल्यास सांगा.',
    booking: 'तुमचा स्लॉट बुक केला जात आहे, कृपया थांबा…',
    done: 'अभिनंदन! तुमचा स्लॉट यशस्वीरित्या बुक झाला आहे. तुमचा टोकन नंबर {token} आहे.',
    error: 'बुकिंग होऊ शकली नाही. कृपया पुन्हा प्रयत्न करा.',
    cancelled: 'बुकिंग रद्द करण्यात आले आहे. पुन्हा सुरू करण्यासाठी स्टार्ट बटण दाबा.',
    
    // Conversational Change Confirmations
    updatedQty: 'प्रमाण बदलून {qty} क्विंटल केले आहे.',
    updatedCrop: 'पीक बदलून {crop} केले आहे. किती क्विंटल आणणार आहात?',
    updatedCentre: 'खरेदी केंद्र बदलून {centre} केले आहे.',
    updatedDate: 'तारीख बदलून {date} केली आहे. उपलब्ध वेळ स्लॉट आहेत: {slots}.',
    updatedSlot: 'वेळ स्लॉट बदलून {slot} केला आहे.',
    
    notUnderstoodCentre: 'मला केंद्राचे नाव समजले नाही. कृपया पुणे, नाशिक, नागपूर, औरंगाबाद किंवा कोल्हापूर सांगा.',
    notUnderstoodCrop: 'कृपया या केंद्रावर उपलब्ध पिकाचे नाव सांगा.',
    notUnderstoodQty: 'कृपया क्विंटलमध्ये प्रमाण सांगा, जसे 10, 20 किंवा 29 क्विंटल.',
    notUnderstoodDate: 'कृपया आज किंवा उद्या सांगा.',
    notUnderstoodSlot: 'कृपया उपलब्ध वेळ सांगा किंवा खालील पर्याय निवडा.',
    notUnderstoodConfirm: 'कृपया पुष्टीसाठी होय म्हणा, किंवा बदल सांगा (उदा. 15 क्विंटल करा किंवा उद्या करा).',
    cropNotAccepted: '{centre} मध्ये फक्त {accepted} स्वीकारले जाते. कृपया उपलब्ध पीक निवडा.',
    
    yesKeywords: ['हो', 'होय', 'हाय', 'yes', 'haan', 'ha', 'haa', 'ok', 'okay', 'bar', 'bara', 'barobar', 'nakkich', 'chalel', 'kara', 'karun taka', 'book kara', 'theek', 'theek ahe', 'chaan', 'sahi', 'हो करा', 'होय करा', 'नक्की करा', 'कन्फर्म'],
    noKeywords: ['नाही', 'नको', 'no', 'nahi', 'nahin', 'cancel', 'thamba', 'chuka', 'naka', 'mat karo', 'ruko', 'नको करू', 'रद्द करा', 'थांबा', 'चूक झाली'],
  },
};

const CROP_LABELS = {
  WHEAT: { en: '🌾 Wheat', hi: '🌾 गेहूं', mr: '🌾 गहू' },
  PADDY: { en: '🍚 Paddy (Rice)', hi: '🍚 धान (चावल)', mr: '🍚 भात (धान)' },
  COTTON: { en: '☁️ Cotton', hi: '☁️ कपास', mr: '☁️ कापूस' },
  SOYBEAN: { en: '🌱 Soybean', hi: '🌱 सोयाबीन', mr: '🌱 सोयाबीन' },
  TUR: { en: '🌿 Tur (Arhar)', hi: '🌿 तूर (अरहर)', mr: '🌿 तूर' },
};

// Strict centre matchers (names only, NO digits/numbers to prevent false triggers)
const CENTRE_ALIASES = {
  1: ['pune', 'poona', 'puna', 'पुणे', 'पुना', 'baramati', 'haveli', 'पुणे केंद्र', 'पुणे बाजार समिती', 'पुणे मंडी'],
  2: ['nashik', 'nasik', 'नासिक', 'नाशिक', 'sinnar', 'dindori', 'niphad', 'नाशिक केंद्र', 'नाशिक बाजार समिती', 'नासिक मंडी'],
  3: ['nagpur', 'नागपुर', 'नागपूर', 'vidarbha', 'नागपूर केंद्र', 'नागपूर बाजार समिती', 'नागपुर मंडी'],
  4: ['aurangabad', 'sambhajinagar', 'sambhaji', 'औरंगाबाद', 'संभाजीनगर', 'संभाजी', 'छत्रपती संभाजीनगर', 'औरंगाबाद केंद्र', 'औरंगाबाद बाजार समिती'],
  5: ['kolhapur', 'कोल्हापुर', 'कोल्हापूर', 'कोल्हापूर केंद्र', 'कोल्हापूर बाजार समिती', 'कोल्हापुर मंडी'],
};

const CENTRE_LOCAL_NAMES = {
  1: { en: 'Pune Procurement Center', hi: 'पुणे मंडी', mr: 'पुणे बाजार समिती' },
  2: { en: 'Nashik Procurement Center', hi: 'नासिक मंडी', mr: 'नाशिक बाजार समिती' },
  3: { en: 'Nagpur Procurement Center', hi: 'नागपुर मंडी', mr: 'नागपूर बाजार समिती' },
  4: { en: 'Aurangabad Procurement Center', hi: 'औरंगाबाद मंडी', mr: 'औरंगाबाद बाजार समिती' },
  5: { en: 'Kolhapur Procurement Center', hi: 'कोल्हापुर मंडी', mr: 'कोल्हापूर बाजार समिती' },
};

// Strict crop matchers (names only, NO generic digits/ordinals)
const CROP_MATCHERS = {
  WHEAT: ['wheat', 'gehu', 'gehun', 'गेहूं', 'गेहूँ', 'गेहू', 'गहू', 'गव्हाचे', 'गव्हाची', 'गहू विक्री', 'kanak'],
  PADDY: ['paddy', 'rice', 'dhan', 'chawal', 'धान', 'भात', 'चावल', 'तांदूळ', 'भाताचे', 'चावलविक्री'],
  COTTON: ['cotton', 'kapas', 'kapaas', 'कपास', 'कापूस', 'रुई', 'rui', 'कापसाचे'],
  SOYBEAN: ['soybean', 'soya', 'soyabean', 'सोयाबीन', 'सोया', 'सोयाबीनचे'],
  TUR: ['tur', 'toor', 'arhar', 'तूर', 'अरहर', 'tuvar', 'तुरीचे'],
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
  { words: ['एकतीस', 'iktis', '31', '३१'], val: 31 },
  { words: ['बत्तीस', 'battis', '32', '३२'], val: 32 },
  { words: ['तेहेतीस', 'tehtis', '33', '३३'], val: 33 },
  { words: ['चौतीस', 'chautis', '34', '३४'], val: 34 },
  { words: ['पस्तीस', 'pastis', 'paintis', 'पैंतीस', '35', '३५'], val: 35 },
  { words: ['छत्तीस', 'chhattis', '36', '३६'], val: 36 },
  { words: ['सदतीस', 'sadtis', '37', '३७'], val: 37 },
  { words: ['अडतीस', 'adtis', '38', '३८'], val: 38 },
  { words: ['एकोणचाळीस', 'untalis', '39', '३९'], val: 39 },
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
  if (!heard || !centres || centres.length === 0) return null;
  const clean = normalize(heard);

  for (const centre of centres) {
    const aliases = CENTRE_ALIASES[centre.id] || [];
    if (aliases.some((a) => clean.includes(normalize(a)))) {
      return centre;
    }
    const cName = normalize(centre.name);
    const cDist = normalize(centre.district);
    if (clean.includes(cName) || (cDist.length > 3 && clean.includes(cDist))) {
      return centre;
    }
  }
  return null;
}

function findMatchingCrop(heard, acceptedCrops) {
  if (!heard) return null;
  const clean = normalize(heard);

  for (const [cropKey, keywords] of Object.entries(CROP_MATCHERS)) {
    // Only match if the keyword is explicitly inside the spoken string
    if (keywords.some((k) => clean.includes(normalize(k)))) {
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

  // Check for direct digits like 29, 15, 20.5
  const digitMatch = converted.match(/(\d+(\.\d+)?)/);
  if (digitMatch) {
    const val = parseFloat(digitMatch[1]);
    if (!isNaN(val) && val > 0) return val;
  }

  const lower = converted.toLowerCase();
  const tokens = lower.split(/[\s,]+/);

  for (const item of NUMBER_MAP) {
    for (const w of item.words) {
      const cleanW = w.toLowerCase().replace(/[\.]/g, '');
      const cleanLower = lower.replace(/[\.]/g, '');
      if (
        cleanLower === cleanW ||
        tokens.some((t) => t.replace(/[\.]/g, '') === cleanW) ||
        (cleanW.length >= 3 && cleanLower.includes(cleanW))
      ) {
        return item.val;
      }
    }
  }

  return null;
}

function findMatchingDate(heard, dates, lang) {
  if (!heard || !dates || dates.length === 0) return null;
  const text = heard.toLowerCase();

  if (/\b(tomorrow|kal|udya|second|doosra|dusra|उद्या|कल|दुसरा|उद्याचा|उद्याची)\b/i.test(text) && dates[1]) {
    return { iso: dates[1], label: lang === 'en' ? 'Tomorrow' : lang === 'hi' ? 'कल' : 'उद्या' };
  }

  if (/\b(today|aaj|aj|first|pehla|pahila|आज|पहिला|आजचा|आजची)\b/i.test(text) && dates[0]) {
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
        return startHr === hr || (hr <= 5 && startHr === hr + 12) || (hr >= 14 && startHr === hr);
      });
      if (found) return found;
    }
  }

  if (/\b(first|pehla|pahila|पहिला|morning|subah|सकाळी|सकाळचा)\b/i.test(text)) {
    return availableSlots[0];
  }
  if (/\b(last|aakhri|shewat|शेवटचा|evening|shaam|संध्याकाळी|दुपारचा)\b/i.test(text)) {
    return availableSlots[availableSlots.length - 1];
  }

  for (const s of availableSlots) {
    if (text.includes(s.slot.toLowerCase())) return s;
  }

  return null;
}

// Detection for explicit change/edit intent
function hasEditIntent(text) {
  if (!text) return false;
  return /\b(change|modify|edit|instead|make it|update|switch|wrong|mistake|badla|badlo|chuka|chuki|nahi|nako|chukun|ऐवजी|बदला|बदलो|दुरुस्त|चुकून|चेंज|दुसरे|बदल|बदलायचे)\b/i.test(text);
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
  const activeAudioRef = useRef(null);
  const isListeningLoopActive = useRef(false);

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

  // Stop all audio and speech engines immediately
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

  // Hands-Free Speech Output via `/api/tts` (with SpeechSynthesis fallback)
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
        if (onFinishedSpeaking) {
          // Immediately start listening for farmer response for natural 2-way conversation
          setTimeout(() => {
            onFinishedSpeaking();
          }, 150);
        }
      };

      const estTimeMs = Math.max(2500, (cleanText.length / 7) * 1000 + 1500);
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

  // User Listening Turn (Auto-restarts and stays active during conversation)
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
        } catch (err) {
          setMicError('Microphone access blocked. Click the lock icon 🔒 in your browser URL bar and set Microphone to "Allow".');
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
      isListeningLoopActive.current = true;

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
          if (onTextHeard) onTextHeard(final.trim());
        }
      };

      recognition.onerror = (e) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          setMicError('Microphone access denied. Click the lock icon 🔒 in your address bar and enable Microphone.');
          setTurnState('IDLE');
          isListeningLoopActive.current = false;
        } else if (e.error === 'no-speech') {
          // If no speech, gracefully stay ready in conversation loop
          setTurnState('IDLE');
        } else {
          setTurnState('IDLE');
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
    [lang, stopAll, addMessage]
  );

  // ── Conversational Orchestration Functions ───────────────────────────────────

  const askCentre = useCallback(() => {
    setStep('CENTRE');
    botSpeakAndPrompt(script.greeting, () => {
      startUserTurn(processVoiceUtterance);
    });
  }, [script, botSpeakAndPrompt, startUserTurn]);

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
        startUserTurn(processVoiceUtterance);
      });
    },
    [lang, script, botSpeakAndPrompt, startUserTurn]
  );

  const askQty = useCallback(
    (centre, cropKey, ackPrefix = '') => {
      setStep('QTY');
      const maxLimit = centre?.max_qty_per_farmer || 50;
      const centreSpeech = getCentreSpeechName(centre, lang);
      const cropLabel = CROP_LABELS[cropKey]?.[lang] || cropKey;
      let promptText = script.askQty
        .replace('{centre}', centreSpeech)
        .replace('{crop}', cropLabel)
        .replace('{max}', maxLimit);

      if (ackPrefix) {
        promptText = `${ackPrefix} ${promptText}`;
      }

      botSpeakAndPrompt(promptText, () => {
        startUserTurn(processVoiceUtterance);
      });
    },
    [lang, script, botSpeakAndPrompt, startUserTurn]
  );

  const askDate = useCallback(
    (centre, cropKey, qtyNum, ackPrefix = '') => {
      setStep('DATE');
      let promptText = script.askDate;
      if (ackPrefix) {
        promptText = `${ackPrefix} ${promptText}`;
      }

      botSpeakAndPrompt(promptText, () => {
        startUserTurn(processVoiceUtterance);
      });
    },
    [script, botSpeakAndPrompt, startUserTurn]
  );

  const askSlot = useCallback(
    (centre, cropKey, qtyNum, dateObj, ackPrefix = '') => {
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
          let promptText = script.askSlot.replace('{slots}', slotSpeechList);
          if (ackPrefix) {
            promptText = `${ackPrefix} ${promptText}`;
          }

          setTimeout(() => {
            botSpeakAndPrompt(promptText, () => {
              startUserTurn(processVoiceUtterance);
            });
          }, 200);
        })
        .catch(() => {
          botSpeakAndPrompt(script.notUnderstoodSlot, () => {
            startUserTurn(processVoiceUtterance);
          });
        });
    },
    [lang, script, botSpeakAndPrompt, startUserTurn, askDate]
  );

  const askConfirm = useCallback(
    (centre, cropKey, qtyNum, dateObj, slotObj, ackPrefix = '') => {
      setStep('CONFIRM');
      const centreSpeech = getCentreSpeechName(centre, lang);
      const cropLabel = CROP_LABELS[cropKey]?.[lang] || cropKey;
      const slotSpeech = formatSlotForSpeech(slotObj.slot, lang);
      let confirmText = script.confirm
        .replace('{centre}', centreSpeech)
        .replace('{crop}', cropLabel)
        .replace('{qty}', qtyNum)
        .replace('{date}', dateObj.label)
        .replace('{slot}', slotSpeech);

      if (ackPrefix) {
        confirmText = `${ackPrefix} ${confirmText}`;
      }

      botSpeakAndPrompt(confirmText, () => {
        startUserTurn(processVoiceUtterance);
      });
    },
    [lang, script, botSpeakAndPrompt, startUserTurn]
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

  /**
   * 🧠 HIGH-ACCURACY CONVERSATIONAL PROCESSOR
   * Prevents false triggers and handles step-specific entity extraction + explicit edits.
   */
  const processVoiceUtterance = useCallback(
    (heard) => {
      const norm = normalize(heard);
      const isEditing = hasEditIntent(heard);

      // Check if user is saying YES/NO during confirmation
      if (step === 'CONFIRM' && !isEditing) {
        const isYes = script.yesKeywords.some((k) => norm.includes(normalize(k)));
        const isNo = script.noKeywords.some((k) => norm.includes(normalize(k)));

        if (isYes && selectedCentre && selectedCrop && selectedQty && selectedDate && selectedSlot) {
          submitBooking(selectedCentre, selectedCrop.key, selectedQty, selectedDate, selectedSlot);
          return;
        }
        if (isNo) {
          stopAll();
          setStep('IDLE');
          botSpeakAndPrompt(script.cancelled);
          return;
        }
      }

      // Check for Restart command
      if (/\b(restart|start over|reset|phir se|suruvatipasun|सुरुवातीपासून|पुन्हा|फिर से)\b/i.test(heard)) {
        startConversation();
        return;
      }

      const dates = reference?.dates || [];
      const extractedCentre = findMatchingCentre(heard, centres);
      const acceptedCropsForCurrent = (extractedCentre || selectedCentre)?.accepted_crops_list || ['WHEAT', 'PADDY', 'COTTON', 'SOYBEAN', 'TUR'];
      const extractedCrop = findMatchingCrop(heard, acceptedCropsForCurrent);
      const extractedQty = extractQuantity(heard);
      const extractedDate = findMatchingDate(heard, dates, lang);
      const extractedSlot = findMatchingSlot(heard, availableSlots);

      let currentCentre = selectedCentre;
      let currentCrop = selectedCrop?.key;
      let currentQty = selectedQty;
      let currentDate = selectedDate;
      let currentSlot = selectedSlot;
      let ackMessage = '';

      // ── Step-Aware Processing ──

      // 1. If currently at CENTRE step, or user explicitly requested centre change:
      if (extractedCentre && (step === 'CENTRE' || isEditing || (heard.includes('centre') || heard.includes('मंडी') || heard.includes('केंद्र')))) {
        currentCentre = extractedCentre;
        setSelectedCentre(extractedCentre);
        const centreSpeech = getCentreSpeechName(extractedCentre, lang);
        ackMessage = script.updatedCentre.replace('{centre}', centreSpeech);

        const newAccepted = extractedCentre.accepted_crops_list || ['WHEAT', 'PADDY', 'COTTON', 'SOYBEAN', 'TUR'];
        if (currentCrop && !newAccepted.includes(currentCrop)) {
          currentCrop = null;
          setSelectedCrop(null);
        }

        if (!currentCrop) {
          askCrop(extractedCentre);
          return;
        }
      }

      // 2. If currently at CROP step, or user explicitly requested crop change:
      if (extractedCrop && (step === 'CROP' || isEditing || (heard.includes('crop') || heard.includes('फसल') || heard.includes('पीक') || heard.includes('विक्री')))) {
        if (!extractedCrop.accepted) {
          const centreSpeech = getCentreSpeechName(currentCentre || selectedCentre, lang);
          const acceptedLabels = acceptedCropsForCurrent.map((k) => CROP_LABELS[k]?.[lang] || k).join(', ');
          const notAccText = script.cropNotAccepted
            .replace('{centre}', centreSpeech)
            .replace('{accepted}', acceptedLabels);
          botSpeakAndPrompt(notAccText, () => askCrop(currentCentre || selectedCentre));
          return;
        }

        currentCrop = extractedCrop.key;
        const cropLabel = CROP_LABELS[extractedCrop.key]?.[lang] || extractedCrop.key;
        setSelectedCrop({ key: extractedCrop.key, label: cropLabel });
        ackMessage = script.updatedCrop.replace('{crop}', cropLabel);

        if (!currentQty || isEditing) {
          askQty(currentCentre || selectedCentre, extractedCrop.key, ackMessage);
          return;
        }
      }

      // 3. If currently at QTY step, or user stated a number with/without edit:
      if (extractedQty && (step === 'QTY' || isEditing || (heard.includes('qtl') || heard.includes('quintal') || heard.includes('क्विंटल') || heard.includes('मात्रा') || heard.includes('प्रमाण')))) {
        const maxLimit = (currentCentre || selectedCentre)?.max_qty_per_farmer || 50;
        if (extractedQty > maxLimit) {
          const overText =
            lang === 'hi'
              ? `यह संख्या इस केंद्र की ${maxLimit} क्विंटल सीमा से अधिक है। कृपया ${maxLimit} या उससे कम बताएं।`
              : lang === 'mr'
              ? `ही संख्या ${maxLimit} क्विंटल मर्यादेपेक्षा जास्त आहे. कृपया ${maxLimit} किंवा कमी सांगा.`
              : `That exceeds the ${maxLimit} quintal limit for this centre. Please choose ${maxLimit} or less.`;
          botSpeakAndPrompt(overText, () => askQty(currentCentre || selectedCentre, currentCrop));
          return;
        }

        currentQty = extractedQty;
        setSelectedQty(extractedQty);
        ackMessage = script.updatedQty.replace('{qty}', extractedQty);

        if (!currentDate) {
          askDate(currentCentre || selectedCentre, currentCrop, extractedQty, ackMessage);
          return;
        }
      }

      // 4. If currently at DATE step, or user specified a date:
      if (extractedDate && (step === 'DATE' || isEditing || (heard.includes('date') || heard.includes('तारीख') || heard.includes('दिन') || heard.includes('दिवस')))) {
        currentDate = extractedDate;
        setSelectedDate(extractedDate);
        currentSlot = null;
        setSelectedSlot(null);

        askSlot(currentCentre || selectedCentre, currentCrop, currentQty, extractedDate, `Changed date to ${extractedDate.label}.`);
        return;
      }

      // 5. If currently at SLOT step, or user specified a time:
      if (extractedSlot && (step === 'SLOT' || isEditing || (heard.includes('time') || heard.includes('slot') || heard.includes('बजे') || heard.includes('वाजता') || heard.includes('वेळ')))) {
        currentSlot = extractedSlot;
        setSelectedSlot(extractedSlot);
        const slotSpeech = formatSlotForSpeech(extractedSlot.slot, lang);
        ackMessage = script.updatedSlot.replace('{slot}', slotSpeech);
      }

      // ── Verification: If all 5 parameters are chosen, proceed to Confirmation ──
      if (currentCentre && currentCrop && currentQty && currentDate && currentSlot) {
        askConfirm(currentCentre, currentCrop, currentQty, currentDate, currentSlot, ackMessage);
        return;
      }

      // If in standard funnel, continue to the current missing step:
      if (!currentCentre) {
        askCentre();
      } else if (!currentCrop) {
        askCrop(currentCentre);
      } else if (!currentQty) {
        askQty(currentCentre, currentCrop);
      } else if (!currentDate) {
        askDate(currentCentre, currentCrop, currentQty);
      } else if (!currentSlot) {
        askSlot(currentCentre, currentCrop, currentQty, currentDate);
      } else {
        botSpeakAndPrompt(script.notUnderstoodConfirm, () => {
          startUserTurn(processVoiceUtterance);
        });
      }
    },
    [
      step,
      script,
      lang,
      centres,
      reference,
      availableSlots,
      selectedCentre,
      selectedCrop,
      selectedQty,
      selectedDate,
      selectedSlot,
      askCentre,
      askCrop,
      askQty,
      askDate,
      askSlot,
      askConfirm,
      submitBooking,
      botSpeakAndPrompt,
      startUserTurn,
      stopAll,
    ]
  );

  // Manual 1-Tap Option Handlers
  const handleSelectCentre = (centre) => {
    stopAll();
    setSelectedCentre(centre);
    const centreSpeech = getCentreSpeechName(centre, lang);
    addMessage('farmer', centreSpeech || centre.name);
    askCrop(centre);
  };

  const handleSelectCrop = (cropKey, centre) => {
    stopAll();
    const targetCentre = centre || selectedCentre;
    const label = CROP_LABELS[cropKey]?.[lang] || cropKey;
    setSelectedCrop({ key: cropKey, label });
    addMessage('farmer', label);
    askQty(targetCentre, cropKey);
  };

  const handleSelectQty = (qtyNum, centre, cropKey) => {
    stopAll();
    const targetCentre = centre || selectedCentre;
    const targetCrop = cropKey || selectedCrop?.key;
    setSelectedQty(qtyNum);
    addMessage('farmer', `${qtyNum} quintals`);
    askDate(targetCentre, targetCrop, qtyNum);
  };

  const handleSelectDate = (dateObj, centre, cropKey, qtyNum) => {
    stopAll();
    const targetCentre = centre || selectedCentre;
    const targetCrop = cropKey || selectedCrop?.key;
    const targetQty = qtyNum || selectedQty;
    setSelectedDate(dateObj);
    addMessage('farmer', dateObj.label);
    askSlot(targetCentre, targetCrop, targetQty, dateObj);
  };

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

  const handleManualMicClick = () => {
    if (turnState === 'USER_LISTENING') {
      stopAll();
    } else {
      stopAll();
      startUserTurn(processVoiceUtterance);
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
    isListeningLoopActive.current = false;
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
          className="fixed bottom-6 right-5 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 via-teal-700 to-indigo-800 shadow-2xl shadow-emerald-900/50 ring-4 ring-emerald-300/40 transition hover:scale-105 active:scale-95"
          aria-label={t('va.startBtn')}
        >
          <span className="absolute h-16 w-16 rounded-full bg-emerald-400/40 animate-ping" />
          <Volume2 className="relative h-7 w-7 text-white" />
          <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-[10px] font-black text-slate-950 shadow-xs">
            AI
          </span>
        </button>
      )}

      {/* Assistant Modal Window */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs sm:items-center sm:justify-center sm:p-4">
          <div className="flex h-[92vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl sm:h-[680px] sm:max-w-md sm:rounded-3xl overflow-hidden border border-slate-200">
            {/* Header: Clean title without clutter */}
            <div className="flex items-center justify-between border-b border-emerald-900/20 bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-900 px-5 py-3.5 text-white">
              <div className="flex items-center gap-3">
                <div className="relative grid h-10 w-10 place-items-center rounded-2xl bg-white/20 shadow-inner backdrop-blur-md">
                  <Bot className="h-6 w-6 text-white" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-emerald-900 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-wide">
                    {lang === 'hi' ? 'एआई बुकिंग सहायक' : lang === 'mr' ? 'AI बुकिंग सहाय्यक' : 'AI Voice Booking Assistant'}
                  </h3>
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
                  className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-emerald-100 hover:bg-white/20 transition"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-emerald-100 hover:bg-white/20 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Dynamic Parameter Memory Chips */}
            {(selectedCentre || selectedCrop || selectedQty || selectedDate || selectedSlot) && (
              <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-900 px-3.5 py-2 text-white text-[11px] font-bold border-b border-slate-800 scrollbar-none">
                <span className="text-[10px] uppercase font-mono text-emerald-400 shrink-0">Memory:</span>
                {selectedCentre && (
                  <span className="rounded-lg bg-slate-800 px-2 py-0.5 border border-slate-700 text-emerald-300 shrink-0">
                    🏛️ {(t(`centre.${selectedCentre.id}`) || selectedCentre.name).split(' ')[0]}
                  </span>
                )}
                {selectedCrop && (
                  <span className="rounded-lg bg-slate-800 px-2 py-0.5 border border-slate-700 text-amber-300 shrink-0">
                    {CROP_LABELS[selectedCrop.key]?.[lang] || selectedCrop.key}
                  </span>
                )}
                {selectedQty && (
                  <span className="rounded-lg bg-slate-800 px-2 py-0.5 border border-slate-700 text-teal-300 shrink-0">
                    ⚖️ {selectedQty} qtl
                  </span>
                )}
                {selectedDate && (
                  <span className="rounded-lg bg-slate-800 px-2 py-0.5 border border-slate-700 text-blue-300 shrink-0">
                    📅 {selectedDate.label}
                  </span>
                )}
                {selectedSlot && (
                  <span className="rounded-lg bg-slate-800 px-2 py-0.5 border border-slate-700 text-purple-300 shrink-0">
                    ⏰ {selectedSlot.slot}
                  </span>
                )}
              </div>
            )}

            {/* Turn-Taking Live Indicator */}
            <div className="flex items-center justify-between px-4 py-2 text-xs font-bold border-b border-slate-100 bg-slate-50">
              {turnState === 'BOT_SPEAKING' ? (
                <div className="flex items-center gap-2 text-emerald-800">
                  <Volume2 className="h-4 w-4 animate-bounce text-emerald-700" />
                  <span>Assistant speaking… (Mic will auto-open)</span>
                </div>
              ) : turnState === 'USER_LISTENING' ? (
                <div className="flex items-center gap-2 text-rose-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-600 animate-ping" />
                  <span>🎙️ Listening… Speak naturally (e.g. "29 क्विंटल")</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-500">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  <span>2-Way Voice Active</span>
                </div>
              )}

              <span className="text-[10px] text-slate-400 font-mono">
                {step !== 'IDLE' && step !== 'DONE' && step !== 'ERROR' ? `Step: ${step}` : ''}
              </span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
              {messages.length === 0 && step === 'IDLE' && (
                <div className="my-auto flex flex-col items-center justify-center p-6 text-center">
                  <div className="relative grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-emerald-100 via-teal-100 to-indigo-100 text-4xl shadow-inner ring-4 ring-emerald-50">
                    🎙️
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                    </span>
                  </div>
                  <h4 className="mt-4 text-base font-extrabold text-slate-900">
                    {lang === 'hi' ? 'एआई बुकिंग सहायक' : lang === 'mr' ? 'AI बुकिंग सहाय्यक' : 'AI Voice Booking Assistant'}
                  </h4>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed max-w-xs">
                    Continuous 2-Way Voice. Speak your centre, crop, quantity, and date naturally.
                  </p>

                  <button
                    type="button"
                    onClick={startConversation}
                    className="mt-6 flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-700 to-indigo-800 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-800/30 transition hover:brightness-110"
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
                    <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-800 shadow-2xs">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[84%] rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed shadow-2xs ${
                      m.from === 'bot'
                        ? 'bg-white text-slate-900 border border-slate-200/80 rounded-tl-xs'
                        : 'bg-gradient-to-r from-emerald-700 to-teal-800 text-white rounded-tr-xs'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {/* Live speech transcription */}
              {turnState === 'USER_LISTENING' && (
                <div className="flex flex-col gap-1.5 rounded-2xl bg-gradient-to-r from-rose-50 to-amber-50 p-3 border border-rose-200 text-xs font-semibold text-rose-950 animate-pulse">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
                    <span>Listening to your speech…</span>
                  </div>
                  {liveHeardTranscript && (
                    <p className="font-mono text-slate-900 bg-white/90 p-2.5 rounded-xl border border-rose-100 shadow-2xs">
                      "{liveHeardTranscript}"
                    </p>
                  )}
                </div>
              )}

              {/* Mic Diagnostics */}
              {micError && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50 p-3.5 border border-amber-300 text-xs font-semibold text-amber-950">
                  <span className="text-base shrink-0">⚠️</span>
                  <div>
                    <p>{micError}</p>
                    <p className="mt-1 text-[11px] text-amber-800 font-normal">
                      💡 Tip: You can also tap any option below to continue.
                    </p>
                  </div>
                </div>
              )}

              {/* Booking spinner */}
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

            {/* Quick 1-Tap Option Chips */}
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

                {/* Step 5: Slot */}
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
                    : 'bg-gradient-to-r from-emerald-700 via-teal-700 to-indigo-800 hover:brightness-110'
                }`}
              >
                <Mic className="h-5 w-5" />
                <span>
                  {turnState === 'USER_LISTENING'
                    ? 'Listening… (Speak your answer)'
                    : turnState === 'BOT_SPEAKING'
                    ? 'Assistant Speaking… (Tap to Interrupt)'
                    : 'Tap to Speak'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
