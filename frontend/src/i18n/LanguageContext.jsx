import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { LANGUAGES, translations } from './translations';

/**
 * Holds the chosen language and hands every screen a `t()` lookup.
 * The choice is remembered in localStorage, so a page refresh mid-demo
 * does not throw the UI back to English.
 */

const LanguageContext = createContext(null);
const STORAGE_KEY = 'procureflow.lang';

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return translations[saved] ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang; // helps screen readers pick the right voice
  }, [lang]);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      languages: LANGUAGES,
      // Falls back to English, then to the key itself, so a missing
      // translation is visible in review but never renders as blank.
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
