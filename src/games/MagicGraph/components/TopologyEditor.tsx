import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { GraphNode, Line, PuzzleConfig } from '../logic/types';
import { generatePuzzle } from '../logic/solver';

interface TopologyEditorProps {
    onPuzzleCreated: (puzzle: PuzzleConfig) => void;
    onCancel: () => void;
}

const EDITOR_WIDTH = 360;
const EDITOR_HEIGHT = 320;
const NODE_RADIUS = 20;
const PADDING = 30;

// Generate unique IDs
let nodeIdCounter = 0;
let lineIdCounter = 0;
const generateNodeId = () => `custom_node_${++nodeIdCounter}`;
const generateLineId = () => `custom_line_${++lineIdCounter}`;

export function TopologyEditor({ onPuzzleCreated, onCancel }: TopologyEditorProps) {
    const { t } = useTranslation('magicGraph');
    const svgRef = useRef<SVGSVGElement>(null);

    // Editor state
    const [nodes, setNodes] = useState<GraphNode[]>([]);
    const [lines, setLines] = useState<Line[]>([]);
    const [availableNumbers, setAvailableNumbers] = useState<number[]>([1, 2, 3, 4, 5]);
    const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
    const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
    const [mode, setMode] = useState<'add' | 'connect' | 'delete'>('add');
    const [error, setError] = useState<string | null>(null);

    // Convert screen coordinates to SVG coordinates
    const getSvgCoordinates = useCallback((clientX: number, clientY: number) => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const rect = svgRef.current.getBoundingClientRect();
        return {
            x: Math.round((clientX - rect.left) * (EDITOR_WIDTH / rect.width)),
            y: Math.round((clientY - rect.top) * (EDITOR_HEIGHT / rect.height)),
        };
    }, []);

    // Add a new node at click position
    const handleCanvasClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
        if (e.target !== e.currentTarget) return; // Only on canvas, not on nodes
        if (mode !== 'add') return;

        const { x, y } = getSvgCoordinates(e.clientX, e.clientY);

        // Ensure within bounds
        if (x < PADDING || x > EDITOR_WIDTH - PADDING || y < PADDING || y > EDITOR_HEIGHT - PADDING) {
            return;
        }

        const newNode: GraphNode = {
            id: generateNodeId(),
            position: { x, y },
            value: null,
            isFixed: false,
        };

        setNodes(prev => [...prev, newNode]);
        setError(null);
    }, [mode, getSvgCoordinates]);

    // Handle node click
    const handleNodeClick = useCallback((nodeId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        if (mode === 'delete') {
            // Remove node and any lines containing it
            setNodes(prev => prev.filter(n => n.id !== nodeId));
            setLines(prev => prev.filter(l => !l.nodeIds.includes(nodeId)));
            setSelectedNodeIds(prev => {
                const next = new Set(prev);
                next.delete(nodeId);
                return next;
            });
            return;
        }

        if (mode === 'connect') {
            setSelectedNodeIds(prev => {
                const next = new Set(prev);
                if (next.has(nodeId)) {
                    next.delete(nodeId);
                } else {
                    next.add(nodeId);
                }
                return next;
            });
        }
    }, [mode]);

    // Start dragging (in add mode)
    const handleNodeMouseDown = useCallback((nodeId: string, e: React.MouseEvent) => {
        if (mode !== 'add') return;
        e.preventDefault();
        setDraggingNodeId(nodeId);
    }, [mode]);

    // Handle mouse move for dragging
    const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
        if (!draggingNodeId) return;

        const { x, y } = getSvgCoordinates(e.clientX, e.clientY);
        const clampedX = Math.max(PADDING, Math.min(EDITOR_WIDTH - PADDING, x));
        const clampedY = Math.max(PADDING, Math.min(EDITOR_HEIGHT - PADDING, y));

        setNodes(prev => prev.map(n =>
            n.id === draggingNodeId
                ? { ...n, position: { x: clampedX, y: clampedY } }
                : n
        ));
    }, [draggingNodeId, getSvgCoordinates]);

    // End dragging
    const handleMouseUp = useCallback(() => {
        setDraggingNodeId(null);
    }, []);

    // Create line from selected nodes
    const createLineFromSelection = useCallback(() => {
        if (selectedNodeIds.size < 2) {
            setError(t('editor.selectAtLeastTwo'));
            return;
        }

        // Create line in order of selection (we'll use array order)
        const nodeIdsArray = Array.from(selectedNodeIds);

        // Check if this exact line already exists
        const existingLine = lines.find(l =>
            l.nodeIds.length === nodeIdsArray.length &&
            nodeIdsArray.every(id => l.nodeIds.includes(id))
        );

        if (existingLine) {
            setError(t('editor.lineExists'));
            return;
        }

        const newLine: Line = {
            id: generateLineId(),
            nodeIds: nodeIdsArray,
        };

        setLines(prev => [...prev, newLine]);
        setSelectedNodeIds(new Set());
        setError(null);
    }, [selectedNodeIds, lines, t]);

    // Handle line click (for deletion in delete mode)
    const handleLineClick = useCallback((lineId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (mode === 'delete') {
            setLines(prev => prev.filter(l => l.id !== lineId));
        }
    }, [mode]);

    // Update available numbers
    const handleNumbersChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const nums = value.split(',')
            .map(s => parseInt(s.trim(), 10))
            .filter(n => !isNaN(n) && n > 0);
        setAvailableNumbers(nums);
    }, []);

    // Generate puzzle from topology
    const generateFromTopology = useCallback(() => {
        if (nodes.length < 2) {
            setError(t('editor.needMoreNodes'));
            return;
        }
        if (lines.length < 1) {
            setError(t('editor.needLines'));
            return;
        }
        if (availableNumbers.length < nodes.length) {
            setError(t('editor.notEnoughNumbers'));
            return;
        }

        // Create base puzzle config
        const basePuzzle: PuzzleConfig = {
            id: `custom_${Date.now()}`,
            name: t('editor.customPuzzle'),
            nodes: nodes.map(n => ({ ...n, value: null, isFixed: false })),
            lines,
            targetSum: 0, // Will be computed by solver
            availableNumbers: [...availableNumbers],
            difficulty: 'medium',
        };

        // Use solver to generate a valid puzzle
        const generatedPuzzle = generatePuzzle(basePuzzle, 0);

        if (generatedPuzzle.targetSum === 0) {
            setError(t('editor.noSolutionFound'));
            return;
        }

        onPuzzleCreated(generatedPuzzle);
    }, [nodes, lines, availableNumbers, onPuzzleCreated, t]);

    // Get line path
    const getLinePath = (line: Line): string => {
        const points = line.nodeIds
            .map(id => nodes.find(n => n.id === id))
            .filter(Boolean)
            .map(n => n!.position);

        if (points.length < 2) return '';

        return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    };

    // Clear all
    const clearAll = useCallback(() => {
        setNodes([]);
        setLines([]);
        setSelectedNodeIds(new Set());
        setError(null);
        nodeIdCounter = 0;
        lineIdCounter = 0;
    }, []);

    return (
        <div className="mg-editor">
            <div className="mg-editor__header">
                <h3>{t('editor.title')}</h3>
                <p className="mg-editor__instructions">{t('editor.instructions')}</p>
            </div>

            {/* Mode selector */}
            <div className="mg-editor__modes">
                <button
                    className={`mg-editor__mode-btn ${mode === 'add' ? 'mg-editor__mode-btn--active' : ''}`}
                    onClick={() => setMode('add')}
                    aria-pressed={mode === 'add'}
                >
                    ➕ {t('editor.addMode')}
                </button>
                <button
                    className={`mg-editor__mode-btn ${mode === 'connect' ? 'mg-editor__mode-btn--active' : ''}`}
                    onClick={() => setMode('connect')}
                    aria-pressed={mode === 'connect'}
                >
                    🔗 {t('editor.connectMode')}
                </button>
                <button
                    className={`mg-editor__mode-btn ${mode === 'delete' ? 'mg-editor__mode-btn--active' : ''}`}
                    onClick={() => setMode('delete')}
                    aria-pressed={mode === 'delete'}
                >
                    🗑️ {t('editor.deleteMode')}
                </button>
            </div>

            {/* Canvas */}
            <svg
                ref={svgRef}
                className="mg-editor__canvas"
                width={EDITOR_WIDTH}
                height={EDITOR_HEIGHT}
                viewBox={`0 0 ${EDITOR_WIDTH} ${EDITOR_HEIGHT}`}
                onClick={handleCanvasClick}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* Grid for guidance */}
                <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border)" strokeWidth="0.5" opacity="0.3" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Lines */}
                {lines.map(line => (
                    <path
                        key={line.id}
                        d={getLinePath(line)}
                        className={`mg-editor-line ${mode === 'delete' ? 'mg-editor-line--deletable' : ''}`}
                        fill="none"
                        onClick={(e) => handleLineClick(line.id, e)}
                    />
                ))}

                {/* Preview line for selected nodes */}
                {selectedNodeIds.size >= 2 && (
                    <path
                        d={getLinePath({ id: 'preview', nodeIds: Array.from(selectedNodeIds) })}
                        className="mg-editor-line mg-editor-line--preview"
                        fill="none"
                    />
                )}

                {/* Nodes */}
                {nodes.map(node => {
                    const isSelected = selectedNodeIds.has(node.id);
                    const isDragging = node.id === draggingNodeId;

                    return (
                        <g
                            key={node.id}
                            className={`mg-editor-node ${isSelected ? 'mg-editor-node--selected' : ''} ${isDragging ? 'mg-editor-node--dragging' : ''} ${mode === 'delete' ? 'mg-editor-node--deletable' : ''}`}
                            onClick={(e) => handleNodeClick(node.id, e)}
                            onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                        >
                            <circle
                                cx={node.position.x}
                                cy={node.position.y}
                                r={NODE_RADIUS}
                                className="mg-editor-node__circle"
                            />
                            <text
                                x={node.position.x}
                                y={node.position.y}
                                textAnchor="middle"
                                dominantBaseline="central"
                                className="mg-editor-node__label"
                            >
                                {nodes.indexOf(node) + 1}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Connect button (in connect mode) */}
            {mode === 'connect' && selectedNodeIds.size >= 2 && (
                <button className="action action--secondary" onClick={createLineFromSelection}>
                    {t('editor.createLine')} ({selectedNodeIds.size} {t('editor.nodesSelected')})
                </button>
            )}

            {/* Numbers input */}
            <div className="mg-editor__numbers">
                <label htmlFor="available-numbers">{t('editor.availableNumbers')}:</label>
                <input
                    id="available-numbers"
                    type="text"
                    value={availableNumbers.join(', ')}
                    onChange={handleNumbersChange}
                    placeholder="1, 2, 3, 4, 5"
                />
            </div>

            {/* Stats */}
            <div className="mg-editor__stats">
                <span>{t('editor.nodes')}: {nodes.length}</span>
                <span>{t('editor.lines')}: {lines.length}</span>
                <span>{t('editor.numbers')}: {availableNumbers.length}</span>
            </div>

            {/* Error message */}
            {error && (
                <div className="mg-editor__error" role="alert">
                    {error}
                </div>
            )}

            {/* Action buttons */}
            <div className="mg-editor__actions">
                <button className="action action--secondary" onClick={clearAll}>
                    {t('editor.clearAll')}
                </button>
                <button className="action action--secondary" onClick={onCancel}>
                    {t('editor.cancel')}
                </button>
                <button
                    className="action action--primary"
                    onClick={generateFromTopology}
                    disabled={nodes.length < 2 || lines.length < 1}
                >
                    {t('editor.generate')}
                </button>
            </div>
        </div>
    );
}
