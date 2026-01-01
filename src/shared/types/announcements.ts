/**
 * Game Announcement Types for Screen Reader Accessibility
 *
 * These types define the structure for announcing game state changes
 * to screen reader users. Used by the useAnnounce hook and game components.
 */

/**
 * Categories of game announcements
 *
 * - timer-warning: Time is running low (e.g., "30 seconds remaining")
 * - game-won: Player has won the game
 * - game-lost: Player has lost the game
 * - time-up: Timer has expired
 * - turn-change: Turn has changed (e.g., in SequenceRace)
 * - piece-placed: A piece was placed on the board
 * - move-made: A move was completed
 * - hint-available: A hint is available for the player
 */
export type AnnouncementType =
  | 'timer-warning'
  | 'game-won'
  | 'game-lost'
  | 'time-up'
  | 'turn-change'
  | 'piece-placed'
  | 'move-made'
  | 'hint-available';

/**
 * Structure for game announcements sent to screen readers
 *
 * @property message - The text to be announced
 * @property priority - 'polite' waits for current speech, 'assertive' interrupts
 * @property type - Category of announcement for filtering/handling
 */
export interface GameAnnouncement {
  message: string;
  priority: 'polite' | 'assertive';
  type: AnnouncementType;
}
