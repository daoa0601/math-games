import { Schema } from 'effect'

const RotationAngle = Schema.Literals([0, 90, 180, 270])
const GridCoordinate = Schema.Number.pipe(Schema.check(Schema.isInt()))

const Position3DSchema = Schema.Struct({
  x: GridCoordinate,
  y: GridCoordinate,
  z: GridCoordinate,
})

const Rotation3DSchema = Schema.Struct({
  x: RotationAngle,
  y: RotationAngle,
  z: RotationAngle,
})

const PlacementSchema = Schema.Struct({
  pieceId: Schema.NonEmptyString,
  position: Position3DSchema,
  rotation: Rotation3DSchema,
})

export class ShapeArchitectCompletion extends Schema.Class<ShapeArchitectCompletion>(
  'ShapeArchitectCompletion',
)({
  placements: Schema.Array(PlacementSchema).pipe(
    Schema.check(Schema.isMaxLength(64, { message: 'Too many placements' })),
  ),
}) {}

export class ShapeArchitectMoveRequest extends Schema.Class<ShapeArchitectMoveRequest>(
  'ShapeArchitectMoveRequest',
)({
  levelId: Schema.NonEmptyString,
  placements: Schema.Array(PlacementSchema).pipe(
    Schema.check(Schema.isMaxLength(64, { message: 'Too many placements' })),
  ),
}) {}
