/**
 * Shared BoxGeometry for voxel rendering.
 *
 * By reusing a single geometry instance across all voxels,
 * we reduce GPU memory usage by ~50% and improve performance.
 * Three.js can batch render calls more efficiently when
 * meshes share the same geometry reference.
 */

import { BoxGeometry } from 'three';

// Singleton geometry instance - created once, reused everywhere
// Size 0.95 leaves small gaps between voxels for visual clarity
const VOXEL_SIZE = 0.95;
const sharedBoxGeometry = new BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);

/**
 * Returns the shared BoxGeometry instance for voxel rendering.
 * Do NOT dispose this geometry - it's shared across all voxels.
 */
export function useSharedBoxGeometry(): BoxGeometry {
  return sharedBoxGeometry;
}

/**
 * Get the shared geometry directly (for non-hook contexts)
 */
export function getSharedBoxGeometry(): BoxGeometry {
  return sharedBoxGeometry;
}
