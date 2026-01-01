import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface StepCardsProps {
    availableSteps: number[];
    validMoves: number[];
    disabled: boolean;
    onSelectStep: (step: number) => void;
    currentPosition?: number;
    targetNumber?: number;
    selectedStep?: number;
}

export function StepCards({
    availableSteps,
    validMoves,
    disabled,
    onSelectStep,
    currentPosition,
    targetNumber,
    selectedStep,
}: StepCardsProps) {
    const { t } = useTranslation('sequenceRace');
    const containerRef = useRef<HTMLDivElement>(null);

    // Generate descriptive aria-label for each step button
    const getStepAriaLabel = (step: number, isValid: boolean): string => {
        const newPosition = currentPosition !== undefined ? currentPosition + step : step;
        const reachesTarget = targetNumber !== undefined && newPosition === targetNumber;

        if (!isValid) {
            return `Step ${step} - would exceed target, not available`;
        }
        if (reachesTarget) {
            return `Step ${step} - advance to ${newPosition} and win!`;
        }
        return `Step ${step} - advance to position ${newPosition}`;
    };

    // Get enabled steps for keyboard navigation
    const enabledSteps = availableSteps.filter((step) => validMoves.includes(step) && !disabled);

    // Keyboard navigation handler
    const handleStepKeyDown = useCallback(
        (e: React.KeyboardEvent, step: number) => {
            if (enabledSteps.length === 0) return;

            const currentIndex = enabledSteps.indexOf(step);
            if (currentIndex === -1) return;

            let nextIndex: number | null = null;

            switch (e.key) {
                case 'ArrowRight':
                case 'ArrowDown':
                    e.preventDefault();
                    nextIndex = (currentIndex + 1) % enabledSteps.length;
                    break;
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    nextIndex = (currentIndex - 1 + enabledSteps.length) % enabledSteps.length;
                    break;
                default:
                    return;
            }

            if (nextIndex !== null && containerRef.current) {
                const nextStep = enabledSteps[nextIndex];
                const nextButton = containerRef.current.querySelector(
                    `[data-step="${nextStep}"]`
                ) as HTMLElement;
                nextButton?.focus();
            }
        },
        [enabledSteps]
    );

    return (
        <div
            ref={containerRef}
            className="step-cards"
            role="listbox"
            aria-label={t('yourTurn', 'Available step options')}
        >
            {availableSteps.map((step) => {
                const isValid = validMoves.includes(step);
                const isDisabled = disabled || !isValid;

                return (
                    <button
                        key={step}
                        data-step={step}
                        role="option"
                        aria-selected={selectedStep === step}
                        aria-disabled={isDisabled}
                        className={`step-card ${!isValid ? 'step-card--invalid' : ''}`}
                        disabled={isDisabled}
                        onClick={() => onSelectStep(step)}
                        onKeyDown={(e) => handleStepKeyDown(e, step)}
                        aria-label={getStepAriaLabel(step, isValid)}
                        tabIndex={isDisabled ? -1 : 0}
                    >
                        <span className="step-card__value" aria-hidden="true">+{step}</span>
                        <span className="step-card__label" aria-hidden="true">step</span>
                    </button>
                );
            })}
        </div>
    );
}
