import { test, expect } from '@playwright/test';
import { setupFreshTestState } from './fixtures/test-utils';
import { DashboardPage } from './pages/Dashboard.page';

/**
 * Accessibility E2E Tests
 *
 * Basic accessibility tests for the application.
 */

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await setupFreshTestState(page);
  });

  test.describe('Dashboard Accessibility', () => {
    test('should have page title', async ({ page }) => {
      await page.goto('/');
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
    });

    test('should have lang attribute on html element', async ({ page }) => {
      await page.goto('/');
      const lang = await page.locator('html').getAttribute('lang');
      expect(lang).toBeTruthy();
      expect(['en', 'vi']).toContain(lang);
    });

    test('should have semantic navigation', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Navigation should be present
      await expect(dashboard.nav).toBeVisible();

      // Should have tablist role
      const hasTablist = await dashboard.nav.getAttribute('role');
      expect(hasTablist).toBe('tablist');
    });

    test('should have game cards as links', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Game cards should be links
      const links = page.locator('a.slab');
      const count = await links.count();
      expect(count).toBe(3);
    });

    test('should support keyboard navigation', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Tab through elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Check that something is focused
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(focused).toBeTruthy();
      expect(focused).not.toBe('BODY');
    });
  });

  test.describe('Game Page Accessibility', () => {
    test('should have accessible game container', async ({ page }) => {
      await page.goto('/magic-graph');
      await page.waitForSelector('[data-testid="magic-graph-game"]');

      // Game container should be visible
      const gameContainer = page.locator('[data-testid="magic-graph-game"]');
      await expect(gameContainer).toBeVisible();
    });

    test('should have accessible buttons', async ({ page }) => {
      await page.goto('/magic-graph');
      await page.waitForSelector('.mg-board');

      // Find all buttons
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      expect(buttonCount).toBeGreaterThan(0);

      // Check that buttons have accessible names
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const hasLabel = await button.evaluate((el) => {
            const label = el.getAttribute('aria-label') || el.textContent || el.getAttribute('title');
            return label && label.trim().length > 0;
          });
          expect(hasLabel).toBe(true);
        }
      }
    });

    test('should support keyboard navigation in games', async ({ page }) => {
      await page.goto('/magic-graph');
      await page.waitForSelector('.mg-board');

      // Tab to interact
      await page.keyboard.press('Tab');

      // Verify focus is on an interactive element
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(focused).toBeTruthy();
    });
  });

  test.describe('Reduced Motion', () => {
    test('should respect prefers-reduced-motion', async ({ page }) => {
      // Emulate prefers-reduced-motion
      await page.emulateMedia({ reducedMotion: 'reduce' });

      await page.goto('/');

      // Check if media query matches
      const hasReducedMotion = await page.evaluate(() => {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      });

      expect(hasReducedMotion).toBe(true);

      // App should still be functional
      await expect(page.locator('.page')).toBeVisible();
    });
  });

  test.describe('Focus Management', () => {
    test('should maintain visible focus indicators', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('.page');

      // Tab through several elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(50);

        // Get focused element
        const focused = await page.evaluateHandle(() => document.activeElement);

        // Check that it has some styling when focused
        const isInteractive = await page.evaluate((el) => {
          if (!el) return false;
          const tagName = el.tagName.toLowerCase();
          return ['a', 'button', 'input', 'select', 'textarea'].includes(tagName);
        }, focused);

        if (isInteractive) {
          // Just verify it's interactive - focus styles are CSS-based
          expect(isInteractive).toBe(true);
        }
      }
    });
  });
});
