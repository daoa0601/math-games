import { useMemo } from 'react';
import { Text, Line } from '@react-three/drei';

interface GridFloorProps {
    gridSize: [number, number, number];
    centerOffset: [number, number, number];
    showCoordinates?: boolean;
}

/**
 * Enhanced grid floor with coordinate labels and colored axis lines.
 * Helps users understand 3D space in the puzzle.
 */
export function GridFloor({
    gridSize,
    centerOffset,
    showCoordinates = true,
}: GridFloorProps) {
    const [width, height, depth] = gridSize;
    const maxDim = Math.max(width, height, depth);

    // Calculate grid floor position (below the puzzle)
    const floorY = centerOffset[1] - 0.5;

    // Axis line endpoints
    const axisLength = maxDim + 1;
    const axisOrigin: [number, number, number] = [
        centerOffset[0] - 0.5,
        floorY,
        centerOffset[2] - 0.5,
    ];

    // Generate coordinate labels
    const xLabels = useMemo(() => {
        if (!showCoordinates) return [];
        return Array.from({ length: width }, (_, i) => ({
            position: [
                i + centerOffset[0],
                floorY - 0.3,
                centerOffset[2] - 1,
            ] as [number, number, number],
            text: i.toString(),
        }));
    }, [width, centerOffset, floorY, showCoordinates]);

    const yLabels = useMemo(() => {
        if (!showCoordinates) return [];
        return Array.from({ length: height }, (_, i) => ({
            position: [
                centerOffset[0] - 1,
                i + centerOffset[1],
                centerOffset[2] - 1,
            ] as [number, number, number],
            text: i.toString(),
        }));
    }, [height, centerOffset, showCoordinates]);

    const zLabels = useMemo(() => {
        if (!showCoordinates || depth <= 1) return [];
        return Array.from({ length: depth }, (_, i) => ({
            position: [
                centerOffset[0] - 1,
                floorY - 0.3,
                i + centerOffset[2],
            ] as [number, number, number],
            text: i.toString(),
        }));
    }, [depth, centerOffset, floorY, showCoordinates]);

    return (
        <group>
            {/* Enhanced grid helper */}
            <gridHelper
                args={[maxDim + 2, maxDim + 2, '#9ca3af', '#d1d5db']}
                position={[0, floorY, 0]}
            />

            {showCoordinates && (
                <>
                    {/* X-axis line (Red) */}
                    <Line
                        points={[
                            axisOrigin,
                            [axisOrigin[0] + axisLength, axisOrigin[1], axisOrigin[2]],
                        ]}
                        color="#ef4444"
                        lineWidth={2}
                    />
                    <Text
                        position={[axisOrigin[0] + axisLength + 0.5, axisOrigin[1], axisOrigin[2]]}
                        fontSize={0.4}
                        color="#ef4444"
                        anchorX="center"
                        anchorY="middle"
                    >
                        X
                    </Text>

                    {/* Y-axis line (Green) */}
                    <Line
                        points={[
                            axisOrigin,
                            [axisOrigin[0], axisOrigin[1] + axisLength, axisOrigin[2]],
                        ]}
                        color="#22c55e"
                        lineWidth={2}
                    />
                    <Text
                        position={[axisOrigin[0], axisOrigin[1] + axisLength + 0.5, axisOrigin[2]]}
                        fontSize={0.4}
                        color="#22c55e"
                        anchorX="center"
                        anchorY="middle"
                    >
                        Y
                    </Text>

                    {/* Z-axis line (Blue) - only show if depth > 1 */}
                    {depth > 1 && (
                        <>
                            <Line
                                points={[
                                    axisOrigin,
                                    [axisOrigin[0], axisOrigin[1], axisOrigin[2] + axisLength],
                                ]}
                                color="#3b82f6"
                                lineWidth={2}
                            />
                            <Text
                                position={[axisOrigin[0], axisOrigin[1], axisOrigin[2] + axisLength + 0.5]}
                                fontSize={0.4}
                                color="#3b82f6"
                                anchorX="center"
                                anchorY="middle"
                            >
                                Z
                            </Text>
                        </>
                    )}

                    {/* X-axis coordinate labels */}
                    {xLabels.map((label, i) => (
                        <Text
                            key={`x-${i}`}
                            position={label.position}
                            fontSize={0.25}
                            color="#6b7280"
                            anchorX="center"
                            anchorY="middle"
                        >
                            {label.text}
                        </Text>
                    ))}

                    {/* Y-axis coordinate labels */}
                    {yLabels.map((label, i) => (
                        <Text
                            key={`y-${i}`}
                            position={label.position}
                            fontSize={0.25}
                            color="#6b7280"
                            anchorX="center"
                            anchorY="middle"
                        >
                            {label.text}
                        </Text>
                    ))}

                    {/* Z-axis coordinate labels (only for 3D puzzles) */}
                    {zLabels.map((label, i) => (
                        <Text
                            key={`z-${i}`}
                            position={label.position}
                            fontSize={0.25}
                            color="#6b7280"
                            anchorX="center"
                            anchorY="middle"
                        >
                            {label.text}
                        </Text>
                    ))}
                </>
            )}
        </group>
    );
}
