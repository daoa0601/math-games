import type { SequenceState } from '../logic/types';

interface RaceTrackProps {
    state: SequenceState;
}

export function RaceTrack({ state }: RaceTrackProps) {
    const { target, currentPosition } = state;

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
                    className="player-avatar"
                    style={{ left: `${positionPercent}%` }}
                >
                    🏃
                </div>

                {/* Target Flag */}
                <div className="target-flag">🏁</div>
            </div>

            {/* Position Display */}
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                Position: <strong style={{ color: 'var(--color-accent)' }}>{currentPosition}</strong> / {target}
            </div>
        </div>
    );
}
