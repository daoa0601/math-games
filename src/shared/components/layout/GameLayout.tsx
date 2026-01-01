import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { SkipLinks } from '@/shared/components/SkipLinks';
import { ThemeToggle } from '@/shared/components/ThemeToggle';

interface GameLayoutProps {
    title: string;
    children: ReactNode;
    /** Optional content to display in the header (e.g., SoundToggle) */
    headerRight?: ReactNode;
}

export function GameLayout({ title, children, headerRight }: GameLayoutProps) {
    const { t } = useTranslation();

    return (
        <div className="game-container">
            <SkipLinks />
            <header className="game-header">
                <h1 className="game-header__title">{title}</h1>
                <div className="game-header__actions">
                    {headerRight}
                    <ThemeToggle />
                    <LanguageSwitcher />
                    <Link to="/" className="btn btn--secondary">
                        ← {t('backToGames')}
                    </Link>
                </div>
            </header>
            <main id="main-content" className="game-content">
                <div id="game-area">
                    {children}
                </div>
            </main>
        </div>
    );
}
