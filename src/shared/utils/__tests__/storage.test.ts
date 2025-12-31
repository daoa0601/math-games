import { describe, it, expect, beforeEach } from 'vitest';
import {
    getProgress,
    saveProgress,
    completeLevel,
    isLevelUnlocked,
    isLevelCompleted,
    getBestTime,
    getTotalScore,
    resetProgress,
    getGlobalStats,
    type GameId,
    type GameProgress,
} from '../storage';

describe('Storage Service', () => {
    const testGameId: GameId = 'magic-graph';

    beforeEach(() => {
        // localStorage is cleared in setup.ts before each test
    });

    describe('getProgress', () => {
        it('returns default progress when no data exists', () => {
            const progress = getProgress(testGameId);

            expect(progress.gameId).toBe(testGameId);
            expect(progress.unlockedLevels).toEqual([]);
            expect(progress.completedLevels.size).toBe(0);
            expect(progress.totalScore).toBe(0);
            expect(progress.lastPlayed).toBeNull();
        });

        it('returns saved progress when data exists', () => {
            const mockProgress: GameProgress = {
                gameId: testGameId,
                unlockedLevels: ['level_2', 'level_3'],
                completedLevels: new Map([
                    ['level_1', { levelId: 'level_1', completed: true, bestTime: 30, completedAt: '2025-01-01' }],
                ]),
                totalScore: 100,
                lastPlayed: '2025-01-01',
            };

            saveProgress(mockProgress);
            const retrieved = getProgress(testGameId);

            expect(retrieved.gameId).toBe(testGameId);
            expect(retrieved.unlockedLevels).toEqual(['level_2', 'level_3']);
            expect(retrieved.completedLevels.get('level_1')?.bestTime).toBe(30);
            expect(retrieved.totalScore).toBe(100);
        });
    });

    describe('completeLevel', () => {
        it('marks level as completed and updates score', () => {
            const progress = completeLevel(testGameId, 'level_1', 45);

            expect(progress.completedLevels.get('level_1')?.completed).toBe(true);
            expect(progress.completedLevels.get('level_1')?.bestTime).toBe(45);
            expect(progress.totalScore).toBeGreaterThan(0);
            expect(progress.lastPlayed).not.toBeNull();
        });

        it('unlocks next level when provided', () => {
            const progress = completeLevel(testGameId, 'level_1', 30, 'level_2');

            expect(progress.unlockedLevels).toContain('level_2');
        });

        it('updates best time when faster', () => {
            completeLevel(testGameId, 'level_1', 60);
            const progress = completeLevel(testGameId, 'level_1', 30);

            expect(progress.completedLevels.get('level_1')?.bestTime).toBe(30);
        });

        it('keeps best time when slower', () => {
            completeLevel(testGameId, 'level_1', 30);
            const progress = completeLevel(testGameId, 'level_1', 60);

            expect(progress.completedLevels.get('level_1')?.bestTime).toBe(30);
        });

        it('adds time bonus for fast completions', () => {
            const slowProgress = completeLevel('sequence-race', 'level_1', 59);
            const slowScore = slowProgress.totalScore;

            resetProgress('shape-architect');
            const fastProgress = completeLevel('shape-architect', 'level_1', 10);
            const fastScore = fastProgress.totalScore;

            // Fast completion should give bonus
            expect(fastScore).toBeGreaterThan(slowScore);
        });
    });

    describe('isLevelUnlocked', () => {
        it('returns true for first level always', () => {
            expect(isLevelUnlocked(testGameId, 'level_1', 'level_1')).toBe(true);
        });

        it('returns false for locked levels', () => {
            expect(isLevelUnlocked(testGameId, 'level_2', 'level_1')).toBe(false);
        });

        it('returns true for unlocked levels', () => {
            completeLevel(testGameId, 'level_1', 30, 'level_2');
            expect(isLevelUnlocked(testGameId, 'level_2', 'level_1')).toBe(true);
        });
    });

    describe('isLevelCompleted', () => {
        it('returns false for uncompleted levels', () => {
            expect(isLevelCompleted(testGameId, 'level_1')).toBe(false);
        });

        it('returns true for completed levels', () => {
            completeLevel(testGameId, 'level_1', 30);
            expect(isLevelCompleted(testGameId, 'level_1')).toBe(true);
        });
    });

    describe('getBestTime', () => {
        it('returns null for uncompleted levels', () => {
            expect(getBestTime(testGameId, 'level_1')).toBeNull();
        });

        it('returns best time for completed levels', () => {
            completeLevel(testGameId, 'level_1', 42);
            expect(getBestTime(testGameId, 'level_1')).toBe(42);
        });
    });

    describe('getTotalScore', () => {
        it('returns 0 for new game', () => {
            expect(getTotalScore(testGameId)).toBe(0);
        });

        it('returns accumulated score', () => {
            completeLevel(testGameId, 'level_1', 30);
            completeLevel(testGameId, 'level_2', 30);
            expect(getTotalScore(testGameId)).toBeGreaterThan(0);
        });
    });

    describe('resetProgress', () => {
        it('clears all progress for a game', () => {
            completeLevel(testGameId, 'level_1', 30, 'level_2');
            resetProgress(testGameId);

            const progress = getProgress(testGameId);
            expect(progress.completedLevels.size).toBe(0);
            expect(progress.totalScore).toBe(0);
        });
    });

    describe('getGlobalStats', () => {
        it('aggregates stats across all games', () => {
            completeLevel('magic-graph', 'level_1', 30);
            completeLevel('sequence-race', 'level_1', 30);

            const stats = getGlobalStats();
            expect(stats.totalScore).toBeGreaterThan(0);
            expect(stats.gamesPlayed).toBe(2);
            expect(stats.levelsCompleted).toBe(2);
        });
    });
});
