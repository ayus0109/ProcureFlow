/**
 * backend/routes/chatbot.js
 *
 * Kisan Sahayak / Farmer Help & Support AI Chatbot Knowledge Engine.
 * Provides instant, highly accurate GovTech guidance in 7 regional Indian languages:
 * 1. English (en)
 * 2. Hindi - हिंदी (hi)
 * 3. Marathi - मराठी (mr)
 * 4. Punjabi - ਪੰਜਾਬੀ (pa)
 * 5. Gujarati - ગુજરાતી (gu)
 * 6. Telugu - తెలుగు (te)
 * 7. Kannada - ಕನ್ನಡ (kn)
 */

const express = require('express');
const { CROPS, SLOT_WINDOWS } = require('../config/constants');
const { getCentresWithStats } = require('../services/centreService');
const { db } = require('../db');

const router = express.Router();

// Knowledge Base Topics & Multi-Lingual Resolution
function answerFarmerQuery(query = '', lang = 'mr') {
  const q = query.toLowerCase().trim();
  const currentLang = ['en', 'hi', 'mr', 'pa', 'gu', 'te', 'kn'].includes(lang) ? lang : 'en';

  // 1. MSP Rates & Crop Prices
  if (
    q.includes('msp') ||
    q.includes('rate') ||
    q.includes('price') ||
    q.includes('bhav') ||
    q.includes('kimat') ||
    q.includes('दर') ||
    q.includes('हमीभाव') ||
    q.includes('भाव') ||
    q.includes('किंमत') ||
    q.includes('मूल्य') ||
    q.includes('ਮੁੱਲ') ||
    q.includes('ਰੇਟ') ||
    q.includes('ભાવ') ||
    q.includes('ధర') ||
    q.includes('బెಲೆ') ||
    q.includes('wheat') ||
    q.includes('गेहूं') ||
    q.includes('गहू') ||
    q.includes('ਕਣਕ') ||
    q.includes('ઘઉં') ||
    q.includes('గోధుమ') ||
    q.includes('ಗೋಧಿ') ||
    q.includes('soybean') ||
    q.includes('सोयाबीन') ||
    q.includes('cotton') ||
    q.includes('कापूस') ||
    q.includes('कपास') ||
    q.includes('ਕਪਾਹ') ||
    q.includes('పత్తి') ||
    q.includes('ಹತ್ತಿ') ||
    q.includes('paddy') ||
    q.includes('धान') ||
    q.includes('भात') ||
    q.includes('ਝੋਨਾ') ||
    q.includes('ડાંગર') ||
    q.includes('వరి') ||
    q.includes('ಭತ್ತ') ||
    q.includes('tur') ||
    q.includes('तूर') ||
    q.includes('अरहर') ||
    q.includes('તુવેર') ||
    q.includes('కందులు') ||
    q.includes('ತೊಗರಿ')
  ) {
    if (currentLang === 'mr') {
      return {
        reply: `🌾 **चालू हंगाम शासकीय हमीभाव (MSP 2026)**:\n\n` +
          `• 🌾 **गहू (Wheat)**: ₹२,४२५ / क्विंटल\n` +
          `• 🌱 **सोयाबीन (Soybean)**: ₹४,८९२ / क्विंटल\n` +
          `• ☁️ **कापूस (Cotton)**: ₹७,५२१ / क्विंटल\n` +
          `• 🍚 **भात / धान (Paddy)**: ₹२,३०० / क्विंटल\n` +
          `• 🌿 **तूर / अरहर (Tur)**: ₹७,५५० / क्विंटल\n\n` +
          `💡 *टीप: जर तुमचा माल 'Grade A' गुणवत्तेचा असेल, तर हमीभावावर अतिरिक्त +५% गुणवत्ता बोनस थेट बँक खात्यात मिळतो!*`,
        suggestions: ['स्लॉट कसा बुक करावा?', 'गुणवत्ता आणि आर्द्रता नियम काय आहेत?', 'पैसे खात्यात कधी जमा होतात?'],
        action: { label: '📅 स्लॉट बुक करा', link: '/farmer/book' }
      };
    } else if (currentLang === 'hi') {
      return {
        reply: `🌾 **वर्तमान सरकारी न्यूनतम समर्थन मूल्य (MSP 2026)**:\n\n` +
          `• 🌾 **गेहूं (Wheat)**: ₹२,४२५ / क्विंटल\n` +
          `• 🌱 **सोयाबीन (Soybean)**: ₹४,८९२ / क्विंटल\n` +
          `• ☁️ **कपास (Cotton)**: ₹७,५२१ / क्विंटल\n` +
          `• 🍚 **धान (Paddy)**: ₹२,३०० / क्विंटल\n` +
          `• 🌿 **तूर / अरहर (Tur)**: ₹७,५५० / क्विंटल\n\n` +
          `💡 *सुझाव: 'Grade A' गुणवत्ता होने पर आधार दर पर +५% अतिरिक्त बोनस सीधे बैंक खाते में दिया जाता है!*`,
        suggestions: ['स्लॉट कैसे बुक करें?', 'नमी और गुणवत्ता नियम क्या हैं?', 'पैसे कब तक खाते में आएंगे?'],
        action: { label: '📅 अभी स्लॉट बुक करें', link: '/farmer/book' }
      };
    } else if (currentLang === 'pa') {
      return {
        reply: `🌾 **ਮੌਜੂਦਾ ਸਰਕਾਰੀ ਘੱਟੋ-ਘੱਟ ਸਮਰਥਨ ਮੁੱਲ (MSP 2026)**:\n\n` +
          `• 🌾 **ਕਣਕ (Wheat)**: ₹੨,੪੨੫ / ਕੁਇੰਟਲ\n` +
          `• 🌱 **ਸੋਇਆਬੀਨ (Soybean)**: ₹੪,੮੯੨ / ਕੁਇੰਟਲ\n` +
          `• ☁️ **ਨਰਮਾ / ਕਪਾਹ (Cotton)**: ₹੭,੫੨੧ / ਕੁਇੰਟਲ\n` +
          `• 🍚 **ਝੋਨਾ / ਧਾਨ (Paddy)**: ₹੨,੩੦੦ / ਕੁਇੰਟਲ\n` +
          `• 🌿 **ਤੂਰ / ਅਰਹਰ (Tur)**: ₹੭,੫੫੦ / ਕੁਇੰਟਲ\n\n` +
          `💡 *ਸੁਝਾਅ: 'Grade A' ਗੁਣਵੱਤਾ ਹੋਣ ਤੇ ਮੂਲ ਦਰ ਤੇ +੫% ਵਾਧੂ ਬੋਨਸ ਸਿੱਧਾ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ ਦਿੱਤਾ ਜਾਂਦਾ ਹੈ!*`,
        suggestions: ['ਸਲਾਟ ਕਿਵੇਂ ਬੁੱਕ ਕਰੀਏ?', 'ਨਮੀ ਅਤੇ ਗੁਣਵੱਤਾ ਨਿਯਮ ਕੀ ਹਨ?', 'ਪੈਸੇ ਖਾਤੇ ਵਿੱਚ ਕਦੋਂ ਆਉਣਗੇ?'],
        action: { label: '📅 ਸਲਾਟ ਬੁੱਕ ਕਰੋ', link: '/farmer/book' }
      };
    } else if (currentLang === 'gu') {
      return {
        reply: `🌾 **વર્તમાન સરકારી ટેકાના ભાવ (MSP 2026)**:\n\n` +
          `• 🌾 **ઘઉં (Wheat)**: ₹૨,૪૨૫ / ક્વિન્ટલ\n` +
          `• 🌱 **સોયાબીન (Soybean)**: ₹૪,૮૯૨ / ક્વિન્ટલ\n` +
          `• ☁️ **કપાસ (Cotton)**: ₹૭,૫૨૧ / ક્વિન્ટલ\n` +
          `• 🍚 **ડાંગર (Paddy)**: ₹૨,૩૦૦ / ક્વિન્ટલ\n` +
          `• 🌿 **તુવેર (Tur)**: ₹૭,૫૫૦ / ક્વિન્ટલ\n\n` +
          `💡 *સુઝાવ: 'Grade A' ગુણવત્તા હોવા પર મૂળ ભાવ પર +૫% વધારાનું બોનસ સીધા બેંક ખાતામાં મળે છે!*`,
        suggestions: ['સ્લોટ કેવી રીતે બુક કરવો?', 'ભેજ અને ગુણવત્તા નિયમો શું છે?', 'પૈસા ખાતામાં ક્યારે આવશે?'],
        action: { label: '📅 સ્લોટ બુક કરો', link: '/farmer/book' }
      };
    } else if (currentLang === 'te') {
      return {
        reply: `🌾 **ప్రభుత్వ కనీస మద్దతు ధరలు (MSP 2026)**:\n\n` +
          `• 🌾 **గోధుమలు (Wheat)**: ₹੨,౪੨੫ / క్వింటాల్\n` +
          `• 🌱 **సోయాబీన్ (Soybean)**: ₹౪,౮౯౨ / క్వింటాల్\n` +
          `• ☁️ **పత్తి (Cotton)**: ₹౭,౫౨౧ / క్వింటాల్\n` +
          `• 🍚 **వరి (Paddy)**: ₹੨,౩౦౦ / క్వింటాల్\n` +
          `• 🌿 **కందులు (Tur)**: ₹౭,౫౫౦ / క్వింటాల్\n\n` +
          `💡 *గమనిక: 'Grade A' నాణ్యత కలిగిన పంటకు కనీస మద్దతు ధరపై అదనంగా +੫% బోనస్ నేరుగా ఖాతాలో జమ అవుతుంది!*`,
        suggestions: ['స్లాట్‌ను ఎలా బుక్ చేయాలి?', 'తేమ మరియు నాణ్యత నిబంధనలు ఏమిటి?', 'డబ్బులు ఎప్పుడు వస్తాయి?'],
        action: { label: '📅 స్లాట్ బుక్ చేయండి', link: '/farmer/book' }
      };
    } else if (currentLang === 'kn') {
      return {
        reply: `🌾 **ಸರ್ಕಾರಿ ಕನಿಷ್ಠ ಬೆಂಬಲ ಬೆಲೆಗಳು (MSP 2026)**:\n\n` +
          `• 🌾 **ಗೋಧಿ (Wheat)**: ₹೨,೪೨೫ / ಕ್ವಿಂಟಾಲ್\n` +
          `• 🌱 **ಸೋಯಾಬೀನ್ (Soybean)**: ₹೪,೮೯೨ / ಕ್ವಿಂಟಾಲ್\n` +
          `• ☁️ **ಹತ್ತಿ (Cotton)**: ₹೭,೫೨೧ / ಕ್ವಿಂಟಾಲ್\n` +
          `• 🍚 **ಭತ್ತ (Paddy)**: ₹೨,೩೦೦ / ಕ್ವಿಂಟಾಲ್\n` +
          `• 🌿 **ತೊಗರಿ (Tur)**: ₹೭,೫೫೦ / ಕ್ವಿಂಟಾಲ್\n\n` +
          `💡 *ಸೂಚನೆ: 'Grade A' ಗುಣಮಟ್ಟದ ಬೆಳೆಗೆ ಮೂಲ ಬೆಂಬಲ ಬೆಲೆಯ ಮೇಲೆ +೫% ಹೆಚ್ಚುವರಿ ಬೋನಸ್ ನೇರವಾಗಿ ಖಾತೆಗೆ ಜಮೆಯಾಗುತ್ತದೆ!*`,
        suggestions: ['ಸ್ಲಾಟ್ ಬುಕ್ ಮಾಡುವುದು ಹೇಗೆ?', 'ತೇವಾಂಶ ಮತ್ತು ಗುಣಮಟ್ಟ ನಿಯಮಗಳು ಯಾವುವು?', 'ಹಣ ಯಾವಾಗ ಜಮೆಯಾಗುತ್ತದೆ?'],
        action: { label: '📅 ಸ್ಲಾಟ್ ಬುಕ್ ಮಾಡಿ', link: '/farmer/book' }
      };
    } else {
      return {
        reply: `🌾 **Government Minimum Support Prices (MSP 2026)**:\n\n` +
          `• 🌾 **Wheat**: ₹2,425 / Quintal\n` +
          `• 🌱 **Soybean**: ₹4,892 / Quintal\n` +
          `• ☁️ **Cotton**: ₹7,521 / Quintal\n` +
          `• 🍚 **Paddy (Rice)**: ₹2,300 / Quintal\n` +
          `• 🌿 **Tur (Arhar)**: ₹7,550 / Quintal\n\n` +
          `💡 *Note: Crops meeting 'Grade A' standards receive a +5% quality bonus directly into your bank account!*`,
        suggestions: ['How do I book a slot?', 'What are moisture and quality rules?', 'How does DBT payment work?'],
        action: { label: '📅 Book Slot Now', link: '/farmer/book' }
      };
    }
  }

  // 2. Booking Process & Slots
  if (
    q.includes('book') ||
    q.includes('slot') ||
    q.includes('time') ||
    q.includes('process') ||
    q.includes('कसा') ||
    q.includes('कसे') ||
    q.includes('बुक') ||
    q.includes('स्लॉट') ||
    q.includes('ਸਲਾਟ') ||
    q.includes('બુક') ||
    q.includes('స్లాట్') ||
    q.includes('ಬುಕ್')
  ) {
    if (currentLang === 'mr') {
      return {
        reply: `📋 **खरेदी स्लॉट बुकिंग प्रक्रिया (३ सोपे टप्पे)**:\n\n` +
          `१. **केंद्र निवडा**: जवळचे APMC खरेदी केंद्र (उदा. पुणे, नाशिक, नागपूर) निवडा.\n` +
          `२. **पीक व वजन**: तुमचे पीक (गहू/सोयाबीन) व क्विंटलमध्ये वजन टाका (कमाल ५० क्विंटल/बुकिंग).\n` +
          `३. **तारीख व वेळ**: आज किंवा उद्याचा १ तासाचा सोयीचा स्लॉट निवडून कन्फर्म करा.\n\n` +
          `⏰ **कामाचे स्लॉट**: १०:००-११:००, ११:००-१२:००, १२:००-१३:००, १४:००-१५:००, १५:००-१६:००, १६:००-१७:०० (दुपारी १ ते २ भोजन सुट्टी).\n\n` +
          `🎫 बुकिंग पूर्ण होताच डिजिटल गेट पास (उदा. PF-1476) त्वरित तयार होतो!`,
        suggestions: ['हमीभाव दर काय आहेत?', 'कोणती कागदपत्रे सोबत आणावी?', 'पैसे खात्यात कधी जमा होतात?'],
        action: { label: '📅 आताच स्लॉट बुक करा', link: '/farmer/book' }
      };
    } else if (currentLang === 'hi') {
      return {
        reply: `📋 **स्लॉट बुकिंग प्रक्रिया (३ आसान चरण)**:\n\n` +
          `१. **केंद्र चुनें**: अपना नजदीकी सरकारी खरीद केंद्र चुनें (जैसे पुणे, नासिक, नागपुर).\n` +
          `२. **फसल और मात्रा**: फसल चुनें और क्विंटल में मात्रा दर्ज करें (अधिकतम ५० क्विंटल/बुकिंग).\n` +
          `३. **तारीख और समय**: आज या कल का १ घंटे का समय स्लॉट चुनकर पुष्टि करें.\n\n` +
          `⏰ **कार्य समय स्लॉट**: १०:००-११:००, ११:००-१२:००, १२:००-१३:००, १४:००-१५:००, १५:००-१६:००, १६:००-१७:०० (दोपहर १ से २ लंच ब्रेक).\n\n` +
          `🎫 बुकिंग होते ही डिजिटल गेट पास (जैसे PF-1476) तुरंत मिल जाता है!`,
        suggestions: ['समर्थन मूल्य क्या है?', 'मंडी में कौन से दस्तावेज चाहिए?', 'डीबीटी भुगतान कैसे मिलता है?'],
        action: { label: '📅 अभी स्लॉट बुक करें', link: '/farmer/book' }
      };
    } else if (currentLang === 'pa') {
      return {
        reply: `📋 **ਸਲਾਟ ਬੁਕਿੰਗ ਪ੍ਰਕਿਰਿਆ (੩ ਆਸਾਨ ਕਦਮ)**:\n\n` +
          `੧. **ਕੇਂਦਰ ਚੁਣੋ**: ਆਪਣਾ ਨਜ਼ਦੀਕੀ ਖਰੀਦ ਕੇਂਦਰ ਚੁਣੋ।\n` +
          `੨. **ਫ਼ਸਲ ਅਤੇ ਮਾਤਰਾ**: ਫ਼ਸਲ ਅਤੇ ਕੁਇੰਟਲ ਵਿੱਚ ਮਾਤਰਾ ਚੁਣੋ (ਵੱਧ ਤੋਂ ਵੱਧ ੫੦ ਕੁਇੰਟਲ/ਬੁਕਿੰਗ)।\n` +
          `੩. **ਮਿਤੀ ਅਤੇ ਸਮਾਂ**: ਅੱਜ ਜਾਂ ਕੱਲ੍ਹ ਦਾ ੧ ਘੰਟੇ ਦਾ ਸਲਾਟ ਚੁਣ ਕੇ ਪੁਸ਼ਟੀ ਕਰੋ।\n\n` +
          `🎫 ਬੁਕਿੰਗ ਹੁੰਦੇ ਹੀ ਡਿਜੀਟਲ ਗੇਟ ਪਾਸ ਤੁਰੰਤ ਮਿਲ ਜਾਂਦਾ ਹੈ!`,
        suggestions: ['ਸਮਰਥਨ ਮੁੱਲ ਕੀ ਹੈ?', 'ਜ਼ਰੂਰੀ ਦਸਤਾਵੇਜ਼ ਕਿਹੜੇ ਹਨ?', 'ਭੁਗਤਾਨ ਕਿਵੇਂ ਹੁੰਦਾ ਹੈ?'],
        action: { label: '📅 ਸਲਾਟ ਬੁੱਕ ਕਰੋ', link: '/farmer/book' }
      };
    } else if (currentLang === 'gu') {
      return {
        reply: `📋 **સ્લોટ બુકિંગ પ્રક્રિયા (૩ સરળ પગલાં)**:\n\n` +
          `૧. **કેન્દ્ર પસંદ કરો**: નજીકનું સરકારી ખરીદ કેન્દ્ર પસંદ કરો.\n` +
          `૨. **પાક અને જથ્થો**: પાક અને ક્વિન્ટલમાં જથ્થો દાખલ કરો (મહત્તમ ૫૦ ક્વિન્ટલ).\n` +
          `૩. **તારીખ અને સમય**: અનુકૂળ ૧ કલાકનો સ્લોટ પસંદ કરીને પુષ્ટિ કરો.\n\n` +
          `🎫 બુકિંગ થતાં જ ડિજિટલ ગેટ પાસ તરત મળી જાય છે!`,
        suggestions: ['ટેકાના ભાવ શું છે?', 'જરૂરી દસ્તાવેજો કયા છે?', 'DBT ચુકવણી કેવી રીતે મળે?'],
        action: { label: '📅 સ્લોટ બુક કરો', link: '/farmer/book' }
      };
    } else if (currentLang === 'te') {
      return {
        reply: `📋 **స్లాట్ బుకింగ్ ప్రక్రియ (౩ సులభమైన దశలు)**:\n\n` +
          `੧. **కేంద్రాన్ని ఎంచుకోండి**: సమీప ప్రభుత్వ సేకరణ కేంద్రాన్ని ఎంచుకోండి.\n` +
          `੨. **పంట & పరిమాణం**: పంట మరియు క్వింటాళ్లలో పరిమాణాన్ని నమోదు చేయండి (గరిష్టంగా ੫౦ క్వింటాళ్లు).\n` +
          `੩. **తేదీ & సమయం**: అనుకూలమైన ੧ గంట సమయ స్లాట్‌ను ఎంచుకుని నిర్ధారించండి.\n\n` +
          `🎫 బుకింగ్ పూర్తయిన వెంటనే డిజిటల్ గేట్ పాస్ జారీ చేయబడుతుంది!`,
        suggestions: ['మద్దతు ధర ఎంత?', 'ఏ పత్రాలు అవసరం?', 'డబ్బులు ఎప్పుడు వస్తాయి?'],
        action: { label: '📅 స్లాట్ బుక్ చేయండి', link: '/farmer/book' }
      };
    } else if (currentLang === 'kn') {
      return {
        reply: `📋 **ಸ್ಲಾಟ್ ಬುಕಿಂಗ್ ಪ್ರಕ್ರಿಯೆ (೩ ಸುಲಭ ಹಂತಗಳು)**:\n\n` +
          `೧. **ಕೇಂದ್ರ ಆಯ್ಕೆಮಾಡಿ**: ಹತ್ತಿರದ ಖರೀದಿ ಕೇಂದ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ.\n` +
          `೨. **ಬೆಳೆ ಮತ್ತು ಪ್ರಮಾಣ**: ಬೆಳೆ ಮತ್ತು ಕ್ವಿಂಟಾಲ್ ಪ್ರಮಾಣವನ್ನು ನಮೂದಿಸಿ (ಗರಿಷ್ಠ ೫೦ ಕ್ವಿಂಟಾಲ್).\n` +
          `೩. **ದಿನಾಂಕ ಮತ್ತು ಸಮಯ**: ಅನುಕೂಲಕರ ೧ ಗಂಟೆಯ ಸ್ಲಾಟ್ ಆಯ್ಕೆಮಾಡಿ ದೃಢೀಕರಿಸಿ.\n\n` +
          `🎫 ಬುಕಿಂಗ್ ಆದ ತಕ್ಷಣ ಡಿಜಿಟಲ್ ಗೇಟ್ ಪಾಸ್ ದೊರೆಯುತ್ತದೆ!`,
        suggestions: ['ಬೆಂಬಲ ಬೆಲೆ ಎಷ್ಟು?', 'ಯಾವ ದಾಖಲೆಗಳು ಬೇಕು?', 'ಪಾವತಿ ಹೇಗೆ ಸಿಗುತ್ತದೆ?'],
        action: { label: '📅 ಸ್ಲಾಟ್ ಬುಕ್ ಮಾಡಿ', link: '/farmer/book' }
      };
    } else {
      return {
        reply: `📋 **Slot Booking Process (3 Easy Steps)**:\n\n` +
          `1. **Select Centre**: Choose your nearest APMC centre (Pune, Nashik, Nagpur, etc.).\n` +
          `2. **Choose Crop & Weight**: Select your harvest and quantity in quintals (max 50 qtl/booking).\n` +
          `3. **Pick Date & Time**: Choose Today/Tomorrow and a 1-hour operating window.\n\n` +
          `⏰ **Operating Windows**: 10:00-11:00, 11:00-12:00, 12:00-13:00, 14:00-15:00, 15:00-16:00, 16:00-17:00 (13:00-14:00 Lunch break).\n\n` +
          `🎫 You receive an instant Digital Gate Pass with Token Number (e.g. PF-1476)!`,
        suggestions: ['What are current MSP rates?', 'What documents should I bring?', 'How does DBT payment work?'],
        action: { label: '📅 Book a Slot', link: '/farmer/book' }
      };
    }
  }

  // 3. DBT Payments & Bank Account
  if (
    q.includes('payment') ||
    q.includes('dbt') ||
    q.includes('money') ||
    q.includes('bank') ||
    q.includes('paise') ||
    q.includes('account') ||
    q.includes('पैसे') ||
    q.includes('खाते') ||
    q.includes('बँक') ||
    q.includes('पेमेंट') ||
    q.includes('खाता') ||
    q.includes('भुगतान') ||
    q.includes('ਪੈਸੇ') ||
    q.includes('ਖਾਤਾ') ||
    q.includes('પૈસા') ||
    q.includes('డబ్బు') ||
    q.includes('ఖాతా') ||
    q.includes('ಹಣ') ||
    q.includes('ಖಾತೆ')
  ) {
    if (currentLang === 'mr') {
      return {
        reply: `💳 **शासकीय DBT बँक पेमेंट माहिती**:\n\n` +
          `• **थेट बँक जमा**: खरेदी पूर्ण झाल्यानंतर PFMS द्वारे २४ ते ४८ तासांच्या आत थेट तुमच्या आधार-लिंक्ड बँक खात्यात रक्कम जमा होते.\n` +
          `• **कोणतेही कमिशन नाही**: मध्यस्थ किंवा दलालांशिवाय १००% पूर्ण रक्कम हमीभावानुसार मिळते.\n` +
          `• **SMS अलर्ट**: पेमेंट जमा होताच PFMS UTR संदर्भासह मोबाईलवर तात्काळ SMS मिळतो.\n` +
          `• **स्थिती तपासा**: तुमच्या होम स्क्रीनवर 'सीझन विक्री ट्रॅकर' मध्ये पावती आणि पेमेंट स्थिती (PROCESSING / PAID) पाहू शकता.`,
        suggestions: ['हमीभाव दर काय आहेत?', 'कागदपत्रे कोणती लागतात?', 'खरेदी पावती कशी डाउनलोड करावी?']
      };
    } else if (currentLang === 'hi') {
      return {
        reply: `💳 **सरकारी DBT बैंक भुगतान विवरण**:\n\n` +
          `• **सीधे बैंक खाते में**: तुलाई पूरी होने के बाद २४ से ४८ घंटों में PFMS के माध्यम से आधार-लिंक्ड बैंक खाते में राशि ट्रांसफर होती है।\n` +
          `• **शून्य कमीशन**: बिना किसी बिचौलिये के सरकार द्वारा १००% राशि सीधे आपके खाते में दी जाती है।\n` +
          `• **SMS सूचना**: भुगतान होते ही PFMS UTR नंबर के साथ आपके मोबाइल पर तुरंत SMS आता है।\n` +
          `• **स्टेटस जांच**: होम पेज पर 'सीजन ट्रैकर' में आप रसीद और भुगतान की स्थिति (PROCESSING / PAID) देख सकते हैं।`,
        suggestions: ['समर्थन मूल्य क्या है?', 'कौन से दस्तावेज आवश्यक हैं?', 'स्लॉट कैसे बुक करें?']
      };
    } else if (currentLang === 'pa') {
      return {
        reply: `💳 **ਸਰਕਾਰੀ DBT ਬੈਂਕ ਭੁਗਤਾਨ ਵੇਰਵੇ**:\n\n` +
          `• **ਸਿੱਧਾ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ**: ਤੋਲ ਪੂਰਾ ਹੋਣ ਤੋਂ ਬਾਅਦ ੨੪ ਤੋਂ ੪੮ ਘੰਟਿਆਂ ਵਿੱਚ PFMS ਰਾਹੀਂ ਆਧਾਰ-ਲਿੰਕਡ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ ਰਕਮ ਟਰਾਂਸਫਰ ਹੁੰਦੀ ਹੈ।\n` +
          `• **ਜ਼ੀਰੋ ਕਮਿਸ਼ਨ**: ਬਿਨਾਂ ਕਿਸੇ ਵਿਚੋਲੇ ਦੇ ੧੦੦% ਪੂਰੀ ਰਕਮ ਸਰਕਾਰੀ MSP ਅਨੁਸਾਰ ਮਿਲਦੀ ਹੈ।\n` +
          `• **SMS ਅਲਰਟ**: ਭੁਗਤਾਨ ਹੁੰਦੇ ਹੀ PFMS UTR ਨੰਬਰ ਨਾਲ ਮੋਬਾਈਲ ਤੇ SMS ਆਉਂਦਾ ਹੈ।`,
        suggestions: ['ਸਮਰਥਨ ਮੁੱਲ ਕੀ ਹੈ?', 'ਦਸਤਾਵੇਜ਼ ਕਿਹੜੇ ਚਾਹੀਦੇ ਹਨ?']
      };
    } else if (currentLang === 'gu') {
      return {
        reply: `💳 **સરકારી DBT બેંક ચુકવણી વિગતો**:\n\n` +
          `• **સીધા બેંક ખાતામાં**: વજન પૂર્ણ થયા પછી ૨૪ થી ૪૮ કલાકમાં PFMS દ્વારા આધાર-લિંક્ડ બેંક ખાતામાં રકમ જમા થાય છે.\n` +
          `• **ઝીરો કમિશન**: કોઈ પણ વચેટીયા વગર ૧૦૦% સંપૂર્ણ રકમ સરકાર તરફથી મળે છે.\n` +
          `• **SMS ચેતવણી**: ચુકવણી થતાં જ PFMS UTR સંદર્ભ સાથે SMS આવે છે.`,
        suggestions: ['ટેકાના ભાવ શું છે?', 'જરૂરી દસ્તાવેજો કયા છે?']
      };
    } else if (currentLang === 'te') {
      return {
        reply: `💳 **ప్రభుత్వ DBT బ్యాంక్ చెల్లింపు వివరాలు**:\n\n` +
          `• **నేరుగా బ్యాంక్ ఖాతాలో**: తూకం పూర్తయిన తర్వాత ੨౪ నుండి ౪౮ గంటల్లో PFMS ద్వారా ఆధార్-లింక్డ్ బ్యాంక్ ఖాతాలో డబ్బు జమ అవుతుంది.\n` +
          `• **జీరో కమీషన్**: ఎలాంటి దళారులు లేకుండా ੧౦౦% పూర్తి మద్దతు ధర నేరుగా లభిస్తుంది.\n` +
          `• **SMS సమాచారం**: చెల్లింపు జరగగానే అధికారిక PFMS UTR నంబర్‌తో SMS అందుతుంది.`,
        suggestions: ['మద్దతు ధర ఎంత?', 'ఏ పత్రాలు అవసరం?']
      };
    } else if (currentLang === 'kn') {
      return {
        reply: `💳 **ಸರ್ಕಾರಿ DBT ಬ್ಯಾಂಕ್ ಪಾವತಿ ವಿವರಗಳು**:\n\n` +
          `• **ನೇರವಾಗಿ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ**: ತೂಕ ಪೂರ್ಣಗೊಂಡ ನಂತರ ೨೪ ರಿಂದ ೪೮ ಗಂಟೆಗಳಲ್ಲಿ PFMS ಮೂಲಕ ಆಧಾರ್-ಲಿಂಕ್ಡ್ ಖಾತೆಗೆ ಹಣ ಜಮೆಯಾಗುತ್ತದೆ.\n` +
          `• **ಶೂನ್ಯ ಕಮಿಷನ್**: ಮಧ್ಯವರ್ತಿಗಳಿಲ್ಲದೆ ೧೦೦% ಸಂಪೂರ್ಣ ಬೆಂಬಲ ಬೆಲೆ ಲಭ್ಯವಿದೆ.\n` +
          `• **SMS ಎಚ್ಚರಿಕೆ**: ಪಾವತಿಯಾದ ತಕ್ಷಣ ಅಧಿಕೃತ PFMS UTR ಸಂಖ್ಯೆಯೊಂದಿಗೆ SMS ಬರುತ್ತದೆ.`,
        suggestions: ['ಬೆಂಬಲ ಬೆಲೆ ಎಷ್ಟು?', 'ಯಾವ ದಾಖಲೆಗಳು ಬೇಕು?']
      };
    } else {
      return {
        reply: `💳 **Direct Benefit Transfer (DBT) Payment Info**:\n\n` +
          `• **Direct to Bank**: Payment is credited directly into your Aadhaar-linked bank account within 24 to 48 hours via PFMS.\n` +
          `• **Zero Middlemen**: 100% full MSP payment with no agent fees or hidden deductions.\n` +
          `• **Instant SMS**: Receive an SMS notification with official PFMS UTR transfer reference as soon as payment is dispatched.\n` +
          `• **Track Live**: Check payment state (PROCESSING / PAID) and download digital receipts in your Season Tracker.`,
        suggestions: ['What are current MSP rates?', 'What documents should I bring?', 'How do I book a slot?']
      };
    }
  }

  // 4. Documents Required
  if (
    q.includes('document') ||
    q.includes('aadhaar') ||
    q.includes('7/12') ||
    q.includes('satbara') ||
    q.includes('paper') ||
    q.includes('कागदपत्र') ||
    q.includes('आधार') ||
    q.includes('सातबारा') ||
    q.includes('दस्तावेज') ||
    q.includes('ਦਸਤਾਵੇਜ਼') ||
    q.includes('ਆਧਾਰ') ||
    q.includes('દસ્તાવેજ') ||
    q.includes('ಆಧಾರ್') ||
    q.includes('ದಾಖಲೆ')
  ) {
    if (currentLang === 'mr') {
      return {
        reply: `📄 **खरेदी केंद्रावर जाताना आणायची आवश्यक कागदपत्रे**:\n\n` +
          `१. 🪪 **आधार कार्ड** (मूळ प्रत किंवा झेरॉक्स)\n` +
          `२. 📜 **७/१२ (सातबारा) व ८-अ उतारा** (चालू हंगामाची पीक नोंद असलेला)\n` +
          `३. 🏦 **बँक पासबुक झेरॉक्स** (किंवा कॅन्सल्ड चेक DBT साठी)\n` +
          `४. 🎫 **KisanSathi डिजिटल गेट पास / टोकन नंबर** (मोबाईलमध्ये दाखवला तरी चालतो)\n\n` +
          `💡 *टीप: ई-केवायसी (e-KYC) पूर्ण असल्यास पडताळणी केवळ २ मिनिटांत पूर्ण होते!*`,
        suggestions: ['आर्द्रता व गुणवत्ता निकष काय आहेत?', 'स्लॉट कसा बुक करावा?']
      };
    } else if (currentLang === 'hi') {
      return {
        reply: `📄 **खरीद केंद्र पर आवश्यक दस्तावेज चेकलिस्ट**:\n\n` +
          `१. 🪪 **आधार कार्ड** (मूल प्रति या फोटोकॉपी)\n` +
          `२. 📜 **खतौनी / ७/१२ भू-अभिलेख** (चालू सीजन की फसल प्रविष्टि)\n` +
          `३. 🏦 **बैंक पासबुक प्रति** (DBT ट्रांसफर हेतु)\n` +
          `४. 🎫 **KisanSathi डिजिटल गेट पास / टोकन**\n\n` +
          `💡 *सुझाव: e-KYC पूरा होने पर गेट वेरिफिकेशन में केवल २ मिनट लगते हैं!*`,
        suggestions: ['नमी के नियम क्या हैं?', 'स्लॉट कैसे बुक करें?']
      };
    } else {
      return {
        reply: `📄 **Required Mandi Gate Documents Checklist**:\n\n` +
          `1. 🪪 **Aadhaar Card** (Original or copy for identity verification)\n` +
          `2. 📜 **7/12 Land Record / RTC** (Showing current season crop registration)\n` +
          `3. 🏦 **Bank Passbook / Cancelled Cheque** (For DBT payment processing)\n` +
          `4. 🎫 **KisanSathi Digital Gate Pass / Token Number** (On your mobile screen)\n\n` +
          `💡 *Tip: Completed Aadhaar e-KYC speeds up entry verification to under 2 minutes!*`,
        suggestions: ['What are moisture rules?', 'How do I book a slot?']
      };
    }
  }

  // 5. Moisture Norms & Grade A Quality Rules
  if (
    q.includes('moisture') ||
    q.includes('quality') ||
    q.includes('grade') ||
    q.includes('bonus') ||
    q.includes('ओलावा') ||
    q.includes('आर्द्रता') ||
    q.includes('गुणवत्ता') ||
    q.includes('नमी') ||
    q.includes('ਗੁਣਵੱਤਾ') ||
    q.includes('ਨਮੀ') ||
    q.includes('ભેજ') ||
    q.includes('తేమ') ||
    q.includes('ತೇವಾಂಶ')
  ) {
    if (currentLang === 'mr') {
      return {
        reply: `💧 **शासकीय आर्द्रता (Moisture) आणि गुणवत्ता नियम**:\n\n` +
          `• ⚖️ **कमाल आर्द्रता मर्यादा**: **१२.०%** किंवा त्यापेक्षा कमी असावी. (१२% पेक्षा जास्त ओलावा असल्यास माल नाकारला जाऊ शकतो).\n` +
          `• 🏆 **Grade A गुणवत्ता (उत्कृष्ट माल)**: हमीभावावर **+५% अतिरिक्त रोख बोनस** मिळतो!\n` +
          `• 🌾 **FAQ (Fair Average Quality)**: १००% पूर्ण शासकीय हमीभाव दर मिळतो.\n` +
          `• ⚠️ **Grade B**: -५% प्रतवारी समायोजन.\n\n` +
          `💡 *सल्ला: केंद्रावर येण्यापूर्वी धान्य उन्हात चांगले वाळवून आणल्यास हमखास Grade A मिळून जास्तीत जास्त नफा मिळतो!*`,
        suggestions: ['चालू हमीभाव काय आहेत?', 'कागदपत्रे कोणती लागतात?']
      };
    } else if (currentLang === 'hi') {
      return {
        reply: `💧 **सरकारी नमी (Moisture) एवं गुणवत्ता मानक**:\n\n` +
          `• ⚖️ **अधिकतम नमी सीमा**: **१२.०%** या उससे कम होनी चाहिए।\n` +
          `• 🏆 **Grade A गुणवत्ता**: न्यूनतम समर्थन मूल्य पर **+५% अतिरिक्त बोनस** दिया जाता है!\n` +
          `• 🌾 **FAQ (साधारण गुणवत्ता)**: १००% पूर्ण समर्थन मूल्य दर मिलता है।\n` +
          `• ⚠️ **Grade B**: -५% गुणवत्ता समायोजन।\n\n` +
          `💡 *सलाह: मंडी लाने से पहले फसल को धूप में अच्छी तरह सुखा लें ताकि अधिकतम समर्थन मूल्य मिल सके!*`,
        suggestions: ['वर्तमान समर्थन मूल्य क्या हैं?', 'स्लॉट कैसे बुक करें?']
      };
    } else {
      return {
        reply: `💧 **Official Moisture Norms & Quality Standards**:\n\n` +
          `• ⚖️ **Maximum Moisture Limit**: **12.0%** or lower. Lots exceeding 12% moisture may be rejected.\n` +
          `• 🏆 **Grade A Quality**: Receives an automatic **+5% Cash Bonus** above the base MSP!\n` +
          `• 🌾 **FAQ (Fair Average Quality)**: Receives 100% full Government MSP rate.\n` +
          `• ⚠️ **Grade B**: Subject to a -5% quality discount.\n\n` +
          `💡 *Recommendation: Dry your produce thoroughly in the sun before bringing it to the procurement centre to secure Grade A!*`,
        suggestions: ['What are current MSP rates?', 'How do I book a slot?']
      };
    }
  }

  // 6. General Help / Default Fallback in 7 Languages
  if (currentLang === 'mr') {
    return {
      reply: `🌾 **मी 'किसान सहाय्यक' - तुमचा सरकारी खरेदी मदतनीस आहे!**\n\n` +
        `मी तुम्हाला खालील बाबतीत मदत करू शकतो:\n` +
        `१. 💰 **हमीभाव दर** (गहू, सोयाबीन, कापूस, भात, तूर)\n` +
        `२. 📅 **स्लॉट बुकिंग** (केंद्राची वेळ, तारीख, कोटा मर्यादा)\n` +
        `३. 💳 **DBT बँक पेमेंट** (खात्यात पैसे जमा होण्याची प्रक्रिया)\n` +
        `४. 📄 **आवश्यक कागदपत्रे** (आधार, ७/१२, बँक पासबुक)\n` +
        `५. 💧 **आर्द्रता व गुणवत्ता नियम** (१२% मर्यादा, Grade A बोनस)\n\n` +
        `कृपया तुमचा प्रश्न विचारा किंवा खालील पर्यायांवर टॅप करा!`,
      suggestions: ['चालू हमीभाव दर काय आहेत?', 'स्लॉट कसा बुक करावा?', 'पैसे खात्यात कधी जमा होतात?', 'कोणती कागदपत्रे सोबत आणावी?']
    };
  } else if (currentLang === 'hi') {
    return {
      reply: `🌾 **मैं 'किसान सहायक' - आपकी सरकारी खरीद सहायता के लिए तत्पर हूँ!**\n\n` +
        `मैं आपकी इन विषयों में मदद कर सकता हूँ:\n` +
        `१. 💰 **समर्थन मूल्य (MSP)** (गेहूं, सोयाबीन, कपास, धान, अरहर)\n` +
        `२. 📅 **स्लॉट बुकिंग** (समय, तारीख और कोटा सीमा)\n` +
        `३. 💳 **DBT बैंक भुगतान** (खाते में सीधे पैसे आने की प्रक्रिया)\n` +
        `४. 📄 **आवश्यक दस्तावेज** (आधार, खतौनी, बैंक पासबुक)\n` +
        `५. 💧 **नमी और गुणवत्ता मानक** (१२% नमी, Grade A बोनस)\n\n` +
        `कृपया अपना प्रश्न लिखें या नीचे दिए गए विकल्पों पर टैप करें!`,
      suggestions: ['वर्तमान समर्थन मूल्य क्या हैं?', 'स्लॉट कैसे बुक करें?', 'पैसे कब तक खाते में आएंगे?', 'कौन से दस्तावेज आवश्यक हैं?']
    };
  } else if (currentLang === 'pa') {
    return {
      reply: `🌾 **ਮੈਂ 'ਕਿਸਾਨ ਸਹਾਇਕ' — ਤੁਹਾਡੀ ਸਰਕਾਰੀ ਖਰੀਦ ਸਹਾਇਤਾ ਲਈ ਹਾਜ਼ਰ ਹਾਂ!**\n\n` +
        `ਮੈਂ ਤੁਹਾਡੀ ਇਹਨਾਂ ਵਿਸ਼ਿਆਂ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ:\n` +
        `੧. 💰 **ਸਮਰਥਨ ਮੁੱਲ (MSP)** (ਕਣਕ, ਝੋਨਾ, ਨਰਮਾ, ਸੋਇਆਬੀਨ, ਤੂਰ)\n` +
        `੨. 📅 **ਸਲਾਟ ਬੁਕਿੰਗ** (ਸਮਾਂ, ਮਿਤੀ ਅਤੇ ਕੋਟਾ)\n` +
        `੩. 💳 **DBT ਬੈਂਕ ਭੁਗਤਾਨ** (ਸਿੱਧਾ ਖਾਤੇ ਵਿੱਚ ਪੈਸੇ ਆਉਣ ਦੀ ਪ੍ਰਕਿਰਿਆ)\n` +
        `੪. 📄 **ਜ਼ਰੂਰੀ ਦਸਤਾਵੇਜ਼** (ਆਧਾਰ, ਜ਼ਮੀਨ ਰਿਕਾਰਡ, ਬੈਂਕ ਪਾਸਬੁੱਕ)\n` +
        `੫. 💧 **ਨਮੀ ਅਤੇ ਗੁਣਵੱਤਾ ਮਿਆਰ** (੧੨% ਨਮੀ, Grade A ਬੋਨਸ)`,
      suggestions: ['ਮੌਜੂਦਾ MSP ਰੇਟ ਕੀ ਹਨ?', 'ਸਲਾਟ ਕਿਵੇਂ ਬੁੱਕ ਕਰੀਏ?', 'ਪੈਸੇ ਖਾਤੇ ਵਿੱਚ ਕਦੋਂ ਆਉਣਗੇ?']
    };
  } else if (currentLang === 'gu') {
    return {
      reply: `🌾 **હું 'કિસાન સહાયક' — તમારી સરકારી ખરીદ સહાય માટે ઉપલબ્ધ છું!**\n\n` +
        `હું તમને નીચેની બાબતોમાં મદદ કરી શકું છું:\n` +
        `૧. 💰 **ટેકાના ભાવ (MSP)** (ઘઉં, ડાંગર, કપાસ, સોયાબીન, તુવેર)\n` +
        `૨. 📅 **સ્લોટ બુકિંગ** (સમય, તારીખ અને મર્યાદા)\n` +
        `૩. 💳 **DBT બેંક ચુકવણી** (સીધા ખાતામાં પૈસા જમા થવાની વિગત)\n` +
        `૪. 📄 **જરૂરી દસ્તાવેજો** (આધાર કાર્ડ, ૭/૧૨, બેંક પાસબુક)\n` +
        `૫. 💧 **ભેજ અને ગુણવત્તા નિયમો** (૧૨% ભેજ, Grade A બોનસ)`,
      suggestions: ['ટેકાના ભાવ શું છે?', 'સ્લોટ કેવી રીતે બુક કરવો?', 'પૈસા ખાતામાં ક્યારે આવશે?']
    };
  } else if (currentLang === 'te') {
    return {
      reply: `🌾 **నేను 'కిసాన్ సహాయక్' — మీ ప్రభుత్వ సేకరణ సహాయకుడిని!**\n\n` +
        `నేను మీకు ఈ క్రింది విషయాలలో సహాయం చేయగలను:\n` +
        `੧. 💰 **కనీస మద్దతు ధరలు (MSP)** (గోధుమలు, వరి, పత్తి, సోయాబీన్, కందులు)\n` +
        `੨. 📅 **స్లాట్ బుకింగ్** (తేదీ, సమయం మరియు కోటా)\n` +
        `੩. 💳 **DBT బ్యాంక్ చెల్లింపులు** (ఖాతాలో డబ్బు జమ ప్రక్రియ)\n` +
        `੪. 📄 **అవసరమైన పత్రాలు** (ఆధార్, భూమి రికార్డులు, బ్యాంక్ పాస్‌బుక్)\n` +
        `੫. 💧 **తేమ & నాణ్యత నిబంధనలు** (੧੨% తేమ పరిమితి, Grade A బోనస్)`,
      suggestions: ['మద్దతు ధరలు ఎంత?', 'స్లాట్ ఎలా బుక్ చేయాలి?', 'డబ్బులు ఎప్పుడు వస్తాయి?']
    };
  } else if (currentLang === 'kn') {
    return {
      reply: `🌾 **ನಾನು 'ಕಿಸಾನ್ ಸಹಾಯಕ' — ನಿಮ್ಮ ಸರ್ಕಾರಿ ಖರೀದಿ ಸಹಾಯ ಸಹಾಯಕ!**\n\n` +
        `ನಾನು ನಿಮಗೆ ಈ ಕೆಳಗಿನ ವಿಷಯಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ:\n` +
        `೧. 💰 **ಕನಿಷ್ಠ ಬೆಂಬಲ ಬೆಲೆಗಳು (MSP)** (ಗೋಧಿ, ಭತ್ತ, ಹತ್ತಿ, ಸೋಯಾಬೀನ್, ತೊಗರಿ)\n` +
        `೨. 📅 **ಸ್ಲಾಟ್ ಬುಕಿಂಗ್** (ದಿನಾಂಕ, ಸಮಯ ಮತ್ತು ಕೋಟಾ)\n` +
        `೩. 💳 **DBT ಬ್ಯಾಂಕ್ ಪಾವತಿ** (ಖಾತೆಗೆ ಹಣ ಜಮೆ ವಿವರ)\n` +
        `೪. 📄 **ಅಗತ್ಯ ದಾಖಲೆಗಳು** (ಆಧಾರ್, ಪಹಣಿ/RTC, ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್)\n` +
        `೫. 💧 **ತೇವಾಂಶ ಮತ್ತು ಗುಣಮಟ್ಟ ನಿಯಮಗಳು** (೧೨% ತೇವಾಂಶ ಮಿತಿ, Grade A ಬೋನಸ್)`,
      suggestions: ['ಬೆಂಬಲ ಬೆಲೆಗಳು ಎಷ್ಟು?', 'ಸ್ಲಾಟ್ ಬುಕ್ ಮಾಡುವುದು ಹೇಗೆ?', 'ಹಣ ಯಾವಾಗ ಜಮೆಯಾಗುತ್ತದೆ?']
    };
  } else {
    return {
      reply: `🌾 **I am 'Kisan Sahayak' — Your APMC Procurement AI Assistant!**\n\n` +
        `I can help you with:\n` +
        `1. 💰 **Government MSP Rates** (Wheat, Soybean, Cotton, Paddy, Tur)\n` +
        `2. 📅 **Slot Booking & Quotas** (Operating hours, 50 qtl max limit)\n` +
        `3. 💳 **Direct Benefit Transfer (DBT)** (PFMS direct credit timeline)\n` +
        `4. 📄 **Documents Required** (Aadhaar, 7/12 Land Record, Bank passbook)\n` +
        `5. 💧 **Moisture & Quality Norms** (12% moisture limit, Grade A bonus)\n\n` +
        `Feel free to ask any question or tap a suggestion below!`,
      suggestions: ['What are current MSP rates?', 'How do I book a slot?', 'How does DBT payment work?', 'What documents should I bring?']
    };
  }
}

// Route: POST /api/chatbot/ask
router.post('/ask', (req, res) => {
  const { query, lang = 'mr' } = req.body || {};
  const response = answerFarmerQuery(query, lang);
  res.json(response);
});

module.exports = router;
