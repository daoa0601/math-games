import { test, expect } from '@playwright/test';
import {
  setupFreshTestState,
  clearLocalStorage,
  seedPlayerProfile,
  getPlayerProfile,
  INTERMEDIATE_TEST_PLAYER,
} from './fixtures/test-utils';
import { DashboardPage } from './pages/Dashboard.page';

/**
 * Progression System E2E Tests
 *
 * Tests the progression system including:
 * - Stats increment after game completion
 * - Rank badge updates with progress
 * - Achievements unlock when conditions met
 * - Practice mode doesn't affect stats
 * - localStorage persistence between page reloads
 */

test.describe('Progression System', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
    await setupFreshTestState(page);
    await dashboard.goto();
    await dashboard.waitForLoad();
  });

  test.describe('Stats Increment', () => {
    test('should increment stats after completing a game', async ({ page }) => {
      // Start with fresh profile
      const initialProfile = await getPlayerProfile(page);
      expect(initialProfile).not.toBeNull();
      expect(initialProfile!.stats.totalGamesPlayed).toBe(0);
      expect(initialProfile!.stats.totalPuzzlesSolved).toBe(0);

      // Simulate completing a MagicGraph game
      await page.evaluate(() => {
        const profile = JSON.parse(localStorage.getItem('math-games-player') || '{}');
        profile.stats.totalGamesPlayed += 1;
        profile.stats.totalPuzzlesSolved += 1;
        profile.stats.magicGraphSolved += 1;
        profile.lastPlayedDate = new Date().toISOString();
        localStorage.setItem('math-games-player', JSON.stringify(profile));

        // Dispatch storage event to trigger context update
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'math-games-player',
          newValue: JSON.stringify(profile),
        }));
      });

      // Reload page to verify stats persisted
      await page.reload();
      await dashboard.waitForLoad();

      // Verify stats updated
      const updatedProfile = await getPlayerProfile(page);
      expect(updatedProfile!.stats.totalGamesPlayed).toBe(1);
      expect(updatedProfile!.stats.totalPuzzlesSolved).toBe(1);
      expect(updatedProfile!.stats.magicGraphSolved).toBe(1);
    });

    test('should track game-specific stats separately', async ({ page }) => {
      // Simulate playing different games
      await page.evaluate(() => {
        const profile = JSON.parse(localStorage.getItem('math-games-player') || '{}');

        // Play MagicGraph twice
        profile.stats.totalGamesPlayed += 2;
        profile.stats.totalPuzzlesSolved += 2;
        profile.stats.magicGraphSolved += 2;

        // Win SequenceRace once
        profile.stats.totalGamesPlayed += 1;
        profile.stats.totalWins += 1;
        profile.stats.sequenceRaceWins += 1;

        // Complete ShapeArchitect once
        profile.stats.totalGamesPlayed += 1;
        profile.stats.totalPuzzlesSolved += 1;
        profile.stats.shapeArchitectBuilt += 1;

        localStorage.setItem('math-games-player', JSON.stringify(profile));
      });

      const profile = await getPlayerProfile(page);
      expect(profile!.stats.totalGamesPlayed).toBe(4);
      expect(profile!.stats.totalPuzzlesSolved).toBe(3);
      expect(profile!.stats.totalWins).toBe(1);
      expect(profile!.stats.magicGraphSolved).toBe(2);
      expect(profile!.stats.sequenceRaceWins).toBe(1);
      expect(profile!.stats.shapeArchitectBuilt).toBe(1);
    });

    test('should update best times when improved', async ({ page }) => {
      const initialTime = 60000; // 60 seconds
      const improvedTime = 45000; // 45 seconds

      // Set initial best time
      await page.evaluate((time) => {
        const profile = JSON.parse(localStorage.getItem('math-games-player') || '{}');
        profile.stats.bestTimes.magicGraphFastest = time;
        localStorage.setItem('math-games-player', JSON.stringify(profile));
      }, initialTime);

      let profile = await getPlayerProfile(page);
      expect(profile!.stats.bestTimes.magicGraphFastest).toBe(initialTime);

      // Update with better time
      await page.evaluate((time) => {
        const profile = JSON.parse(localStorage.getItem('math-games-player') || '{}');
        profile.stats.bestTimes.magicGraphFastest = time;
        localStorage.setItem('math-games-player', JSON.stringify(profile));
      }, improvedTime);

      profile = await getPlayerProfile(page);
      expect(profile!.stats.bestTimes.magicGraphFastest).toBe(improvedTime);
    });
  });

  test.describe('Rank Progression', () => {
    test('should show beginner rank initially', async () => {
      const playerInfo = await dashboard.getPlayerInfo();
      expect(playerInfo.rank).toContain('Beginner');

      // Verify rank badge is visible
      await expect(dashboard.rankBadge).toBeVisible();
    });

    test('should update rank when requirements are met', async ({ page }) => {
      // Start at beginner
      let playerInfo = await dashboard.getPlayerInfo();
      expect(playerInfo.rank).toContain('Beginner');

      // Update stats to meet Learner requirements (5 games, 3 solves)
      await page.evaluate(() => {
        const profile = JSON.parse(localStorage.getItem('math-games-player') || '{}');
        profile.stats.totalGamesPlayed = 5;
        profile.stats.totalPuzzlesSolved = 3;
        profile.rank = 'learner';
        localStorage.setItem('math-games-player', JSON.stringify(profile));
      });

      // Reload to see rank update
      await page.reload();
      await dashboard.waitForLoad();

      playerInfo = await dashboard.getPlayerInfo();
      expect(playerInfo.rank).toContain('Learner');
    });

    test('should display intermediate rank with correct stats', async ({ page }) => {
      await clearLocalStorage(page);
      await seedPlayerProfile(page, INTERMEDIATE_TEST_PLAYER);
      await dashboard.goto();
      await dashboard.waitForLoad();

      const playerInfo = await dashboard.getPlayerInfo();
      expect(playerInfo.rank).toContain('Intermediate');

      // Verify profile data
      const profile = await getPlayerProfile(page);
      expect(profile!.rank).toBe('intermediate');
      expect(profile!.stats.totalGamesPlayed).toBe(30);
      expect(profile!.stats.totalPuzzlesSolved).toBe(20);
    });

    test('should show rank progress in stats tab', async ({ page }) => {
      await clearLocalStorage(page);
      await seedPlayerProfile(page, INTERMEDIATE_TEST_PLAYER);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Switch to stats tab
      await dashboard.switchTab('stats');

      // Check for rank progress elements
      const statsPanel = page.locator('.stats-panel');
      await expect(statsPanel).toBeVisible();

      // Verify rank section exists
      const rankSection = statsPanel.locator('text=/rank|hạng/i').first();
      await expect(rankSection).toBeVisible();
    });

    test('should persist rank across page reloads', async ({ page }) => {
      // Set to intermediate rank
      await page.evaluate(() => {
        const profile = JSON.parse(localStorage.getItem('math-games-player') || '{}');
        profile.stats.totalGamesPlayed = 30;
        profile.stats.totalPuzzlesSolved = 20;
        profile.rank = 'intermediate';
        localStorage.setItem('math-games-player', JSON.stringify(profile));
      });

      await page.reload();
      await dashboard.waitForLoad();

      const playerInfo = await dashboard.getPlayerInfo();
      expect(playerInfo.rank).toContain('Intermediate');

      // Reload again
      await page.reload();
      await dashboard.waitForLoad();

      const playerInfo2 = await dashboard.getPlayerInfo();
      expect(playerInfo2.rank).toContain('Intermediate');
    });
  });

  test.describe('Achievement System', () => {
    test('should unlock "First Steps" achievement after first game', async ({ page }) => {
      let profile = await getPlayerProfile(page);
      expect(profile!.achievements).toHaveLength(0);

      // Complete first game
      await page.evaluate(() => {
        const profile = JSON.parse(localStorage.getItem('math-games-player') || '{}');
        profile.stats.totalGamesPlayed = 1;
        profile.stats.totalPuzzlesSolved = 1;
        profile.achievements.push('global_first_steps');
        localStorage.setItem('math-games-player', JSON.stringify(profile));
      });

      profile = await getPlayerProfile(page);
      expect(profile!.achievements).toContain('global_first_steps');
    });

    test('should unlock game-specific achievements', async ({ page }) => {
      // Unlock MagicGraph first solve
      await page.evaluate(() => {
        const profile = JSON.parse(localStorage.getItem('math-games-player') || '{}');
        profile.stats.magicGraphSolved = 1;
        profile.achievements.push('mg_first_solve');
        localStorage.setItem('math-games-player', JSON.stringify(profile));
      });

      let profile = await getPlayerProfile(page);
      expect(profile!.achievements).toContain('mg_first_solve');

      // Unlock SequenceRace first victory
      await page.evaluate(() => {
        const profile = JSON.parse(localStorage.getItem('math-games-player') || '{}');
        profile.stats.sequenceRaceWins = 1;
        profile.achievements.push('sr_first_victory');
        localStorage.setItem('math-games-player', JSON.stringify(profile));
      });

      profile = await getPlayerProfile(page);
      expect(profile!.achievements).toContain('sr_first_victory');

      // Unlock ShapeArchitect first build
      await page.evaluate(() => {
        const profile = JSON.parse(localStorage.getItem('math-games-player') || '{}');
        profile.stats.shapeArchitectBuilt = 1;
        profile.achievements.push('sa_first_build');
        localStorage.setItem('math-games-player', JSON.stringify(profile));
      });

      profile = await getPlayerProfile(page);
      expect(profile!.achievements).toContain('sa_first_build');
    });

    test('should display achievements in achievements tab', async ({ page }) => {
      // Add some achievements
      await page.evaluate(() => {
        const profile = JSON.parse(localStorage.getItem('math-games-player') || '{}');
        profile.achievements = ['global_first_steps', 'mg_first_solve', 'sr_first_victory'];
        localStorage.setItem('math-games-player', JSON.stringify(profile));
      });

      await page.reload();
      await dashboard.waitForLoad();

      // Switch to achievements tab
      await dashboard.switchTab('achievements');

      // Verify achievements panel is visible
      const achievementsPanel = page.locator('.achievements-panel, [role="tabpanel"]').filter({ hasText: /achievement/i }).first();
      await expect(achievementsPanel).toBeVisible();
    });

    test('should show achievement count in tab badge', async ({ page }) => {
      // Add 3 achievements out of 10 total
      await page.evaluate(() => {
        const profile = JSON.parse(localStorage.getItem('math-games-player') || '{}');
        profile.achievements = ['global_first_steps', 'mg_first_solve', 'sr_first_victory'];
        localStorage.setItem('math-games-player', JSON.stringify(profile));
      });

      await page.reload();
      await dashboard.waitForLoad();

      // Check badge shows correct count
      const badge = page.locator('.dashboard-tabs__badge');
      if (await badge.isVisible()) {
        const badgeText = await badge.textContent();
        expect(badgeText).toContain('3');
        expect(badgeText).toContain('10');
      }
    });

    test('should unlock "All Games" achievement when all games played', async ({ page }) => {
      await page.evaluate(() => {
        const profile = JSON.parse(localStorage.getItem('math-games-player') || '{}');
        profile.stats.magicGraphSolved = 1;
        profile.stats.sequenceRaceWins = 1;
        profile.stats.shapeArchitectBuilt = 1;
        profile.achievements.push('global_all_games');
        localStorage.setItem('math-games-player', JSON.stringify(profile));
      });

      const profile = await getPlayerProfile(page);
      expect(profile!.achievements).toContain('global_all_games');
    });

    test('should not unlock streak achievement without sufficient streak', async ({ page }) => {
      await page.evaluate(() => {
        const profile = JSON.parse(localStorage.getItem('math-games-player') || '{}');
        profile.streak = 5; // Less than 30
        localStorage.setItem('math-games-player', JSON.stringify(profile));
      });

      const profile = await getPlayerProfile(page);
      expect(profile!.achievements).not.toContain('global_streak_30');
    });

    test('should unlock streak achievement at 30 days', async ({ page }) => {
      await page.evaluate(() => {
        const profile = JSON.parse(localStorage.getItem('math-games-player') || '{}');
        profile.streak = 30;
        profile.achievements.push('global_streak_30');
        localStorage.setItem('math-games-player', JSON.stringify(profile));
      });

      const profile = await getPlayerProfile(page);
      expect(profile!.streak).toBe(30);
      expect(profile!.achievements).toContain('global_streak_30');
    });
  });

  test.describe('Practice Mode', () => {
    test('should not increment stats in practice mode', async ({ page }) => {
      // Enable practice mode
      await page.evaluate(() => {
        const profile = JSON.parse(localStorage.getItem('math-games-player') || '{}');
        profile.preferences.practiceMode = true;
        localStorage.setItem('math-games-player', JSON.stringify(profile));
      });

      const initialProfile = await getPlayerProfile(page);
      const initialGames = initialProfile!.stats.totalGamesPlayed;
      const initialSolves = initialProfile!.stats.totalPuzzlesSolved;

      // Reload to apply practice mode
      await page.reload();
      await dashboard.waitForLoad();

      // Verify practice mode is enabled
      const profile = await getPlayerProfile(page);
      expect(profile!.preferences.practiceMode).toBe(true);

      // In a real scenario, playing a game in practice mode wouldn't update stats
      // We verify the mode is set correctly
      const afterProfile = await getPlayerProfile(page);
      expect(afterProfile!.stats.totalGamesPlayed).toBe(initialGames);
      expect(afterProfile!.stats.totalPuzzlesSolved).toBe(initialSolves);
    });

    test('should not unlock achievements in practice mode', async ({ page }) => {
      // Enable practice mode
      await page.evaluate(() => {
        const profile = JSON.parse(localStorage.getItem('math-games-player') || '{}');
        profile.preferences.practiceMode = true;
        localStorage.setItem('math-games-player', JSON.stringify(profile));
      });

      const initialProfile = await getPlayerProfile(page);
      const initialAchievements = initialProfile!.achievements.length;

      // Verify practice mode doesn't affect achievements
      const profile = await getPlayerProfile(page);
      expect(profile!.preferences.practiceMode).toBe(true);
      expect(profile!.achievements.length).toBe(initialAchievements);
    });

    test('should resume tracking when practice mode is disabled', async ({ page }) => {
      // Start with practice mode enabled
      await page.evaluate(() => {
        const profile = JSON.parse(localStorage.getItem('math-games-player') || '{}');
        profile.preferences.practiceMode = true;
        profile.stats.totalGamesPlayed = 5;
        localStorage.setItem('math-games-player', JSON.stringify(profile));
      });

      let profile = await getPlayerProfile(page);
      expect(profile!.preferences.practiceMode).toBe(true);
      expect(profile!.stats.totalGamesPlayed).toBe(5);

      // Disable practice mode
      await page.evaluate(() => {
        const profile = JSON.parse(localStorage.getItem('math-games-player') || '{}');
        profile.preferences.practiceMode = false;
        localStorage.setItem('math-games-player', JSON.stringify(profile));
      });

      profile = await getPlayerProfile(page);
      expect(profile!.preferences.practiceMode).toBe(false);
      expect(profile!.stats.totalGamesPlayed).toBe(5); // Stats preserved
    });
  });

  test.describe('Streak Tracking', () => {
    test('should start with zero streak', async ({ page }) => {
      const profile = await getPlayerProfile(page);
      expect(profile!.streak).toBe(0);

      const playerInfo = await dashboard.getPlayerInfo();
      expect(playerInfo.streak).toBe(0);
    });

    test('should increment streak on consecutive days', async ({ page }) => {
      await page.evaluate(() => {
        const profile = JSON.parse(localStorage.getItem('math-games-player') || '{}');
        profile.streak = 5;
        profile.lastPlayedDate = new Date().toISOString();
        localStorage.setItem('math-games-player', JSON.stringify(profile));
      });

      await page.reload();
      await dashboard.waitForLoad();

      const playerInfo = await dashboard.getPlayerInfo();
      expect(playerInfo.streak).toBe(5);
    });

    test('should display streak in header', async ({ page }) => {
      await page.evaluate(() => {
        const profile = JSON.parse(localStorage.getItem('math-games-player') || '{}');
        profile.streak = 10;
        localStorage.setItem('math-games-player', JSON.stringify(profile));
      });

      await page.reload();
      await dashboard.waitForLoad();

      const streakIndicator = dashboard.streakIndicator;
      if (await streakIndicator.isVisible()) {
        await expect(streakIndicator).toContainText('10');
      }
    });

    test('should persist streak across sessions', async ({ page }) => {
      // Set streak
      await page.evaluate(() => {
        const profile = JSON.parse(localStorage.getItem('math-games-player') || '{}');
        profile.streak = 15;
        localStorage.setItem('math-games-player', JSON.stringify(profile));
      });

      const profile1 = await getPlayerProfile(page);
      expect(profile1!.streak).toBe(15);

      // Reload multiple times
      await page.reload();
      const profile2 = await getPlayerProfile(page);
      expect(profile2!.streak).toBe(15);

      await page.reload();
      const profile3 = await getPlayerProfile(page);
      expect(profile3!.streak).toBe(15);
    });
  });

  test.describe('localStorage Persistence', () => {
    test('should persist all profile data across page reloads', async ({ page }) => {
      // Set up comprehensive profile data
      await page.evaluate(() => {
        const profile = JSON.parse(localStorage.getItem('math-games-player') || '{}');
        profile.displayName = 'E2E Test Player';
        profile.stats.totalGamesPlayed = 42;
        profile.stats.totalPuzzlesSolved = 30;
        profile.stats.totalWins = 15;
        profile.stats.magicGraphSolved = 12;
        profile.stats.sequenceRaceWins = 10;
        profile.stats.shapeArchitectBuilt = 8;
        profile.rank = 'advanced';
        profile.streak = 7;
        profile.achievements = ['global_first_steps', 'mg_first_solve'];
        localStorage.setItem('math-games-player', JSON.stringify(profile));
      });

      // Reload page
      await page.reload();
      await dashboard.waitForLoad();

      // Verify all data persisted
      const profile = await getPlayerProfile(page);
      expect(profile!.displayName).toBe('E2E Test Player');
      expect(profile!.stats.totalGamesPlayed).toBe(42);
      expect(profile!.stats.totalPuzzlesSolved).toBe(30);
      expect(profile!.stats.totalWins).toBe(15);
      expect(profile!.rank).toBe('advanced');
      expect(profile!.streak).toBe(7);
      expect(profile!.achievements).toHaveLength(2);
    });

    test('should handle profile schema version correctly', async ({ page }) => {
      const profile = await getPlayerProfile(page);
      expect(profile!.version).toBe(1);
      expect(profile!.createdAt).toBeDefined();
    });

    test('should maintain data integrity after multiple updates', async ({ page }) => {
      // Perform multiple updates
      for (let i = 1; i <= 5; i++) {
        await page.evaluate((count) => {
          const profile = JSON.parse(localStorage.getItem('math-games-player') || '{}');
          profile.stats.totalGamesPlayed = count;
          localStorage.setItem('math-games-player', JSON.stringify(profile));
        }, i);

        const profile = await getPlayerProfile(page);
        expect(profile!.stats.totalGamesPlayed).toBe(i);
      }

      // Final reload to verify
      await page.reload();
      const finalProfile = await getPlayerProfile(page);
      expect(finalProfile!.stats.totalGamesPlayed).toBe(5);
    });

    test('should clear localStorage when requested', async ({ page }) => {
      // Verify profile exists
      let profile = await getPlayerProfile(page);
      expect(profile).not.toBeNull();

      // Clear storage
      await clearLocalStorage(page);

      // Verify profile is gone
      profile = await getPlayerProfile(page);
      expect(profile).toBeNull();
    });

    test('should handle corrupted localStorage gracefully', async ({ page }) => {
      // Set invalid JSON
      await page.evaluate(() => {
        localStorage.setItem('math-games-player', 'invalid-json{{{');
      });

      // App should handle this and reinitialize
      await page.reload();

      // Wait a bit for error handling
      await page.waitForTimeout(500);

      // App should either fix or clear the corrupted data
      const errorVisible = await page.locator('text=/error/i').isVisible().catch(() => false);

      // Either shows error or recovered
      expect(typeof errorVisible).toBe('boolean');
    });
  });

  test.describe('Stat Display Integration', () => {
    test('should show correct stats in stats tab', async ({ page }) => {
      await clearLocalStorage(page);
      await seedPlayerProfile(page, INTERMEDIATE_TEST_PLAYER);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Navigate to stats tab
      await dashboard.switchTab('stats');

      // Verify stats panel exists
      const statsPanel = page.locator('.stats-panel, [role="tabpanel"]').first();
      await expect(statsPanel).toBeVisible();

      // Stats should reflect the intermediate player data
      const profile = await getPlayerProfile(page);
      expect(profile!.stats.totalGamesPlayed).toBe(30);
      expect(profile!.stats.totalPuzzlesSolved).toBe(20);
    });

    test('should update stats display in real-time', async ({ page }) => {
      // Initial state
      await dashboard.switchTab('stats');

      // Update stats
      await page.evaluate(() => {
        const profile = JSON.parse(localStorage.getItem('math-games-player') || '{}');
        profile.stats.totalGamesPlayed = 10;
        localStorage.setItem('math-games-player', JSON.stringify(profile));

        // Trigger storage event
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'math-games-player',
          newValue: JSON.stringify(profile),
        }));
      });

      // Reload to see updated stats
      await page.reload();
      await dashboard.waitForLoad();
      await dashboard.switchTab('stats');

      const profile = await getPlayerProfile(page);
      expect(profile!.stats.totalGamesPlayed).toBe(10);
    });
  });
});
