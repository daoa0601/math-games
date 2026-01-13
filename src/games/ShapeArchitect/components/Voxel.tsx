import { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { useSharedBoxGeometry } from '../hooks';

interface VoxelProps {
    position: [number, number, number];
    color: string;
    isTarget?: boolean;
    isPreview?: boolean;
    isPreviewValid?: boolean;
    isPreviewLocked?: boolean;
    /** Empty cell voxel - transparent but clickable for piece placement */
    isEmpty?: boolean;
    /** Just placed - triggers snap animation */
    isJustPlaced?: boolean;
    /** Selected for movement - shows selection highlight */
    isSelectedForMove?: boolean;
    onClick?: () => void;
    onPointerEnter?: () => void;
}

/**
 * A 3D voxel (cube) component for the ShapeArchitect game.
 * Used to render filled cells, target cells, and placement previews.
 */
export function Voxel({
    position,
    color,
    isTarget = false,
    isPreview = false,
    isPreviewValid = true,
    isPreviewLocked = false,
    isEmpty = false,
    isJustPlaced = false,
    isSelectedForMove = false,
    onClick,
    onPointerEnter,
}: VoxelProps) {
    const meshRef = useRef<Mesh>(null);
    const [hovered, setHovered] = useState(false);
    // Use shared geometry singleton for better GPU memory efficiency
    const sharedGeometry = useSharedBoxGeometry();

    // Animate preview, just-placed, and selected blocks
    useFrame((state) => {
        if (meshRef.current) {
            if (isPreview) {
                // Locked previews pulse slower and slightly larger
                const speed = isPreviewLocked ? 2 : 4;
                const amplitude = isPreviewLocked ? 0.08 : 0.05;
                meshRef.current.scale.setScalar(0.9 + Math.sin(state.clock.elapsedTime * speed) * amplitude);
            } else if (isJustPlaced) {
                // Snap animation - quick bounce effect
                const elapsed = state.clock.elapsedTime * 8;
                const bounce = Math.max(0, Math.sin(elapsed) * Math.exp(-elapsed * 0.3));
                meshRef.current.scale.setScalar(1 + bounce * 0.15);
            } else if (isSelectedForMove) {
                // Pulsing scale for selected piece
                const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.03;
                meshRef.current.scale.setScalar(pulse);
            } else {
                // Reset scale for normal blocks
                meshRef.current.scale.setScalar(1);
            }
        }
    });

    // Calculate visual properties based on state
    const getColor = () => {
        if (isEmpty) {
            return hovered ? '#6366f1' : '#1e1e2e'; // highlight on hover
        }
        if (isPreview) {
            return isPreviewValid ? '#22c55e' : '#ef4444'; // green/red
        }
        if (isTarget) {
            return hovered ? '#6366f1' : '#4338ca'; // lighter/darker purple
        }
        return color;
    };

    const getOpacity = () => {
        if (isEmpty) return hovered ? 0.3 : 0.1; // very transparent, more visible on hover
        if (isPreview) return isPreviewLocked ? 0.75 : 0.6;
        if (isTarget) return 0.3;
        return 1;
    };

    // Only placed (filled) blocks cast shadows - not targets, previews, or empty cells
    const shouldCastShadow = !isTarget && !isPreview && !isEmpty;

    return (
        <mesh
            ref={meshRef}
            position={position}
            castShadow={shouldCastShadow}
            receiveShadow
            onPointerDown={(e) => {
                // Use onPointerDown instead of onClick for immediate response
                // onClick requires both pointerdown AND pointerup on same mesh,
                // which fails if user's finger/mouse moves slightly between press and release
                if (e.button === 0) {  // Left click only
                    onClick?.();
                    e.stopPropagation();  // Stop AFTER handling to ensure our code runs first
                }
            }}
            onPointerEnter={(e) => {
                e.stopPropagation();
                setHovered(true);
                onPointerEnter?.();
            }}
            onPointerLeave={() => setHovered(false)}
            geometry={sharedGeometry}
        >
            <meshStandardMaterial
                color={getColor()}
                transparent={isTarget || isPreview || isEmpty}
                opacity={getOpacity()}
                wireframe={isTarget && !hovered && !isEmpty}
            />
            {/* Add edge highlight for filled blocks */}
            {!isTarget && !isPreview && !isEmpty && (
                <lineSegments>
                    <edgesGeometry args={[sharedGeometry]} />
                    <lineBasicMaterial
                        color={isSelectedForMove ? '#a855f7' : (onClick && hovered ? '#c4b5fd' : '#ffffff')}
                        transparent
                        opacity={isSelectedForMove ? 0.9 : (onClick && hovered ? 0.6 : 0.3)}
                    />
                </lineSegments>
            )}
        </mesh>
    );
}
