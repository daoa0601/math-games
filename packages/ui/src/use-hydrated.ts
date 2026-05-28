import { useEffect, useState } from "react";

/**
 * Returns false during SSR and the first client render, then true after mount.
 * Gate browser-only or locale/timezone-dependent output behind this so it
 * can't diverge between server and client and trip a hydration mismatch.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}
