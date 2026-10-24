import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import type {
  CellState,
  LevelConfig,
  PlacedPiece,
  Position3D,
} from "../logic/types";
import { groupCellsByColor } from "../logic/placement";
import {
  firstTargetInColumn,
  nearestProjectedTarget,
  planeHitToCell,
} from "./picking";
import type { GridSize } from "./picking";
import { createPerfMonitor } from "./perf-monitor";
import type { PerfMonitor, PerfSnapshot } from "./perf-monitor";

export type { PerfSnapshot };

export interface ThreeScene {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  perf: PerfMonitor;
  dispose: () => void;
  fitToGrid: (gridSize: [number, number, number]) => void;
  pickGridCell: (clientX: number, clientY: number) => Position3D | null;
  updateGrid: (
    gridState: CellState[][][],
    config: LevelConfig,
    placedPieces: PlacedPiece[],
  ) => void;
  updateGhost: (positions: Position3D[] | null, valid: boolean) => void;
  resize: (w: number, h: number) => void;
  /** Subscribe to perf snapshots (FPS, frame times). Returns an unsubscribe fn. */
  onPerf: (handler: (snapshot: PerfSnapshot) => void) => () => void;
}

const CUBE_SIZE = 0.92;
const TARGET_COLOR = 0x737373;
const GHOST_VALID = 0x2563eb;
const GHOST_INVALID = 0xdc2626;

const _tmpMatrix = new THREE.Matrix4();
const _tmpVec = new THREE.Vector3();
const _tmpColor = new THREE.Color();

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  if (Array.isArray(material)) {
    for (const item of material) item.dispose();
    return;
  }
  material.dispose();
}

function disposeObject(object: THREE.Object3D) {
  if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
    object.geometry.dispose();
    disposeMaterial(object.material);
  }
}

interface PooledMesh {
  mesh: THREE.InstancedMesh;
  capacity: number;
  count: number;
}

