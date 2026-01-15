// Game hooks
export * from './game';

// Accessibility hooks
export * from './accessibility';

// Gesture hooks
export * from './gestures';

// Device capability hooks
export * from './device';

// Firebase hooks
export * from './firebase';

// Cross-cutting hooks (remain at root)
export { useTutorial } from './useTutorial';
export type { UseTutorialOptions, UseTutorialReturn } from './useTutorial';

// Translation hooks
export { useGameTranslations } from './useGameTranslations';
export type { GameNamespace } from './useGameTranslations';
