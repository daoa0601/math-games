import { useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh, BoxGeometry } from 'three';

interface VoxelProps {
    position: [number, number, number];
    color: string;
    isTarget?: boolean;
    isPreview?: boolean;
    isPreviewValid?: boolean;
    isPreviewLocked?: boolean;
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
    onClick,
    onPointerEnter,
}: VoxelProps) {
    const meshRef = useRef<Mesh>(null);
    const [hovered, setHovered] = useState(false);
    // Store geometry in state to avoid accessing ref during render
    const [geometry, setGeometry] = useState<BoxGeometry | null>(null);

    // Capture geometry after mount (refs are only available after render)
    useEffect(() => {
        if (meshRef.current?.geometry) {
            setGeometry(meshRef.current.geometry as BoxGeometry);
        }
    }, []);

    // Animate preview blocks
    useFrame((state) => {
        if (meshRef.current && isPreview) {
            // Locked previews pulse slower and slightly larger
            const speed = isPreviewLocked ? 2 : 4;
            const amplitude = isPreviewLocked ? 0.08 : 0.05;
            meshRef.current.scale.setScalar(0.9 + Math.sin(state.clock.elapsedTime * speed) * amplitude);
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
        if (isPreview) return isPreviewLocked ? 0.75 : 0.6;
        if (isTarget) return 0.3;
        return 1;
    };

    // Solid blocks cast shadows, all blocks receive shadows
    const shouldCastShadow = !isTarget && !isPreview;

    return (
        <mesh
            ref={meshRef}
            position={position}
            castShadow={shouldCastShadow}
            receiveShadow
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
            {/* Add edge highlight for filled blocks (only after geometry is available) */}
            {!isTarget && !isPreview && geometry && (
                <lineSegments>
                    <edgesGeometry args={[geometry]} />
                    <lineBasicMaterial color="#ffffff" transparent opacity={0.3} />
                </lineSegments>
            )}
        </mesh>
    );
}