export function createThreeScene(canvas: HTMLCanvasElement): ThreeScene {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    // We render on demand; preserving the buffer keeps the last frame visible
    // for screenshots without an extra render cost in the idle loop.
    preserveDrawingBuffer: true,
    // Default powerPreference is fine for an idle-rendering scene; we are not
    // pegging the GPU continuously.
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  // VSM (variance shadow maps) gives soft shadows without the deprecated
  // PCFSoftShadowMap (removed in three.js 0.184). For a small voxel grid
  // the cost is comparable to PCF.
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfafafa);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 3;
  controls.maxDistance = 40;
  controls.minPolarAngle = 0.1;
  controls.maxPolarAngle = Math.PI / 2 - 0.03;
  // On every user interaction, the controls change the camera, which means we
  // need to repaint. The render-on-demand loop listens for this.
  controls.addEventListener("change", () => requestRender("controls"));

  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
  keyLight.position.set(6, 10, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.35);
  fillLight.position.set(-6, 4, -5);
  scene.add(fillLight);

  // Shared geometry — every voxel reuses the same cube. Never disposed per
  // update; disposed once on scene teardown.
  const cubeGeometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
  const targetGeometry = new THREE.EdgesGeometry(cubeGeometry);
  const placedGroup = new THREE.Group();
  const targetGroup = new THREE.Group();
  const ghostGroup = new THREE.Group();
  scene.add(targetGroup, placedGroup, ghostGroup);

  let currentGridSize: GridSize = [1, 1, 1];
  let currentGridState: CellState[][][] = [[[0]]];

  // ---- Render-on-demand state ----
  // We only render when something actually changed. A small number of
  // "settle" frames run after each request so OrbitControls damping finishes
  // smoothly, then the loop idles at ~0 CPU until the next interaction.
  let pendingFrames = 0;
  let rafId = 0;
  const MAX_SETTLE_FRAMES = 16; // ~250ms of damping tail at 60fps

  // ---- Material pooling ----
  // The previous code allocated a fresh MeshStandardMaterial per color per
  // update and disposed them on the next update — visible as GC pressure on
  // every placement. We cache by color instead and reuse them.
  const materialCache = new Map<string, THREE.MeshStandardMaterial>();
  const lineMaterial = new THREE.LineBasicMaterial({
    color: TARGET_COLOR,
    transparent: true,
    opacity: 0.45,
  });
  const ghostMaterialValid = new THREE.MeshStandardMaterial({
    color: GHOST_VALID,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    roughness: 0.7,
  });
  const ghostMaterialInvalid = new THREE.MeshStandardMaterial({
    color: GHOST_INVALID,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    roughness: 0.7,
  });

  // ---- InstancedMesh pools ----
  // Reuse a small number of pooled InstancedMesh objects across updates
  // (sized to the worst case seen so far), growing lazily. Avoids creating
  // and disposing GPU buffers on every placement.
  const placedPools = new Map<string, PooledMesh>();
  let ghostPool: PooledMesh | null = null;

  function getPlacedMaterial(color: string): THREE.MeshStandardMaterial {
    let mat = materialCache.get(color);
    if (!mat) {
      mat = new THREE.MeshStandardMaterial({
        color: _tmpColor.set(color),
        roughness: 0.65,
        metalness: 0.05,
      });
      materialCache.set(color, mat);
    }
    return mat;
  }

  function ensurePool(
    cache: Map<string, PooledMesh>,
    key: string,
    needed: number,
    material: THREE.Material,
    castShadow: boolean,
  ): PooledMesh {
    const existing = cache.get(key);
    if (existing && existing.capacity >= needed) {
      existing.count = needed;
      existing.mesh.count = needed;
      return existing;
    }

    // Grow to 2x the requested size (with a small floor) so we don't reallocate
    // on every subsequent placement that adds one more cube.
    const capacity = Math.max(needed, Math.ceil(needed * 2), 8);
    if (existing) {
      placedGroup.remove(existing.mesh);
      existing.mesh.geometry = cubeGeometry; // shared; old geometry not owned
      existing.mesh.dispose();
    }
    const mesh = new THREE.InstancedMesh(cubeGeometry, material, capacity);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = castShadow;
    mesh.count = needed;
    mesh.frustumCulled = false; // scene is always on screen
    placedGroup.add(mesh);
    const pool: PooledMesh = { mesh, capacity, count: needed };
    cache.set(key, pool);
    return pool;
  }

  function requestRender(reason: RenderReason): void {
    pendingFrames = MAX_SETTLE_FRAMES;
    void reason;
  }
  function clearGroup(group: THREE.Group) {
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      // Don't dispose pooled meshes here; they're managed by the pool.
      if (!(child instanceof THREE.InstancedMesh)) {
        disposeObject(child);
      }
    }
  }

  function fitToGrid(gridSize: [number, number, number] | GridSize) {
    currentGridSize = [...gridSize] as GridSize;
    const [width, height, depth] = gridSize;
    const maxDimension = Math.max(width, height, depth);
    const distance = Math.max(5, maxDimension * 1.8);

    controls.target.set(0, Math.max(0.4, depth / 2), 0);
    camera.position.set(distance, distance * 0.9, distance);
    camera.lookAt(controls.target);
    controls.update();
    requestRender("fit");
  }

  function updateGrid(
    gridState: CellState[][][],
    config: LevelConfig,
    placedPieces: PlacedPiece[],
  ) {
    currentGridSize = config.gridSize;
    currentGridState = gridState;

    // Hide all pooled meshes; we'll repopulate the ones we need.
    for (const pool of placedPools.values()) {
      pool.mesh.visible = false;
      pool.count = 0;
    }

    const { byColor, targets } = groupCellsByColor({
      gridState,
      placedPieces,
      config,
    });

    // Targets: edges-only wireframes. These are cheap (LineSegments, no
    // shadow) so we rebuild them per update — but reuse the shared line
    // material and target geometry.
    clearGroup(targetGroup);
    if (targets.length > 0) {
      for (const position of targets) {
        const line = new THREE.LineSegments(targetGeometry, lineMaterial);
        _tmpVec.set(
          position.x - currentGridSize[0] / 2 + 0.5,
          position.z + 0.5,
          position.y - currentGridSize[1] / 2 + 0.5,
        );
        line.position.copy(_tmpVec);
        targetGroup.add(line);
      }
    }

    // Placed voxels: one pooled InstancedMesh per color.
    for (const [color, positions] of byColor) {
      const material = getPlacedMaterial(color);
      const pool = ensurePool(
        placedPools,
        color,
        positions.length,
        material,
        true,
      );
      for (let i = 0; i < positions.length; i++) {
        const p = positions[i];
        _tmpVec.set(
          p.x - currentGridSize[0] / 2 + 0.5,
          p.z + 0.5,
          p.y - currentGridSize[1] / 2 + 0.5,
        );
        _tmpMatrix.makeTranslation(_tmpVec.x, _tmpVec.y, _tmpVec.z);
        pool.mesh.setMatrixAt(i, _tmpMatrix);
      }
      pool.mesh.instanceMatrix.needsUpdate = true;
      pool.mesh.visible = true;
    }

    requestRender("grid");
  }

  function updateGhost(positions: Position3D[] | null, valid: boolean) {
    if (ghostPool) ghostPool.mesh.visible = false;
    if (!positions || positions.length === 0) {
      requestRender("ghost-clear");
      return;
    }

    const material = valid ? ghostMaterialValid : ghostMaterialInvalid;
    // Grow/realloc the ghost pool if needed.
    if (!ghostPool || ghostPool.capacity < positions.length) {
      const capacity = Math.max(positions.length, 8);
      if (ghostPool) {
        ghostGroup.remove(ghostPool.mesh);
        ghostPool.mesh.dispose();
      }
      const mesh = new THREE.InstancedMesh(cubeGeometry, material, capacity);
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.count = positions.length;
      mesh.frustumCulled = false;
      ghostGroup.add(mesh);
      ghostPool = { mesh, capacity, count: positions.length };
    } else {
      ghostPool.mesh.material = material;
      ghostPool.count = positions.length;
      ghostPool.mesh.count = positions.length;
    }

    for (let i = 0; i < positions.length; i++) {
      const p = positions[i];
      _tmpVec.set(
        p.x - currentGridSize[0] / 2 + 0.5,
        p.z + 0.5,
        p.y - currentGridSize[1] / 2 + 0.5,
      );
      _tmpMatrix.makeTranslation(_tmpVec.x, _tmpVec.y, _tmpVec.z);
      ghostPool.mesh.setMatrixAt(i, _tmpMatrix);
    }
    ghostPool.mesh.instanceMatrix.needsUpdate = true;
    ghostPool.mesh.visible = true;
    requestRender("ghost");
  }

  function pickGridCell(clientX: number, clientY: number): Position3D | null {
    const rect = canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = new THREE.Vector3();
    if (!raycaster.ray.intersectPlane(plane, hit)) {
      return nearestProjectedTarget({
        gridState: currentGridState,
        gridSize: currentGridSize,
        project: (p) => {
          _tmpVec.set(p.x, p.y, p.z).project(camera);
          return { x: _tmpVec.x, y: _tmpVec.y };
        },
        rect,
        clientX,
        clientY,
      });
    }

    const cell = planeHitToCell({ x: hit.x, z: hit.z }, currentGridSize);
    if (!cell) {
      return nearestProjectedTarget({
        gridState: currentGridState,
        gridSize: currentGridSize,
        project: (p) => {
          _tmpVec.set(p.x, p.y, p.z).project(camera);
          return { x: _tmpVec.x, y: _tmpVec.y };
        },
        rect,
        clientX,
        clientY,
      });
    }

    return (
      firstTargetInColumn(currentGridState, currentGridSize, cell) ?? {
        x: cell.x,
        y: cell.y,
        z: 0,
      }
    );
  }

  function resize(w: number, h: number) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    requestRender("resize");
  }

  // ---- Perf monitor ----
  const perfHandlers = new Set<(s: PerfSnapshot) => void>();
  const perf = createPerfMonitor({
    windowMs: 2_000,
    reportMs: 1_000,
    onSnapshot: (snapshot) => {
      for (const handler of perfHandlers) handler(snapshot);
    },
  });

  function onPerf(handler: (snapshot: PerfSnapshot) => void): () => void {
    perfHandlers.add(handler);
    return () => perfHandlers.delete(handler);
  }

  // ---- The render-on-demand loop ----
  // Runs continuously at rAF cadence but only does renderer.render when
  // pendingFrames > 0. When idle (no interaction, no pending updates), each
  // tick is essentially free and counts as no frame, so the HUD and metrics
  // show "0 fps while idle, 60 fps while interacting" honestly.
  function animate(now: number) {
    rafId = requestAnimationFrame(animate);
    controls.update();
    if (pendingFrames > 0) {
      const token = perf.beginFrame(now);
      renderer.render(scene, camera);
      pendingFrames--;
      perf.endFrame(token);
    } else {
      perf.idle(now);
    }
  }

  fitToGrid(currentGridSize);
  rafId = requestAnimationFrame(animate);

  function dispose() {
    cancelAnimationFrame(rafId);
    controls.dispose();
    // Pools
    for (const pool of placedPools.values()) pool.mesh.dispose();
    placedPools.clear();
    if (ghostPool) {
      ghostPool.mesh.dispose();
      ghostPool = null;
    }
    // Groups (non-pooled children: target lines)
    clearGroup(targetGroup);
    // Materials
    for (const mat of materialCache.values()) mat.dispose();
    materialCache.clear();
    lineMaterial.dispose();
    ghostMaterialValid.dispose();
    ghostMaterialInvalid.dispose();
    // Shared geometry
    cubeGeometry.dispose();
    targetGeometry.dispose();
    renderer.dispose();
    perfHandlers.clear();
  }

  return {
    renderer,
    scene,
    camera,
    controls,
    perf,
    dispose,
    fitToGrid,
    pickGridCell,
    updateGrid,
    updateGhost,
    resize,
    onPerf,
  };
}

type RenderReason =
  | "controls"
  | "fit"
  | "grid"
  | "ghost"
  | "ghost-clear"
  | "resize";
