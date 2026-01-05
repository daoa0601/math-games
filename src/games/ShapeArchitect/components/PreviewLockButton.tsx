interface PreviewLockButtonProps {
    locked: boolean;
    onToggle: () => void;
    disabled?: boolean;
}

/**
 * Button to lock/unlock the piece preview position.
 * When locked, the ghost preview stays in place even when hovering elsewhere.
 */
export function PreviewLockButton({ locked, onToggle, disabled = false }: PreviewLockButtonProps) {
    return (
        <button
            className={`sa-lock-btn ${locked ? 'sa-lock-btn--locked' : ''}`}
            onClick={onToggle}
            disabled={disabled}
            aria-pressed={locked}
            title={`${locked ? 'Unlock' : 'Lock'} preview position (L)`}
            type="button"
        >
            {locked ? <UnlockIcon /> : <LockIcon />}
            <span className="sa-lock-btn__label">
                {locked ? 'Unlock' : 'Lock'}
            </span>
        </button>
    );
}

function LockIcon() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
    );
}

function UnlockIcon() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 019.9-1" />
        </svg>
    );
}
