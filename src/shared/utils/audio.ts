// ========================================
// Audio Service - Sound Effects System
// Uses Web Audio API for programmatic sound synthesis
// No external audio files required
// ========================================

/**
 * Available sound effect names
 */
export type SoundName = 'place' | 'error' | 'win' | 'click';

// Audio context (created on demand to comply with autoplay policies)
let audioContext: AudioContext | null = null;

// Global sound enabled state
let soundEnabled = true;

// Local storage key for persistence
const SOUND_ENABLED_KEY = 'math-games-sound-enabled';

// Global volume (0.0 to 1.0)
let globalVolume = 0.5;

/**
 * Get or create AudioContext (lazy initialization)
 * Must be called after user interaction due to browser autoplay policies
 */
function getAudioContext(): AudioContext | null {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        } catch {
            console.debug('Web Audio API not supported');
            return null;
        }
    }

    // Resume if suspended (happens after being inactive)
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    return audioContext;
}

/**
 * Create a gain node with envelope (attack/decay)
 */
function createEnvelope(
    ctx: AudioContext,
    volume: number,
    attack: number,
    decay: number
): GainNode {
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume * globalVolume, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, now + attack + decay);

    return gain;
}

/**
 * Play a short "pop" sound for piece/number placement
 * Sine wave at 440Hz with quick decay
 */
function playPlaceSound(ctx: AudioContext): void {
    const osc = ctx.createOscillator();
    const gain = createEnvelope(ctx, 0.4, 0.01, 0.1);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
}

/**
 * Play a soft click for UI interactions
 * High-pitched tick with very short duration
 */
function playClickSound(ctx: AudioContext): void {
    const osc = ctx.createOscillator();
    const gain = createEnvelope(ctx, 0.2, 0.001, 0.05);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.06);
}

/**
 * Play an error buzzer sound
 * Low sawtooth wave with short buzz
 */
function playErrorSound(ctx: AudioContext): void {
    const osc = ctx.createOscillator();
    const gain = createEnvelope(ctx, 0.3, 0.01, 0.2);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
}

/**
 * Play a victory fanfare
 * Ascending arpeggio: C4 -> E4 -> G4 -> C5
 */
function playWinSound(ctx: AudioContext): void {
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    const noteDelay = 0.12;
    const noteDuration = 0.3;

    notes.forEach((freq, i) => {
        const startTime = ctx.currentTime + (i * noteDelay);

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3 * globalVolume, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + noteDuration);
    });

    // Final sustained chord (C major)
    const chordTime = ctx.currentTime + (notes.length * noteDelay);
    const chordNotes = [261.63, 329.63, 392.00, 523.25];

    chordNotes.forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, chordTime);

        gain.gain.setValueAtTime(0, chordTime);
        gain.gain.linearRampToValueAtTime(0.15 * globalVolume, chordTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, chordTime + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(chordTime);
        osc.stop(chordTime + 0.8);
    });
}

/**
 * Initialize sound enabled state from localStorage
 */
export function initSoundPreference(): void {
    try {
        const saved = localStorage.getItem(SOUND_ENABLED_KEY);
        if (saved !== null) {
            soundEnabled = saved === 'true';
        }
    } catch {
        // localStorage not available, use default
    }
}

/**
 * Preload sounds - initializes AudioContext
 * Should be called after user interaction (e.g., first click)
 */
export function preloadSounds(): void {
    if (!soundEnabled) return;
    getAudioContext();
}

/**
 * Play a sound effect by name
 * Silently fails if sound is disabled or Web Audio not supported
 */
export function playSound(name: SoundName): void {
    if (!soundEnabled) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    try {
        switch (name) {
            case 'place':
                playPlaceSound(ctx);
                break;
            case 'click':
                playClickSound(ctx);
                break;
            case 'error':
                playErrorSound(ctx);
                break;
            case 'win':
                playWinSound(ctx);
                break;
        }
    } catch {
        // Silently ignore audio errors
    }
}

/**
 * Toggle sound on/off
 * Persists preference to localStorage
 */
export function toggleSound(enabled: boolean): void {
    soundEnabled = enabled;

    try {
        localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
    } catch {
        // localStorage not available
    }
}

/**
 * Check if sound is currently enabled
 */
export function isSoundEnabled(): boolean {
    return soundEnabled;
}

/**
 * Set volume for a specific sound (no-op for Web Audio API version)
 * Kept for API compatibility
 */
export function setSoundVolume(_name: SoundName, _volume: number): void {
    // Individual sound volumes not supported in this implementation
    // Use setGlobalVolume instead
}

/**
 * Set global volume multiplier for all sounds (0.0 to 1.0)
 */
export function setGlobalVolume(volume: number): void {
    globalVolume = Math.max(0, Math.min(1, volume));
}
