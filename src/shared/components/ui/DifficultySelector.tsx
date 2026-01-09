import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import './DifficultySelector.css';

type Difficulty = 'easy' | 'medium' | 'hard' | 'master' | 'grandmaster';

interface DifficultySelectorProps<T extends Difficulty> {
    /** Available difficulty options */
    options: readonly T[];
    /** Currently selected difficulty */
    value: T;
    /** Callback when difficulty changes */
    onChange: (difficulty: T) => void;
}

const DIFFICULTY_EMOJI: Record<Difficulty, string> = {
    easy: '🌱',
    medium: '🌿',
    hard: '🌳',
    master: '🎓',
    grandmaster: '👑',
};

/**
 * Shared difficulty selector component.
 * Displays difficulty options as buttons with emojis and translations.
 *
 * @example
 * <DifficultySelector
 *   options={['easy', 'medium', 'hard'] as const}
 *   value={difficulty}
 *   onChange={setDifficulty}
 * />
 */
export function DifficultySelector<T extends Difficulty>({
    options,
    value,
    onChange,
}: DifficultySelectorProps<T>) {
    const { t } = useTranslation('common');

    // Memoized handler to avoid creating new functions in map loop
    const handleClick = useCallback((difficulty: T) => {
        onChange(difficulty);
    }, [onChange]);

    return (
        <div className="difficulty-selector">
            {options.map((d) => (
                <button
                    key={d}
                    className={`difficulty-btn difficulty-btn--${d} ${value === d ? 'difficulty-btn--active' : ''}`}
                    onClick={() => handleClick(d)}
                    aria-pressed={value === d}
                >
                    {DIFFICULTY_EMOJI[d]} {t(`difficulty.${d}`)}
                </button>
            ))}
        </div>
    );
}
