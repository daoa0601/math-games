import { useMemo, type CSSProperties } from 'react';
import type { SequenceState, GameMode } from '../logic/types';

interface RaceTrackProps {
    state: SequenceState;
    gameMode: GameMode;
    isAIThinking?: boolean;
    aiReaction?: 'confident' | 'worried' | 'neutral';
    previewPosition?: number | null;
    isUrgent?: boolean;
}

// Simplified avatar using emoji instead of CSS art
function AvatarEmoji({ isAI }: { isAI?: boolean }) {
    return <span aria-hidden="true">{isAI ? '🤖' : '🏃'}</span>;
}

interface MarkerData {
    value: number;
    percent: number;
    isMajor: boolean;
    style: CSSProperties;
}

export function RaceTrack({ state, gameMode, isAIThinking, aiReaction = 'neutral', previewPosition, isUrgent }: RaceTrackProps) {
    const { target, currentPosition, gameOver, winner } = state;
    const positionPercent = (currentPosition / target) * 100;

    // Memoize markers array - only recalculate when target changes
    const markers = useMemo((): MarkerData[] => {
        const interval = target <= 15 ? 1 : target <= 30 ? 5 : 10;
        const result: MarkerData[] = [];
        for (let i = 0; i <= target; i += interval) {
            const percent = (i / target) * 100;
            const isMajor = i === 0 || i === target || i % (interval * 2) === 0;
            result.push({
                value: i,
                percent,
                isMajor,
                style: { position: 'absolute', left: `${percent}%` },
            });
        }
        return result;
    }, [target]);

    // Memoize position styles
    const playerStyle = useMemo((): CSSProperties => ({
        left: `${positionPercent}%`,
    }), [positionPercent]);

    const previewStyle = useMemo((): CSSProperties | undefined => {
        if (previewPosition === null || previewPosition === undefined ||
            previewPosition === currentPosition || previewPosition > target) {
            return undefined;
        }
        return { left: `${(previewPosition / target) * 100}%` };
    }, [previewPosition, currentPosition, target]);

    return (
        <div className={`sr-track${isUrgent ? ' sr-track--urgent' : ''}`}>
            <div className="sr-track__wrapper">
                {/* Track Line */}
                <div className="sr-track__line" />

                {/* Markers */}
                <div className="sr-markers">
                    {markers.map((marker) => (
                        <div
                            key={marker.value}
                            className={`sr-marker ${marker.isMajor ? 'sr-marker--major' : ''}`}
                            style={marker.style}
                        >
                            {marker.isMajor && (
                                <span className="sr-marker__label">{marker.value}</span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Player Avatar */}
                <div
                    className={`sr-avatar sr-avatar--player ${
                        gameOver && winner !== 'player' && winner !== null ? 'sr-avatar--loser' : ''
                    }`}
                    style={playerStyle}
                    aria-label={gameMode === 'two-player' ? 'Shared player position' : 'Your runner'}
                >
                    <AvatarEmoji />
                </div>

                {/* Preview Ghost Marker (shows where player would land on hover) */}
                {previewStyle && (
                    <div
                        className="sr-preview"
                        style={previewStyle}
                        aria-hidden="true"
                    />
                )}

                {/* AI Opponent (only in vs-ai mode) */}
                {gameMode === 'vs-ai' && (
                    <div
                        className={`sr-avatar sr-avatar--ai ${
                            gameOver && winner === 'player' ? 'sr-avatar--loser' : ''
                        }`}
                        style={playerStyle}
                        aria-label="AI opponent"
                    >
                        <AvatarEmoji isAI />
                        {/* AI Reaction Bubble */}
                        {!gameOver && (
                            <span className="sr-reaction">
                                {aiReaction === 'confident' && '😏'}
                                {aiReaction === 'worried' && '😰'}
                                {aiReaction === 'neutral' && (isAIThinking ? '🤔' : '')}
                            </span>
                        )}
                    </div>
                )}

                {/* Target Flag */}
                <div className="sr-flag">🏁</div>
            </div>

            {/* Position Display */}
            <div className="sr-position">
                Position: <strong>{currentPosition}</strong> / {target}
            </div>
        </div>
    );
}
