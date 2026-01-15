import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RadioGroup, RadioGroupItem, Label } from '@/shared/components/ui/shadcn';

type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master' | 'grandmaster';

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
    expert: '🔥',
    master: '🎓',
    grandmaster: '👑',
};

/**
 * Shared difficulty selector component.
 * Displays difficulty options using shadcn RadioGroup with emojis and translations.
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

    // Type-safe onChange wrapper
    const handleChange = useCallback((newValue: string) => {
        onChange(newValue as T);
    }, [onChange]);

    return (
        <RadioGroup value={value} onValueChange={handleChange} layout="horizontal" className="difficulty-selector">
            {options.map((d) => (
                <div key={d} className="tw:flex tw:items-center tw:gap-2">
                    <RadioGroupItem value={d} id={`difficulty-${d}`} />
                    <Label
                        htmlFor={`difficulty-${d}`}
                        className={`difficulty-btn difficulty-btn--${d} ${value === d ? 'difficulty-btn--active' : ''}`}
                    >
                        <span className="difficulty-btn__emoji" aria-hidden="true">
                            {DIFFICULTY_EMOJI[d]}
                        </span>{' '}
                        {t(`difficulty.${d}`)}
                    </Label>
                </div>
            ))}
        </RadioGroup>
    );
}
