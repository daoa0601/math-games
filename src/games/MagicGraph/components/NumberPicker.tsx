import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface NumberPickerProps {
    availableNumbers: number[];
    usedNumbers: Set<number>;
    position: { x: number; y: number };
    onSelect: (num: number) => void;
    onClose: () => void;
    onClear?: () => void; // Optional: clear existing value
    currentValue?: number | null; // Show current value if any
}

export function NumberPicker({
    availableNumbers,
    usedNumbers,
    position,
    onSelect,
    onClose,
    onClear,
    currentValue,
}: NumberPickerProps) {
    const { t } = useTranslation('magicGraph');
    const { t: tc } = useTranslation('common');
    const pickerRef = useRef<HTMLDivElement>(null);

    // Close picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        // Delay adding listener to avoid immediate close
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Filter to only show unused numbers
    const availableForSelection = availableNumbers.filter(n => !usedNumbers.has(n));

    return (
        <div
            ref={pickerRef}
            className="mg-picker"
            style={{
                left: position.x,
                top: position.y,
            }}
        >
            <div className="mg-picker__header">
                <span>{t('picker.chooseNumber')}</span>
                <button className="mg-picker__close" onClick={onClose}>×</button>
            </div>

            <div className="mg-picker__grid">
                {availableForSelection.map((num) => (
                    <button
                        key={num}
                        className={`mg-picker__option ${currentValue === num ? 'mg-picker__option--current' : ''}`}
                        onClick={() => onSelect(num)}
                    >
                        {num}
                    </button>
                ))}
            </div>

            {currentValue !== null && currentValue !== undefined && onClear && (
                <button
                    className="mg-picker__clear"
                    onClick={onClear}
                >
                    {tc('buttons.reset')}
                </button>
            )}

            {availableForSelection.length === 0 && (
                <p className="mg-picker__empty">{t('picker.noNumbersAvailable')}</p>
            )}
        </div>
    );
}
