import { useEffect, useRef, useState } from 'react'

import type { LevelConfig, Piece, PlacedPiece, Position3D, Rotation3D } from '../logic/types'
import type { VoxelGrid } from '../logic/voxel-grid'
import type { ThreeScene } from '../rendering/three-scene'

interface ShapeArchitect3DProps {
  grid: VoxelGrid
  config: LevelConfig
  placedPieces: PlacedPiece[]
  selectedPiece: Piece | null
  placementRotation: Rotation3D
  onCellClick: (position: Position3D) => void
}

export function ShapeArchitect3D({
  grid,
  config,
  placedPieces,
  selectedPiece,
  placementRotation: _placementRotation,
  onCellClick,
}: ShapeArchitect3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<ThreeScene | null>(null)
  const [ready, setReady] = useState(false)

  // Lazy-load Three.js and initialize scene
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let disposed = false

    import('../rendering/three-scene').then(({ createThreeScene }) => {
      if (disposed) return
      const threeScene = createThreeScene(canvas)
      sceneRef.current = threeScene
      setReady(true)

      // Initial size
      const container = containerRef.current
      if (container) {
        const rect = container.getBoundingClientRect()
        threeScene.resize(rect.width, Math.max(300, rect.width * 0.6))
      }
    })

    return () => {
      disposed = true
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [])

  // Resize on container changes
  useEffect(() => {
    const container = containerRef.current
    if (!container || !sceneRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        sceneRef.current?.resize(w, Math.max(300, w * 0.6))
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [ready])

  // Update grid when state changes
  useEffect(() => {
    if (!sceneRef.current) return
    sceneRef.current.updateGrid(grid, config, placedPieces)
  }, [grid, config, placedPieces, ready])

  // Update ghost on hover (simplified — using canvas click for placement)
  // Full raycasting ghost would need more complex intersection logic.
  // For now, ghost updates happen on the 2D Canvas fallback.

  // Click-to-place uses raycasting against the ground plane.
  // Three.js is lazy-loaded so we import it dynamically inside the handler.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !sceneRef.current) return

    function handleClick(e: MouseEvent) {
      const threeScene = sceneRef.current
      if (!threeScene) return

      const rect = canvas!.getBoundingClientRect()
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1

      // Lazy-import THREE for Raycaster (already bundled by this point)
      import('three').then(({ Raycaster, Vector2, Plane, Vector3 }) => {
        const raycaster = new Raycaster()
        raycaster.setFromCamera(new Vector2(ndcX, ndcY), threeScene.camera)

        const groundPlane = new Plane(new Vector3(0, 1, 0), 0)
        const hit = new Vector3()
        raycaster.ray.intersectPlane(groundPlane, hit)

        if (hit) {
          const [gw, , ] = config.gridSize
          const [, gh] = config.gridSize
          const gx = Math.floor(hit.x + gw / 2)
          const gy = Math.floor(hit.z + gh / 2)
          if (gx >= 0 && gx < gw && gy >= 0 && gy < gh) {
            onCellClick({ x: gx, y: gy, z: 0 })
          }
        }
      })
    }

    canvas.addEventListener('click', handleClick)
    return () => canvas.removeEventListener('click', handleClick)
  }, [ready, config, onCellClick])

  return (
    <div ref={containerRef} className="max-w-[520px]">
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ minHeight: 300, cursor: selectedPiece ? 'crosshair' : 'grab' }}
        aria-label="Shape Architect 3D view"
        role="img"
      />
      {!ready && (
        <div className="flex h-[300px] items-center justify-center text-sm text-neutral-500">
          Loading 3D view…
        </div>
      )}
    </div>
  )
}
