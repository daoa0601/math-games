import { useTranslation } from 'react-i18next';
import { LANGUAGE_KEY } from '../constants';

export function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'vi' ? 'en' : 'vi';
        i18n.changeLanguage(newLang);
        localStorage.setItem(LANGUAGE_KEY, newLang);
    };

    return (
        <button
            className="lang-switcher"
            onClick={toggleLanguage}
            title={i18n.language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
            aria-label={i18n.language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
        >
            {i18n.language === 'vi' ? '🇬🇧 EN' : '🇻🇳 VI'}
        </button>
    );
}
