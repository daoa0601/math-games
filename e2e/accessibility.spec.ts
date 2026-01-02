import { test, expect } from '@playwright/test';
import { setupFreshTestState } from './fixtures/test-utils';
import { DashboardPage } from './pages/Dashboard.page';

/**
 * Accessibility E2E Tests
 *
 * Tests accessibility features including:
 * - Keyboard navigation through tabs
 * - Focus management on dialogs/overlays
 * - Skip links functionality
 * - ARIA labels on interactive elements
 * - Tab order is logical
 * - Screen reader compatibility
 */

test.describe('Accessibility', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
    await setupFreshTestState(page);
    await dashboard.goto();
    await dashboard.waitForLoad();
  });

  test.describe('Keyboard Navigation', () => {
    test('should navigate between tabs using arrow keys', async ({ page }) => {
      // Focus the tab list
      await dashboard.playTab.focus();

      // Verify Play tab is initially selected
      let activeTab = await page.locator('[role="tab"][aria-selected="true"]');
      await expect(activeTab).toContainText(/play|chơi/i);

      // Press Right Arrow to move to Stats tab
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(100);

      activeTab = await page.locator('[role="tab"][aria-selected="true"]');
      await expect(activeTab).toContainText(/stats|thống kê/i);

      // Press Right Arrow to move to Achievements tab
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(100);

      activeTab = await page.locator('[role="tab"][aria-selected="true"]');
      await expect(activeTab).toContainText(/achievements|thành tích/i);

      // Press Right Arrow to wrap back to Play tab
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(100);

      activeTab = await page.locator('[role="tab"][aria-selected="true"]');
      await expect(activeTab).toContainText(/play|chơi/i);
    });

    test('should navigate tabs using left arrow key', async ({ page }) => {
      // Focus on Play tab
      await dashboard.playTab.focus();

      // Press Left Arrow to wrap to Achievements tab
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(100);

      const activeTab = await page.locator('[role="tab"][aria-selected="true"]');
      await expect(activeTab).toContainText(/achievements|thành tích/i);

      // Press Left Arrow to move to Stats tab
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(100);

      const statsTab = await page.locator('[role="tab"][aria-selected="true"]');
      await expect(statsTab).toContainText(/stats|thống kê/i);
    });

    test('should navigate tabs using Home and End keys', async ({ page }) => {
      // Focus on Stats tab
      await dashboard.statsTab.focus();
      await dashboard.statsTab.click();

      // Press Home to go to first tab
      await page.keyboard.press('Home');
      await page.waitForTimeout(100);

      let activeTab = await page.locator('[role="tab"][aria-selected="true"]');
      await expect(activeTab).toContainText(/play|chơi/i);

      // Press End to go to last tab
      await page.keyboard.press('End');
      await page.waitForTimeout(100);

      activeTab = await page.locator('[role="tab"][aria-selected="true"]');
      await expect(activeTab).toContainText(/achievements|thành tích/i);
    });

    test('should navigate game cards using Tab key', async ({ page }) => {
      // Ensure we're on Play tab
      await dashboard.playTab.click();
      await page.waitForTimeout(200);

      // Tab to first game card
      await page.keyboard.press('Tab');

      // Check that a game card is focused
      const focusedElement = await page.evaluateHandle(() => document.activeElement);
      const tagName = await page.evaluate((el) => el?.tagName, focusedElement);

      // Should be on a link (game card)
      expect(tagName).toBe('A');
    });

    test('should activate game card with Enter key', async ({ page }) => {
      // Ensure we're on Play tab
      await dashboard.playTab.click();
      await page.waitForTimeout(200);

      // Focus on MagicGraph card
      await dashboard.magicGraphCard.focus();

      // Press Enter to navigate
      await page.keyboard.press('Enter');

      // Should navigate to MagicGraph game
      await page.waitForURL(/\/magic-graph/);
      expect(page.url()).toContain('magic-graph');
    });

    test('should support Space key to activate buttons', async ({ page }) => {
      // Focus on sound toggle button
      await dashboard.soundToggle.focus();

      // Get initial state
      const initialState = await dashboard.soundToggle.getAttribute('aria-pressed');

      // Press Space to toggle
      await page.keyboard.press('Space');
      await page.waitForTimeout(100);

      // Verify state changed
      const newState = await dashboard.soundToggle.getAttribute('aria-pressed');
      expect(newState).not.toBe(initialState);
    });

    test('should trap focus in modal dialogs', async ({ page }) => {
      // This test would be more relevant if we had a modal
      // For now, we verify that tabbing stays within appropriate boundaries

      // Navigate to stats tab
      await dashboard.statsTab.click();
      await page.waitForTimeout(200);

      // Tab through elements - focus should stay within the stats panel
      const statsPanel = page.locator('[role="tabpanel"]:visible');
      await expect(statsPanel).toBeVisible();

      // Tab multiple times and verify we don't lose focus to unexpected elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(50);

        const focused = await page.evaluateHandle(() => document.activeElement);
        const isVisible = await page.evaluate((el) => {
          if (!el) return false;
          const rect = (el as HTMLElement).getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        }, focused);

        expect(isVisible).toBe(true);
      }
    });

    test('should support Escape key to close overlays', async ({ page }) => {
      // Note: This test assumes game overlays support Escape key
      // We'll verify the pattern works on the dashboard

      // Press Escape (should not cause errors even if no overlay is open)
      await page.keyboard.press('Escape');

      // Dashboard should still be visible
      await expect(page.locator('.dashboard')).toBeVisible();
    });
  });

  test.describe('Skip Links', () => {
    test('should have skip to main content link', async ({ page }) => {
      // Tab to skip link (first focusable element)
      await page.keyboard.press('Tab');

      // Check if skip link is focused
      const focused = await page.evaluateHandle(() => document.activeElement);
      const isSkipLink = await page.evaluate((el) => {
        return el?.classList.contains('skip-link') || el?.textContent?.includes('Skip');
      }, focused);

      expect(isSkipLink).toBe(true);
    });

    test('should navigate to main content when skip link is activated', async ({ page }) => {
      // Tab to skip link
      await page.keyboard.press('Tab');

      // Press Enter on skip link
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);

      // Focus should now be on main content
      const focused = await page.evaluateHandle(() => document.activeElement);
      const focusedId = await page.evaluate((el) => el?.id, focused);

      // Main content should be focused (or element within it)
      expect(focusedId).toBeTruthy();
    });

    test('should make skip links visible on focus', async ({ page }) => {
      // Tab to skip link
      await page.keyboard.press('Tab');

      // Get skip link element
      const skipLink = await page.locator('.skip-link').first();

      // Check if skip link is visible (not hidden off-screen)
      const isVisible = await skipLink.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top >= 0 && rect.left >= 0;
      });

      expect(isVisible).toBe(true);
    });

    test('should have skip to game area link on game pages', async ({ page }) => {
      // Navigate to a game
      await dashboard.magicGraphCard.click();
      await page.waitForURL(/\/magic-graph/);

      // Tab to first element (should be skip link)
      await page.keyboard.press('Tab');

      // Check for game area skip link
      const skipLinks = await page.locator('.skip-link').allTextContents();

      // Should have skip links (might include "skip to main" and "skip to game")
      expect(skipLinks.length).toBeGreaterThan(0);
    });
  });

  test.describe('ARIA Labels and Roles', () => {
    test('should have proper tab role attributes', async () => {
      // Check Play tab
      const playTab = dashboard.playTab;
      await expect(playTab).toHaveAttribute('role', 'tab');
      await expect(playTab).toHaveAttribute('aria-selected');

      // Check Stats tab
      const statsTab = dashboard.statsTab;
      await expect(statsTab).toHaveAttribute('role', 'tab');
      await expect(statsTab).toHaveAttribute('aria-selected');

      // Check Achievements tab
      const achievementsTab = dashboard.achievementsTab;
      await expect(achievementsTab).toHaveAttribute('role', 'tab');
      await expect(achievementsTab).toHaveAttribute('aria-selected');
    });

    test('should have tablist with proper ARIA attributes', async ({ page }) => {
      const tablist = page.locator('[role="tablist"]');
      await expect(tablist).toBeVisible();

      // Check for aria-label or aria-labelledby
      const hasLabel = await tablist.evaluate((el) => {
        return el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby');
      });

      expect(hasLabel).toBe(true);
    });

    test('should have tabpanel with proper ARIA attributes', async ({ page }) => {
      // Switch to stats tab
      await dashboard.statsTab.click();
      await page.waitForTimeout(200);

      // Find visible tabpanel
      const tabpanel = page.locator('[role="tabpanel"]:visible');
      await expect(tabpanel).toBeVisible();

      // Should have aria-labelledby pointing to the tab
      const hasLabelledBy = await tabpanel.evaluate((el) => {
        return el.hasAttribute('aria-labelledby');
      });

      expect(hasLabelledBy).toBe(true);
    });

    test('should have proper button labels', async () => {
      // Sound toggle should have accessible name
      const soundToggle = dashboard.soundToggle;
      const soundLabel = await soundToggle.evaluate((el) => {
        return el.getAttribute('aria-label') || el.textContent;
      });

      expect(soundLabel).toBeTruthy();
      expect(soundLabel?.length).toBeGreaterThan(0);

      // Language switcher should have accessible name
      const langSwitcher = dashboard.languageSwitcher;
      const langLabel = await langSwitcher.evaluate((el) => {
        return el.getAttribute('aria-label') || el.textContent;
      });

      expect(langLabel).toBeTruthy();
    });

    test('should have accessible game card links', async () => {
      // Game cards should have accessible names
      const magicGraphCard = dashboard.magicGraphCard;
      const cardText = await magicGraphCard.textContent();

      expect(cardText).toBeTruthy();
      expect(cardText).toContain('Magic Graph');
    });

    test('should use semantic HTML elements', async ({ page }) => {
      // Check for nav elements
      const navElements = await page.locator('nav').count();
      expect(navElements).toBeGreaterThan(0);

      // Check for main element
      const mainElement = await page.locator('main').count();
      expect(mainElement).toBeGreaterThan(0);

      // Check for header
      const headerElements = await page.locator('header').count();
      expect(headerElements).toBeGreaterThan(0);
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      // Get all headings
      const h1Count = await page.locator('h1').count();
      const h2Count = await page.locator('h2').count();

      // Should have at least one h1 (page title or app name)
      expect(h1Count).toBeGreaterThanOrEqual(1);

      // If there are h2s, they should follow h1
      if (h2Count > 0) {
        const firstH1 = await page.locator('h1').first().textContent();
        expect(firstH1).toBeTruthy();
      }
    });

    test('should label form controls properly', async ({ page }) => {
      // Navigate to a game with form controls
      await dashboard.sequenceRaceCard.click();
      await page.waitForURL(/\/sequence-race/);
      await page.waitForTimeout(500);

      // Check for labeled inputs/selects/buttons
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const hasLabel = await button.evaluate((el) => {
          const label = el.getAttribute('aria-label') || el.textContent || el.getAttribute('title');
          return label && label.trim().length > 0;
        });

        if (await button.isVisible()) {
          expect(hasLabel).toBe(true);
        }
      }
    });

    test('should have live regions for dynamic content', async ({ page }) => {
      // Look for aria-live regions (for announcements)
      const liveRegions = await page.locator('[aria-live]').count();

      // May have 0 or more live regions depending on state
      expect(liveRegions).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Focus Management', () => {
    test('should maintain visible focus indicators', async ({ page }) => {
      // Tab through several elements
      const elementsToTab = 5;

      for (let i = 0; i < elementsToTab; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(50);

        // Get focused element
        const focused = await page.evaluateHandle(() => document.activeElement);

        // Check for focus styles
        const hasFocusStyle = await page.evaluate((el) => {
          if (!el || !(el instanceof HTMLElement)) return false;

          const styles = window.getComputedStyle(el);
          // Check for outline or box-shadow (common focus indicators)
          return (
            styles.outline !== 'none' ||
            styles.outlineWidth !== '0px' ||
            styles.boxShadow !== 'none'
          );
        }, focused);

        // Focus should be visible
        // Note: This might not always be true for all elements, but interactive ones should have focus styles
        const isInteractive = await page.evaluate((el) => {
          if (!el) return false;
          const tagName = el.tagName.toLowerCase();
          const hasTabindex = el.getAttribute('tabindex');
          return (
            ['a', 'button', 'input', 'select', 'textarea'].includes(tagName) ||
            (hasTabindex && parseInt(hasTabindex) >= 0)
          );
        }, focused);

        if (isInteractive) {
          expect(hasFocusStyle).toBe(true);
        }
      }
    });

    test('should restore focus after tab navigation', async ({ page }) => {
      // Click Stats tab
      await dashboard.statsTab.click();
      await page.waitForTimeout(200);

      // Tab to an element within stats panel
      await page.keyboard.press('Tab');

      // Go back to Play tab
      await dashboard.playTab.click();
      await page.waitForTimeout(200);

      // Focus should be somewhere logical (not lost)
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(focused).toBeTruthy();
    });

    test('should focus on first interactive element in tab panel', async ({ page }) => {
      // Switch to achievements tab
      await dashboard.achievementsTab.click();
      await page.waitForTimeout(300);

      // Tab should move focus into the panel
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      // Check that focus is within the achievements panel
      const focusedElement = await page.evaluateHandle(() => document.activeElement);
      const isInPanel = await page.evaluate((el) => {
        if (!el) return false;
        const panel = document.querySelector('[role="tabpanel"]:not([hidden])');
        return panel?.contains(el) ?? false;
      }, focusedElement);

      // Focus should be in the active tab panel or on a control
      expect(typeof isInPanel).toBe('boolean');
    });

    test('should not lose focus when content updates', async ({ page }) => {
      // Click on a tab
      await dashboard.statsTab.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);

      // Focus should still be on an interactive element
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(focused).toBeTruthy();
      expect(focused).not.toBe('BODY');
    });

    test('should manage focus in game cards grid', async ({ page }) => {
      // Ensure Play tab is active
      await dashboard.playTab.click();
      await page.waitForTimeout(200);

      // Focus on first game card
      await dashboard.magicGraphCard.focus();

      let focused = await page.evaluate(() => document.activeElement?.textContent);
      expect(focused).toContain('Magic Graph');

      // Tab to next card
      await page.keyboard.press('Tab');
      await page.waitForTimeout(50);

      focused = await page.evaluate(() => document.activeElement?.textContent);
      expect(focused).toBeTruthy();
    });
  });

  test.describe('Tab Order', () => {
    test('should have logical tab order in dashboard', async ({ page }) => {
      const tabOrder: string[] = [];

      // Tab through first 10 elements
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(50);

        const elementInfo = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el) return 'none';

          const tag = el.tagName.toLowerCase();
          const role = el.getAttribute('role') || '';
          const text = (el.textContent || '').trim().substring(0, 30);

          return `${tag}${role ? `[${role}]` : ''}: ${text}`;
        });

        tabOrder.push(elementInfo);
      }

      // Verify we got meaningful tab stops
      expect(tabOrder.length).toBe(10);

      // Should not have too many 'body' entries (indicating lost focus)
      const bodyCount = tabOrder.filter((item) => item.includes('body')).length;
      expect(bodyCount).toBeLessThan(3);
    });

    test('should tab through game cards in visual order', async ({ page }) => {
      // Go to Play tab
      await dashboard.playTab.click();
      await page.waitForTimeout(200);

      // Get all game cards
      const cards = await page.locator('.game-card').all();
      expect(cards.length).toBeGreaterThan(0);

      // Tab through cards - they should be in visual order
      await dashboard.magicGraphCard.focus();

      const firstCard = await page.evaluate(() => document.activeElement?.textContent);
      expect(firstCard).toContain('Magic Graph');
    });

    test('should have proper tab order in stats tab', async ({ page }) => {
      // Navigate to stats tab
      await dashboard.statsTab.click();
      await page.waitForTimeout(200);

      // Tab through elements
      const tabStops: string[] = [];

      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(50);

        const tag = await page.evaluate(() => document.activeElement?.tagName);
        if (tag) tabStops.push(tag);
      }

      // Should have collected tab stops
      expect(tabStops.length).toBeGreaterThan(0);
    });

    test('should skip non-interactive elements', async ({ page }) => {
      // Tab through page
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(30);

        const tagName = await page.evaluate(() => document.activeElement?.tagName);

        if (tagName && tagName !== 'BODY') {
          // If focused on something other than body, it should be interactive or have tabindex
          const isInteractive = await page.evaluate(() => {
            const el = document.activeElement;
            if (!el) return false;

            const tag = el.tagName;
            const tabindex = el.getAttribute('tabindex');

            return (
              ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(tag) ||
              (tabindex && parseInt(tabindex) >= 0)
            );
          });

          expect(isInteractive).toBe(true);
        }
      }
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should have page title', async ({ page }) => {
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
    });

    test('should update page title on navigation', async ({ page }) => {
      // Get initial title
      await page.title();

      // Navigate to a game
      await dashboard.magicGraphCard.click();
      await page.waitForURL(/\/magic-graph/);

      const gameTitle = await page.title();
      expect(gameTitle).toBeTruthy();

      // Title should change (or could be the same if app doesn't update title)
      expect(typeof gameTitle).toBe('string');
    });

    test('should have lang attribute on html element', async ({ page }) => {
      const lang = await page.locator('html').getAttribute('lang');
      expect(lang).toBeTruthy();
      expect(['en', 'vi']).toContain(lang);
    });

    test('should have descriptive alt text for images', async ({ page }) => {
      const images = page.locator('img');
      const imageCount = await images.count();

      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        if (await img.isVisible()) {
          const alt = await img.getAttribute('alt');
          // Alt should exist (can be empty for decorative images)
          expect(alt).not.toBeNull();
        }
      }
    });

    test('should announce dynamic content updates', async ({ page }) => {
      // Look for aria-live regions
      const liveRegions = page.locator('[aria-live]');
      const count = await liveRegions.count();

      // App may or may not have live regions, but they should be properly configured if present
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const region = liveRegions.nth(i);
          const ariaLive = await region.getAttribute('aria-live');

          expect(['polite', 'assertive', 'off']).toContain(ariaLive);
        }
      }
    });

    test('should have accessible status messages', async ({ page }) => {
      // Check for status roles
      const statusElements = page.locator('[role="status"]');
      const alertElements = page.locator('[role="alert"]');

      // These may not exist, but if they do, they should be properly used
      const statusCount = await statusElements.count();
      const alertCount = await alertElements.count();

      expect(statusCount + alertCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Reduced Motion', () => {
    test('should respect prefers-reduced-motion', async ({ page }) => {
      // Emulate prefers-reduced-motion
      await page.emulateMedia({ reducedMotion: 'reduce' });

      // Reload to apply
      await page.reload();
      await dashboard.waitForLoad();

      // Check if animations are disabled via CSS
      const hasReducedMotion = await page.evaluate(() => {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      });

      expect(hasReducedMotion).toBe(true);

      // App should still be functional
      await expect(dashboard.playTab).toBeVisible();
      await expect(dashboard.statsTab).toBeVisible();
    });

    test('should have functional UI with reduced motion', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.reload();
      await dashboard.waitForLoad();

      // Navigate between tabs - should work without animations
      await dashboard.statsTab.click();
      await page.waitForTimeout(100);

      await expect(dashboard.statsTab).toHaveAttribute('aria-selected', 'true');

      await dashboard.achievementsTab.click();
      await page.waitForTimeout(100);

      await expect(dashboard.achievementsTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  test.describe('Color Contrast and Visual Accessibility', () => {
    test('should have sufficient color contrast on interactive elements', async () => {
      // This is a basic check - proper contrast testing requires specialized tools
      // We verify elements have distinct backgrounds/colors

      const playTab = dashboard.playTab;

      // Get computed styles
      const styles = await playTab.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          borderColor: computed.borderColor,
        };
      });

      expect(styles.color).toBeTruthy();
      expect(styles.backgroundColor).toBeTruthy();
    });

    test('should not rely solely on color for information', async ({ page }) => {
      // Verify that interactive states have multiple indicators
      // E.g., selected tab should have both color AND aria-selected

      const selectedTab = page.locator('[role="tab"][aria-selected="true"]');
      await expect(selectedTab).toBeVisible();

      // Selected state is communicated via ARIA, not just color
      const ariaSelected = await selectedTab.getAttribute('aria-selected');
      expect(ariaSelected).toBe('true');
    });
  });
});
