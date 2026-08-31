import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import i18n from './i18n';
import { LANGUAGES, translations } from './translations';

/**
 * LanguageContext
 * Holds the active regional language across all 7 supported languages:
 * English (en), Hindi (hi), Marathi (mr), Punjabi (pa), Gujarati (gu), Telugu (te), Kannada (kn).
 *
 * Synchronizes with i18next and persists the choice in localStorage.
 */

const LanguageContext = createContext(null);
const STORAGE_KEY = 'procureflow.lang';

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : 'en';
    return translations[saved] ? saved : 'en';
  });

  const setLang = (newLang) => {
    if (translations[newLang]) {
      setLangState(newLang);
      try {
        i18n.changeLanguage(newLang);
      } catch {}
    }
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    try {
      i18n.changeLanguage(lang);
    } catch {}
  }, [lang]);

  const value = useMemo(
    () => ({
      lang,
      language: lang,
      setLang,
      languages: LANGUAGES,
      t: (key) => translations[lang]?.[key] ?? translations.en[key] ?? key,
    }),
    [lang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}
