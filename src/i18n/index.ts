import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import English translations
import commonEn from './locales/en/common.json';
import magicGraphEn from './locales/en/magicGraph.json';
import sequenceRaceEn from './locales/en/sequenceRace.json';
import shapeArchitectEn from './locales/en/shapeArchitect.json';

// Import Vietnamese translations
import commonVi from './locales/vi/common.json';
import magicGraphVi from './locales/vi/magicGraph.json';
import sequenceRaceVi from './locales/vi/sequenceRace.json';
import shapeArchitectVi from './locales/vi/shapeArchitect.json';

// Check for saved language preference
const savedLang = localStorage.getItem('math-games-lang');

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                common: commonEn,
                magicGraph: magicGraphEn,
                sequenceRace: sequenceRaceEn,
                shapeArchitect: shapeArchitectEn,
            },
            vi: {
                common: commonVi,
                magicGraph: magicGraphVi,
                sequenceRace: sequenceRaceVi,
                shapeArchitect: shapeArchitectVi,
            },
        },
        lng: savedLang || 'vi', // Default to Vietnamese
        fallbackLng: 'en',
        ns: ['common', 'magicGraph', 'sequenceRace', 'shapeArchitect'],
        defaultNS: 'common',
        interpolation: {
            escapeValue: false, // React already escapes
        },
        detection: {
            order: ['localStorage', 'navigator'],
            lookupLocalStorage: 'math-games-lang',
            caches: ['localStorage'],
        },
    });

export default i18n;
