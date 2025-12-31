import { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';

interface VoxelProps {
    position: [number, number, number];
    color: string;
    isTarget?: boolean;
    isPreview?: boolean;
    isPreviewValid?: boolean;
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
    onClick,
    onPointerEnter,
}: VoxelProps) {
    const meshRef = useRef<Mesh>(null);
    const [hovered, setHovered] = useState(false);

    // Animate preview blocks
    useFrame((state) => {
        if (meshRef.current && isPreview) {
            meshRef.current.scale.setScalar(0.9 + Math.sin(state.clock.elapsedTime * 4) * 0.05);
        }
    });

    // Calculate visual properties based on state
    const getColor = () => {
        if (isPreview) {
            return isPreviewValid ? '#22c55e' : '#ef4444'; // green/red
        }
        if (isTarget) {
            return hovered ? '#6366f1' : '#4338ca'; // lighter/darker purple
        }
        return color;
    };

    const getOpacity = () => {
        if (isPreview) return 0.6;
        if (isTarget) return 0.3;
        return 1;
    };

    return (
        <mesh
            ref={meshRef}
            position={position}
            onClick={(e) => {
                e.stopPropagation();
                onClick?.();
            }}
            onPointerEnter={(e) => {
                e.stopPropagation();
                setHovered(true);
                onPointerEnter?.();
            }}
            onPointerLeave={() => setHovered(false)}
        >
            <boxGeometry args={[0.95, 0.95, 0.95]} />
            <meshStandardMaterial
                color={getColor()}
                transparent={isTarget || isPreview}
                opacity={getOpacity()}
                wireframe={isTarget && !hovered}
            />
            {/* Add edge highlight for filled blocks */}
            {!isTarget && !isPreview && (
                <lineSegments>
                    <edgesGeometry args={[meshRef.current?.geometry]} />
                    <lineBasicMaterial color="#ffffff" transparent opacity={0.3} />
                </lineSegments>
            )}
        </mesh>
    );
}
