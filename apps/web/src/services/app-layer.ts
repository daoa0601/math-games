import { Layer } from 'effect'

import { InfraLayer } from '@math-games/effect-infra'
import { GameLayer } from '@math-games/effect-game'
import { ClassroomLayer } from '@math-games/effect-classroom'

const ResolvedGameLayer = GameLayer.pipe(Layer.provide(InfraLayer))

const ResolvedClassroomLayer = ClassroomLayer.pipe(
  Layer.provide(Layer.mergeAll(InfraLayer, ResolvedGameLayer)),
)

export const AppLayer = Layer.mergeAll(
  InfraLayer,
  ResolvedGameLayer,
  ResolvedClassroomLayer,
)
