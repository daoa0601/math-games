interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  label?: string;
  className?: string;
}

export function ProgressRing({
  progress,
  size = 60,
  strokeWidth = 6,
  color = 'var(--accent)',
  backgroundColor = 'var(--border)',
  showPercentage = true,
  label,
  className = '',
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const normalizedProgress = Math.min(100, Math.max(0, progress));
  const strokeDashoffset = circumference - (normalizedProgress / 100) * circumference;

  // Determine color based on progress (simplified for Linear Editorial)
  const getProgressColor = () => {
    if (color !== 'var(--accent)') return color;
    if (normalizedProgress >= 100) return 'var(--success)';
    return 'var(--accent)';
  };

  return (
    <div
      className={`progress-ring ${className}`}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={normalizedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || `${normalizedProgress}% complete`}
    >
      <svg
        className="progress-ring__svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circle */}
        <circle
          className="progress-ring__circle-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={backgroundColor}
        />
        {/* Progress circle */}
        <circle
          className="progress-ring__circle"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={getProgressColor()}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease',
          }}
        />
      </svg>
      {showPercentage && (
        <span
          className="progress-ring__text"
          style={{
            fontSize: size < 50 ? '0.625rem' : size < 80 ? '0.75rem' : '0.875rem',
          }}
        >
          {Math.round(normalizedProgress)}%
        </span>
      )}
    </div>
  );
}

// Compact variant for game cards
interface CompactProgressRingProps {
  completed: number;
  total: number;
  size?: number;
}

export function CompactProgressRing({
  completed,
  total,
  size = 48,
}: CompactProgressRingProps) {
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="progress-ring-compact" style={{ width: size, height: size }}>
      <ProgressRing
        progress={progress}
        size={size}
        strokeWidth={4}
        showPercentage={false}
      />
      <span
        className="progress-ring-compact__label"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: size < 40 ? '0.625rem' : '0.75rem',
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          color: 'var(--text)',
          whiteSpace: 'nowrap',
        }}
      >
        {completed}/{total}
      </span>
    </div>
  );
}
