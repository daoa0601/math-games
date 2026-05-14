import { Schema } from 'effect'

export class GameProgressRequest extends Schema.Class<GameProgressRequest>(
  'GameProgressRequest',
)({
  levelId: Schema.NonEmptyString,
  completion: Schema.Unknown.check(
    Schema.makeFilter<unknown>((v) =>
      v !== null && v !== undefined ? undefined : 'Missing completion payload',
    ),
  ),
}) {}
