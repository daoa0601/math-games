import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useFocusTrap } from '@/shared/hooks/accessibility';
import { MagicGraphLearn } from './content/MagicGraphLearn';
import { SequenceRaceLearn } from './content/SequenceRaceLearn';
import { ShapeArchitectLearn } from './content/ShapeArchitectLearn';
import './LearnModal.css';

export type GameId = 'magic-graph' | 'sequence-race' | 'shape-architect';

export interface LearnModalProps {
  gameId: GameId | null;
  isOpen: boolean;
  onClose: () => void;
}

const GAME_TITLES: Record<GameId, string> = {
  'magic-graph': 'games.magicGraph.title',
  'sequence-race': 'games.sequenceRace.title',
  'shape-architect': 'games.shapeArchitect.title',
};

const GAME_ICONS: Record<GameId, string> = {
  'magic-graph': '✨',
  'sequence-race': '🏃',
  'shape-architect': '🏗️',
};

function LearnContent({ gameId, lang }: { gameId: GameId; lang: string }) {
  switch (gameId) {
    case 'magic-graph':
      return <MagicGraphLearn lang={lang} />;
    case 'sequence-race':
      return <SequenceRaceLearn lang={lang} />;
    case 'shape-architect':
      return <ShapeArchitectLearn lang={lang} />;
    default:
      return null;
  }
}

/**
 * LearnModal
 *
 * Modal overlay that displays student-friendly mathematical content
 * for each game. Uses createPortal to escape parent overflow constraints
 * and useFocusTrap for accessibility.
 *
 * Entry points:
 * - Dashboard "Learn" tab
 * - In-game "?" button
 */
export function LearnModal({ gameId, isOpen, onClose }: LearnModalProps) {
  const { t, i18n } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);

  useFocusTrap({
    containerRef,
    onEscape: onClose,
    enabled: isOpen,
    autoFocus: true,
    restoreFocus: true,
  });

  if (!isOpen || !gameId) return null;

  const modalContent = (
    <div className="learn-modal" onClick={onClose}>
      <div className="learn-modal__backdrop" aria-hidden="true" />
      <div
        className="learn-modal__card"
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="learn-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="learn-modal__header">
          <div className="learn-modal__title-wrapper">
            <span className="learn-modal__icon" aria-hidden="true">
              {GAME_ICONS[gameId]}
            </span>
            <h2 id="learn-modal-title" className="learn-modal__title">
              {t(GAME_TITLES[gameId])}
            </h2>
          </div>
          <button
            className="learn-modal__close"
            onClick={onClose}
            aria-label={t('common.close')}
            type="button"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>
        <div className="learn-modal__body">
          <LearnContent gameId={gameId} lang={i18n.language} />
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default LearnModal;
