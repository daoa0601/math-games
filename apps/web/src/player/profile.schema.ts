import { Schema } from 'effect'

export const DisplayName = Schema.String.pipe(
  Schema.check(
    Schema.isMinLength(2, {
      message: 'Display name must be at least 2 characters',
    }),
    Schema.isMaxLength(40, {
      message: 'Display name must be at most 40 characters',
    }),
  ),
)

export const Locale = Schema.Literals(['en', 'vi'])
export type Locale = typeof Locale.Type

export const GradeBand = Schema.Literals(['elementary', 'middle', 'high'])
export type GradeBand = typeof GradeBand.Type

export class PlayerProfileInput extends Schema.Class<PlayerProfileInput>(
  'PlayerProfileInput',
)({
  displayName: DisplayName,
  locale: Locale,
  gradeBand: GradeBand,
}) {}

export class AchievementImportInput extends Schema.Class<AchievementImportInput>(
  'AchievementImportInput',
)({
  achievementIds: Schema.Array(Schema.NonEmptyString),
}) {}
