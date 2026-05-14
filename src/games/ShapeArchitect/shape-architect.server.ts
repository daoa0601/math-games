import { Effect, Schema } from 'effect'

import {
  GameProgressValidationError,
  HeaderService,
  OriginGuardService,
  PlayerIdentityService,
  RateLimitService,
} from '@/services'

import { canPlacePiece, checkSolved, initializeGrid, placePiece } from './logic'
import type { LevelConfig, PlacedPiece, ShapeArchitectGameState } from './logic'
import { shapeArchitectModule } from './module'
import { ShapeArchitectMoveRequest } from './shape-architect.schema'

type MoveRequest = typeof ShapeArchitectMoveRequest.Type

function decodeMoveRequest(rawData: unknown) {
  return Effect.try({
    try: () => Schema.decodeUnknownSync(ShapeArchitectMoveRequest)(rawData),
    catch: (e) =>
      new GameProgressValidationError({
        reason: e instanceof Error ? e.message : 'Invalid move request',
      }),
  })
}

function createGameState(
  level: LevelConfig,
  placedPieces: PlacedPiece[],
  accepted: boolean,
  error?: string,
): ShapeArchitectGameState {
  const usedPieceIds = new Set(placedPieces.map((piece) => piece.pieceId))
  const remainingPieces = level.pieces.filter(
    (piece) => !usedPieceIds.has(piece.id),
  )
  const grid = placedPieces.reduce((currentGrid, placedPiece) => {
    const piece = level.pieces.find(
      (candidate) => candidate.id === placedPiece.pieceId,
    )

    return piece
      ? placePiece(
          currentGrid,
          piece,
          placedPiece.position,
          placedPiece.rotation,
        )
      : currentGrid
  }, initializeGrid(level))

  return {
    grid: grid.toNestedArray(),
    placedPieces,
    remainingPieces,
    isSolved: checkSolved(grid, level.targetVoxels),
    moveCount: placedPieces.length,
    accepted,
    ...(error ? { error } : {}),
  }
}

function replayPlacements(
  level: LevelConfig,
  requestedPlacements: MoveRequest['placements'],
): ShapeArchitectGameState {
  let grid = initializeGrid(level)
  const placedPieces: PlacedPiece[] = []
  const usedPieceIds = new Set<string>()

  for (const placement of requestedPlacements) {
    if (usedPieceIds.has(placement.pieceId)) {
      return createGameState(
        level,
        placedPieces,
        false,
        `Piece already placed: ${placement.pieceId}`,
      )
    }

    const piece = level.pieces.find(
      (candidate) => candidate.id === placement.pieceId,
    )

    if (!piece) {
      return createGameState(
        level,
        placedPieces,
        false,
        `Unknown piece: ${placement.pieceId}`,
      )
    }

    if (
      !canPlacePiece(
        grid,
        piece,
        placement.position,
        placement.rotation,
        level.gridSize,
      )
    ) {
      return createGameState(
        level,
        placedPieces,
        false,
        `Invalid placement for ${piece.name}`,
      )
    }

    const placedPiece: PlacedPiece = {
      pieceId: piece.id,
      position: placement.position,
      rotation: placement.rotation,
      color: piece.color,
    }

    placedPieces.push(placedPiece)
    usedPieceIds.add(piece.id)
    grid = placePiece(grid, piece, placement.position, placement.rotation)
  }

  return {
    grid: grid.toNestedArray(),
    placedPieces,
    remainingPieces: level.pieces.filter(
      (piece) => !usedPieceIds.has(piece.id),
    ),
    isSolved: checkSolved(grid, level.targetVoxels),
    moveCount: placedPieces.length,
    accepted: true,
  }
}

export function createValidateMoveEffect(rawData: unknown) {
  return Effect.gen(function* () {
    const data = yield* decodeMoveRequest(rawData)

    yield* (yield* OriginGuardService).assert()
    yield* (yield* HeaderService).setResponse('cache-control', 'no-store')

    const playerId = yield* (yield* PlayerIdentityService).resolveId()
    yield* (yield* RateLimitService).assert(`move:shape-architect:${playerId}`)

    const level = shapeArchitectModule.resolveLevelConfig(data.levelId)
    if (!level) {
      return yield* new GameProgressValidationError({
        reason: `Unknown level: ${data.levelId}`,
      })
    }

    return replayPlacements(level, data.placements)
  })
}
