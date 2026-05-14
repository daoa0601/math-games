import type { LevelConfig } from './types'
import { solvePuzzle } from './solver'
import { solvePuzzleDLX } from './dlx-solver'
import type { SolverResult } from './solver'

export interface SolverRequest {
  type: 'solve'
  level: LevelConfig
  maxTimeMs: number
  algorithm?: 'backtrack' | 'dlx'
}

export interface SolverResponse {
  type: 'result'
  result: SolverResult
}

export interface SolverCancel {
  type: 'cancel'
}

export type WorkerMessage = SolverRequest | SolverCancel

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data

  if (msg.type === 'solve') {
    const solver = msg.algorithm === 'dlx' ? solvePuzzleDLX : solvePuzzle
    const result = solver(msg.level, msg.maxTimeMs)
    const response: SolverResponse = { type: 'result', result }
    self.postMessage(response)
  }
}
