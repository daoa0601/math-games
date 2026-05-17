// ========================================
// Sequence Race Logic - Barrel Export
// ========================================

// Types
export type {
  SequenceType,
  GameMode,
  Player,
  SequenceState,
  HistoryEntry,
  GameConfig,
} from "./types";

// Engine functions
export {
  createGameState,
  getValidMoves,
  isValidMove,
  isHumanTurn,
  applyMove,
  getAIMove,
  analyzePosition,
  analyzePlayerMove,
  validateGameFairness,
  validateAllPresets,
  type MoveAnalysis,
  type FairnessResult,
} from "./engine";

// Presets
export {
  generateSequence,
  SEQUENCE_INFO,
  presetGames,
  generateRandomConfig,
  runPresetValidation,
  type SequenceInfo,
} from "./presets";

// Seeded Generator
export {
  generateSeededConfig,
  getDailySequenceRaceConfig,
  previewDailyConfig,
} from "./seededGenerator";
