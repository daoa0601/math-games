// UI primitives
export * from './ui';

// Layout components
export * from './layout';

// Auth components
export * from './auth';

// Gamification components
export * from './gamification';

// Icons
export { MagicGraphIcon, SequenceRaceIcon, ShapeArchitectIcon } from './icons';

// Tutorial
export * from './Tutorial';

// Learn Modal
export { LearnModal } from './LearnModal';
export type { LearnModalProps } from './LearnModal';
// GameId is deprecated - use StorageGameId from '@/shared/types' instead

// Feedback Modal
export { FeedbackModal } from './FeedbackModal';
export type { FeedbackModalProps } from './FeedbackModal';

// Overlays
export { GameOverlay, VictoryModal } from './overlays';
export type { GameOverlayProps, VictoryModalProps, VictoryVariant } from './overlays';

// Daily Challenge
export { DailyChallenge } from './DailyChallenge';

// Personal Best
export { PersonalBestIndicator } from './PersonalBest';
export type { PersonalBestIndicatorProps } from './PersonalBest';

// Remaining top-level components
export { ErrorBoundary } from './ErrorBoundary';
export { ErrorFallback } from './ErrorFallback';
export { HelpButton } from './HelpButton';
export { HighContrastToggle } from './HighContrastToggle';
export { LanguageSwitcher } from './LanguageSwitcher';
export {
  ScreenReaderAnnounceProvider,
  ScreenReaderAnnounce,
  useAnnounce
} from './ScreenReaderAnnounce';
export type { AnnouncePriority } from './ScreenReaderAnnounce';
export { SkipLinks } from './SkipLinks';
export { SoundToggle } from './SoundToggle';
export type { SoundToggleProps } from './SoundToggle';
