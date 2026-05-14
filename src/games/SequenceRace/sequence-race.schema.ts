import { Schema } from 'effect'

export class SequenceRaceCompletion extends Schema.Class<SequenceRaceCompletion>(
  'SequenceRaceCompletion',
)({
  history: Schema.Array(
    Schema.Struct({
      actor: Schema.Literals(['player', 'ai']),
      step: Schema.Number,
    }),
  ),
}) {}
