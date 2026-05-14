import { Schema } from 'effect'

export class MagicGraphCompletion extends Schema.Class<MagicGraphCompletion>(
  'MagicGraphCompletion',
)({
  nodeValues: Schema.Record(
    Schema.String,
    Schema.Union([
      Schema.Number.pipe(Schema.check(Schema.isInt())),
      Schema.Null,
    ]),
  ),
}) {}
