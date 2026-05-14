import { Schema } from 'effect'

export const PlayerId = Schema.String.pipe(Schema.brand('PlayerId'))
export type PlayerId = typeof PlayerId.Type

export const GameId = Schema.Literals([
  'magic-graph',
  'sequence-race',
  'shape-architect',
]).pipe(Schema.brand('GameId'))
export type GameId = typeof GameId.Type

export const LevelId = Schema.NonEmptyString.pipe(Schema.brand('LevelId'))
export type LevelId = typeof LevelId.Type
