/**
 * Migration Service Tests
 *
 * Tests for the merge strategies used in localStorage ↔ Firestore migration.
 */

import { describe, it, expect } from 'vitest';
import {
  mergeStats,
  mergeAchievements,
  mergeProfiles,
} from '../services/migrationService';
import type { PlayerProfile, PlayerStats } from '@/shared/schemas/playerProfile.schema';

describe('migrationService', () => {
  describe('mergeStats', () => {
    it('takes maximum values from both stat objects', () => {
      const local: PlayerStats = {
        totalGamesPlayed: 10,
        totalPuzzlesSolved: 5,
        totalWins: 3,
        magicGraphSolved: 2,
        sequenceRaceWins: 1,
        shapeArchitectBuilt: 2,
        bestTimes: {
          magicGraphFastest: 30000,
          sequenceRaceFastest: 45000,
          shapeArchitectFastest: null,
        },
      };

      const remote: PlayerStats = {
        totalGamesPlayed: 8,
        totalPuzzlesSolved: 7,
        totalWins: 2,
        magicGraphSolved: 4,
        sequenceRaceWins: 1,
        shapeArchitectBuilt: 1,
        bestTimes: {
          magicGraphFastest: 25000,
          sequenceRaceFastest: null,
          shapeArchitectFastest: 60000,
        },
      };

      const merged = mergeStats(local, remote);

      expect(merged.totalGamesPlayed).toBe(10); // max(10, 8)
      expect(merged.totalPuzzlesSolved).toBe(7); // max(5, 7)
      expect(merged.totalWins).toBe(3); // max(3, 2)
      expect(merged.magicGraphSolved).toBe(4); // max(2, 4)
      expect(merged.sequenceRaceWins).toBe(1); // max(1, 1)
      expect(merged.shapeArchitectBuilt).toBe(2); // max(2, 1)
    });

    it('takes the better (lower) best time when both exist', () => {
      const local: PlayerStats = {
        totalGamesPlayed: 0,
        totalPuzzlesSolved: 0,
        totalWins: 0,
        magicGraphSolved: 0,
        sequenceRaceWins: 0,
        shapeArchitectBuilt: 0,
        bestTimes: {
          magicGraphFastest: 30000,
          sequenceRaceFastest: 45000,
          shapeArchitectFastest: 60000,
        },
      };

      const remote: PlayerStats = {
        totalGamesPlayed: 0,
        totalPuzzlesSolved: 0,
        totalWins: 0,
        magicGraphSolved: 0,
        sequenceRaceWins: 0,
        shapeArchitectBuilt: 0,
        bestTimes: {
          magicGraphFastest: 25000,
          sequenceRaceFastest: 50000,
          shapeArchitectFastest: 55000,
        },
      };

      const merged = mergeStats(local, remote);

      expect(merged.bestTimes.magicGraphFastest).toBe(25000); // min(30000, 25000)
      expect(merged.bestTimes.sequenceRaceFastest).toBe(45000); // min(45000, 50000)
      expect(merged.bestTimes.shapeArchitectFastest).toBe(55000); // min(60000, 55000)
    });

    it('takes non-null time when one is null', () => {
      const local: PlayerStats = {
        totalGamesPlayed: 0,
        totalPuzzlesSolved: 0,
        totalWins: 0,
        magicGraphSolved: 0,
        sequenceRaceWins: 0,
        shapeArchitectBuilt: 0,
        bestTimes: {
          magicGraphFastest: 30000,
          sequenceRaceFastest: null,
          shapeArchitectFastest: null,
        },
      };

      const remote: PlayerStats = {
        totalGamesPlayed: 0,
        totalPuzzlesSolved: 0,
        totalWins: 0,
        magicGraphSolved: 0,
        sequenceRaceWins: 0,
        shapeArchitectBuilt: 0,
        bestTimes: {
          magicGraphFastest: null,
          sequenceRaceFastest: 45000,
          shapeArchitectFastest: null,
        },
      };

      const merged = mergeStats(local, remote);

      expect(merged.bestTimes.magicGraphFastest).toBe(30000);
      expect(merged.bestTimes.sequenceRaceFastest).toBe(45000);
      expect(merged.bestTimes.shapeArchitectFastest).toBeNull();
    });
  });

  describe('mergeAchievements', () => {
    it('returns union of both achievement lists', () => {
      const local = ['global_first_steps', 'mg_first_solve'];
      const remote = ['global_first_steps', 'sr_first_victory'];

      const merged = mergeAchievements(local, remote);

      expect(merged).toHaveLength(3);
      expect(merged).toContain('global_first_steps');
      expect(merged).toContain('mg_first_solve');
      expect(merged).toContain('sr_first_victory');
    });

    it('handles empty arrays', () => {
      expect(mergeAchievements([], [])).toEqual([]);
      expect(mergeAchievements(['a'], [])).toEqual(['a']);
      expect(mergeAchievements([], ['b'])).toEqual(['b']);
    });

    it('removes duplicates', () => {
      const local = ['a', 'b', 'c'];
      const remote = ['b', 'c', 'd'];

      const merged = mergeAchievements(local, remote);

      expect(merged).toHaveLength(4);
      expect(merged.filter(a => a === 'b')).toHaveLength(1);
    });
  });

  describe('mergeProfiles', () => {
    const createTestProfile = (overrides: Partial<PlayerProfile> = {}): PlayerProfile => ({
      id: 'test-id',
      displayName: '',
      stats: {
        totalGamesPlayed: 0,
        totalPuzzlesSolved: 0,
        totalWins: 0,
        magicGraphSolved: 0,
        sequenceRaceWins: 0,
        shapeArchitectBuilt: 0,
        bestTimes: {
          magicGraphFastest: null,
          sequenceRaceFastest: null,
          shapeArchitectFastest: null,
        },
      },
      rank: 'beginner',
      streak: 0,
      lastPlayedDate: null,
      achievements: [],
      preferences: {
        soundEnabled: true,
        practiceMode: false,
        language: 'en',
      },
      createdAt: '2024-01-01T00:00:00.000Z',
      version: 2,
      ...overrides,
    });

    it('prefers non-empty display name', () => {
      const local = createTestProfile({ displayName: 'Local Player' });
      const remote = createTestProfile({ displayName: '' });

      const merged = mergeProfiles(local, remote);
      expect(merged.displayName).toBe('Local Player');

      const merged2 = mergeProfiles(
        createTestProfile({ displayName: '' }),
        createTestProfile({ displayName: 'Remote Player' })
      );
      expect(merged2.displayName).toBe('Remote Player');
    });

    it('takes the higher streak', () => {
      const local = createTestProfile({ streak: 5 });
      const remote = createTestProfile({ streak: 10 });

      const merged = mergeProfiles(local, remote);
      expect(merged.streak).toBe(10);
    });

    it('keeps local preferences', () => {
      const local = createTestProfile({
        preferences: { soundEnabled: false, practiceMode: true, language: 'vi' },
      });
      const remote = createTestProfile({
        preferences: { soundEnabled: true, practiceMode: false, language: 'en' },
      });

      const merged = mergeProfiles(local, remote);
      expect(merged.preferences.soundEnabled).toBe(false);
      expect(merged.preferences.practiceMode).toBe(true);
      expect(merged.preferences.language).toBe('vi');
    });

    it('merges stats using max values', () => {
      const local = createTestProfile({
        stats: {
          totalGamesPlayed: 10,
          totalPuzzlesSolved: 5,
          totalWins: 3,
          magicGraphSolved: 2,
          sequenceRaceWins: 1,
          shapeArchitectBuilt: 2,
          bestTimes: {
            magicGraphFastest: 30000,
            sequenceRaceFastest: null,
            shapeArchitectFastest: null,
          },
        },
      });
      const remote = createTestProfile({
        stats: {
          totalGamesPlayed: 8,
          totalPuzzlesSolved: 7,
          totalWins: 2,
          magicGraphSolved: 4,
          sequenceRaceWins: 1,
          shapeArchitectBuilt: 1,
          bestTimes: {
            magicGraphFastest: 25000,
            sequenceRaceFastest: 45000,
            shapeArchitectFastest: null,
          },
        },
      });

      const merged = mergeProfiles(local, remote);
      expect(merged.stats.totalGamesPlayed).toBe(10);
      expect(merged.stats.totalPuzzlesSolved).toBe(7);
      expect(merged.stats.bestTimes.magicGraphFastest).toBe(25000);
    });

    it('merges achievements using union', () => {
      const local = createTestProfile({
        achievements: ['global_first_steps', 'mg_first_solve'],
      });
      const remote = createTestProfile({
        achievements: ['global_first_steps', 'sr_first_victory'],
      });

      const merged = mergeProfiles(local, remote);
      expect(merged.achievements).toHaveLength(3);
      expect(merged.achievements).toContain('global_first_steps');
      expect(merged.achievements).toContain('mg_first_solve');
      expect(merged.achievements).toContain('sr_first_victory');
    });

    it('keeps the earliest creation date', () => {
      const local = createTestProfile({ createdAt: '2024-02-01T00:00:00.000Z' });
      const remote = createTestProfile({ createdAt: '2024-01-01T00:00:00.000Z' });

      const merged = mergeProfiles(local, remote);
      expect(merged.createdAt).toBe('2024-01-01T00:00:00.000Z');
    });

    it('uses remote ID (Firebase UID)', () => {
      const local = createTestProfile({ id: 'local-id' });
      const remote = createTestProfile({ id: 'firebase-uid' });

      const merged = mergeProfiles(local, remote);
      expect(merged.id).toBe('firebase-uid');
    });
  });
});
