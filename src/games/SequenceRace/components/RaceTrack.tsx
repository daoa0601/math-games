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

export function RaceTrack({ state, gameMode, isAIThinking, aiReaction = 'neutral', previewPosition, isUrgent }: RaceTrackProps) {
    const { target, currentPosition, gameOver, winner } = state;
    const positionPercent = (currentPosition / target) * 100;

    // Generate markers (every 5 units or at least 5 markers)
    const markerInterval = target <= 15 ? 1 : target <= 30 ? 5 : 10;
    const markers = [];
    for (let i = 0; i <= target; i += markerInterval) {
        const percent = (i / target) * 100;
        const isMajor = i === 0 || i === target || i % (markerInterval * 2) === 0;
        markers.push({ value: i, percent, isMajor });
    }

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
                            style={{ position: 'absolute', left: `${marker.percent}%` }}
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
                    style={{ left: `${positionPercent}%` }}
                    aria-label={gameMode === 'two-player' ? 'Shared player position' : 'Your runner'}
                >
                    <AvatarEmoji />
                </div>

                {/* Preview Ghost Marker (shows where player would land on hover) */}
                {previewPosition !== null && previewPosition !== undefined && previewPosition !== currentPosition && previewPosition <= target && (
                    <div
                        className="sr-preview"
                        style={{ left: `${(previewPosition / target) * 100}%` }}
                        aria-hidden="true"
                    />
                )}

                {/* AI Opponent (only in vs-ai mode) */}
                {gameMode === 'vs-ai' && (
                    <div
                        className={`sr-avatar sr-avatar--ai ${
                            gameOver && winner === 'player' ? 'sr-avatar--loser' : ''
                        }`}
                        style={{ left: `${positionPercent}%` }}
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
