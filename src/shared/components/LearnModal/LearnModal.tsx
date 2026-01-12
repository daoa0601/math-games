import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/shared/components/ui';
import type { StorageGameId } from '@/shared/types/game';
import { MagicGraphLearn } from './content/MagicGraphLearn';
import { SequenceRaceLearn } from './content/SequenceRaceLearn';
import { ShapeArchitectLearn } from './content/ShapeArchitectLearn';
import './LearnModal.css';

export interface LearnModalProps {
  gameId: StorageGameId | null;
  isOpen: boolean;
  onClose: () => void;
}

const GAME_TITLES: Record<StorageGameId, string> = {
  'magic-graph': 'games.magicGraph.title',
  'sequence-race': 'games.sequenceRace.title',
  'shape-architect': 'games.shapeArchitect.title',
};

function LearnContent({ gameId, lang }: { gameId: StorageGameId; lang: string }) {
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
 * for each game. Uses BottomSheet for consistent modal behavior.
 *
 * Entry points:
 * - Dashboard "Learn" tab
 * - In-game "?" button
 */
export function LearnModal({ gameId, isOpen, onClose }: LearnModalProps) {
  const { t, i18n } = useTranslation();

  if (!gameId) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={t(GAME_TITLES[gameId])}
      detent="full"
      className="learn-modal-sheet"
    >
      <LearnContent gameId={gameId} lang={i18n.language} />
    </BottomSheet>
  );
}

export default LearnModal;
