import { useTranslation } from 'react-i18next';
import { SEQUENCE_INFO, type SequenceType } from '../logic/presets';

interface SequenceInfoBadgeProps {
    /** The type of sequence to display */
    sequenceType: SequenceType;
    /** Optional variant for different display styles */
    variant?: 'badge' | 'hint' | 'full';
}

/**
 * Displays information about a sequence type with its name and formula.
 * Used in the game UI to show what sequence the player is working with.
 */
export function SequenceInfoBadge({
    sequenceType,
    variant = 'badge'
}: SequenceInfoBadgeProps) {
    const { t } = useTranslation('sequenceRace');
    const info = SEQUENCE_INFO[sequenceType];

    const name = t(`sequences.${sequenceType}.name`);
    const description = t(`sequences.${sequenceType}.description`);

    if (variant === 'hint') {
        return (
            <div className="sequence-hint">
                <span className="sequence-hint__name">{name}</span>
                <span className="sequence-hint__description">{description}</span>
            </div>
        );
    }

    if (variant === 'full') {
        return (
            <div className="sequence-info-full">
                <h4 className="sequence-info-full__name">{name}</h4>
                <p className="sequence-info-full__description">{description}</p>
                <code className="sequence-info-full__formula">{info.formula}</code>
            </div>
        );
    }

    // Default 'badge' variant
    return (
        <div className="sequence-badge">
            <span className="sequence-badge__type">{name}</span>
            <span className="sequence-badge__formula">{info.formula}</span>
        </div>
    );
}
