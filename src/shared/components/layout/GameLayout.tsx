import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { SkipLinks } from '@/shared/components/SkipLinks';
import { ThemeToggle } from '@/shared/components/ThemeToggle';
import { LearnModal, type GameId } from '@/shared/components/LearnModal';

interface GameLayoutProps {
    title: string;
    children: ReactNode;
    /** Optional content to display in the header (e.g., SoundToggle) */
    headerRight?: ReactNode;
    /** Game ID for the Learn modal */
    gameId?: GameId;
}

export function GameLayout({ title, children, headerRight, gameId }: GameLayoutProps) {
    const { t } = useTranslation();
    const [showLearn, setShowLearn] = useState(false);

    return (
        <div className="game-container">
            <SkipLinks />
            <header className="game-header">
                <h1 className="game-header__title">{title}</h1>
                <div className="game-header__actions">
                    {headerRight}
                    {gameId && (
                        <button
                            className="game-btn game-btn--ghost learn-button"
                            onClick={() => setShowLearn(true)}
                            aria-label={t('learn.howToPlay')}
                        >
                            ?
                        </button>
                    )}
                    <ThemeToggle />
                    <LanguageSwitcher />
                    <Link to="/" className="game-btn game-btn--secondary">
                        ← {t('backToGames')}
                    </Link>
                </div>
            </header>
            <main id="main-content" className="game-content">
                <div id="game-area">
                    {children}
                </div>
            </main>

            {gameId && (
                <LearnModal
                    gameId={gameId}
                    isOpen={showLearn}
                    onClose={() => setShowLearn(false)}
                />
            )}
        </div>
    );
}
