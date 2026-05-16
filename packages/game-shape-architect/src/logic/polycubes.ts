import type { Piece, Position3D } from './types'

type PieceFactory = (id: string, color: string) => Piece

function piece(name: string, layout: Position3D[]): PieceFactory {
  return (id, color) => ({
    id,
    name,
    color,
    layout,
  })
}

export const TETRACUBE = {
  I: piece('I-Tetracube', [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
    { x: 3, y: 0, z: 0 },
  ]),
  O: piece('O-Tetracube', [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 1, y: 1, z: 0 },
  ]),
  L: piece('L-Tetracube', [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
  ]),
  T: piece('T-Tetracube', [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
    { x: 1, y: 1, z: 0 },
  ]),
  S: piece('S-Tetracube', [
    { x: 1, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 1, y: 1, z: 0 },
  ]),
  V: piece('V-Tetracube', [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 2, z: 0 },
  ]),
  Tripod: piece('Tripod-Tetracube', [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 },
  ]),
  Stack: piece('Stack-Tetracube', [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 1, y: 0, z: 1 },
  ]),
} as const

export const PENTACUBE = {
  Slab: piece('Slab-Pentacube', [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 1, y: 1, z: 0 },
  ]),
  Tower: piece('Tower-Pentacube', [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 0, y: 0, z: 2 },
  ]),
  Bridge: piece('Bridge-Pentacube', [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 2, y: 0, z: 1 },
  ]),
  Corner: piece('Corner-Pentacube', [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 1, z: 1 },
  ]),
  Stair: piece('Stair-Pentacube', [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 1, y: 1, z: 0 },
    { x: 1, y: 1, z: 1 },
    { x: 2, y: 1, z: 1 },
  ]),
} as const

export const TETRACUBE_KEYS = Object.keys(
  TETRACUBE,
) as (keyof typeof TETRACUBE)[]

export const PENTACUBE_KEYS = Object.keys(
  PENTACUBE,
) as (keyof typeof PENTACUBE)[]
