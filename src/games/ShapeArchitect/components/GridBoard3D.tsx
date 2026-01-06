import React, { useMemo, useCallback, Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import type { CellState, Piece, Position3D, PlacedPiece, Rotation3D } from '../logic/types';
import { getPieceWorldPositions, findNearestValidPosition } from '../logic/engine';
import { Voxel } from './Voxel';
import { GridFloor } from './GridFloor';
import { useThreeCleanup } from '../hooks';
import { CAMERA_PRESETS, type CameraPreset } from './CameraPresetButtons';
import { useDeviceCapabilities } from '@/shared/hooks';
import { Canvas3DErrorBoundary } from './Canvas3DErrorBoundary';

interface GridBoard3DProps {
    grid: CellState[][][];
    gridSize: [number, number, number];
    selectedPiece: Piece | null;
    rotation: Rotation3D;
    placedPieces: PlacedPiece[];
    levelPieces: Piece[];
    onCellClick: (position: Position3D) => void;
    hoverPosition?: Position3D | null;
    onCellHover?: (position: Position3D | null) => void;
    cameraPreset?: CameraPreset;
    /** Maximum visible z-layer (for layer slicing). Layers above this are hidden. */
    maxVisibleLayer?: number;
    /** Whether the preview position is locked */
    isPreviewLocked?: boolean;
    /** Positions that were just placed (for snap animation) */
    justPlacedPositions?: Set<string>;
    /** ID of placed piece currently selected for movement */
    selectedPlacedPieceId?: string | null;
    /** Callback when a placed piece is clicked (for movement selection) */
    onPlacedPieceClick?: (pieceId: string) => void;
}

/**
 * 3D visualization of the ShapeArchitect grid using Three.js.
 * Features orbit controls for viewing from any angle.
 */
export function GridBoard3D({
    grid,
    gridSize,
    selectedPiece,
    rotation,
    placedPieces,
    levelPieces,
    onCellClick,
    hoverPosition,
    onCellHover,
    cameraPreset = 'isometric',
    maxVisibleLayer,
    isPreviewLocked = false,
    justPlacedPositions,
    selectedPlacedPieceId,
    onPlacedPieceClick,
}: GridBoard3DProps) {
    const [width, height, depth] = gridSize;

    // If maxVisibleLayer is not set, show all layers
    const effectiveMaxLayer = maxVisibleLayer ?? (depth - 1);

    // Center offset for the grid (memoized to avoid dependency instability)
    const centerOffset = useMemo<[number, number, number]>(() => [
        -width / 2 + 0.5,
        -height / 2 + 0.5,
        -depth / 2 + 0.5,
    ], [width, height, depth]);

    // Build a map of cell positions to colors and piece IDs based on placed pieces
    const cellColorMap = useMemo(() => {
        const colorMap = new Map<string, { color: string; pieceId: string }>();
        for (const placed of placedPieces) {
            const piece = levelPieces.find((p) => p.id === placed.pieceId);
            if (!piece) continue;
            const positions = getPieceWorldPositions(piece, placed.position, placed.rotation);
            for (const pos of positions) {
                colorMap.set(`${pos.x},${pos.y},${pos.z}`, {
                    color: placed.color,
                    pieceId: placed.pieceId,
                });
            }
        }
        return colorMap;
    }, [placedPieces, levelPieces]);

    // Get positions of the currently selected placed piece (for highlighting)
    const selectedPlacedPiecePositions = useMemo(() => {
        if (!selectedPlacedPieceId) return new Set<string>();
        const positions = new Set<string>();
        cellColorMap.forEach((data, posKey) => {
            if (data.pieceId === selectedPlacedPieceId) {
                positions.add(posKey);
            }
        });
        return positions;
    }, [selectedPlacedPieceId, cellColorMap]);

    // Calculate preview positions based on hover, using snap-to-nearest
    const previewData = useMemo(() => {
        if (!selectedPiece || !hoverPosition) {
            return { positions: new Set<string>(), isValid: false, snappedPosition: null };
        }

        // Try to find a valid position using snap-to-nearest
        const snappedPosition = findNearestValidPosition(
            grid,
            selectedPiece,
            hoverPosition,
            rotation,
            gridSize,
            2
        );

        const finalPosition = snappedPosition ?? hoverPosition;
        const worldPositions = getPieceWorldPositions(selectedPiece, finalPosition, rotation);
        const positionSet = new Set<string>();

        for (const pos of worldPositions) {
            positionSet.add(`${pos.x},${pos.y},${pos.z}`);
        }

        return {
            positions: positionSet,
            isValid: snappedPosition !== null,
            snappedPosition,
        };
    }, [selectedPiece, hoverPosition, rotation, gridSize, grid]);

    const handleCellClick = useCallback(
        (x: number, y: number, z: number) => {
            onCellClick({ x, y, z });
        },
        [onCellClick]
    );

    const handleCellHover = useCallback(
        (x: number, y: number, z: number) => {
            onCellHover?.({ x, y, z });
        },
        [onCellHover]
    );

    // Generate all voxels for the scene
    const voxels = useMemo(() => {
        const result: React.ReactNode[] = [];

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                for (let z = 0; z < depth; z++) {
                    // Skip layers above the visibility threshold
                    if (z > effectiveMaxLayer) continue;

                    const cell = grid[x][y][z];
                    const posKey = `${x},${y},${z}`;
                    const position: [number, number, number] = [
                        x + centerOffset[0],
                        y + centerOffset[1],
                        z + centerOffset[2],
                    ];

                    // Check for preview FIRST (ghost preview can appear on any cell)
                    const isPreview = previewData.positions.has(posKey);

                    // Render ghost preview on ANY cell type (including empty)
                    if (isPreview) {
                        result.push(
                            <Voxel
                                key={`preview-${posKey}`}
                                position={position}
                                color={selectedPiece?.color ?? '#6366f1'}
                                isPreview
                                isPreviewValid={previewData.isValid}
                                isPreviewLocked={isPreviewLocked}
                            />
                        );
                        continue; // Don't render the underlying cell when showing preview
                    }

                    // Skip or render empty cells based on whether piece is selected
                    if (cell === 0) {
                        // Only show empty voxels when a piece is selected for placement
                        if (selectedPiece) {
                            result.push(
                                <Voxel
                                    key={`empty-${posKey}`}
                                    position={position}
                                    color="#1e1e2e"
                                    isEmpty
                                    onClick={() => handleCellClick(x, y, z)}
                                    onPointerEnter={() => handleCellHover(x, y, z)}
                                />
                            );
                        }
                        continue;
                    }

                    if (cell === 1) {
                        // Target cell - can place pieces here
                        result.push(
                            <Voxel
                                key={`target-${posKey}`}
                                position={position}
                                color="#4338ca"
                                isTarget
                                onClick={() => handleCellClick(x, y, z)}
                                onPointerEnter={() => handleCellHover(x, y, z)}
                            />
                        );
                    } else if (cell === 2) {
                        // Filled cell
                        const cellData = cellColorMap.get(posKey);
                        const color = cellData?.color ?? '#6366f1';
                        const isJustPlaced = justPlacedPositions?.has(posKey) ?? false;
                        const isSelectedForMove = selectedPlacedPiecePositions.has(posKey);
                        result.push(
                            <Voxel
                                key={`filled-${posKey}`}
                                position={position}
                                color={color}
                                isJustPlaced={isJustPlaced}
                                isSelectedForMove={isSelectedForMove}
                                onClick={onPlacedPieceClick && cellData ? () => onPlacedPieceClick(cellData.pieceId) : undefined}
                            />
                        );
                    }
                }
            }
        }

        return result;
    }, [
        grid,
        width,
        height,
        depth,
        centerOffset,
        previewData,
        selectedPiece,
        cellColorMap,
        handleCellClick,
        handleCellHover,
        effectiveMaxLayer,
        isPreviewLocked,
        justPlacedPositions,
        selectedPlacedPiecePositions,
        onPlacedPieceClick,
    ]);

    // Detect device capabilities for adaptive rendering
    const { enableAntialias, enableShadows, pixelRatio } = useDeviceCapabilities();

    return (
        <div className="sa-board-3d" onPointerLeave={() => onCellHover?.(null)}>
            <Canvas3DErrorBoundary>
                <Canvas
                    shadows={enableShadows}
                    frameloop="demand"
                    gl={{
                        antialias: enableAntialias,
                        powerPreference: 'high-performance',
                    }}
                    dpr={[1, pixelRatio]}
                >
                    <Suspense fallback={null}>
                        <Scene3DContent
                            voxels={voxels}
                            centerOffset={centerOffset}
                            gridSize={[width, height, depth]}
                            cameraPreset={cameraPreset}
                        />
                    </Suspense>
                </Canvas>
            </Canvas3DErrorBoundary>
        </div>
    );
}

