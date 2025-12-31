export {
    getProgress,
    saveProgress,
    completeLevel,
    isLevelUnlocked,
    isLevelCompleted,
    getBestTime,
    getTotalScore,
    resetProgress,
    getGlobalStats,
} from './storage';

export type { GameId, LevelProgress, GameProgress } from './storage';

export {
    playSound,
    toggleSound,
    isSoundEnabled,
    preloadSounds,
    initSoundPreference,
    setSoundVolume,
    setGlobalVolume,
} from './audio';

export type { SoundName } from './audio';
