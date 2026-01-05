interface NumberInventoryProps {
    availableNumbers: number[];
    usedNumbers: Set<number>;
    selectedNumber: number | null;
    onSelectNumber: (num: number | null) => void;
}

export function NumberInventory({
    availableNumbers,
    usedNumbers,
    selectedNumber,
    onSelectNumber,
}: NumberInventoryProps) {
    const handleClick = (num: number) => {
        if (usedNumbers.has(num)) return;

        if (selectedNumber === num) {
            onSelectNumber(null); // Deselect
        } else {
            onSelectNumber(num);
        }
    };

    return (
        <div className="mg-inventory">
            {availableNumbers.map((num) => {
                const isUsed = usedNumbers.has(num);
                const isSelected = selectedNumber === num;

                const chipClass = [
                    'mg-chip',
                    isSelected && 'mg-chip--selected',
                    isUsed && 'mg-chip--used',
                ]
                    .filter(Boolean)
                    .join(' ');

                return (
                    <button
                        key={num}
                        className={chipClass}
                        onClick={() => handleClick(num)}
                        disabled={isUsed}
                    >
                        {num}
                    </button>
                );
            })}
        </div>
    );
}
