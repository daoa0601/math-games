/**
 * SequenceRace Hooks - Barrel Export
 *
 * Game-specific hooks extracted from SequenceRaceGame for better
 * separation of concerns and testability.
 */

export { useSequenceRaceState, type UseSequenceRaceStateReturn } from './useSequenceRaceState';
export { useAIOpponent, type UseAIOpponentReturn, type AIReaction } from './useAIOpponent';
export { useHintSystem, type UseHintSystemReturn } from './useHintSystem';
