/**
 * FarmerChatbot.jsx
 *
 * Kisan Sahayak / Farmer Help & Support AI Chatbot.
 * Answers any questions, doubts, or issues regarding APMC procurement, MSP rates,
 * slot booking, DBT payments, moisture norms, required documents, and mandi operations.
 *
 * Multilingual: 7 Regional Languages:
 * 1. English (en)
 * 2. Hindi - हिंदी (hi)
 * 3. Marathi - मराठी (mr)
 * 4. Punjabi - ਪੰਜਾਬੀ (pa)
 * 5. Gujarati - ગુજરાતી (gu)
 * 6. Telugu - తెలుగు (te)
 * 7. Kannada - ಕನ್ನಡ (kn)
 *
 * Features:
 * - Dynamic i18n integration across all 7 Indian languages
 * - Clean text-based chat interface with instant send
 * - Large touch-friendly suggestion cards with high contrast for mobile screens
 * - 1-tap reactive language switching pills
 * - Direct navigation action buttons
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Send,
  Bot,
  RotateCcw,
  Sparkles,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext.jsx';

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
  pa: [
    '🌾 ਮੌਜੂਦਾ ਸਰਕਾਰੀ ਘੱਟੋ-ਘੱਟ ਸਮਰਥਨ ਮੁੱਲ (MSP) ਕੀ ਹਨ?',
    '📋 ਸਰਕਾਰੀ ਖਰੀਦ ਸਲਾਟ ਕਿਵੇਂ ਬੁੱਕ ਕਰੀਏ?',
    '💳 DBT ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ ਪੈਸੇ ਕਦੋਂ ਆਉਣਗੇ?',
    '📄 ਮੰਡੀ ਵਿੱਚ ਕਿਹੜੇ ਦਸਤਾਵੇਜ਼ ਲੈ ਕੇ ਜਾਣੇ ਹਨ?',
    '💧 ਵੱਧ ਤੋਂ ਵੱਧ ਨਮੀ (Moisture) ਸੀਮਾ ਕੀ ਹੈ?',
    '🏛️ ਕਿਸ ਖਰੀਦ ਕੇਂਦਰ ਤੇ ਘੱਟ ਭੀੜ ਹੈ?',
  ],
  gu: [
    '🌾 વર્તમાન સરકારી ટેકાના ભાવ (MSP) શું છે?',
    '📋 સરકારી ખરીદ સ્લોટ કેવી રીતે બુક કરવો?',
    '💳 DBT બેંક ખાતામાં પૈસા ક્યારે આવશે?',
    '📄 માર્કેટ યાર્ડમાં કયા દસ્તાવેજો લઈ જવાના છે?',
    '💧 મહત્તમ ભેજ (Moisture) મર્યાદા શું છે?',
    '🏛️ કયા ખરીદ કેન્દ્ર પર ઓછી ભીડ છે?',
  ],
  te: [
    '🌾 ప్రస్తుత ప్రభుత్వ కనీస మద్దతు ధరలు (MSP) ఎంత?',
    '📋 ప్రభుత్వ సేకరణ స్లాట్‌ను ఎలా బుక్ చేయాలి?',
    '💳 DBT బ్యాంక్ ఖాతాలో డబ్బులు ఎప్పుడు వస్తాయి?',
    '📄 మార్కెట్ యార్డుకు ఏ పత్రాలు తీసుకురావాలి?',
    '💧 గరిష్ట తేమ శాతం (Moisture) పరిమితి ఎంత?',
    '🏛️ ఏ సేకరణ కేంద్రంలో తక్కువ రద్దీ ఉంది?',
  ],
  kn: [
    '🌾 ಪ್ರಸ್ತುತ ಸರ್ಕಾರಿ ಕನಿಷ್ಠ ಬೆಂಬಲ ಬೆಲೆಗಳು (MSP) ಎಷ್ಟು?',
    '📋 ಸರ್ಕಾರಿ ಖರೀದಿ ಸ್ಲಾಟ್ ಬುಕ್ ಮಾಡುವುದು ಹೇಗೆ?',
    '💳 DBT ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಹಣ ಯಾವಾಗ ಜಮೆಯಾಗುತ್ತದೆ?',
    '📄 ಮಂಡಿಗೆ ಯಾವ ದಾಖಲೆಗಳನ್ನು ತರಬೇಕು?',
    '💧 ಗರಿಷ್ಠ ತೇವಾಂಶ (Moisture) ಮಿತಿ ಎಷ್ಟು?',
    '🏛️ ಯಾವ ಖರೀದಿ ಕೇಂದ್ರದಲ್ಲಿ ಕಡಿಮೆ ಜನಸಂದಣಿಯಿದೆ?',
  ],
};

const BOT_TITLES = {
  mr: { title: 'किसान सहाय्यक AI', sub: 'शासकीय APMC मदत व शंका निवारण', selectLang: 'भाषा निवडा:' },
  hi: { title: 'किसान सहायक AI', sub: 'सरकारी APMC सहायता केंद्र', selectLang: 'भाषा चुनें:' },
  en: { title: 'Kisan Sahayak AI', sub: 'APMC Procurement Helpdesk', selectLang: 'Select Language:' },
  pa: { title: 'ਕਿਸਾਨ ਸਹਾਇਕ AI', sub: 'ਸਰਕਾਰੀ ਮੰਡੀ ਸਹਾਇਤਾ ਕੇਂਦਰ', selectLang: 'ਭਾਸ਼ਾ ਚੁਣੋ:' },
  gu: { title: 'કિસાન સહાયક AI', sub: 'સરકારી ખરીદ સહાયતા કેન્દ્ર', selectLang: 'ભાષા પસંદ કરો:' },
  te: { title: 'కిసాన్ సహాయక్ AI', sub: 'ప్రభుత్వ సేకరణ సహాయ కేంద్రం', selectLang: 'భాషను ఎంచుకోండి:' },
  kn: { title: 'ಕಿಸಾನ್ ಸಹಾಯಕ AI', sub: 'ಸರ್ಕಾರಿ ಖರೀದಿ ಸಹಾಯ ಕೇಂದ್ರ', selectLang: 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ:' },
};

export default function FarmerChatbot() {
  const { lang, setLang, languages, t } = useLanguage();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Initial Bot Welcome Greeting Generator
  const getWelcomeMessage = useCallback((currentLang) => {
    let welcomeText = '';
    if (currentLang === 'mr') {
      welcomeText =
        `नमस्कार! 🙏 मी **'किसान सहाय्यक' (Kisan Sahayak)** आहे — तुमचा २४/७ शासकीय APMC खरेदी मदतनीस.\n\n` +
        `तुम्हाला शासकीय हमीभाव, स्लॉट बुकिंग, DBT बँक पेमेंट, आवश्यक कागदपत्रे किंवा आर्द्रता नियमांबाबत काहीही अडचण किंवा प्रश्न असल्यास मला विचारा!`;
    } else if (currentLang === 'hi') {
      welcomeText =
        `नमस्ते! 🙏 मैं **'किसान सहायक' (Kisan Sahayak)** हूँ — आपका २४/७ सरकारी मंडी खरीद सहायक।\n\n` +
        `आपको न्यूनतम समर्थन मूल्य (MSP), स्लॉट बुकिंग, बैंक भुगतान, आवश्यक दस्तावेज या नमी मानकों से जुड़ा कोई भी प्रश्न या समस्या हो, तो बेझिझक पूछें!`;
    } else if (currentLang === 'pa') {
      welcomeText =
        `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! 🙏 ਮੈਂ **'ਕਿਸਾਨ ਸਹਾਇਕ' (Kisan Sahayak)** ਹਾਂ — ਤੁਹਾਡਾ ੨੪/੭ ਸਰਕਾਰੀ ਮੰਡੀ ਖਰੀਦ ਸਹਾਇਕ।\n\n` +
        `ਤੁਹਾਨੂੰ ਘੱਟੋ-ਘੱਟ ਸਮਰਥਨ ਮੁੱਲ (MSP), ਸਲਾਟ ਬੁਕਿੰਗ, ਬੈਂਕ ਭੁਗਤਾਨ, ਜ਼ਰੂਰੀ ਦਸਤਾਵੇਜ਼ਾਂ ਜਾਂ ਨਮੀ ਦੇ ਮਿਆਰਾਂ ਬਾਰੇ ਕੋਈ ਵੀ ਸਵਾਲ ਹੋਵੇ, ਤਾਂ ਬੇਝਿਜਕ ਪੁੱਛੋ!`;
    } else if (currentLang === 'gu') {
      welcomeText =
        `નમસ્તે! 🙏 હું **'કિસાન સહાયક' (Kisan Sahayak)** છું — તમારો ૨૪/૭ સરકારી ખરીદ સહાયક.\n\n` +
        `તમને ટેકાના ભાવ (MSP), સ્લોટ બુકિંગ, બેંક ચુકવણી, જરૂરી દસ્તાવેજો કે ભેજના નિયમો અંગે કોઈ પણ પ્રશ્ન હોય, તો પૂછો!`;
    } else if (currentLang === 'te') {
      welcomeText =
        `నమస్కారం! 🙏 నేను **'కిసాన్ సహాయక్' (Kisan Sahayak)** — మీ ੨੪/੭ ప్రభుత్వ సేకరణ సహాయకుడిని.\n\n` +
        `మీకు కనీస మద్దతు ధరలు (MSP), స్లాట్ బుకింగ్, బ్యాంక్ చెల్లింపులు, అవసరమైన పత్రాలు లేదా తేమ నిబంధనల గురించి ఏవైనా సందేహాలు ఉంటే అడగండి!`;
    } else if (currentLang === 'kn') {
      welcomeText =
        `ನಮಸ್ಕಾರ! 🙏 ನಾನು **'ಕಿಸಾನ್ ಸಹಾಯಕ' (Kisan Sahayak)** — ನಿಮ್ಮ ೨೪/೭ ಸರ್ಕಾರಿ ಖರೀದಿ ಸಹಾಯ ಸಹಾಯಕ.\n\n` +
        `ನಿಮಗೆ ಕನಿಷ್ಠ ಬೆಂಬಲ ಬೆಲೆ (MSP), ಸ್ಲಾಟ್ ಬುಕಿಂಗ್, ಬ್ಯಾಂಕ್ ಪಾವತಿ, ಅಗತ್ಯ ದಾಖಲೆಗಳು ಅಥವಾ ತೇವಾಂಶ ಮಾನದಂಡಗಳ ಬಗ್ಗೆ ಯಾವುದೇ ಪ್ರಶ್ನೆಗಳಿದ್ದರೂ ಕೇಳಿ!`;
    } else {
      welcomeText =
        `Hello! 🙏 I am **'Kisan Sahayak'** — your 24/7 APMC Procurement AI Assistant.\n\n` +
        `Ask me anything about Government MSP rates, slot booking, DBT payments, required documents, or moisture and quality guidelines!`;
    }

    return {
      id: `welcome-${currentLang}`,
      from: 'bot',
      text: welcomeText,
      suggestions: SUGGESTIONS[currentLang] || SUGGESTIONS.en,
    };
  }, []);

  // Initialize or update welcome greeting whenever `lang` or `open` changes
  useEffect(() => {
    if (open) {
      setMessages((prev) => {
        if (prev.length <= 1) {
          return [getWelcomeMessage(lang)];
        }
        return prev;
      });
    }
  }, [open, lang, getWelcomeMessage]);

  // Send query to AI backend
  const handleSend = async (queryText) => {
    const q = (queryText || input).trim();
    if (!q || loading) return;

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
              : lang === 'pa'
              ? 'ਮਾਫ਼ ਕਰਨਾ, ਸਰਵਰ ਨਾਲ ਸੰਪਰਕ ਨਹੀਂ ਹੋ ਸਕਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਥੋੜ੍ਹੀ ਦੇਰ ਬਾਅਦ ਕੋਸ਼ਿਸ਼ ਕਰੋ।'
              : lang === 'gu'
              ? 'ક્ષમા કરશો, સર્વર સાથે સંપર્ક થઈ શક્યો નથી. કૃપા કરીને થોડી વાર પછી પ્રયાસ કરો.'
              : lang === 'te'
              ? 'క్షమించండి, సర్వర్‌తో కనెక్ట్ కాలేకపోయాము. దయచేసి కాసేపటి తర్వాత మళ్ళీ ప్రయత్నించండి.'
              : lang === 'kn'
              ? 'ಕ್ಷಮಿಸಿ, ಸರ್ವರ್ ಸಂಪರ್ಕ ಸಾಧಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಪ್ರಯತ್ನಿಸಿ.'
              : 'Sorry, could not connect to server. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Markdown-style bold & bullet point renderer
  const renderMessageContent = (text) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 text-sm sm:text-base leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1.5" />;

          // Parse **bold** parts
          const parts = line.split(/(\*\*.*?\*\*)/g);
          const formattedLine = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-black text-slate-950">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            if (part.startsWith('*') && part.endsWith('*')) {
              return (
                <em key={pIdx} className="italic text-slate-700">
                  {part.slice(1, -1)}
                </em>
              );
            }
            return part;
          });

          return (
            <p key={idx} className="text-slate-900">
              {formattedLine}
            </p>
          );
        })}
      </div>
    );
  };

  const currentBotTitle = BOT_TITLES[lang] || BOT_TITLES.en;

  return (
    <>
      {/* Floating Trigger Button (Clean Natural Assistant) */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-5 z-50 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-[#133e2b] border-2 border-[#2b7956] text-white shadow-xl transition-all hover:scale-105 hover:bg-[#0d2a1d] active:scale-95 group touch-manipulation"
          aria-label="Kisan Sahayak Assistant"
        >
          <Bot className="h-7 w-7 text-[#a3e635]" />
          <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-[#f59e0b] text-[10px] font-black text-slate-950 shadow-xs border border-white">
            💬
          </span>
        </button>
      )}

      {/* Interactive Chat Window Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs sm:items-center sm:justify-center sm:p-4 animate-fadeIn">
          <div className="flex h-[95dvh] w-full flex-col rounded-t-3xl bg-white shadow-2xl sm:h-[700px] sm:max-w-xl sm:rounded-3xl overflow-hidden border border-[#e2e8e0]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#0d2a1d] bg-[#133e2b] px-4 sm:px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#1c563c] border border-[#2b7956] text-[#a3e635]">
                  <Bot className="h-6 w-6" />
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#a3e635] ring-2 ring-[#133e2b]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-wide flex items-center gap-2 text-white">
                    <span>{currentBotTitle.title}</span>
                    <span className="rounded-full bg-[#1c563c] px-2 py-0.5 text-[10px] font-bold text-emerald-200 border border-[#2b7956]">
                      Online
                    </span>
                  </h3>
                  <p className="text-xs font-medium text-emerald-200/90">
                    {currentBotTitle.sub}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMessages([getWelcomeMessage(lang)])}
                  title="Reset Chat"
                  className="grid h-9 w-9 place-items-center rounded-xl bg-[#1c563c] text-emerald-100 hover:bg-[#256f4e] transition"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-xl bg-[#1c563c] text-emerald-100 hover:bg-[#256f4e] transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* In-Chat 1-Tap Language Switcher Strip (All 7 Regional Languages) */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-slate-200 bg-emerald-50/90 text-xs font-bold text-emerald-950 gap-2">
              <div className="flex items-center gap-1.5 text-xs text-emerald-900 shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
                <span className="hidden sm:inline">{currentBotTitle.selectLang}</span>
              </div>

              {/* 1-Tap Dynamic Regional Language Switcher Pills */}
              <div className="flex items-center gap-1 overflow-x-auto p-1 rounded-xl bg-white border border-emerald-200 shadow-2xs max-w-full no-scrollbar">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setLang(l.code);
                      setMessages([getWelcomeMessage(l.code)]);
                    }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-black transition-all shrink-0 ${
                      lang === l.code
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-50'
                    }`}
                  >
                    {l.native}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/60">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 ${m.from === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {m.from === 'bot' && (
                    <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                      <Bot className="h-5 w-5" />
                    </div>
                  )}

                  <div className={`max-w-[90%] sm:max-w-[85%] space-y-3`}>
                    <div
                      className={`rounded-3xl p-4 sm:p-4.5 shadow-xs ${
                        m.from === 'user'
                          ? 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white rounded-tr-xs text-sm sm:text-base font-semibold'
                          : 'bg-white text-slate-900 border-2 border-slate-200/90 rounded-tl-xs'
                      }`}
                    >
                      {m.from === 'bot' ? renderMessageContent(m.text) : m.text}
                    </div>

                    {/* Direct Action Link in reply */}
                    {m.action && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          navigate(m.action.link);
                        }}
                        className="inline-flex items-center gap-2 rounded-2xl bg-[#156637] hover:bg-[#133e2b] px-5 py-3 text-sm font-black text-white shadow-xs transition"
                      >
                        <span>{m.action.label}</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}

                    {/* Touch-Friendly Suggestion Cards */}
                    {m.suggestions && m.suggestions.length > 0 && (
                      <div className="pt-2 flex flex-col gap-2 w-full">
                        <p className="text-xs font-black uppercase tracking-wider text-slate-500 px-1">
                          {lang === 'mr'
                            ? '👇 महत्त्वाचे प्रश्न (टॅप करा):'
                            : lang === 'hi'
                            ? '👇 मुख्य प्रश्न (टैप करें):'
                            : lang === 'pa'
                            ? '👇 ਮੁੱਖ ਸਵਾਲ (ਟੈਪ ਕਰੋ):'
                            : lang === 'gu'
                            ? '👇 મુખ્ય પ્રશ્નો (ટેપ કરો):'
                            : lang === 'te'
                            ? '👇 ముఖ్యమైన ప్రశ్నలు (నొక్కండి):'
                            : lang === 'kn'
                            ? '👇 ಪ್ರಮುಖ ಪ್ರಶ್ನೆಗಳು (ಟ್ಯಾಪ್ ಮಾಡಿ):'
                            : '👇 Common Questions (Tap to ask):'}
                        </p>
                        {m.suggestions.map((s, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => handleSend(s)}
                            className="w-full rounded-2xl border border-[#e2e8e0] bg-[#f9fbf9] p-3.5 sm:p-4 text-xs sm:text-sm font-bold text-[#133e2b] hover:border-[#156637] hover:bg-white shadow-xs transition-all active:scale-98 flex items-center justify-between text-left group"
                          >
                            <span className="leading-snug pr-2">{s}</span>
                            <ChevronRight className="h-4 w-4 shrink-0 text-[#156637] group-hover:translate-x-1 transition-transform" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Bot typing loading state */}
              {loading && (
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-[#f0f7f2] text-[#156637]">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl bg-white p-4 border border-[#e2e8e0] shadow-xs">
                    <Loader2 className="h-5 w-5 animate-spin text-[#156637]" />
                    <span className="font-bold text-slate-800">
                      {lang === 'mr'
                        ? 'माहिती शोधत आहे…'
                        : lang === 'hi'
                        ? 'उत्तर तैयार कर रहा है…'
                        : lang === 'pa'
                        ? 'ਜਾਣਕਾਰੀ ਲੱਭ ਰਿਹਾ ਹੈ…'
                        : lang === 'gu'
                        ? 'માહિતી શોધી રહ્યું છે…'
                        : lang === 'te'
                        ? 'సమాచారం వెతుకుతోంది…'
                        : lang === 'kn'
                        ? 'ಮಾಹಿತಿ ಹುಡುಕಲಾಗುತ್ತಿದೆ…'
                        : 'Finding answer…'}
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar with Clean Textbox + Send Button */}
            <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2.5"
              >
                {/* Text Input */}
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    lang === 'mr'
                      ? 'तुमचा प्रश्न इथे विचारा (गहू, हमीभाव, DBT)...'
                      : lang === 'hi'
                      ? 'अपना प्रश्न यहाँ लिखें (गेहूं, MSP, DBT)...'
                      : lang === 'pa'
                      ? 'ਆਪਣਾ ਸਵਾਲ ਇੱਥੇ ਲਿਖੋ (ਕਣਕ, MSP, DBT)...'
                      : lang === 'gu'
                      ? 'તમારો પ્રશ્ન અહીં લખો (ઘઉં, MSP, DBT)...'
                      : lang === 'te'
                      ? 'మీ ప్రశ్నను ఇక్కడ రాయండి (గోధుమలు, MSP, DBT)...'
                      : lang === 'kn'
                      ? 'ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಇಲ್ಲಿ ಬರೆಯಿರಿ (ಗೋಧಿ, MSP, DBT)...'
                      : 'Ask your doubt here (MSP, Slots, DBT)...'
                  }
                  className="h-13 sm:h-14 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm sm:text-base font-bold text-slate-900 outline-none focus:border-[#156637] focus:bg-white focus:ring-2 focus:ring-emerald-100 placeholder:font-medium placeholder:text-slate-400"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="grid h-13 w-13 sm:h-14 sm:w-14 shrink-0 place-items-center rounded-2xl bg-[#156637] hover:bg-[#133e2b] text-white shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition"
                  title="Send"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
