export { useGameTimer, formatTime, DEFAULT_TIMER_DURATION } from './useGameTimer';
export type { UseGameTimerOptions, UseGameTimerReturn } from './useGameTimer';
export { useHighContrast } from './useHighContrast';
export { useGameRewards } from './useGameRewards';
export type { GameCompletionParams, CompletionRewards, UseGameRewardsReturn } from './useGameRewards';
export { useGameKeyboard } from './useGameKeyboard';
export type { GameKeyboardShortcuts } from './useGameKeyboard';

// Accessibility hooks
export { useFocusTrap } from './useFocusTrap';
export type { UseFocusTrapOptions, UseFocusTrapReturn } from './useFocusTrap';
export { useAnnounce } from './useAnnounce';
export type { AnnouncePriority } from './useAnnounce';

// Touch gesture hooks
export { useSwipe, useSwipeNavigation, useSwipeBack } from './useSwipe';
export type { SwipeDirection, SwipeEvent, UseSwipeOptions, UseSwipeReturn } from './useSwipe';
export { usePinchZoom, usePinchZoomState } from './usePinchZoom';
export type { PinchEvent, UsePinchZoomOptions, UsePinchZoomReturn } from './usePinchZoom';
export { useDragScroll } from './useDragScroll';
export type { UseDragScrollOptions, UseDragScrollReturn } from './useDragScroll';

// Tutorial hook
export { useTutorial } from './useTutorial';
export type { UseTutorialOptions, UseTutorialReturn } from './useTutorial';