/**
 * Camera animation component that smoothly transitions between presets
 */
function CameraAnimator({ preset }: { preset: CameraPreset }) {
    const { camera, invalidate } = useThree();
    const controlsRef = useRef<OrbitControlsImpl>(null);
    const targetPosition = useRef(new THREE.Vector3(...CAMERA_PRESETS[preset].position));
    const targetLookAt = useRef(new THREE.Vector3(...CAMERA_PRESETS[preset].target));
    const isAnimatingRef = useRef(false);

    useEffect(() => {
        targetPosition.current.set(...CAMERA_PRESETS[preset].position);
        targetLookAt.current.set(...CAMERA_PRESETS[preset].target);
        isAnimatingRef.current = true;
        invalidate(); // Start animation loop
    }, [preset, invalidate]);

    useFrame(() => {
        // Smoothly interpolate camera position
        camera.position.lerp(targetPosition.current, 0.08);

        // Update controls target for orbit
        if (controlsRef.current) {
            controlsRef.current.target.lerp(targetLookAt.current, 0.08);
            controlsRef.current.update();
        }

        // Check if animation is complete (close enough to target)
        const positionDist = camera.position.distanceTo(targetPosition.current);
        if (positionDist > 0.01) {
            invalidate(); // Continue animation
        } else {
            isAnimatingRef.current = false;
        }
    });

    return (
        <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={25}
            onChange={() => invalidate()}
        />
    );
}

