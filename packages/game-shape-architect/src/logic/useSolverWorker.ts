import { useCallback, useEffect, useRef, useState } from 'react'

import type { LevelConfig } from './types'
import type { SolverResult } from './solver'
import type { SolverResponse } from './solver.worker'

interface UseSolverWorkerReturn {
  solve: (level: LevelConfig, maxTimeMs?: number) => void
  result: SolverResult | null
  solving: boolean
  ready: boolean
}

export function useSolverWorker(): UseSolverWorkerReturn {
  const workerRef = useRef<Worker | null>(null)
  const [result, setResult] = useState<SolverResult | null>(null)
  const [solving, setSolving] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const worker = new Worker(new URL('./solver.worker.ts', import.meta.url), {
      type: 'module',
    })

    worker.onmessage = (e: MessageEvent<SolverResponse>) => {
      setResult(e.data.result)
      setSolving(false)
    }

    worker.onerror = () => {
      setSolving(false)
    }

    workerRef.current = worker
    setReady(true)

    return () => {
      worker.terminate()
      setReady(false)
    }
  }, [])

  const solve = useCallback((level: LevelConfig, maxTimeMs: number = 5000) => {
    const worker = workerRef.current
    if (!worker) return

    setResult(null)
    setSolving(true)
    worker.postMessage({ type: 'solve', level, maxTimeMs })
  }, [])

  return { solve, result, solving, ready }
}
