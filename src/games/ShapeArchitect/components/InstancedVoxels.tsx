/**
 * InstancedVoxels - High-performance batched voxel rendering
 *
 * Uses Three.js InstancedMesh to render many voxels with minimal draw calls.
 * Instead of 500+ individual mesh draw calls, we batch voxels by color
 * into ~5-10 instanced meshes, reducing draw calls by 50-80%.
 *
 * Performance benefits:
 * - Fewer draw calls (GPU state changes are expensive)
 * - Better GPU batching
 * - Lower CPU overhead
 */

import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getSharedBoxGeometry } from '../hooks';

interface VoxelData {
  position: [number, number, number];
  color: string;
  type: 'filled' | 'target' | 'empty' | 'preview';
  isPreviewValid?: boolean;
  isPreviewLocked?: boolean;
}

interface InstancedVoxelsProps {
  voxels: VoxelData[];
  onCellClick?: (x: number, y: number, z: number) => void;
  onCellHover?: (x: number, y: number, z: number) => void;
}

// Reusable objects for matrix calculations (avoid GC pressure)
const tempMatrix = new THREE.Matrix4();
const tempVector = new THREE.Vector3();

/**
 * Group voxels by color and type for efficient instanced rendering
 */
function groupVoxelsByColorAndType(voxels: VoxelData[]) {
  const groups = new Map<string, VoxelData[]>();

  for (const voxel of voxels) {
    // Create unique key combining color and type
    const key = `${voxel.color}-${voxel.type}`;
    const group = groups.get(key) ?? [];
    group.push(voxel);
    groups.set(key, group);
  }

  return groups;
}

/**
 * Single instanced mesh for a group of same-colored voxels
 */
function InstancedVoxelGroup({
  voxels,
  color,
  type,
  isPreviewValid,
  isPreviewLocked,
}: {
  voxels: VoxelData[];
  color: string;
  type: 'filled' | 'target' | 'empty' | 'preview';
  isPreviewValid?: boolean;
  isPreviewLocked?: boolean;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { invalidate } = useThree();
  const geometry = useMemo(() => getSharedBoxGeometry(), []);

  // Update instance matrices when voxels change
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    for (let i = 0; i < voxels.length; i++) {
      const voxel = voxels[i];
      tempMatrix.makeTranslation(voxel.position[0], voxel.position[1], voxel.position[2]);
      mesh.setMatrixAt(i, tempMatrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    mesh.count = voxels.length;
    invalidate();
  }, [voxels, invalidate]);

  // Animate preview voxels
  useFrame((state) => {
    if (type !== 'preview' || !meshRef.current) return;

    const speed = isPreviewLocked ? 2 : 4;
    const amplitude = isPreviewLocked ? 0.08 : 0.05;
    const scale = 0.9 + Math.sin(state.clock.elapsedTime * speed) * amplitude;

    for (let i = 0; i < voxels.length; i++) {
      const voxel = voxels[i];
      tempMatrix.makeTranslation(voxel.position[0], voxel.position[1], voxel.position[2]);
      tempMatrix.scale(tempVector.set(scale, scale, scale));
      meshRef.current.setMatrixAt(i, tempMatrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  // Calculate material properties based on type
  const { opacity, transparent, wireframe } = useMemo(() => {
    switch (type) {
      case 'empty':
        return { opacity: 0.1, transparent: true, wireframe: false };
      case 'target':
        return { opacity: 0.3, transparent: true, wireframe: true };
      case 'preview':
        return { opacity: isPreviewLocked ? 0.75 : 0.6, transparent: true, wireframe: false };
      default: // filled
        return { opacity: 1, transparent: false, wireframe: false };
    }
  }, [type, isPreviewLocked]);

  // Get display color
  const displayColor = useMemo(() => {
    if (type === 'preview') {
      return isPreviewValid ? '#22c55e' : '#ef4444';
    }
    return color;
  }, [type, color, isPreviewValid]);

  // Only filled blocks cast shadows
  const castShadow = type === 'filled';

  if (voxels.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, voxels.length]}
      castShadow={castShadow}
      receiveShadow
    >
      <meshStandardMaterial
        color={displayColor}
        transparent={transparent}
        opacity={opacity}
        wireframe={wireframe}
      />
    </instancedMesh>
  );
}

/**
 * Main component that renders all voxels using instanced meshes
 */
export function InstancedVoxels({ voxels }: InstancedVoxelsProps) {
  // Group voxels by color and type
  const groups = useMemo(() => groupVoxelsByColorAndType(voxels), [voxels]);

  return (
    <>
      {Array.from(groups.entries()).map(([key, groupVoxels]) => {
        const firstVoxel = groupVoxels[0];
        return (
          <InstancedVoxelGroup
            key={key}
            voxels={groupVoxels}
            color={firstVoxel.color}
            type={firstVoxel.type}
            isPreviewValid={firstVoxel.isPreviewValid}
            isPreviewLocked={firstVoxel.isPreviewLocked}
          />
        );
      })}
    </>
  );
}

export type { VoxelData };
