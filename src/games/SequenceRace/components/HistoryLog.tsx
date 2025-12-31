import { useTranslation } from 'react-i18next';
import type { HistoryEntry } from '../logic/types';

interface HistoryLogProps {
    history: HistoryEntry[];
}

export function HistoryLog({ history }: HistoryLogProps) {
    const { t } = useTranslation('sequenceRace');

    if (history.length === 0) {
        return (
            <div className="history-log">
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
                    {t('gameStart')}
                </p>
            </div>
        );
    }

    return (
        <div className="history-log">
            {history.map((entry, index) => (
                <div key={index} className={`history-entry history-entry--${entry.actor}`}>
                    <span>{entry.actor === 'player' ? '🧑' : '🤖'}</span>
                    <span>+{entry.step}</span>
                    <span>→</span>
                    <span><strong>{entry.position}</strong></span>
                </div>
            ))}
        </div>
    );
}
