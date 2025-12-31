import type { Line, LineWithStatus, GraphNode } from '../logic/types';
import { getLineStatus } from '../logic/solver';

interface NodeClickEvent {
    nodeId: string;
    screenPosition: { x: number; y: number };
}

interface PuzzleBoardProps {
    nodes: GraphNode[];
    lines: Line[];
    nodeValues: Map<string, number | null>;
    targetSum: number;
    selectedNodeId: string | null;
    onNodeClick: (event: NodeClickEvent) => void;
    impossibleLineIds?: Set<string>; // Lines that cannot reach target sum
    recommendedNodeId?: string | null; // Node with fewest options (Starter hint)
}

const BOARD_WIDTH = 320;
const BOARD_HEIGHT = 280;
const NODE_RADIUS = 24;
const PADDING = 40;

export function PuzzleBoard({
    nodes,
    lines,
    nodeValues,
    targetSum,
    selectedNodeId,
    onNodeClick,
    impossibleLineIds,
    recommendedNodeId,
}: PuzzleBoardProps) {
    // Calculate line statuses
    const lineStatuses: LineWithStatus[] = lines.map((line) =>
        getLineStatus(line, nodeValues, targetSum)
    );

    // Get status class for line (including impossible state from Auditor)
    const getLineClass = (line: LineWithStatus) => {
        const isImpossible = impossibleLineIds?.has(line.id);
        const baseClass = `puzzle-line puzzle-line--${line.status}`;
        return isImpossible ? `${baseClass} puzzle-line--impossible` : baseClass;
    };

    // Calculate scaled positions
    const getScaledPosition = (node: GraphNode) => {
        // Original positions are in 0-300 range, scale to fit board with padding
        const scaleX = (BOARD_WIDTH - PADDING * 2) / 300;
        const scaleY = (BOARD_HEIGHT - PADDING * 2) / 250;
        return {
            x: node.position.x * scaleX + PADDING,
            y: node.position.y * scaleY + PADDING,
        };
    };

    // Get line path between multiple nodes
    const getLinePath = (line: Line): string => {
        const points = line.nodeIds
            .map((id) => nodes.find((n) => n.id === id))
            .filter(Boolean)
            .map((n) => getScaledPosition(n!));

        if (points.length < 2) return '';

        return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    };

    // Get ARIA label for node
    const getNodeAriaLabel = (node: GraphNode, value: number | null | undefined): string => {
        const isEmpty = value === null || value === undefined;
        const isFixed = node.isFixed;
        const isRecommended = node.id === recommendedNodeId && isEmpty;

        if (isFixed) {
            return `Fixed node with value ${value}`;
        }
        if (isEmpty) {
            return isRecommended
                ? `Empty node, recommended starting position. Click to place a number`
                : `Empty node. Click to place a number`;
        }
        return `Node with value ${value}. Click to change`;
    };

    return (
        <svg
            className="puzzle-board"
            width={BOARD_WIDTH}
            height={BOARD_HEIGHT}
            viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
            role="img"
            aria-label={`Magic Graph puzzle board with ${nodes.length} nodes. Target sum: ${targetSum}`}
        >
            <title>Magic Graph Puzzle</title>
            <desc>
                An interactive graph puzzle where you place numbers on nodes so that each line sums to the target.
            </desc>

            {/* Render lines first (behind nodes) */}
            {lineStatuses.map((line) => (
                <path
                    key={line.id}
                    d={getLinePath(line)}
                    className={getLineClass(line)}
                    fill="none"
                    role="presentation"
                    aria-hidden="true"
                />
            ))}

            {/* Render nodes */}
            {nodes.map((node) => {
                const pos = getScaledPosition(node);
                const value = nodeValues.get(node.id);
                const isEmpty = value === null || value === undefined;
                const isFixed = node.isFixed;
                const isSelected = node.id === selectedNodeId;

                const isRecommended = node.id === recommendedNodeId && isEmpty;

                const nodeClass = [
                    'puzzle-node',
                    isFixed && 'puzzle-node--fixed',
                    isEmpty && 'puzzle-node--empty',
                    isSelected && 'puzzle-node--selected',
                    isRecommended && 'puzzle-node--recommended',
                ]
                    .filter(Boolean)
                    .join(' ');

                const handleClick = (e: React.MouseEvent) => {
                    if (isFixed) return;
                    // Get screen position for the picker
                    const rect = (e.currentTarget.closest('svg') as SVGSVGElement)?.getBoundingClientRect();
                    const screenPosition = rect
                        ? { x: rect.left + pos.x, y: rect.top + pos.y }
                        : { x: e.clientX, y: e.clientY };
                    onNodeClick({ nodeId: node.id, screenPosition });
                };

                // Handle keyboard activation (Enter or Space)
                const handleKeyDown = (e: React.KeyboardEvent) => {
                    if (isFixed) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const rect = (e.currentTarget.closest('svg') as SVGSVGElement)?.getBoundingClientRect();
                        const screenPosition = rect
                            ? { x: rect.left + pos.x, y: rect.top + pos.y }
                            : { x: 0, y: 0 };
                        onNodeClick({ nodeId: node.id, screenPosition });
                    }
                };

                return (
                    <g
                        key={node.id}
                        className={nodeClass}
                        onClick={handleClick}
                        onKeyDown={handleKeyDown}
                        tabIndex={isFixed ? -1 : 0}
                        role={isFixed ? 'img' : 'button'}
                        aria-label={getNodeAriaLabel(node, value)}
                        style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                    >
                        <circle
                            className="puzzle-node__circle"
                            cx={pos.x}
                            cy={pos.y}
                            r={NODE_RADIUS}
                        />
                        {!isEmpty && (
                            <text
                                className="puzzle-node__text"
                                x={pos.x}
                                y={pos.y}
                                textAnchor="middle"
                                dominantBaseline="central"
                            >
                                {value}
                            </text>
                        )}
                    </g>
                );
            })}
        </svg>
    );
}
