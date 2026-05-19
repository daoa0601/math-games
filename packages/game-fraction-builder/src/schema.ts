import { Schema } from "effect";

export const FractionBuilderCompletionSchema = Schema.Struct({
  numerator: Schema.Number,
  denominator: Schema.Number,
  /** For compare mode: "left" | "right" | "equal" */
  compareAnswer: Schema.optional(Schema.String),
});

export type FractionBuilderCompletion =
  typeof FractionBuilderCompletionSchema.Type;
