import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import { HighContrastToggle } from './HighContrastToggle';
import { LanguageSwitcher } from './LanguageSwitcher';

interface GameLayoutProps {
    title: string;
    children: ReactNode;
}

export function GameLayout({ title, children }: GameLayoutProps) {
    const { t } = useTranslation();

    return (
        <div className="game-container">
            <header className="game-header">
                <h1 className="game-header__title">{title}</h1>
                <div className="game-header__actions">
                    <HighContrastToggle />
                    <LanguageSwitcher />
                    <Link to="/" className="btn btn--secondary">
                        ← {t('backToGames')}
                    </Link>
                </div>
            </header>
            <main className="game-content">
                {children}
            </main>
        </div>
    );
}
