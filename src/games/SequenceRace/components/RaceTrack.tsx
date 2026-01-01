import { useEffect, useState, useRef } from 'react';
import type { SequenceState, GameMode } from '../logic/types';

interface RaceTrackProps {
    state: SequenceState;
    gameMode: GameMode;
    isAIThinking?: boolean;
    aiReaction?: 'confident' | 'worried' | 'neutral';
}

// CSS Stick Figure Component
function StickFigure() {
    return (
        <div className="stick-figure">
            <div className="stick-figure__head" />
            <div className="stick-figure__body" />
            <div className="stick-figure__arms">
                <div className="stick-figure__arm stick-figure__arm--left" />
                <div className="stick-figure__arm stick-figure__arm--right" />
            </div>
            <div className="stick-figure__legs">
                <div className="stick-figure__leg stick-figure__leg--left" />
                <div className="stick-figure__leg stick-figure__leg--right" />
            </div>
        </div>
    );
}

export function RaceTrack({ state, gameMode, isAIThinking, aiReaction = 'neutral' }: RaceTrackProps) {
    const { target, currentPosition, gameOver, winner } = state;
    const prevPositionRef = useRef(currentPosition);
    const [isMoving, setIsMoving] = useState(false);

    // Detect movement and trigger animation
    useEffect(() => {
        if (currentPosition !== prevPositionRef.current) {
            // This setState is intentional for animation triggers (not a cascading render)
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsMoving(true);
            prevPositionRef.current = currentPosition;

            // Clear moving state after animation completes
            const timer = setTimeout(() => setIsMoving(false), 400);
            return () => clearTimeout(timer);
        }
    }, [currentPosition]);

    // Calculate position percentage
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
        <div className="race-track">
            <div className="track-wrapper">
                {/* Track Line */}
                <div className="track-line" />

                {/* Markers */}
                <div className="track-markers">
                    {markers.map((marker) => (
                        <div
                            key={marker.value}
                            className={`track-marker ${marker.isMajor ? 'track-marker--major' : ''}`}
                            style={{ position: 'absolute', left: `${marker.percent}%` }}
                        >
                            {marker.isMajor && (
                                <span className="track-marker-label">{marker.value}</span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Player Avatar */}
                <div
                    className={`player-avatar player-avatar--player player-avatar--stick-figure ${
                        isMoving ? 'player-avatar--moving' : ''
                    } ${
                        gameOver && winner === 'player' ? 'player-avatar--winner' : ''
                    } ${
                        gameOver && winner !== 'player' && winner !== null ? 'player-avatar--loser' : ''
                    }`}
                    style={{ left: `${positionPercent}%` }}
                    aria-label={gameMode === 'two-player' ? 'Shared player position' : 'Your runner'}
                >
                    <StickFigure />
                </div>

                {/* AI Opponent (only in vs-ai mode) */}
                {gameMode === 'vs-ai' && (
                    <div
                        className={`player-avatar player-avatar--ai player-avatar--stick-figure ${
                            isAIThinking ? 'player-avatar--thinking' : ''
                        } ${
                            gameOver && winner === 'ai' ? 'player-avatar--winner' : ''
                        } ${
                            gameOver && winner === 'player' ? 'player-avatar--loser' : ''
                        }`}
                        style={{ left: `${positionPercent}%` }}
                        aria-label="AI opponent"
                    >
                        <StickFigure />
                        {/* AI Reaction Bubble */}
                        {!gameOver && (
                            <span className={`ai-reaction ai-reaction--${aiReaction}`}>
                                {aiReaction === 'confident' && '😏'}
                                {aiReaction === 'worried' && '😰'}
                                {aiReaction === 'neutral' && (isAIThinking ? '🤔' : '')}
                            </span>
                        )}
                    </div>
                )}

                {/* Target Flag */}
                <div className={`target-flag ${gameOver ? 'target-flag--finished' : ''}`}>🏁</div>
            </div>

            {/* Position Display */}
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                Position: <strong style={{ color: 'var(--color-accent)' }}>{currentPosition}</strong> / {target}
            </div>
        </div>
    );
}
