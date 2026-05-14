import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import type { LevelConfig, PlacedPiece, Position3D } from '../logic/types'
import type { VoxelGrid } from '../logic/voxel-grid'
import { getPieceWorldPositions } from '../logic/engine'

export interface ThreeScene {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  controls: OrbitControls
  dispose: () => void
  updateGrid: (
    grid: VoxelGrid,
    config: LevelConfig,
    placedPieces: PlacedPiece[],
  ) => void
  updateGhost: (positions: Position3D[] | null, valid: boolean) => void
  resize: (w: number, h: number) => void
}

const CUBE_SIZE = 0.95
const GHOST_OPACITY = 0.4

export function createThreeScene(canvas: HTMLCanvasElement): ThreeScene {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0xfafafa)

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200)
  camera.position.set(8, 10, 8)
  camera.lookAt(0, 0, 0)

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambient)

  const directional = new THREE.DirectionalLight(0xffffff, 0.8)
  directional.position.set(5, 10, 5)
  directional.castShadow = true
  directional.shadow.mapSize.width = 1024
  directional.shadow.mapSize.height = 1024
  scene.add(directional)

  // Controls
  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  controls.dampingFactor = 0.1
  controls.minPolarAngle = 0.1
  controls.maxPolarAngle = Math.PI / 2 - 0.05 // Don't flip below ground
  controls.target.set(0, 0, 0)

  // Ground plane
  const groundGeo = new THREE.PlaneGeometry(30, 30)
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    roughness: 1,
    metalness: 0,
  })
  const ground = new THREE.Mesh(groundGeo, groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.01
  ground.receiveShadow = true
  scene.add(ground)

  // Group for voxels
  const voxelGroup = new THREE.Group()
  scene.add(voxelGroup)

  // Ghost group
  const ghostGroup = new THREE.Group()
  scene.add(ghostGroup)

  // Shared geometry
  const cubeGeo = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE)

  // Animation loop
  let animId = 0
  let currentGridSize: [number, number, number] = [10, 10, 1]
  function animate() {
    animId = requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
  }
  animate()

  function disposeMaterial(material: THREE.Material | THREE.Material[]) {
    if (Array.isArray(material)) {
      for (const item of material) {
        item.dispose()
      }
      return
    }

    material.dispose()
  }

  function disposeObjectResources(object: THREE.Object3D) {
    if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
      if (object.geometry !== cubeGeo) {
        object.geometry.dispose()
      }
      disposeMaterial(object.material)
    }
  }

  function clearGroup(group: THREE.Group) {
    while (group.children.length > 0) {
      const child = group.children[0]
      group.remove(child)
      disposeObjectResources(child)
    }
  }

  function updateGrid(
    grid: VoxelGrid,
    config: LevelConfig,
    placedPieces: PlacedPiece[],
  ) {
    clearGroup(voxelGroup)

    const [gw, gh, gd] = config.gridSize
    currentGridSize = config.gridSize
    const offsetX = -gw / 2
    const offsetZ = -gh / 2

    // Build color lookup
    const colorLookup = new Map<string, string>()
    for (const pp of placedPieces) {
      const piece = config.pieces.find((p) => p.id === pp.pieceId)
      if (!piece) continue
      for (const pos of getPieceWorldPositions(
        piece,
        pp.position,
        pp.rotation,
      )) {
        colorLookup.set(`${pos.x},${pos.y},${pos.z}`, pp.color)
      }
    }

    // Update camera target
    controls.target.set(0, (gd - 1) * 0.5, 0)

    // Draw cells
    for (let z = 0; z < gd; z++) {
      for (let y = 0; y < gh; y++) {
        for (let x = 0; x < gw; x++) {
          const state = grid.get(x, y, z)
          if (state === 0) continue

          const key = `${x},${y},${z}`
          const worldX = x + offsetX + 0.5
          const worldY = z + 0.5
          const worldZ = y + offsetZ + 0.5

          if (state === 1) {
            // Target cell — translucent wireframe box
            const edges = new THREE.EdgesGeometry(cubeGeo)
            const line = new THREE.LineSegments(
              edges,
              new THREE.LineBasicMaterial({
                color: 0x999999,
                opacity: 0.5,
                transparent: true,
              }),
            )
            line.position.set(worldX, worldY, worldZ)
            voxelGroup.add(line)
          } else if (state === 2) {
            const hexColor = colorLookup.get(key) ?? '#999999'
            const mat = new THREE.MeshStandardMaterial({
              color: new THREE.Color(hexColor),
              roughness: 0.7,
              metalness: 0.1,
            })
            const mesh = new THREE.Mesh(cubeGeo, mat)
            mesh.position.set(worldX, worldY, worldZ)
            mesh.castShadow = true
            mesh.receiveShadow = true
            voxelGroup.add(mesh)
          }
        }
      }
    }

    // Update grid helper
    const gridHelper = scene.getObjectByName('gridHelper')
    if (gridHelper) {
      scene.remove(gridHelper)
      disposeObjectResources(gridHelper)
    }
    const newHelper = new THREE.GridHelper(
      Math.max(gw, gh),
      Math.max(gw, gh),
      0xcccccc,
      0xe0e0e0,
    )
    newHelper.name = 'gridHelper'
    newHelper.position.y = 0
    scene.add(newHelper)
  }

  function updateGhost(positions: Position3D[] | null, valid: boolean) {
    clearGroup(ghostGroup)
    if (!positions) return

    const [gw, gh] = currentGridSize
    const offsetX = -gw / 2
    const offsetZ = -gh / 2

    const color = valid ? 0x3b82f6 : 0xef4444
    const mat = new THREE.MeshStandardMaterial({
      color,
      opacity: GHOST_OPACITY,
      transparent: true,
      depthWrite: false,
    })

    for (const pos of positions) {
      const mesh = new THREE.Mesh(cubeGeo, mat)
      mesh.position.set(
        pos.x + offsetX + 0.5,
        pos.z + 0.5,
        pos.y + offsetZ + 0.5,
      )
      ghostGroup.add(mesh)
    }
  }

  function resize(w: number, h: number) {
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }

  function dispose() {
    cancelAnimationFrame(animId)
    controls.dispose()
    clearGroup(voxelGroup)
    clearGroup(ghostGroup)
    const gridHelper = scene.getObjectByName('gridHelper')
    if (gridHelper) {
      scene.remove(gridHelper)
      disposeObjectResources(gridHelper)
    }
    cubeGeo.dispose()
    groundGeo.dispose()
    groundMat.dispose()
    renderer.dispose()
  }

  return {
    renderer,
    scene,
    camera,
    controls,
    dispose,
    updateGrid,
    updateGhost,
    resize,
  }
}
