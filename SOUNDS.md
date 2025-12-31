# Sound Effects - Asset Requirements

This document specifies the required sound effect files for Math Gymnasium.

## Required Files

All files should be placed in `/public/sounds/` directory.

| File | Purpose | Duration | Style |
|------|---------|----------|-------|
| `place.mp3` | Piece placement in ShapeArchitect, number selection in MagicGraph | 0.1-0.3s | Soft click, satisfying "snap" |
| `error.mp3` | Invalid move, placement collision, out of bounds | 0.2-0.4s | Gentle buzz or "boop", not jarring |
| `win.mp3` | Puzzle completed, game won | 1-2s | Celebratory fanfare, uplifting |
| `click.mp3` | Button presses, UI interactions | 0.05-0.15s | Light tap, subtle |

## Audio Specifications

- **Format**: MP3 (best browser support)
- **Sample Rate**: 44.1kHz
- **Bit Rate**: 128-192 kbps
- **Channels**: Mono or Stereo

## Volume Guidelines

Default volumes are set in `src/shared/utils/audio.ts`:

| Sound | Default Volume |
|-------|---------------|
| place | 0.5 (50%) |
| error | 0.4 (40%) |
| win | 0.7 (70%) |
| click | 0.3 (30%) |

## How to Replace Placeholders

1. Obtain or create sound effect files matching the specifications above
2. Replace the placeholder files in `/public/sounds/`
3. Test in browser to ensure they load correctly
4. Adjust volumes in `audio.ts` if needed

## Integration Points

Sounds are integrated in the following game components:

```typescript
import { playSound } from '@/shared/utils/audio';

// On successful piece placement
playSound('place');

// On invalid action
playSound('error');

// On puzzle completion
playSound('win');

// On button click
playSound('click');
```

## Free Sound Resources

Consider these sources for royalty-free sound effects:
- [Freesound.org](https://freesound.org) - Creative Commons sounds
- [Mixkit](https://mixkit.co/free-sound-effects/) - Free sound effects
- [Zapsplat](https://www.zapsplat.com) - Free with attribution

## Current Status

⚠️ **Placeholder files are currently silent/missing.**

The audio system gracefully handles missing files - no errors will be thrown if sound files don't exist. The app functions normally without audio.
