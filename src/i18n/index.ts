import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { LANGUAGE_KEY } from '../shared/constants';

// Import common translations only (loaded upfront)
// Game translations are lazy-loaded via lazyLoader.ts
import commonEn from './locales/en/common.json';
import authEn from './locales/en/auth.json';
import syncEn from './locales/en/sync.json';
import keyboardEn from './locales/en/keyboard.json';
import commonVi from './locales/vi/common.json';
import authVi from './locales/vi/auth.json';
import syncVi from './locales/vi/sync.json';
import keyboardVi from './locales/vi/keyboard.json';

// Check for saved language preference (SSR-safe)
const savedLang = typeof window !== 'undefined' ? localStorage.getItem(LANGUAGE_KEY) : null;

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        // Only load common/shared namespaces upfront
        // Game namespaces (magicGraph, sequenceRace, shapeArchitect) are loaded on-demand
        resources: {
            en: {
                common: commonEn,
                auth: authEn,
                sync: syncEn,
                keyboard: keyboardEn,
            },
            vi: {
                common: commonVi,
                auth: authVi,
                sync: syncVi,
                keyboard: keyboardVi,
            },
        },
        lng: savedLang || 'vi', // Default to Vietnamese
        fallbackLng: 'en',
        // Only specify namespaces that are loaded upfront
        ns: ['common', 'auth', 'sync', 'keyboard'],
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
