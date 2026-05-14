import type { CellState } from '../logic/types'
import type { VoxelGrid } from '../logic/voxel-grid'

export interface IsoConfig {
  tileWidth: number
  tileHeight: number
  originX: number
  originY: number
}

export function toScreen(
  x: number,
  y: number,
  z: number,
  cfg: IsoConfig,
): { sx: number; sy: number } {
  return {
    sx: cfg.originX + (x - y) * (cfg.tileWidth / 2),
    sy: cfg.originY + (x + y) * (cfg.tileHeight / 2) - z * cfg.tileHeight,
  }
}

export function screenToIso(
  sx: number,
  sy: number,
  z: number,
  cfg: IsoConfig,
): { x: number; y: number } {
  const adjSy = sy - cfg.originY + z * cfg.tileHeight
  const adjSx = sx - cfg.originX
  const fx = adjSy / cfg.tileHeight + adjSx / cfg.tileWidth
  const fy = adjSy / cfg.tileHeight - adjSx / cfg.tileWidth
  return { x: Math.floor(fx), y: Math.floor(fy) }
}

function darkenHex(hex: string, amount: number): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - Math.round(255 * amount))
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - Math.round(255 * amount))
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - Math.round(255 * amount))
  return `rgb(${r},${g},${b})`
}

export function drawIsoCube(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  z: number,
  color: string,
  cfg: IsoConfig,
): void {
  const tw = cfg.tileWidth / 2
  const th = cfg.tileHeight / 2
  const { sx, sy } = toScreen(x, y, z, cfg)

  // Top face
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(sx, sy - th)
  ctx.lineTo(sx + tw, sy)
  ctx.lineTo(sx, sy + th)
  ctx.lineTo(sx - tw, sy)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.15)'
  ctx.lineWidth = 0.5
  ctx.stroke()

  // Left face
  ctx.fillStyle = darkenHex(color, 0.15)
  ctx.beginPath()
  ctx.moveTo(sx - tw, sy)
  ctx.lineTo(sx, sy + th)
  ctx.lineTo(sx, sy + th + th)
  ctx.lineTo(sx - tw, sy + th)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Right face
  ctx.fillStyle = darkenHex(color, 0.30)
  ctx.beginPath()
  ctx.moveTo(sx + tw, sy)
  ctx.lineTo(sx, sy + th)
  ctx.lineTo(sx, sy + th + th)
  ctx.lineTo(sx + tw, sy + th)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
}

export function drawIsoWireframe(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  z: number,
  cfg: IsoConfig,
  strokeColor: string = 'rgba(0,0,0,0.2)',
): void {
  const tw = cfg.tileWidth / 2
  const th = cfg.tileHeight / 2
  const { sx, sy } = toScreen(x, y, z, cfg)

  ctx.strokeStyle = strokeColor
  ctx.lineWidth = 0.5

  // Top face outline
  ctx.beginPath()
  ctx.moveTo(sx, sy - th)
  ctx.lineTo(sx + tw, sy)
  ctx.lineTo(sx, sy + th)
  ctx.lineTo(sx - tw, sy)
  ctx.closePath()
  ctx.stroke()
}

export interface IsoCubeEntry {
  x: number
  y: number
  z: number
  color: string
  state: CellState
}

export function collectVisibleCubes(
  grid: VoxelGrid,
  colorLookup: Map<string, string>,
  visibleLayers: Set<number>,
): IsoCubeEntry[] {
  const cubes: IsoCubeEntry[] = []
  for (let z = 0; z < grid.depth; z++) {
    if (!visibleLayers.has(z)) continue
    for (let y = grid.height - 1; y >= 0; y--) {
      for (let x = 0; x < grid.width; x++) {
        const state = grid.get(x, y, z)
        if (state === 0) continue
        const key = `${x},${y},${z}`
        const color = colorLookup.get(key) ?? (state === 1 ? '#e5e5e5' : '#cccccc')
        cubes.push({ x, y, z, color, state })
      }
    }
  }
  return cubes
}

export function computeIsoConfig(
  gridWidth: number,
  gridHeight: number,
  gridDepth: number,
  canvasWidth: number,
  _canvasHeight: number,
): IsoConfig {
  const maxSpan = Math.max(gridWidth, gridHeight)
  const tileWidth = Math.min(48, Math.floor(canvasWidth / (maxSpan + 1)))
  const tileHeight = tileWidth / 2
  const originX = canvasWidth / 2
  const originY = tileHeight * maxSpan / 2 + gridDepth * tileHeight + tileHeight
  return { tileWidth, tileHeight, originX, originY }
}