/**
 * Inner scene component that uses the Three.js cleanup hook.
 * Must be a child of Canvas to access the Three.js context.
 */
function Scene3DContent({
    voxels,
    centerOffset,
    gridSize,
    cameraPreset,
}: {
    voxels: React.ReactNode[];
    centerOffset: [number, number, number];
    gridSize: [number, number, number];
    cameraPreset: CameraPreset;
}) {
    const { invalidate } = useThree();

    // Cleanup Three.js resources on unmount to prevent GPU memory leaks
    useThreeCleanup();

    // Invalidate render when voxels or camera preset changes
    useEffect(() => {
        invalidate();
    }, [voxels, cameraPreset, invalidate]);

    return (
        <>
            {/* Camera positioned for isometric-like view */}
            <PerspectiveCamera makeDefault position={[8, 6, 8]} fov={50} />

            {/* Lighting - Enhanced for 3D depth */}
            <ambientLight intensity={0.4} />

            {/* Key light with shadows (reduced resolution for better mobile perf) */}
            <directionalLight
                position={[10, 10, 5]}
                intensity={1.2}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
                shadow-bias={-0.0001}
                shadow-camera-left={-10}
                shadow-camera-right={10}
                shadow-camera-top={10}
                shadow-camera-bottom={-10}
            />

            {/* Fill light (cool blue tint for depth) */}
            <directionalLight position={[-5, 5, -5]} intensity={0.4} color="#b4d4ff" />

            {/* Rim light (warm for edge definition) */}
            <pointLight position={[0, -3, 8]} intensity={0.5} color="#ffe4b5" />

            {/* Environment for nice reflections */}
            <Environment preset="studio" />

            {/* Shadow-receiving ground plane */}
            <mesh
                position={[0, centerOffset[1] - 0.5, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                receiveShadow
            >
                <planeGeometry args={[20, 20]} />
                <shadowMaterial opacity={0.2} />
            </mesh>

            {/* Grid floor with coordinate labels */}
            <GridFloor
                gridSize={gridSize}
                centerOffset={centerOffset}
                showCoordinates={true}
            />

            {/* Render all voxels */}
            {voxels}

            {/* Camera animation and orbit controls */}
            <CameraAnimator preset={cameraPreset} />
        </>
    );
}
