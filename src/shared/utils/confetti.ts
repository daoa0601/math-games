/**
 * Lazy Confetti Loader
 *
 * Dynamically imports canvas-confetti only when needed.
 * Saves ~11KB per game that would otherwise load it synchronously.
 */

import type { Options as ConfettiOptions } from 'canvas-confetti';

/**
 * Trigger confetti animation with lazy loading
 * Only loads the canvas-confetti module on first use
 */
export async function showConfetti(options?: ConfettiOptions): Promise<void> {
  try {
    const { default: confetti } = await import('canvas-confetti');
    confetti(options);
  } catch {
    // Silently fail if confetti fails to load
    console.debug('Confetti failed to load');
  }
}

/**
 * Fire multiple confetti bursts with delays
 */
export async function showConfettiBurst(bursts: Array<{ options: ConfettiOptions; delay?: number }>): Promise<void> {
  try {
    const { default: confetti } = await import('canvas-confetti');

    for (const burst of bursts) {
      if (burst.delay) {
        await new Promise(resolve => setTimeout(resolve, burst.delay));
      }
      confetti(burst.options);
    }
  } catch {
    console.debug('Confetti failed to load');
  }
}
