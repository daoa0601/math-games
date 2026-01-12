import { useTranslation } from 'react-i18next';
import { IconButton } from '@/shared/components/ui';
import { LANGUAGE_KEY } from '../constants';

export function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'vi' ? 'en' : 'vi';
        i18n.changeLanguage(newLang);
        localStorage.setItem(LANGUAGE_KEY, newLang);
    };

    const isVietnamese = i18n.language === 'vi';
    const label = isVietnamese ? 'Switch to English' : 'Chuyển sang Tiếng Việt';

    return (
        <IconButton
            onClick={toggleLanguage}
            title={label}
            aria-label={label}
        >
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                {/* Globe icon */}
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
        </IconButton>
    );
}
