import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { LANGUAGE_KEY } from '../shared/constants';

 // Import English translations
 import commonEn from './locales/en/common.json';
 import authEn from './locales/en/auth.json';
 import syncEn from './locales/en/sync.json';
 import keyboardEn from './locales/en/keyboard.json';
 import magicGraphEn from './locales/en/magicGraph.json';
 import sequenceRaceEn from './locales/en/sequenceRace.json';
 import shapeArchitectEn from './locales/en/shapeArchitect.json';

 // Import Vietnamese translations
 import commonVi from './locales/vi/common.json';
 import authVi from './locales/vi/auth.json';
 import syncVi from './locales/vi/sync.json';
 import keyboardVi from './locales/vi/keyboard.json';
 import magicGraphVi from './locales/vi/magicGraph.json';
 import sequenceRaceVi from './locales/vi/sequenceRace.json';
 import shapeArchitectVi from './locales/vi/shapeArchitect.json';

// Check for saved language preference (SSR-safe)
const savedLang = typeof window !== 'undefined' ? localStorage.getItem(LANGUAGE_KEY) : null;

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                common: commonEn,
                auth: authEn,
                sync: syncEn,
                keyboard: keyboardEn,
                magicGraph: magicGraphEn,
                sequenceRace: sequenceRaceEn,
                shapeArchitect: shapeArchitectEn,
            },
            vi: {
                common: commonVi,
                auth: authVi,
                sync: syncVi,
                keyboard: keyboardVi,
                magicGraph: magicGraphVi,
                sequenceRace: sequenceRaceVi,
                shapeArchitect: shapeArchitectVi,
            },
        },
        lng: savedLang || 'vi', // Default to Vietnamese
        fallbackLng: 'en',
        ns: ['common', 'auth', 'sync', 'keyboard', 'magicGraph', 'sequenceRace', 'shapeArchitect'],
        defaultNS: 'common',
        interpolation: {
            escapeValue: false, // React already escapes
        },
        detection: {
            order: ['localStorage', 'navigator'],
            lookupLocalStorage: LANGUAGE_KEY,
            caches: ['localStorage'],
        },
    });

export default i18n;
