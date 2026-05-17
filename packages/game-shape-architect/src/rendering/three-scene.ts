import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import type {
  CellState,
  LevelConfig,
  PlacedPiece,
  Position3D,
} from "../logic/types";
import { getPieceWorldPositions } from "../logic/engine";

export interface ThreeScene {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
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
}

const CUBE_SIZE = 0.92;
const TARGET_COLOR = 0x737373;
const GHOST_VALID = 0x2563eb;
const GHOST_INVALID = 0xdc2626;

function toScenePosition(
  position: Position3D,
  gridSize: [number, number, number],
) {
  const [width, height] = gridSize;
  return new THREE.Vector3(
    position.x - width / 2 + 0.5,
    position.z + 0.5,
    position.y - height / 2 + 0.5,
  );
}

function setInstanceMatrix(
  mesh: THREE.InstancedMesh,
  index: number,
  position: THREE.Vector3,
) {
  const matrix = new THREE.Matrix4();
  matrix.makeTranslation(position.x, position.y, position.z);
  mesh.setMatrixAt(index, matrix);
}

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

export function createThreeScene(canvas: HTMLCanvasElement): ThreeScene {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

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

  const cubeGeometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
  const targetGeometry = new THREE.EdgesGeometry(cubeGeometry);
  const placedGroup = new THREE.Group();
  const targetGroup = new THREE.Group();
  const ghostGroup = new THREE.Group();
  scene.add(targetGroup, placedGroup, ghostGroup);

  let currentGridSize: [number, number, number] = [1, 1, 1];
  let currentGridState: CellState[][][] = [[[0]]];
  let animationId = 0;

  function clearGroup(group: THREE.Group) {
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      disposeObject(child);
    }
  }

  function fitToGrid(gridSize: [number, number, number]) {
    currentGridSize = gridSize;
    const [width, height, depth] = gridSize;
    const maxDimension = Math.max(width, height, depth);
    const distance = Math.max(5, maxDimension * 1.8);

    controls.target.set(0, Math.max(0.4, depth / 2), 0);
    camera.position.set(distance, distance * 0.9, distance);
    camera.lookAt(controls.target);
    controls.update();
  }

  function buildColorLookup(config: LevelConfig, placedPieces: PlacedPiece[]) {
    const lookup = new Map<string, string>();

    for (const placedPiece of placedPieces) {
      const piece = config.pieces.find(
        (candidate) => candidate.id === placedPiece.pieceId,
      );
      if (!piece) continue;

      for (const position of getPieceWorldPositions(
        piece,
        placedPiece.position,
        placedPiece.rotation,
      )) {
        lookup.set(
          `${position.x},${position.y},${position.z}`,
          placedPiece.color,
        );
      }
    }

    return lookup;
  }

  function updateGrid(
    gridState: CellState[][][],
    config: LevelConfig,
    placedPieces: PlacedPiece[],
  ) {
    currentGridSize = config.gridSize;
    currentGridState = gridState;
    clearGroup(placedGroup);
    clearGroup(targetGroup);

    const positionsByColor = new Map<string, Position3D[]>();
    const targetPositions: Position3D[] = [];
    const colorLookup = buildColorLookup(config, placedPieces);
    const [width, height, depth] = config.gridSize;

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        for (let z = 0; z < depth; z++) {
          const state = gridState[x]?.[y]?.[z] ?? 0;
          if (state === 1) {
            targetPositions.push({ x, y, z });
            continue;
          }

          if (state === 2) {
            const color = colorLookup.get(`${x},${y},${z}`) ?? "#737373";
            const positions = positionsByColor.get(color) ?? [];
            positions.push({ x, y, z });
            positionsByColor.set(color, positions);
          }
        }
      }
    }

    if (targetPositions.length > 0) {
      const material = new THREE.LineBasicMaterial({
        color: TARGET_COLOR,
        transparent: true,
        opacity: 0.45,
      });

      for (const position of targetPositions) {
        const line = new THREE.LineSegments(targetGeometry, material);
        line.position.copy(toScenePosition(position, config.gridSize));
        targetGroup.add(line);
      }
    }

    for (const [color, positions] of positionsByColor) {
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.65,
        metalness: 0.05,
      });
      const mesh = new THREE.InstancedMesh(
        cubeGeometry,
        material,
        positions.length,
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      positions.forEach((position, index) => {
        setInstanceMatrix(
          mesh,
          index,
          toScenePosition(position, config.gridSize),
        );
      });
      mesh.instanceMatrix.needsUpdate = true;
      placedGroup.add(mesh);
    }
  }

  function updateGhost(positions: Position3D[] | null, valid: boolean) {
    clearGroup(ghostGroup);
    if (!positions || positions.length === 0) return;

    const material = new THREE.MeshStandardMaterial({
      color: valid ? GHOST_VALID : GHOST_INVALID,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      roughness: 0.7,
    });
    const mesh = new THREE.InstancedMesh(
      cubeGeometry,
      material,
      positions.length,
    );

    positions.forEach((position, index) => {
      setInstanceMatrix(
        mesh,
        index,
        toScenePosition(position, currentGridSize),
      );
    });
    mesh.instanceMatrix.needsUpdate = true;
    ghostGroup.add(mesh);
  }

  function nearestProjectedTarget(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    const [width, height, depth] = currentGridSize;
    let best: { position: Position3D; distance: number } | null = null;

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        for (let z = 0; z < depth; z++) {
          if ((currentGridState[x]?.[y]?.[z] ?? 0) !== 1) continue;

          const projected = toScenePosition({ x, y, z }, currentGridSize);
          projected.project(camera);
          const screenX = rect.left + ((projected.x + 1) / 2) * rect.width;
          const screenY = rect.top + ((1 - projected.y) / 2) * rect.height;
          const distance = Math.hypot(clientX - screenX, clientY - screenY);

          if (!best || distance < best.distance) {
            best = { position: { x, y, z }, distance };
          }
        }
      }
    }

    return best && best.distance <= 96 ? best.position : null;
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
      return nearestProjectedTarget(clientX, clientY);
    }

    const [width, height, depth] = currentGridSize;
    const x = Math.floor(hit.x + width / 2);
    const y = Math.floor(hit.z + height / 2);

    if (x < 0 || x >= width || y < 0 || y >= height) {
      return nearestProjectedTarget(clientX, clientY);
    }

    for (let z = 0; z < depth; z++) {
      if ((currentGridState[x]?.[y]?.[z] ?? 0) === 1) return { x, y, z };
    }

    return nearestProjectedTarget(clientX, clientY) ?? { x, y, z: 0 };
  }

  function resize(w: number, h: number) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function animate() {
    animationId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  function dispose() {
    cancelAnimationFrame(animationId);
    controls.dispose();
    clearGroup(placedGroup);
    clearGroup(targetGroup);
    clearGroup(ghostGroup);
    cubeGeometry.dispose();
    targetGeometry.dispose();
    renderer.dispose();
  }

  fitToGrid(currentGridSize);
  animate();

  return {
    renderer,
    scene,
    camera,
    controls,
    dispose,
    fitToGrid,
    pickGridCell,
    updateGrid,
    updateGhost,
    resize,
  };
}
