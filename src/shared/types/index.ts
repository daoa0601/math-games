/**
 * Shared Type Definitions
 */

export type {
  StorageGameId,
  ComponentGameId,
  AchievementCategory,
  GameId, // Legacy alias
} from './game';

export {
  STORAGE_GAME_IDS,
  COMPONENT_GAME_IDS,
  toStorageId,
  toComponentId,
  toUrlPath,
} from './game';

export type { AnnouncementType, GameAnnouncement } from './announcements';
