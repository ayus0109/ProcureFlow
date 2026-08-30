/**
 * backend/routes/chatbot.js
 *
 * Kisan Sahayak / Farmer Help & Support AI Chatbot Knowledge Engine.
 * Provides instant, highly accurate GovTech guidance in Marathi, Hindi & English.
 */

const express = require('express');
const { CROPS, SLOT_WINDOWS } = require('../config/constants');
const { getCentresWithStats } = require('../services/centreService');
const { db } = require('../db');

const router = express.Router();

// Knowledge Base Topics & Resolution
function answerFarmerQuery(query = '', lang = 'mr') {
  const q = query.toLowerCase().trim();
  const isMr = lang === 'mr';
  const isHi = lang === 'hi';

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
    q.includes('गेहूं') ||
    q.includes('गहू') ||
    q.includes('wheat') ||
    q.includes('soybean') ||
    q.includes('सोयाबीन') ||
    q.includes('cotton') ||
    q.includes('कापूस') ||
    q.includes('कपास') ||
    q.includes('paddy') ||
    q.includes('धान') ||
    q.includes('भात') ||
    q.includes('tur') ||
    q.includes('तूर') ||
    q.includes('अरहर')
  ) {
    if (isMr) {
      return {
        reply: `🌾 **चालू हंगाम शासकीय हमीभाव (MSP 2026)**:\n\n` +
          `• 🌾 **गहू (Wheat)**: ₹२,४२५ / क्विंटल\n` +
          `• 🌱 **सोयाबीन (Soybean)**: ₹४,८९२ / क्विंटल\n` +
          `• ☁️ **कापूस (Cotton)**: ₹७,५२१ / क्विंटल\n` +
          `• 🍚 **भात / धान (Paddy)**: ₹२,३०० / क्विंटल\n` +
          `• 🌿 **तूर / अरहर (Tur)**: ₹७,५५० / क्विंटल\n\n` +
          `💡 *टीप: जर तुमचा माल 'Grade A' गुणवत्तेचा असेल, तर हमीभावावर अतिरिक्त +५% गुणवत्ता बोनस थेट बँक खात्यात मिळतो!*`,
        suggestions: [
          'स्लॉट कसा बुक करावा?',
          'गुणवत्ता आणि आर्द्रता नियम काय आहेत?',
          'पैसे खात्यात कधी जमा होतात?'
        ],
        action: { label: '📅 स्लॉट बुक करा', link: '/farmer/book' }
      };
    } else if (isHi) {
      return {
        reply: `🌾 **वर्तमान सरकारी न्यूनतम समर्थन मूल्य (MSP 2026)**:\n\n` +
          `• 🌾 **गेहूं (Wheat)**: ₹२,४२५ / क्विंटल\n` +
          `• 🌱 **सोयाबीन (Soybean)**: ₹४,८९२ / क्विंटल\n` +
          `• ☁️ **कपास (Cotton)**: ₹७,५२१ / क्विंटल\n` +
          `• 🍚 **धान (Paddy)**: ₹२,३०० / क्विंटल\n` +
          `• 🌿 **तूर / अरहर (Tur)**: ₹७,५५० / क्विंटल\n\n` +
          `💡 *सुझाव: 'Grade A' गुणवत्ता होने पर आधार दर पर +५% अतिरिक्त बोनस सीधे बैंक खाते में दिया जाता है!*`,
        suggestions: [
          'स्लॉट कैसे बुक करें?',
          'नमी और गुणवत्ता नियम क्या हैं?',
          'पैसे कब तक खाते में आएंगे?'
        ],
        action: { label: '📅 स्लॉट बुक करें', link: '/farmer/book' }
      };
    } else {
      return {
        reply: `🌾 **Government Minimum Support Prices (MSP 2026)**:\n\n` +
          `• 🌾 **Wheat**: ₹2,425 / Quintal\n` +
          `• 🌱 **Soybean**: ₹4,892 / Quintal\n` +
          `• ☁️ **Cotton**: ₹7,521 / Quintal\n` +
          `• 🍚 **Paddy (Rice)**: ₹2,300 / Quintal\n` +
          `• 🌿 **Tur (Arhar)**: ₹7,550 / Quintal\n\n` +
          `💡 *Note: Crops meeting 'Grade A' standards receive a +5% quality bonus over the base MSP!*`,
        suggestions: [
          'How do I book a slot?',
          'What are moisture and quality rules?',
          'How does DBT payment work?'
        ],
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
    q.includes('तारीख') ||
    q.includes('वेळ') ||
    q.includes('नोंदणी') ||
    q.includes('बुकिंग')
  ) {
    if (isMr) {
      return {
        reply: `📋 **खरेदी स्लॉट बुकिंग प्रक्रिया (३ सोपे टप्पे)**:\n\n` +
          `१. **केंद्र निवडा**: जवळचे APMC खरेदी केंद्र (उदा. पुणे, नाशिक, नागपूर) निवडा.\n` +
          `२. **पीक व वजन**: तुमचे पीक (गहू/सोयाबीन) व क्विंटलमध्ये वजन टाका (कमाल ५० क्विंटल/बुकिंग).\n` +
          `३. **तारीख व वेळ**: आज किंवा उद्याचा १ तासाचा सोयीचा स्लॉट निवडून कन्फर्म करा.\n\n` +
          `⏰ **कामाचे स्लॉट**: १०:००-११:००, ११:००-१२:००, १२:००-१३:००, १४:००-१५:००, १५:००-१६:००, १६:००-१७:०० (दुपारी १ ते २ भोजन सुट्टी).\n\n` +
          `🎫 बुकिंग पूर्ण होताच डिजिटल गेट पास (उदा. PF-1476) त्वरित तयार होतो!`,
        suggestions: [
          'हमीभाव दर काय आहेत?',
          'कोणती कागदपत्रे सोबत आणावी?',
          'पैसे खात्यात कधी जमा होतात?'
        ],
        action: { label: '📅 आताच स्लॉट बुक करा', link: '/farmer/book' }
      };
    } else if (isHi) {
      return {
        reply: `📋 **स्लॉट बुकिंग प्रक्रिया (३ आसान चरण)**:\n\n` +
          `१. **केंद्र चुनें**: अपना नजदीकी सरकारी खरीद केंद्र चुनें (जैसे पुणे, नासिक, नागपुर).\n` +
          `२. **फसल और मात्रा**: फसल चुनें और क्विंटल में मात्रा दर्ज करें (अधिकतम ५० क्विंटल/बुकिंग).\n` +
          `३. **तारीख और समय**: आज या कल का १ घंटे का समय स्लॉट चुनकर पुष्टि करें.\n\n` +
          `⏰ **कार्य समय स्लॉट**: १०:००-११:००, ११:००-१२:००, १२:००-१३:००, १४:००-१५:००, १५:००-१६:००, १६:००-१७:०० (दोपहर १ से २ लंच ब्रेक).\n\n` +
          `🎫 बुकिंग होते ही डिजिटल गेट पास (जैसे PF-1476) तुरंत मिल जाता है!`,
        suggestions: [
          'समर्थन मूल्य क्या है?',
          'मंडी में कौन से दस्तावेज चाहिए?',
          'डीबीटी भुगतान कैसे मिलता है?'
        ],
        action: { label: '📅 अभी स्लॉट बुक करें', link: '/farmer/book' }
      };
    } else {
      return {
        reply: `📋 **Slot Booking Process (3 Easy Steps)**:\n\n` +
          `1. **Select Centre**: Choose your nearest APMC centre (Pune, Nashik, Nagpur, etc.).\n` +
          `2. **Choose Crop & Weight**: Select your harvest and quantity in quintals (max 50 qtl/booking).\n` +
          `3. **Pick Date & Time**: Choose Today/Tomorrow and a 1-hour operating window.\n\n` +
          `⏰ **Operating Windows**: 10:00-11:00, 11:00-12:00, 12:00-13:00, 14:00-15:00, 15:00-16:00, 16:00-17:00 (13:00-14:00 Lunch break).\n\n` +
          `🎫 You receive an instant Digital Gate Pass with Token Number (e.g. PF-1476)!`,
        suggestions: [
          'What are current MSP rates?',
          'What documents should I bring?',
          'How does DBT payment work?'
        ],
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
    q.includes('जमा')
  ) {
    if (isMr) {
      return {
        reply: `💳 **शासकीय DBT बँक पेमेंट माहिती**:\n\n` +
          `• **थेट बँक जमा**: खरेदी पूर्ण झाल्यानंतर PFMS द्वारे २४ ते ४८ तासांच्या आत थेट तुमच्या आधार-लिंक्ड बँक खात्यात रक्कम जमा होते.\n` +
          `• **कोणतेही कमिशन नाही**: मध्यस्थ किंवा दलालांशिवाय १००% पूर्ण रक्कम हमीभावानुसार मिळते.\n` +
          `• **SMS अलर्ट**: पेमेंट जमा होताच PFMS UTR संदर्भासह मोबाईलवर तात्काळ SMS मिळतो.\n` +
          `• **स्थिती तपासा**: तुमच्या होम स्क्रीनवर 'सीझन विक्री ट्रॅकर' मध्ये पावती आणि पेमेंट स्थिती (PROCESSING / PAID) पाहू शकता.`,
        suggestions: [
          'हमीभाव दर काय आहेत?',
          'कागदपत्रे कोणती लागतात?',
          'खरेदी पावती कशी डाउनलोड करावी?'
        ]
      };
    } else if (isHi) {
      return {
        reply: `💳 **सरकारी DBT बैंक भुगतान विवरण**:\n\n` +
          `• **सीधे बैंक खाते में**: तुलाई पूरी होने के बाद २४ से ४८ घंटों में PFMS के माध्यम से आधार-लिंक्ड बैंक खाते में राशि ट्रांसफर होती है।\n` +
          `• **शून्य कमीशन**: बिना किसी बिचौलिये के सरकार द्वारा १००% राशि सीधे आपके खाते में दी जाती है।\n` +
          `• **SMS सूचना**: भुगतान होते ही PFMS UTR नंबर के साथ आपके मोबाइल पर तुरंत SMS आता है।\n` +
          `• **स्टेटस जांच**: होम पेज पर 'सीजन ट्रैकर' में आप रसीद और भुगतान की स्थिति (PROCESSING / PAID) देख सकते हैं।`,
        suggestions: [
          'समर्थन मूल्य क्या है?',
          'कौन से दस्तावेज आवश्यक हैं?',
          'स्लॉट कैसे बुक करें?'
        ]
      };
    } else {
      return {
        reply: `💳 **Direct Benefit Transfer (DBT) Payment Info**:\n\n` +
          `• **Direct to Bank**: Payment is credited directly into your Aadhaar-linked bank account within 24 to 48 hours via PFMS.\n` +
          `• **Zero Middlemen**: 100% full MSP payment with no agent fees or hidden deductions.\n` +
          `• **Instant SMS**: Receive an SMS notification with official PFMS UTR transfer reference as soon as payment is dispatched.\n` +
          `• **Track Live**: Check payment state (PROCESSING / PAID) and download digital receipts in your Season Tracker.`,
        suggestions: [
          'What are current MSP rates?',
          'What documents should I bring?',
          'How do I book a slot?'
        ]
      };
    }
  }

  // 4. Documents Required (Aadhaar, 7/12, Passbook)
  if (
    q.includes('document') ||
    q.includes('aadhaar') ||
    q.includes('7/12') ||
    q.includes('satbara') ||
    q.includes('paper') ||
    q.includes('कागदपत्र') ||
    q.includes('कागदपत्रे') ||
    q.includes('आधार') ||
    q.includes('सातबारा') ||
    q.includes('दस्तावेज') ||
    q.includes('कागजात')
  ) {
    if (isMr) {
      return {
        reply: `📄 **खरेदी केंद्रावर जाताना आणायची आवश्यक कागदपत्रे**:\n\n` +
          `१. 🪪 **आधार कार्ड** (मूळ प्रत किंवा झेरॉक्स)\n` +
          `२. 📜 **७/१२ (सातबारा) व ८-अ उतारा** (चालू हंगामाची पीक नोंद असलेला)\n` +
          `३. 🏦 **बँक पासबुक झेरॉक्स** (किंवा कॅन्सल्ड चेक DBT साठी)\n` +
          `४. 🎫 **ProcureFlow डिजिटल गेट पास / टोकन नंबर** (मोबाईलमध्ये दाखवला तरी चालतो)\n\n` +
          `💡 *टीप: ई-केवायसी (e-KYC) पूर्ण असल्यास पडताळणी केवळ २ मिनिटांत पूर्ण होते!*`,
        suggestions: [
          'आर्द्रता व गुणवत्ता निकष काय आहेत?',
          'स्लॉट कसा बुक करावा?',
          'केंद्राची वेळ काय आहे?'
        ]
      };
    } else if (isHi) {
      return {
        reply: `📄 **खरीद केंद्र पर आवश्यक दस्तावेज चेकलिस्ट**:\n\n` +
          `१. 🪪 **आधार कार्ड** (मूल प्रति या फोटोकॉपी)\n` +
          `२. 📜 **७/१२ खतौनी / भूलेख रिकॉर्ड** (फसल प्रविष्टि सहित)\n` +
          `३. 🏦 **बैंक पासबुक फोटोकॉपी** (DBT भुगतान हेतु)\n` +
          `४. 🎫 **ProcureFlow डिजिटल गेट पास / टोकन नंबर** (मोबाइल स्क्रीन मान्य है)\n\n` +
          `💡 *सुझाव: e-KYC सत्यापित होने पर गेट वेरिफिकेशन मात्र २ मिनट में हो जाता है!*`,
        suggestions: [
          'नमी की अधिकतम सीमा क्या है?',
          'स्लॉट कैसे बुक करें?',
          'भुगतान कब मिलेगा?'
        ]
      };
    } else {
      return {
        reply: `📄 **Required Documents Checklist at APMC Centre**:\n\n` +
          `1. 🪪 **Aadhaar Card** (Original or copy)\n` +
          `2. 📜 **7/12 Land Record (Satbara Extract)** with current crop sowing record\n` +
          `3. 🏦 **Bank Passbook Copy / Cancelled Cheque** for DBT credit\n` +
          `4. 🎫 **ProcureFlow Digital Gate Pass / Token Number** (on mobile screen)\n\n` +
          `💡 *Tip: e-KYC verified farmers pass gate verification in under 2 minutes!*`,
        suggestions: [
          'What is the moisture limit?',
          'How do I book a slot?',
          'What are current MSP rates?'
        ]
      };
    }
  }

  // 5. Moisture & Quality Standards (FAQ Norms)
  if (
    q.includes('moisture') ||
    q.includes('quality') ||
    q.includes('faq') ||
    q.includes('grade') ||
    q.includes('reject') ||
    q.includes('आर्द्रता') ||
    q.includes('ओलावा') ||
    q.includes('गुणवत्ता') ||
    q.includes('नमी') ||
    q.includes('क्वालिटी') ||
    q.includes('ग्रेड')
  ) {
    if (isMr) {
      return {
        reply: `💧 **शासकीय गुणवत्ता व आर्द्रता (Moisture) निकष**:\n\n` +
          `• 💧 **कमाल आर्द्रता मर्यादा**: १२.०% (Moisture $\\le 12.0\\%$)\n` +
          `• 🌾 **FAQ प्रत (Fair Average Quality)**: १००% हमीभाव मिळतो (उदा. गहू ₹२,४२५/क्विंटल).\n` +
          `• ⭐ **Grade A प्रत**: उच्च गुणवत्तेसाठी अतिरिक्त +५% बोनस मिळतो (उदा. गहू ₹२,५४६.२५/क्विंटल).\n` +
          `• 🚫 **कचरा व इतर घटक**: कचरा/माती १% पेक्षा कमी आणि किडलेले दाणे २% पेक्षा कमी असावेत.\n\n` +
          `💡 *सुझाव: माल केंद्रावर आणण्यापूर्वी उन्हात व्यवस्थित वाळवून आणावा, जेणेकरून आर्द्रता १२% पेक्षा कमी राहील.*`,
        suggestions: [
          'हमीभाव दर काय आहेत?',
          'कागदपत्रे कोणती लागतात?',
          'स्लॉट कसा बुक करावा?'
        ]
      };
    } else if (isHi) {
      return {
        reply: `💧 **सरकारी गुणवत्ता और नमी (Moisture) मानक**:\n\n` +
          `• 💧 **अधिकतम नमी सीमा**: १२.०% (Moisture $\\le 12.0\\%$)\n` +
          `• 🌾 **FAQ मानक**: १००% आधार समर्थन मूल्य (जैसे गेहूं ₹२,४२५/क्विंटल).\n` +
          `• ⭐ **Grade A गुणवत्ता**: उत्कृष्ट अनाज पर +५% अतिरिक्त प्रीमियम बोनस (जैसे गेहूं ₹२,५४६.२५/क्विंटल).\n` +
          `• 🚫 **विदेशी तत्व**: मिट्टी/कचरा १% से कम और क्षतिग्रस्त दाने २% से कम होने चाहिए।\n\n` +
          `💡 *सुझाव: मंडी लाने से पहले फसल को अच्छी तरह सुखा लें ताकि नमी १२% के भीतर रहे।*`,
        suggestions: [
          'समर्थन मूल्य क्या है?',
          'दस्तावेज कौन से चाहिए?',
          'स्लॉट कैसे बुक करें?'
        ]
      };
    } else {
      return {
        reply: `💧 **Government Quality & Moisture (FAQ) Standards**:\n\n` +
          `• 💧 **Max Moisture Limit**: $\\le 12.0\\%$\n` +
          `• 🌾 **FAQ Grade (Fair Average Quality)**: Receives 100% base MSP (e.g. Wheat ₹2,425/qtl).\n` +
          `• ⭐ **Grade A Standard**: Receives an extra +5% quality bonus (e.g. Wheat ₹2,546.25/qtl).\n` +
          `• 🚫 **Foreign Matter**: Dust/stones $\\le 1.0\\%$, damaged grains $\\le 2.0\\%$.\n\n` +
          `💡 *Tip: Dry grains under direct sunlight before bringing to the mandi to ensure moisture is under 12%.*`,
        suggestions: [
          'What are current MSP rates?',
          'What documents should I bring?',
          'How do I book a slot?'
        ]
      };
    }
  }

  // 6. Centres, Locations & Congestion
  if (
    q.includes('centre') ||
    q.includes('center') ||
    q.includes('location') ||
    q.includes('mandi') ||
    q.includes('pune') ||
    q.includes('nashik') ||
    q.includes('nagpur') ||
    q.includes('aurangabad') ||
    q.includes('kolhapur') ||
    q.includes('केंद्र') ||
    q.includes('मंडी') ||
    q.includes('पुणे') ||
    q.includes('नाशिक') ||
    q.includes('नागपूर') ||
    q.includes('औरंगाबाद') ||
    q.includes('कोल्हापूर') ||
    q.includes('गर्दी') ||
    q.includes('भीड़')
  ) {
    if (isMr) {
      return {
        reply: `🏛️ **सक्रिय APMC खरेदी केंद्रे आणि स्थिती**:\n\n` +
          `• 🏛️ **पुणे केंद्र (Pune)**: कमी गर्दी (Low) • सरासरी प्रतीक्षा ~३०-३५ मिनिटे\n` +
          `• 🏛️ **औरंगाबाद केंद्र (Aurangabad)**: कमी गर्दी (Low) • सरासरी प्रतीक्षा ~३५-४० मिनिटे\n` +
          `• 🏛️ **नाशिक केंद्र (Nashik)**: मध्यम गर्दी (Moderate) • सरासरी प्रतीक्षा ~१.५ तास\n` +
          `• 🏛️ **कोल्हापूर केंद्र (Kolhapur)**: मध्यम गर्दी (Moderate) • सरासरी प्रतीक्षा ~२ तास\n` +
          `• 🏛️ **नागपूर केंद्र (Nagpur)**: जास्त गर्दी (High) • सरासरी प्रतीक्षा ~४ तास\n\n` +
          `💡 *सुझाव: 'Low' गर्दी असलेले केंद्र निवडल्यास तुमचा माल ३० मिनिटांत मोजून होतो!*`,
        suggestions: [
          'कमी गर्दीच्या केंद्रात स्लॉट बुक करा',
          'हमीभाव दर काय आहेत?',
          'कामाची वेळ काय आहे?'
        ],
        action: { label: '📍 खरेदी केंद्रे तपासा', link: '/farmer/book' }
      };
    } else if (isHi) {
      return {
        reply: `🏛️ **सक्रिय APMC खरीद केंद्र और स्थिति**:\n\n` +
          `• 🏛️ **पुणे केंद्र (Pune)**: कम भीड़ (Low) • औसत प्रतीक्षा ~३०-३५ मिनट\n` +
          `• 🏛️ **औरंगाबाद केंद्र (Aurangabad)**: कम भीड़ (Low) • औसत प्रतीक्षा ~३५-४० मिनट\n` +
          `• 🏛️ **नासिक केंद्र (Nashik)**: मध्यम भीड़ (Moderate) • औसत प्रतीक्षा ~१.५ घंटे\n` +
          `• 🏛️ **कोल्हापुर केंद्र (Kolhapur)**: मध्यम भीड़ (Moderate) • औसत प्रतीक्षा ~२ घंटे\n` +
          `• 🏛️ **नागपुर केंद्र (Nagpur)**: अधिक भीड़ (High) • औसत प्रतीक्षा ~४ घंटे\n\n` +
          `💡 *सुझाव: 'Low' भीड़ वाला केंद्र चुनने पर तुलाई ३० मिनट के भीतर पूरी हो जाती है!*`,
        suggestions: [
          'कम भीड़ वाले केंद्र पर स्लॉट बुक करें',
          'समर्थन मूल्य क्या है?',
          'कार्य समय क्या है?'
        ],
        action: { label: '📍 खरीद केंद्र देखें', link: '/farmer/book' }
      };
    } else {
      return {
        reply: `🏛️ **Active APMC Centres & Live Congestion**:\n\n` +
          `• 🏛️ **Pune Center**: Low Congestion • Avg. wait ~30-35 mins\n` +
          `• 🏛️ **Aurangabad Center**: Low Congestion • Avg. wait ~35-40 mins\n` +
          `• 🏛️ **Nashik Center**: Moderate Congestion • Avg. wait ~1.5 hrs\n` +
          `• 🏛️ **Kolhapur Center**: Moderate Congestion • Avg. wait ~2 hrs\n` +
          `• 🏛️ **Nagpur Center**: High Congestion • Avg. wait ~4 hrs\n\n` +
          `💡 *Tip: Selecting a 'Low' congestion centre ensures you finish weighment in under 35 minutes!*`,
        suggestions: [
          'Book slot at Low congestion centre',
          'What are current MSP rates?',
          'What are operating hours?'
        ],
        action: { label: '📍 View Centres', link: '/farmer/book' }
      };
    }
  }

  // 7. Token & Live Queue Tracker
  if (
    q.includes('queue') ||
    q.includes('token') ||
    q.includes('live') ||
    q.includes('wait') ||
    q.includes('रांग') ||
    q.includes('टोकन') ||
    q.includes('नंबर') ||
    q.includes('प्रतीक्षा') ||
    q.includes('गेट पास') ||
    q.includes('पास')
  ) {
    if (isMr) {
      return {
        reply: `⏳ **लाइव्ह रांग व डिजिटल टोकन प्रणाली**:\n\n` +
          `• **डिजिटल टोकन (उदा. PF-1476)**: स्लॉट बुक करताच तुम्हाला टोकन आणि रांगेतील अचूक क्रमांक मिळतो.\n` +
          `• **थेट ट्रॅकिंग**: शेतकरी होम पेजवर तुमची रांग आपोआप पुढे जाताना लाइव्ह दिसते (रिफ्रेश करण्याची गरज नाही).\n` +
          `• **अचूक वेळ (Reach By Time)**: जेव्हा तुमचा नंबर जवळ येतो, तेव्हा 'केंद्रावर पोहचा' अशी अचूक वेळ दाखवली जाते.\n` +
          `• **काऊंटरवर बोलाविणे**: तुमचा नंबर आल्यावर काऊंटरचा रंग बदलतो व आवाजी सूचना मिळते.`,
        suggestions: [
          'स्लॉट कसा बुक करावा?',
          'कागदपत्रे कोणती लागतात?',
          'पैसे खात्यात कधी जमा होतात?'
        ]
      };
    } else if (isHi) {
      return {
        reply: `⏳ **लाइव कतार और डिजिटल टोकन सिस्टम**:\n\n` +
          `• **डिजिटल टोकन (जैसे PF-1476)**: स्लॉट बुक करते ही आपको टोकन और कतार में स्थान मिल जाता है।\n` +
          `• **रियल-टाइम ट्रैकिंग**: किसान होम पेज पर कतार लाइव अपडेट होती है (पेज रिफ्रेश करने की जरूरत नहीं)।\n` +
          `• **पहुंचने का समय (Reach By Time)**: स्लॉट के अनुसार केंद्र पर पहुंचने का सही समय स्क्रीन पर दिखता है।\n` +
          `• **काउंटर कॉल**: आपकी बारी आते ही काउंटर पर बुलावा आता है और SMS सूचना मिलती है।`,
        suggestions: [
          'स्लॉट कैसे बुक करें?',
          'दस्तावेज कौन से चाहिए?',
          'डीबीटी भुगतान कब मिलता है?'
        ]
      };
    } else {
      return {
        reply: `⏳ **Live Queue & Digital Token System**:\n\n` +
          `• **Digital Token (e.g. PF-1476)**: Automatically assigned upon booking with exact queue position.\n` +
          `• **Real-Time Tracking**: Your queue moves forward live on your home screen without refreshing.\n` +
          `• **Reach-By Time**: Displays the exact recommended arrival time inside your booked window.\n` +
          `• **Counter Call**: Your token flashes with an alert when the weighment counter calls you forward.`,
        suggestions: [
          'How do I book a slot?',
          'What documents should I bring?',
          'How does DBT payment work?'
        ]
      };
    }
  }

  // 8. General Help / Default Fallback
  if (isMr) {
    return {
      reply: `🌾 **मी 'किसान सहाय्यक' - तुमचा सरकारी खरेदी मदतनीस आहे!**\n\n` +
        `मी तुम्हाला खालील बाबतीत मदत करू शकतो:\n` +
        `१. 💰 **हमीभाव दर** (गहू, सोयाबीन, कापूस, भात, तूर)\n` +
        `२. 📅 **स्लॉट बुकिंग** (केंद्राची वेळ, तारीख, कोटा मर्यादा)\n` +
        `३. 💳 **DBT बँक पेमेंट** (खात्यात पैसे जमा होण्याची प्रक्रिया)\n` +
        `४. 📄 **आवश्यक कागदपत्रे** (आधार, ७/१२, बँक पासबुक)\n` +
        `५. 💧 **आर्द्रता व गुणवत्ता नियम** (१२% मर्यादा, Grade A बोनस)\n\n` +
        `कृपया तुमचा प्रश्न विचारा किंवा खालील पर्यायांवर टॅप करा!`,
      suggestions: [
        'चालू हमीभाव दर काय आहेत?',
        'स्लॉट कसा बुक करावा?',
        'पैसे खात्यात कधी जमा होतात?',
        'कोणती कागदपत्रे सोबत आणावी?'
      ]
    };
  } else if (isHi) {
    return {
      reply: `🌾 **मैं 'किसान सहायक' - आपकी सरकारी खरीद सहायता के लिए तत्पर हूँ!**\n\n` +
        `मैं आपकी इन विषयों में मदद कर सकता हूँ:\n` +
        `१. 💰 **समर्थन मूल्य (MSP)** (गेहूं, सोयाबीन, कपास, धान, अरहर)\n` +
        `२. 📅 **स्लॉट बुकिंग** (समय, तारीख और कोटा सीमा)\n` +
        `३. 💳 **DBT बैंक भुगतान** (खाते में सीधे पैसे आने की प्रक्रिया)\n` +
        `४. 📄 **आवश्यक दस्तावेज** (आधार, खतौनी, बैंक पासबुक)\n` +
        `५. 💧 **नमी और गुणवत्ता मानक** (१२% नमी, Grade A बोनस)\n\n` +
        `कृपया अपना प्रश्न लिखें या नीचे दिए गए विकल्पों पर टैप करें!`,
      suggestions: [
        'वर्तमान समर्थन मूल्य क्या हैं?',
        'स्लॉट कैसे बुक करें?',
        'पैसे कब तक खाते में आएंगे?',
        'कौन से दस्तावेज आवश्यक हैं?'
      ]
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
      suggestions: [
        'What are current MSP rates?',
        'How do I book a slot?',
        'How does DBT payment work?',
        'What documents should I bring?'
      ]
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
