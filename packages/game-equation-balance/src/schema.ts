import { Schema } from "effect";

export const EquationBalanceCompletionSchema = Schema.Struct({
  answer: Schema.Number,
});

export type EquationBalanceCompletion =
  typeof EquationBalanceCompletionSchema.Type;
