/**
 * frontend/src/utils/localizedMessages.js
 *
 * Provides dynamic localization for SMS, WhatsApp dispatches, and live system notifications
 * across all 7 supported regional languages:
 * - English (en)
 * - Hindi (hi)
 * - Marathi (mr)
 * - Punjabi (pa)
 * - Gujarati (gu)
 * - Telugu (te)
 * - Kannada (kn)
 */

/**
 * Extracts key parameters from an SMS/WhatsApp log message.
 */
function extractParams(msg = '') {
  const tokenMatch = msg.match(/PF-[0-9A-Z]+/i) || msg.match(/\*([A-Z0-9-]+)\*/);
  const token = tokenMatch ? tokenMatch[1] || tokenMatch[0] : 'PF-TOKEN';

  const nameMatch =
    msg.match(/Dear\s+([A-Za-z\s]+?)(?:,|\s+your)/i) ||
    msg.match(/नमस्ते\s+([^\s,]+(?:\s+[^\s,]+)?)\s*जी/i) ||
    msg.match(/नमस्कार\s+([^\s,]+(?:\s+[^\s,]+)?)\s*जी/i);
  const farmerName = nameMatch ? nameMatch[1].trim() : 'Farmer';

  const dateMatch = msg.match(/(\d{4}-\d{2}-\d{2})/);
  const date = dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10);

  const timeMatch = msg.match(/\[?(\d{1,2}:\d{2}-\d{1,2}:\d{2})\]?/);
  const time = timeMatch ? timeMatch[1] : '14:00-15:00';

  const centreMatch =
    msg.match(/at\s+([A-Za-z\s]+?(?:Center|Centre|Mandi|APMC))/i) ||
    msg.match(/केंद्र:\s*([^\n\r]+)/i);
  const centre = centreMatch ? centreMatch[1].trim() : 'Procurement Center';

  const cropMatch =
    msg.match(/Crop:\s*([A-Za-z\s]+?)\s*\(/i) ||
    msg.match(/फसल:\s*([^\s(]+)/i) ||
    msg.match(/पीक:\s*([^\s(]+)/i);
  const crop = cropMatch ? cropMatch[1].trim() : 'Crop';

  const qtyMatch = msg.match(/\((\d+(?:\.\d+)?)\s*(?:qtl|quintal|क्विंटल)/i);
  const qty = qtyMatch ? qtyMatch[1] : '10';

  const arriveMatch =
    msg.match(/arrive by\s*(\d{1,2}:\d{2})/i) ||
    msg.match(/पहुंचें:\s*(\d{1,2}:\d{2})/i) ||
    msg.match(/पोहोचा:\s*(\d{1,2}:\d{2})/i);
  const arriveBy = arriveMatch ? arriveMatch[1] : time.split('-')[0] || '14:00';

  const counterMatch = msg.match(/Counter\s*#?(\d+)/i) || msg.match(/काउंटर\s*#?(\d+)/i);
  const counterNum = counterMatch ? counterMatch[1] : '1';

  const amtMatch = msg.match(/₹?\s*([0-9,]+(?:\.\d{2})?)/) || msg.match(/Rs\.?\s*([0-9,]+(?:\.\d{2})?)/i);
  const amount = amtMatch ? amtMatch[1] : '0';

  const refMatch = msg.match(/Ref:\s*([A-Za-z0-9-]+)/i) || msg.match(/संदर्भ:\s*([A-Za-z0-9-]+)/i);
  const ref = refMatch ? refMatch[1] : 'PFMS-DBT-TXN';

  return { token, farmerName, date, time, centre, crop, qty, arriveBy, counterNum, amount, ref };
}

/**
 * Localizes an SMS / WhatsApp log entry to the target language.
 */
export function formatLogMessage(log, lang = 'en', t) {
  if (!log) return '';
  const type = log.type || '';
  const channel = log.channel || 'SMS';
  const raw = log.message || '';
  const p = extractParams(raw);

  // 1. BOOKING CONFIRMED
  if (type === 'BOOKING_CONFIRMED' || raw.includes('Mandi Pass') || raw.includes('is BOOKED')) {
    if (channel === 'WHATSAPP') {
      switch (lang) {
        case 'hi':
          return `🌾 *किसानसाथी मंडी पास*\n` +
            `नमस्ते ${p.farmerName} जी, आपका टोकन *${p.token}* बुक हो चुका है।\n` +
            `📅 दिनांक: ${p.date} [${p.time}]\n` +
            `🏛️ केंद्र: ${p.centre}\n` +
            `🌾 फसल: ${p.crop} (${p.qty} क्विंटल)\n` +
            `⏰ आगमन समय: ${p.arriveBy}`;
        case 'mr':
          return `🌾 *किसानसाथी मंडी पास*\n` +
            `नमस्कार ${p.farmerName} जी, आपला टोकन *${p.token}* बुक झाला आहे.\n` +
            `📅 दिनांक: ${p.date} [${p.time}]\n` +
            `🏛️ केंद्र: ${p.centre}\n` +
            `🌾 पीक: ${p.crop} (${p.qty} क्विंटल)\n` +
            `⏰ आगमन वेळ: ${p.arriveBy}`;
        case 'pa':
          return `🌾 *ਕਿਸਾਨਸਾਥੀ ਮੰਡੀ ਪਾਸ*\n` +
            `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ${p.farmerName} ਜੀ, ਤੁਹਾਡਾ ਟੋਕਨ *${p.token}* ਬੁੱਕ ਹੋ ਗਿਆ ਹੈ।\n` +
            `📅 ਮਿਤੀ: ${p.date} [${p.time}]\n` +
            `🏛️ ਕੇਂਦਰ: ${p.centre}\n` +
            `🌾 ਫਸਲ: ${p.crop} (${p.qty} ਕੁਇੰਟਲ)\n` +
            `⏰ ਪਹੁੰਚਣ ਦਾ ਸਮਾਂ: ${p.arriveBy}`;
        case 'gu':
          return `🌾 *કિસાનસાથી મંડી પાસ*\n` +
            `નમસ્તે ${p.farmerName} જી, તમારો ટોકન *${p.token}* બુક થઈ ગયો છે.\n` +
            `📅 તારીખ: ${p.date} [${p.time}]\n` +
            `🏛️ કેન્દ્ર: ${p.centre}\n` +
            `🌾 પાક: ${p.crop} (${p.qty} ક્વિન્ટલ)\n` +
            `⏰ પહોંચવાનો સમય: ${p.arriveBy}`;
        case 'te':
          return `🌾 *కిసాన్‌సాథి మండి పాస్*\n` +
            `నమస్కారం ${p.farmerName} గారు, మీ టోకెన్ *${p.token}* బుక్ చేయబడింది.\n` +
            `📅 తేదీ: ${p.date} [${p.time}]\n` +
            `🏛️ కేంద్రం: ${p.centre}\n` +
            `🌾 పంట: ${p.crop} (${p.qty} క్వింటాళ్లు)\n` +
            `⏰ చేరే సమయం: ${p.arriveBy}`;
        case 'kn':
          return `🌾 *ಕಿಸಾನ್‌ಸಾಥಿ ಮಂಡಿ ಪಾಸ್*\n` +
            `ನಮಸ್ಕಾರ ${p.farmerName} ಅವರೇ, ನಿಮ್ಮ ಟೋಕನ್ *${p.token}* ಬುಕ್ ಆಗಿದೆ.\n` +
            `📅 ದಿನಾಂಕ: ${p.date} [${p.time}]\n` +
            `🏛️ ಕೇಂದ್ರ: ${p.centre}\n` +
            `🌾 ಬೆಳೆ: ${p.crop} (${p.qty} ಕ್ವಿಂಟಾಲ್)\n` +
            `⏰ ತಲುಪುವ ಸಮಯ: ${p.arriveBy}`;
        default: // en
          return `🌾 *KisanSathi Mandi Pass*\n` +
            `Dear ${p.farmerName}, your token *${p.token}* has been booked successfully.\n` +
            `📅 Date: ${p.date} [${p.time}]\n` +
            `🏛️ Centre: ${p.centre}\n` +
            `🌾 Crop: ${p.crop} (${p.qty} qtl)\n` +
            `⏰ Arrive by: ${p.arriveBy}`;
      }
    } else {
      // SMS Channel
      switch (lang) {
        case 'hi':
          return `[किसानसाथी APMC] प्रिय ${p.farmerName}, आपका खरीद स्लॉट ${p.centre} पर बुक हो गया है।\n` +
            `टोकन: ${p.token}\n` +
            `दिनांक: ${p.date} (${p.time})\n` +
            `फसल: ${p.crop} (${p.qty} क्विंटल)\n` +
            `कृपया ${p.arriveBy} तक पहुंचें। लाइव ट्रैक करें: https://kisansathi.gov.in`;
        case 'mr':
          return `[किसानसाथी APMC] प्रिय ${p.farmerName}, आपली खरेदी नोंदणी ${p.centre} येथे यशस्वी झाली आहे.\n` +
            `टोकन: ${p.token}\n` +
            `दिनांक: ${p.date} (${p.time})\n` +
            `पीक: ${p.crop} (${p.qty} क्विंटल)\n` +
            `कृपया ${p.arriveBy} पर्यंत पोहोचा. थेट ट्रॅक करा: https://kisansathi.gov.in`;
        case 'pa':
          return `[ਕਿਸਾਨਸਾਥੀ APMC] ਪਿਆਰੇ ${p.farmerName}, ਤੁਹਾਡਾ ਖਰੀਦ ਸਲਾਟ ${p.centre} ਵਿਖੇ ਬੁੱਕ ਹੋ ਗਿਆ ਹੈ।\n` +
            `ਟੋਕਨ: ${p.token}\n` +
            `ਮਿਤੀ: ${p.date} (${p.time})\n` +
            `ਫਸਲ: ${p.crop} (${p.qty} ਕੁਇੰਟਲ)\n` +
            `ਕਿਰਪਾ ਕਰਕੇ ${p.arriveBy} ਤੱਕ ਪਹੁੰਚੋ। ਲਾਈਵ ਟਰੈਕ ਕਰੋ: https://kisansathi.gov.in`;
        case 'gu':
          return `[કિસાનસાથી APMC] પ્રિય ${p.farmerName}, તમારો ખરીદ સ્લોટ ${p.centre} પર બુક થઈ ગયો છે.\n` +
            `ટોકન: ${p.token}\n` +
            `તારીખ: ${p.date} (${p.time})\n` +
            `પાક: ${p.crop} (${p.qty} ક્વિન્ટલ)\n` +
            `કૃપા કરીને ${p.arriveBy} સુધીમાં પહોંચો. લાઈવ ટ્રેક કરો: https://kisansathi.gov.in`;
        case 'te':
          return `[కిసాన్‌సాథి APMC] ప్రియమైన ${p.farmerName}, మీ సేకరణ స్లాట్ ${p.centre} వద్ద బుక్ చేయబడింది.\n` +
            `టోకెన్: ${p.token}\n` +
            `తేదీ: ${p.date} (${p.time})\n` +
            `పంట: ${p.crop} (${p.qty} క్వింటాళ్లు)\n` +
            `దయచేసి ${p.arriveBy} నాటికి చేరుకోండి. లైవ్ ట్రాక్ చేయండి: https://kisansathi.gov.in`;
        case 'kn':
          return `[ಕಿಸಾನ್‌ಸಾಥಿ APMC] ಆತ್ಮೀಯ ${p.farmerName}, ನಿಮ್ಮ ಖರೀದಿ ಸ್ಲಾಟ್ ${p.centre} ನಲ್ಲಿ ಬುಕ್ ಆಗಿದೆ.\n` +
            `ಟೋಕನ್: ${p.token}\n` +
            `ದಿನಾಂಕ: ${p.date} (${p.time})\n` +
            `ಬೆಳೆ: ${p.crop} (${p.qty} ಕ್ವಿಂಟಾಲ್)\n` +
            `ದಯವಿಟ್ಟು ${p.arriveBy} ಒಳಗೆ ತಲುಪಿ. ಲೈವ್ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ: https://kisansathi.gov.in`;
        default: // en
          return `[KisanSathi APMC] Dear ${p.farmerName}, your procurement slot is BOOKED at ${p.centre}.\n` +
            `Token: ${p.token}\n` +
            `Date: ${p.date} (${p.time})\n` +
            `Crop: ${p.crop} (${p.qty} qtl)\n` +
            `Please arrive by ${p.arriveBy}. Track live: https://kisansathi.gov.in`;
      }
    }
  }

  // 2. COUNTER CALLED ALERT
  if (type === 'CALLED_ALERT' || raw.includes('CALLED at Counter') || raw.includes('बुलाया गया है')) {
    switch (lang) {
      case 'hi':
        return `[किसानसाथी जरूरी] टोकन ${p.token} को अब ${p.centre} के काउंटर #${p.counterNum} पर बुलाया गया है। कृपया गुणवत्ता जांच के लिए तुरंत पहुंचें।`;
      case 'mr':
        return `[किसानसाथी तातडीचे] टोकन ${p.token} ला आता ${p.centre} च्या काऊंटर #${p.counterNum} वर बोलावण्यात आले आहे. कृपया गुणवत्ता तपासणीसाठी त्वरित पुढे या.`;
      case 'pa':
        return `[ਕਿਸਾਨਸਾਥੀ ਜ਼ਰੂਰੀ] ਟੋਕਨ ${p.token} ਨੂੰ ਹੁਣ ${p.centre} ਦੇ ਕਾਊਂਟਰ #${p.counterNum} 'ਤੇ ਬੁਲਾਇਆ ਗਿਆ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਗੁਣਵੱਤਾ ਜਾਂਚ ਲਈ ਤੁਰੰਤ ਪਹੁੰਚੋ।`;
      case 'gu':
        return `[કિસાનસાથી તાત્કાલિક] ટોકન ${token || p.token} ને હવે ${p.centre} ના કાઉન્ટર #${p.counterNum} પર બોલાવવામાં આવ્યા છે. કૃપા કરીને ગુણવત્તા તપાસ માટે તાત્કાલિક પહોંચો.`;
      case 'te':
        return `[కిసాన్‌సాథి అత్యవసరం] టోకెన్ ${p.token} ఇప్పుడు ${p.centre} వద్ద కౌంటర్ #${p.counterNum} వద్దకు పిలువబడింది. దయచేసి నాణ్యత పరీక్ష కోసం వెంటనే వెళ్లండి.`;
      case 'kn':
        return `[ಕಿಸಾನ್‌ಸಾಥಿ ತುರ್ತು] ಟೋಕನ್ ${p.token} ಅನ್ನು ಈಗ ${p.centre} ನ ಕೌಂಟರ್ #${p.counterNum} ನಲ್ಲಿ ಕರೆಯಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಗುಣಮಟ್ಟ ತಪಾಸಣೆಗಾಗಿ ತಕ್ಷಣ ಮುಂದುವರಿಯಿರಿ.`;
      default: // en
        return `[KisanSathi URGENT] Token ${p.token} is now CALLED at Counter #${p.counterNum} at ${p.centre}. Please proceed immediately with your lot for quality assaying.`;
    }
  }

  // 3. PAYMENT CREDITED (DBT)
  if (type === 'PAYMENT_CREDITED' || raw.includes('DBT') || raw.includes('credited')) {
    switch (lang) {
      case 'hi':
        return `[किसानसाथी DBT] टोकन ${p.token} के लिए ₹${p.amount} का भुगतान आपके आधार से जुड़े बैंक खाते में जमा कर दिया गया है। संदर्भ: ${p.ref}।`;
      case 'mr':
        return `[किसानसाथी DBT] टोकन ${p.token} साठी ₹${p.amount} चा भरणा आपल्या आधार-संलग्न बँक खात्यात जमा झाला आहे. संदर्भ: ${p.ref}.`;
      case 'pa':
        return `[ਕਿਸਾਨਸਾਥੀ DBT] ਟੋਕਨ ${p.token} ਲਈ ₹${p.amount} ਦਾ ਭੁਗਤਾਨ ਤੁਹਾਡੇ ਆਧਾਰ ਨਾਲ ਜੁੜੇ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ ਜਮ੍ਹਾਂ ਕਰ ਦਿੱਤਾ ਗਿਆ ਹੈ। ਰੈਫਰੈਂਸ: ${p.ref}।`;
      case 'gu':
        return `[કિસਾਨસાથી DBT] ટોકન ${p.token} માટે ₹${p.amount} ની રકમ તમારા આધાર-લિંક્ડ બેંક ખાતામાં જમા કરવામાં આવી છે. સંદર્ભ: ${p.ref}.`;
      case 'te':
        return `[కిసాన్‌సాథి DBT] టోకెన్ ${p.token} కోసం ₹${p.amount} చెల్లింపు మీ ఆధార్-లింక్డ్ బ్యాంక్ ఖాతాలో జమ చేయబడింది. రిఫరెన్స్: ${p.ref}.`;
      case 'kn':
        return `[ಕಿಸಾನ್‌ಸಾಥಿ DBT] ಟೋಕನ್ ${p.token} ಗಾಗಿ ₹${p.amount} ಪಾವತಿಯನ್ನು ನಿಮ್ಮ ಆಧಾರ್ ಲಿಂಕ್ ಮಾಡಿದ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಜಮಾ ಮಾಡಲಾಗಿದೆ. ಉಲ್ಲೇಖ: ${p.ref}.`;
      default: // en
        return `[KisanSathi DBT] Payment of ₹${p.amount} for Token ${p.token} has been credited to your Aadhaar-linked bank account. Ref: ${p.ref}.`;
    }
  }

  return raw;
}

/**
 * Localizes live notification alerts shown in AlertsPanel.
 */
export function formatAlertMessage(message = '', lang = 'en') {
  if (!message) return '';
  const p = extractParams(message);

  // Match queue waiting
  if (message.includes('You are in the queue at')) {
    switch (lang) {
      case 'hi':
        return `आप ${p.centre} पर कतार में हैं। टोकन ${p.token}।`;
      case 'mr':
        return `आपण ${p.centre} येथे रांगेत आहात. टोकन ${p.token}.`;
      case 'pa':
        return `ਤੁਸੀਂ ${p.centre} ਵਿਖੇ ਕਤਾਰ ਵਿੱਚ ਹੋ। ਟੋਕਨ ${p.token}।`;
      case 'gu':
        return `તમે ${p.centre} પર લાઈનમાં છો. ટોકન ${p.token}.`;
      case 'te':
        return `మీరు ${p.centre} వద్ద క్యూలో ఉన్నారు. టోకెన్ ${p.token}.`;
      case 'kn':
        return `ನೀವು ${p.centre} ನಲ್ಲಿ ಕ್ಯೂನಲ್ಲಿದ್ದೀರಿ. ಟೋಕನ್ ${p.token}.`;
      default:
        return message;
    }
  }

  // Match counter turn
  if (message.includes('It is your turn')) {
    switch (lang) {
      case 'hi':
        return `आपकी बारी आ गई है। कृपया ${p.centre} के काउंटर पर जाएं। टोकन ${p.token}।`;
      case 'mr':
        return `आपली पाळी आली आहे. कृपया ${p.centre} च्या काऊंटरवर जा. टोकन ${p.token}.`;
      case 'pa':
        return `ਤੁਹਾਡੀ ਵਾਰੀ ਆ ਗਈ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ${p.centre} ਦੇ ਕਾਊਂਟਰ 'ਤੇ ਜਾਓ। ਟੋਕਨ ${p.token}।`;
      case 'gu':
        return `તમારો વારો આવી ગયો છે. કૃપા કરીને ${p.centre} ના કાઉન્ટર પર જાઓ. ટોકન ${p.token}.`;
      case 'te':
        return `మీ వంతు వచ్చింది. దయచేసి ${p.centre} వద్ద కౌంటర్‌కు వెళ్లండి. టోకెన్ ${p.token}.`;
      case 'kn':
        return `ನಿಮ್ಮ ಸರದಿ ಬಂದಿದೆ. ದಯವಿಟ್ಟು ${p.centre} ನ ಕೌಂಟರ್‌ಗೆ ಹೋಗಿ. ಟೋಕನ್ ${p.token}.`;
      default:
        return message;
    }
  }

  // Match checked in
  if (message.includes('Checked in at')) {
    switch (lang) {
      case 'hi':
        return `${p.centre} पर चेक-इन पूरा हुआ। टोकन ${p.token}।`;
      case 'mr':
        return `${p.centre} येथे चेक-इन पूर्ण झाले. टोकन ${p.token}.`;
      case 'pa':
        return `${p.centre} ਵਿਖੇ ਚੈੱਕ-ਇਨ ਪੂਰਾ ਹੋਇਆ। ਟੋਕਨ ${p.token}।`;
      case 'gu':
        return `${p.centre} પર ચેક-ઇન પૂર્ણ થયું. ટોકન ${p.token}.`;
      case 'te':
        return `${p.centre} వద్ద చెక్-ఇన్ పూర్తయింది. టోకెన్ ${p.token}.`;
      case 'kn':
        return `${p.centre} ನಲ್ಲಿ ಚೆಕ್-ಇನ್ ಪೂರ್ಣಗೊಂಡಿದೆ. ಟೋಕನ್ ${p.token}.`;
      default:
        return message;
    }
  }

  // Match quality assaying
  if (message.includes('Quality check has started') || message.includes('गुणवत्ता')) {
    switch (lang) {
      case 'hi':
        return `टोकन ${p.token} के लिए गुणवत्ता जांच शुरू हो गई है।`;
      case 'mr':
        return `टोकन ${p.token} साठी गुणवत्ता तपासणी सुरू झाली आहे.`;
      case 'pa':
        return `ਟੋਕਨ ${p.token} ਲਈ ਗੁਣਵੱਤਾ ਜਾਂਚ ਸ਼ੁਰੂ ਹੋ ਗਈ ਹੈ।`;
      case 'gu':
        return `ટોકન ${p.token} માટે ગુણવત્તા તપાસ શરૂ થઈ ગઈ છે.`;
      case 'te':
        return `టోకెన్ ${p.token} కోసం నాణ్యత పరీక్ష ప్రారంభమైంది.`;
      case 'kn':
        return `ಟೋಕನ್ ${p.token} ಗಾಗಿ ಗುಣಮಟ್ಟ ತಪಾಸಣೆ ಪ್ರಾರಂಭವಾಗಿದೆ.`;
      default:
        return message;
    }
  }

  // Match weighment
  if (message.includes('Weighment has started') || message.includes('वजन')) {
    switch (lang) {
      case 'hi':
        return `टोकन ${p.token} के लिए वजन माप शुरू हो गया है।`;
      case 'mr':
        return `टोकन ${p.token} साठी वजन मापन सुरू झाले आहे.`;
      case 'pa':
        return `ਟੋਕਨ ${p.token} ਲਈ ਵਜ਼ਨ ਮਾਪ ਸ਼ੁਰੂ ਹੋ ਗਿਆ ਹੈ।`;
      case 'gu':
        return `ટોકન ${p.token} માટે વજન માપણી શરૂ થઈ ગઈ છે.`;
      case 'te':
        return `టోకెన్ ${p.token} కోసం బరువు కొలత ప్రారంభమైంది.`;
      case 'kn':
        return `ಟೋಕನ್ ${p.token} ಗಾಗಿ ತೂಕ ಅಳತೆ ಪ್ರಾರಂಭವಾಗಿದೆ.`;
      default:
        return message;
    }
  }

  // Match DBT payment transfer
  if (message.includes('Govt DBT Bank Transfer of') || message.includes('credited directly to')) {
    switch (lang) {
      case 'hi':
        return `टोकन ${p.token} के लिए ₹${p.amount} का सरकारी DBT बैंक भुगतान सीधे बैंक खाते में जमा किया गया।`;
      case 'mr':
        return `टोकन ${p.token} साठी ₹${p.amount} चा सरकारी DBT थेट बँक भरणा खात्यात जमा झाला.`;
      case 'pa':
        return `ਟੋਕਨ ${p.token} ਲਈ ₹${p.amount} ਦਾ ਸਰਕਾਰੀ DBT ਬੈਂਕ ਭੁਗਤਾਨ ਸਿੱਧਾ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ ਜਮ੍ਹਾਂ ਕੀਤਾ ਗਿਆ।`;
      case 'gu':
        return `ટોકન ${p.token} માટે ₹${p.amount} ની સરકારી DBT બેંક ચુકવણી સીધી બેંક ખાતામાં જમા થઈ.`;
      case 'te':
        return `టోకెన్ ${p.token} కోసం ₹${p.amount} ప్రభుత్వ DBT బ్యాంక్ చెల్లింపు నేరుగా ఖాతాలో జమ చేయబడింది.`;
      case 'kn':
        return `ಟೋಕನ್ ${p.token} ಗಾಗಿ ₹${p.amount} ಸರ್ಕಾರದ DBT ಬ್ಯಾಂಕ್ ಪಾವತಿಯನ್ನು ನೇರವಾಗಿ ಖಾತೆಗೆ ಜಮಾ ಮಾಡಲಾಗಿದೆ.`;
      default:
        return message;
    }
  }

  return message;
}

/**
 * Generates localized WhatsApp share text for the Printable Gate Pass.
 */
export function formatWhatsAppPass(booking, farmer, lang = 'en', t) {
  if (!booking) return '';
  const centreTitle = t ? (t(`centre.${booking.centre_id}`) || booking.centre_name) : booking.centre_name;
  const cropTitle = t ? (t(`crop.${booking.crop}`) || booking.crop) : booking.crop;
  const farmerName = farmer?.name || 'Farmer';
  const arriveBy = booking.arriveBy || booking.slot_time?.split('-')[0] || '14:00';

  switch (lang) {
    case 'hi':
      return `🌾 *किसानसाथी आधिकारिक मंडी पास*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🎟️ *टोकन नंबर:* ${booking.token}\n` +
        `👨‍🌾 *किसान:* ${farmerName}\n` +
        `🏛️ *केंद्र:* ${centreTitle} (${booking.district || ''})\n` +
        `📅 *दिनांक:* ${booking.slot_date}\n` +
        `⏰ *समय स्लॉट:* ${booking.slot_time}\n` +
        `🌾 *फसल:* ${cropTitle} (${booking.quantity_qtl} क्विंटल)\n` +
        `📍 *पहुंचने का समय:* ${arriveBy}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `कृपया अपना आधार कार्ड और बैंक पासबुक साथ लाएं। लाइव स्थिति देखें: https://kisansathi.gov.in`;
    case 'mr':
      return `🌾 *किसानसाथी अधिकृत मंडी पास*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🎟️ *टोकन क्रमांक:* ${booking.token}\n` +
        `👨‍🌾 *शेतकरी:* ${farmerName}\n` +
        `🏛️ *केंद्र:* ${centreTitle} (${booking.district || ''})\n` +
        `📅 *दिनांक:* ${booking.slot_date}\n` +
        `⏰ *वेळ स्लॉट:* ${booking.slot_time}\n` +
        `🌾 *पीक:* ${cropTitle} (${booking.quantity_qtl} क्विंटल)\n` +
        `📍 *आगमन वेळ:* ${arriveBy}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `कृपया आपले आधार कार्ड आणि बँक पासबुक सोबत आणा. थेट स्थिती पहा: https://kisansathi.gov.in`;
    case 'pa':
      return `🌾 *ਕਿਸਾਨਸਾਥੀ ਅਧਿਕਾਰਤ ਮੰਡੀ ਪਾਸ*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🎟️ *ਟੋਕਨ ਨੰਬਰ:* ${booking.token}\n` +
        `👨‍🌾 *ਕਿਸਾਨ:* ${farmerName}\n` +
        `🏛️ *ਕੇਂਦਰ:* ${centreTitle} (${booking.district || ''})\n` +
        `📅 *ਮਿਤੀ:* ${booking.slot_date}\n` +
        `⏰ *ਸਮਾਂ ਸਲਾਟ:* ${booking.slot_time}\n` +
        `🌾 *ਫਸਲ:* ${cropTitle} (${booking.quantity_qtl} ਕੁਇੰਟਲ)\n` +
        `📍 *ਪਹੁੰਚਣ ਦਾ ਸਮਾਂ:* ${arriveBy}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਆਧਾਰ ਕਾਰਡ ਅਤੇ ਬੈਂਕ ਪਾਸਬੁੱਕ ਨਾਲ ਲਿਆਓ। ਲਾਈਵ ਸਥਿਤੀ ਵੇਖੋ: https://kisansathi.gov.in`;
    case 'gu':
      return `🌾 *કિસાનસાથી સત્તાવાર મંડી પાસ*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🎟️ *ટોકન નંબર:* ${booking.token}\n` +
        `👨‍🌾 *ખેડૂત:* ${farmerName}\n` +
        `🏛️ *કેન્દ્ર:* ${centreTitle} (${booking.district || ''})\n` +
        `📅 *તારીખ:* ${booking.slot_date}\n` +
        `⏰ *સમય સ્લોટ:* ${booking.slot_time}\n` +
        `🌾 *પાક:* ${cropTitle} (${booking.quantity_qtl} ક્વિન્ટલ)\n` +
        `📍 *પહોંચવાનો સમય:* ${arriveBy}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `કૃપા કરીને તમારું આધાર કાર્ડ અને બેંક પાસબુક સાથે લાવો. લાઈવ સ્થિતિ જુઓ: https://kisansathi.gov.in`;
    case 'te':
      return `🌾 *కిసాన్‌సాథి అధికారిక మండి పాస్*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🎟️ *టోకెన్ సంఖ్య:* ${booking.token}\n` +
        `👨‍🌾 *రైతు:* ${farmerName}\n` +
        `🏛️ *కేంద్రం:* ${centreTitle} (${booking.district || ''})\n` +
        `📅 *తేదీ:* ${booking.slot_date}\n` +
        `⏰ *సమయ స్లాట్:* ${booking.slot_time}\n` +
        `🌾 *పంట:* ${cropTitle} (${booking.quantity_qtl} క్వింటాళ్లు)\n` +
        `📍 *చేరే సమయం:* ${arriveBy}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `దయచేసి మీ ఆధార్ కార్డు మరియు బ్యాంక్ పాస్‌బుక్ వెంట తీసుకురండి. లైవ్ స్థితిని ట్రాక్ చేయండి: https://kisansathi.gov.in`;
    case 'kn':
      return `🌾 *ಕಿಸಾನ್‌ಸಾಥಿ ಅಧಿಕೃತ ಮಂಡಿ ಪಾಸ್*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🎟️ *ಟೋಕನ್ ಸಂಖ್ಯೆ:* ${booking.token}\n` +
        `👨‍🌾 *ರೈತ:* ${farmerName}\n` +
        `🏛️ *ಕೇಂದ್ರ:* ${centreTitle} (${booking.district || ''})\n` +
        `📅 *ದಿನಾಂಕ:* ${booking.slot_date}\n` +
        `⏰ *ಸಮಯ ಸ್ಲಾಟ್:* ${booking.slot_time}\n` +
        `🌾 *ಬೆಳೆ:* ${cropTitle} (${booking.quantity_qtl} ಕ್ವಿಂಟಾಲ್)\n` +
        `📍 *ತಲುಪುವ ಸಮಯ:* ${arriveBy}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `ದಯವಿಟ್ಟು ನಿಮ್ಮ ಆಧಾರ್ ಕಾರ್ಡ್ ಮತ್ತು ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ ತರಲು ಮರೆಯದಿರಿ. ಲೈವ್ ಸ್ಥಿತಿ ವೀಕ್ಷಿಸಿ: https://kisansathi.gov.in`;
    default: // en
      return `🌾 *KisanSathi Official Mandi Pass*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🎟️ *Token Number:* ${booking.token}\n` +
        `👨‍🌾 *Farmer:* ${farmerName}\n` +
        `🏛️ *Centre:* ${centreTitle} (${booking.district || ''})\n` +
        `📅 *Date:* ${booking.slot_date}\n` +
        `⏰ *Time Slot:* ${booking.slot_time}\n` +
        `🌾 *Crop:* ${cropTitle} (${booking.quantity_qtl} Quintals)\n` +
        `📍 *Arrive By:* ${arriveBy}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Please carry your Aadhaar card and bank passbook. Track live status at https://kisansathi.gov.in`;
  }
}
