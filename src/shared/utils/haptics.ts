/**
 * Haptic feedback utilities for mobile devices.
 * Uses the Vibration API to provide tactile feedback on supported devices.
 */

export type HapticType = 'light' | 'medium' | 'heavy';

// Vibration patterns in milliseconds
const HAPTIC_PATTERNS: Record<HapticType, number> = {
    light: 10,   // Subtle tap (piece selection)
    medium: 25,  // Moderate (piece placement)
    heavy: 50,   // Strong (error, puzzle solved)
};

/**
 * Trigger haptic feedback if device supports it.
 * Fails silently on unsupported devices.
 *
 * @param type - Intensity of haptic: 'light' | 'medium' | 'heavy'
 */
export function triggerHaptic(type: HapticType = 'light'): void {
    if ('vibrate' in navigator) {
        try {
            navigator.vibrate(HAPTIC_PATTERNS[type]);
        } catch {
            // Silently fail if vibration not allowed
        }
    }
}

/**
 * Check if haptic feedback is available on this device.
 */
export function isHapticSupported(): boolean {
    return 'vibrate' in navigator;
}
