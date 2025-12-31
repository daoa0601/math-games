import React, { useMemo, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import type { CellState, Piece, Position3D, PlacedPiece } from '../logic/types';
import { getPieceWorldPositions, isInBounds } from '../logic/engine';
import { Voxel } from './Voxel';

interface GridBoard3DProps {
    grid: CellState[][][];
    gridSize: [number, number, number];
    selectedPiece: Piece | null;
    rotation: number;
    placedPieces: PlacedPiece[];
    levelPieces: Piece[];
    onCellClick: (position: Position3D) => void;
    hoverPosition?: Position3D | null;
    onCellHover?: (position: Position3D | null) => void;
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
}: GridBoard3DProps) {
    const [width, height, depth] = gridSize;

    // Center offset for the grid
    const centerOffset: [number, number, number] = [
        -width / 2 + 0.5,
        -height / 2 + 0.5,
        -depth / 2 + 0.5,
    ];

    // Build a map of cell positions to colors based on placed pieces
    const cellColorMap = useMemo(() => {
        const colorMap = new Map<string, string>();
        for (const placed of placedPieces) {
            const piece = levelPieces.find((p) => p.id === placed.pieceId);
            if (!piece) continue;
            const positions = getPieceWorldPositions(piece, placed.position, placed.rotation);
            for (const pos of positions) {
                colorMap.set(`${pos.x},${pos.y},${pos.z}`, placed.color);
            }
        }
        return colorMap;
    }, [placedPieces, levelPieces]);

    // Calculate preview positions based on hover
    const previewData = useMemo(() => {
        if (!selectedPiece || !hoverPosition) {
            return { positions: new Map<string, boolean>() };
        }

        const worldPositions = getPieceWorldPositions(selectedPiece, hoverPosition, rotation);
        const positionMap = new Map<string, boolean>();

        for (const pos of worldPositions) {
            let isValid = true;
            if (!isInBounds(pos, gridSize)) {
                isValid = false;
            } else {
                const cell = grid[pos.x][pos.y][pos.z];
                if (cell !== 1) {
                    isValid = false;
                }
            }
            positionMap.set(`${pos.x},${pos.y},${pos.z}`, isValid);
        }

        return { positions: positionMap };
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
                    const cell = grid[x][y][z];
                    const posKey = `${x},${y},${z}`;
                    const position: [number, number, number] = [
                        x + centerOffset[0],
                        y + centerOffset[1],
                        z + centerOffset[2],
                    ];

                    // Skip empty cells
                    if (cell === 0) continue;

                    // Check for preview
                    const isPreview = previewData.positions.has(posKey);
                    const isPreviewValid = previewData.positions.get(posKey) ?? true;

                    if (isPreview) {
                        // Render preview voxel
                        result.push(
                            <Voxel
                                key={`preview-${posKey}`}
                                position={position}
                                color={selectedPiece?.color ?? '#6366f1'}
                                isPreview
                                isPreviewValid={isPreviewValid}
                            />
                        );
                    } else if (cell === 1) {
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
                        const color = cellColorMap.get(posKey) ?? '#6366f1';
                        result.push(
                            <Voxel key={`filled-${posKey}`} position={position} color={color} />
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
    ]);

    return (
        <div className="grid-board-3d" onPointerLeave={() => onCellHover?.(null)}>
            <Canvas>
                <Suspense fallback={null}>
                    {/* Camera positioned for isometric-like view */}
                    <PerspectiveCamera makeDefault position={[8, 6, 8]} fov={50} />

                    {/* Lighting */}
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
                    <pointLight position={[-10, -10, -5]} intensity={0.3} />

                    {/* Environment for nice reflections */}
                    <Environment preset="studio" />

                    {/* Grid floor for reference */}
                    <gridHelper
                        args={[Math.max(width, height, depth) + 2, Math.max(width, height, depth) + 2]}
                        position={[0, centerOffset[1] - 0.5, 0]}
                    />

                    {/* Render all voxels */}
                    {voxels}

                    {/* Orbit controls for navigation */}
                    <OrbitControls
                        enablePan={true}
                        enableZoom={true}
                        enableRotate={true}
                        minDistance={5}
                        maxDistance={20}
                        target={[0, 0, 0]}
                    />
                </Suspense>
            </Canvas>
        </div>
    );
}
