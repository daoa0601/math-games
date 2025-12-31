interface StepCardsProps {
    availableSteps: number[];
    validMoves: number[];
    disabled: boolean;
    onSelectStep: (step: number) => void;
    currentPosition?: number;
    targetNumber?: number;
}

export function StepCards({
    availableSteps,
    validMoves,
    disabled,
    onSelectStep,
    currentPosition,
    targetNumber,
}: StepCardsProps) {
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

    return (
        <div
            className="step-cards"
            role="group"
            aria-label="Available step options"
        >
            {availableSteps.map((step) => {
                const isValid = validMoves.includes(step);

                return (
                    <button
                        key={step}
                        className={`step-card ${!isValid ? 'step-card--invalid' : ''}`}
                        disabled={disabled || !isValid}
                        onClick={() => onSelectStep(step)}
                        aria-label={getStepAriaLabel(step, isValid)}
                    >
                        <span className="step-card__value" aria-hidden="true">+{step}</span>
                        <span className="step-card__label" aria-hidden="true">step</span>
                    </button>
                );
            })}
        </div>
    );
}
