import { Schema } from 'effect'

export const PatternDetectiveCompletionSchema = Schema.Struct({
  selectedAnswer: Schema.Union([Schema.Number, Schema.String]),
})

export type PatternDetectiveCompletion =
  typeof PatternDetectiveCompletionSchema.Type
