import { useEffect, useCallback } from 'react';

export interface UseKeyboardControlsOptions {
    onRotateX: () => void;
    onRotateY: () => void;
    onRotateZ: () => void;
    onUndo: () => void;
    onEscape: () => void;
    onTogglePreviewLock?: () => void;
    enabled: boolean;
    levelType: '2D' | '3D';
    hasSelectedPiece: boolean;
}

export function useKeyboardControls({
    onRotateX,
    onRotateY,
    onRotateZ,
    onUndo,
    onEscape,
    onTogglePreviewLock,
    enabled,
    levelType,
    hasSelectedPiece,
}: UseKeyboardControlsOptions): void {
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!enabled) return;

        // Don't handle if focus is in an input element
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

        switch (e.key.toLowerCase()) {
            case 'r':
                // Rotate Z axis (roll) - default rotation key
                if (hasSelectedPiece) {
                    e.preventDefault();
                    onRotateZ();
                }
                break;
            case 't':
                // Rotate X axis (pitch) - disabled in 2D mode
                if (hasSelectedPiece && levelType !== '2D') {
                    e.preventDefault();
                    onRotateX();
                }
                break;
            case 'y':
                // Rotate Y axis (yaw) - disabled in 2D mode
                if (hasSelectedPiece && levelType !== '2D') {
                    e.preventDefault();
                    onRotateY();
                }
                break;
            case 'l':
                // Toggle preview lock
                if (onTogglePreviewLock) {
                    e.preventDefault();
                    onTogglePreviewLock();
                }
                break;
            case 'escape':
                // Deselect piece
                onEscape();
                break;
            case 'z':
                // Ctrl+Z = undo
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    onUndo();
                }
                break;
        }
    }, [enabled, hasSelectedPiece, levelType, onRotateX, onRotateY, onRotateZ, onUndo, onEscape, onTogglePreviewLock]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}
