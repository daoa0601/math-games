/**
 * Color to Pattern Mapping
 *
 * Maps piece colors to CSS pattern classes for accessibility.
 * This ensures colorblind users can distinguish pieces by pattern
 * in addition to color.
 */

// Pattern class names from patterns.css
export type PatternClass =
  | 'pattern-dots'
  | 'pattern-lines'
  | 'pattern-grid'
  | 'pattern-diagonal'
  | 'pattern-checkerboard'
  | 'pattern-waves'
  | 'pattern-triangles'
  | 'pattern-crosshatch';

/**
 * Map of common game colors to their corresponding patterns
 * Uses HSL hue ranges to group similar colors
 */
const colorPatternMap: Array<{ range: [number, number]; pattern: PatternClass }> = [
  { range: [0, 30], pattern: 'pattern-diagonal' },      // Reds, oranges
  { range: [30, 60], pattern: 'pattern-dots' },         // Yellows
  { range: [60, 150], pattern: 'pattern-lines' },       // Greens
  { range: [150, 210], pattern: 'pattern-waves' },      // Cyans
  { range: [210, 270], pattern: 'pattern-grid' },       // Blues
  { range: [270, 330], pattern: 'pattern-triangles' },  // Purples, magentas
  { range: [330, 360], pattern: 'pattern-diagonal' },   // Back to reds
];

/**
 * Parse hex color to HSL hue value
 */
function hexToHue(hex: string): number {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Parse RGB
  const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
  const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
  const b = parseInt(cleanHex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let hue = 0;

  if (delta === 0) {
    hue = 0;
  } else if (max === r) {
    hue = ((g - b) / delta) % 6;
  } else if (max === g) {
    hue = (b - r) / delta + 2;
  } else {
    hue = (r - g) / delta + 4;
  }

  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;

  return hue;
}

/**
 * Get pattern class for a given color
 * @param color - Hex color string (e.g., '#FF5722')
 * @returns CSS pattern class name
 */
export function getPatternForColor(color: string): PatternClass {
  const hue = hexToHue(color);

  for (const { range, pattern } of colorPatternMap) {
    if (hue >= range[0] && hue < range[1]) {
      return pattern;
    }
  }

  // Default fallback
  return 'pattern-dots';
}

/**
 * Get both color and pattern styles for a piece
 * @param color - Hex color string
 * @returns Object with backgroundColor and pattern className
 */
export function getPieceStyles(color: string): {
  backgroundColor: string;
  patternClass: PatternClass;
} {
  return {
    backgroundColor: color,
    patternClass: getPatternForColor(color),
  };
}

/**
 * Predefined color-pattern assignments for consistent piece identification
 * Use these when you want explicit control over which pattern each piece gets
 */
export const PIECE_PATTERNS: Record<string, PatternClass> = {
  // Standard Tetris colors
  '#00BCD4': 'pattern-waves',      // Cyan I-block
  '#FFEB3B': 'pattern-dots',       // Yellow O-block
  '#9C27B0': 'pattern-triangles',  // Purple T-block
  '#4CAF50': 'pattern-lines',      // Green S-block
  '#F44336': 'pattern-diagonal',   // Red Z-block
  '#2196F3': 'pattern-grid',       // Blue J-block
  '#FF9800': 'pattern-checkerboard', // Orange L-block
  '#E91E63': 'pattern-crosshatch', // Pink

  // Additional colors
  '#FF5722': 'pattern-diagonal',   // Deep orange
  '#3F51B5': 'pattern-grid',       // Indigo
  '#009688': 'pattern-waves',      // Teal
  '#795548': 'pattern-lines',      // Brown
  '#607D8B': 'pattern-dots',       // Blue-grey
  '#FFC107': 'pattern-dots',       // Amber
  '#26A69A': 'pattern-waves',      // Teal variant
  '#7B1FA2': 'pattern-triangles',  // Purple variant
  '#9E9E9E': 'pattern-grid',       // Grey
};

/**
 * Get explicit pattern for a known piece color
 * Falls back to hue-based calculation for unknown colors
 */
export function getExplicitPattern(color: string): PatternClass {
  return PIECE_PATTERNS[color.toUpperCase()] ?? getPatternForColor(color);
}
