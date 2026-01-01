import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Material, BufferGeometry, Texture } from 'three';
import type { Object3D } from 'three';

/**
 * Hook to properly dispose of Three.js resources when the component unmounts.
 * Prevents GPU memory leaks by cleaning up geometries, materials, and textures.
 *
 * @see https://threejs.org/manual/en/how-to-dispose-of-objects.html
 *
 * @example
 * ```tsx
 * function MyScene() {
 *   useThreeCleanup();
 *   return <mesh>...</mesh>;
 * }
 * ```
 */
export function useThreeCleanup() {
  const { scene, gl } = useThree();

  useEffect(() => {
    // Cleanup function runs on unmount
    return () => {
      // Traverse the scene and dispose all resources
      scene.traverse((object: Object3D) => {
        // Dispose geometries
        if ('geometry' in object && object.geometry instanceof BufferGeometry) {
          object.geometry.dispose();
        }

        // Dispose materials (can be single or array)
        if ('material' in object) {
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];

          for (const material of materials) {
            if (material instanceof Material) {
              // Dispose any textures attached to the material
              disposeMaterialTextures(material);
              material.dispose();
            }
          }
        }
      });

      // Clear the scene
      while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
      }

      // Force WebGL context cleanup
      gl.dispose();
    };
  }, [scene, gl]);
}

/**
 * Disposes all textures attached to a material.
 * Materials can have multiple texture properties (map, normalMap, etc.).
 */
function disposeMaterialTextures(material: Material) {
  // Common texture properties on Three.js materials
  const textureProperties = [
    'map',
    'lightMap',
    'bumpMap',
    'normalMap',
    'specularMap',
    'envMap',
    'alphaMap',
    'aoMap',
    'displacementMap',
    'emissiveMap',
    'gradientMap',
    'metalnessMap',
    'roughnessMap',
  ] as const;

  for (const prop of textureProperties) {
    if (prop in material) {
      const texture = (material as unknown as Record<string, unknown>)[prop];
      if (texture instanceof Texture) {
        texture.dispose();
      }
    }
  }
}

export default useThreeCleanup;
