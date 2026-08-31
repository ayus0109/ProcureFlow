/**
 * i18n.js
 *
 * Configures i18next & react-i18next with 7 Indian regional languages:
 * English (en), Hindi (hi), Marathi (mr), Punjabi (pa), Gujarati (gu), Telugu (te), Kannada (kn).
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './translations';

const resources = {};
for (const [code, dict] of Object.entries(translations)) {
  resources[code] = {
    translation: dict,
  };
}

const savedLang =
  typeof window !== 'undefined'
    ? localStorage.getItem('kisansathi.lang') || localStorage.getItem('procureflow.lang') || 'en'
    : 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: translations[savedLang] ? savedLang : 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
