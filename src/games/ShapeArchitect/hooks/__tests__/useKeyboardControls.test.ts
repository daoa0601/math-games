import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardControls } from '../useKeyboardControls';

describe('useKeyboardControls', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('calls onRotateZ when R key is pressed', () => {
        const onRotateZ = vi.fn();
        renderHook(() => useKeyboardControls({
            onRotateX: vi.fn(),
            onRotateY: vi.fn(),
            onRotateZ,
            onUndo: vi.fn(),
            onEscape: vi.fn(),
            enabled: true,
            levelType: '3D',
            hasSelectedPiece: true,
        }));

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
        expect(onRotateZ).toHaveBeenCalled();
    });

    it('does not call onRotateX/Y in 2D mode', () => {
        const onRotateX = vi.fn();
        const onRotateY = vi.fn();
        renderHook(() => useKeyboardControls({
            onRotateX,
            onRotateY,
            onRotateZ: vi.fn(),
            onUndo: vi.fn(),
            onEscape: vi.fn(),
            enabled: true,
            levelType: '2D',
            hasSelectedPiece: true,
        }));

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'y' }));

        expect(onRotateX).not.toHaveBeenCalled();
        expect(onRotateY).not.toHaveBeenCalled();
    });

    it('calls onRotateX/Y in 3D mode', () => {
        const onRotateX = vi.fn();
        const onRotateY = vi.fn();
        renderHook(() => useKeyboardControls({
            onRotateX,
            onRotateY,
            onRotateZ: vi.fn(),
            onUndo: vi.fn(),
            onEscape: vi.fn(),
            enabled: true,
            levelType: '3D',
            hasSelectedPiece: true,
        }));

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'y' }));

        expect(onRotateX).toHaveBeenCalled();
        expect(onRotateY).toHaveBeenCalled();
    });

    it('calls onTogglePreviewLock when L key is pressed', () => {
        const onTogglePreviewLock = vi.fn();
        renderHook(() => useKeyboardControls({
            onRotateX: vi.fn(),
            onRotateY: vi.fn(),
            onRotateZ: vi.fn(),
            onUndo: vi.fn(),
            onEscape: vi.fn(),
            onTogglePreviewLock,
            enabled: true,
            levelType: '3D',
            hasSelectedPiece: true,
        }));

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'l' }));
        expect(onTogglePreviewLock).toHaveBeenCalled();
    });

    it('calls onUndo when Ctrl+Z is pressed', () => {
        const onUndo = vi.fn();
        renderHook(() => useKeyboardControls({
            onRotateX: vi.fn(),
            onRotateY: vi.fn(),
            onRotateZ: vi.fn(),
            onUndo,
            onEscape: vi.fn(),
            enabled: true,
            levelType: '3D',
            hasSelectedPiece: false,
        }));

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
        expect(onUndo).toHaveBeenCalled();
    });

    it('calls onEscape when Escape is pressed', () => {
        const onEscape = vi.fn();
        renderHook(() => useKeyboardControls({
            onRotateX: vi.fn(),
            onRotateY: vi.fn(),
            onRotateZ: vi.fn(),
            onUndo: vi.fn(),
            onEscape,
            enabled: true,
            levelType: '3D',
            hasSelectedPiece: true,
        }));

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(onEscape).toHaveBeenCalled();
    });

    it('does not call handlers when disabled', () => {
        const onRotateZ = vi.fn();
        const onUndo = vi.fn();
        renderHook(() => useKeyboardControls({
            onRotateX: vi.fn(),
            onRotateY: vi.fn(),
            onRotateZ,
            onUndo,
            onEscape: vi.fn(),
            enabled: false,
            levelType: '3D',
            hasSelectedPiece: true,
        }));

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));

        expect(onRotateZ).not.toHaveBeenCalled();
        expect(onUndo).not.toHaveBeenCalled();
    });

    it('does not call rotation handlers when no piece is selected', () => {
        const onRotateZ = vi.fn();
        renderHook(() => useKeyboardControls({
            onRotateX: vi.fn(),
            onRotateY: vi.fn(),
            onRotateZ,
            onUndo: vi.fn(),
            onEscape: vi.fn(),
            enabled: true,
            levelType: '3D',
            hasSelectedPiece: false,
        }));

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
        expect(onRotateZ).not.toHaveBeenCalled();
    });
});
