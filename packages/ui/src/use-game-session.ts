import { useEffect, useState } from "react";

export type GameSessionMode = "practice" | "timed";

const TIMED_LIMIT_SECONDS = 60;

interface UseGameSessionOptions {
  completed: boolean;
  resetKey: string;
}

export function useGameSession({ completed, resetKey }: UseGameSessionOptions) {
  const [mode, setMode] = useState<GameSessionMode>("practice");
  const [paused, setPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    setElapsedSeconds(0);
    setPaused(false);
  }, [resetKey]);

  const remainingSeconds = Math.max(0, TIMED_LIMIT_SECONDS - elapsedSeconds);
  const timedOut = mode === "timed" && remainingSeconds === 0;
  const running = !completed && !paused && !timedOut;

  useEffect(() => {
    if (!running) return;

    const timer = window.setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1_000);

    return () => {
      window.clearInterval(timer);
    };
  }, [running]);

  function resetSession() {
    setElapsedSeconds(0);
    setPaused(false);
  }

  function changeMode(nextMode: GameSessionMode) {
    setMode(nextMode);
    setElapsedSeconds(0);
    setPaused(false);
  }

  return {
    elapsedSeconds,
    mode,
    paused,
    remainingSeconds,
    resetSession,
    setMode: changeMode,
    setPaused,
    timedOut,
  };
}
