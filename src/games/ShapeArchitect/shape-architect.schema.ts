import { Schema } from 'effect'

const RotationAngle = Schema.Literals([0, 90, 180, 270])

export class ShapeArchitectCompletion extends Schema.Class<ShapeArchitectCompletion>(
  'ShapeArchitectCompletion',
)({
  placements: Schema.Array(
    Schema.Struct({
      pieceId: Schema.String,
      position: Schema.Struct({
        x: Schema.Number,
        y: Schema.Number,
        z: Schema.Number,
      }),
      rotation: Schema.Struct({
        x: RotationAngle,
        y: RotationAngle,
        z: RotationAngle,
      }),
    }),
  ).pipe(
    Schema.check(
      Schema.isMaxLength(64, { message: 'Too many placements' }),
    ),
  ),
}) {}
