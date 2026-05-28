import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface UseLevelSelectionOptions<TConfig extends { id: string }> {
  /** All level configs from the loader. */
  configs: TConfig[];
  /** Default level id from the loader. */
  initialConfigId: string;
  /** Search param level id (from the URL). */
  searchLevel?: string;
  /**
   * Called when a new level is selected (via selectLevel, addAndSelectConfig,
   * or URL search param change). Receives the incoming config so the route
   * can reinitialize game state.
   *
   * Note: useGameSession auto-resets via its resetKey prop, so you do NOT
   * need to call session.resetSession() here.
   */
  onReset?: (config: TConfig) => void;
}

interface UseLevelSelectionReturn<TConfig extends { id: string }> {
  /** The resolved config for the currently selected level. */
  config: TConfig;
  /** Index of the current config in the available list. */
  configIndex: number;
  /** All available configs (may grow when practice levels are added). */
  availableConfigs: TConfig[];
  /** Select a level by config object. Calls onReset. */
  selectLevel: (config: TConfig) => void;
  /** Add a practice config to the front of the list and select it. */
  addAndSelectConfig: (config: TConfig) => void;
}

export function useLevelSelection<TConfig extends { id: string }>({
  configs,
  initialConfigId,
  searchLevel,
  onReset,
}: UseLevelSelectionOptions<TConfig>): UseLevelSelectionReturn<TConfig> {
  const [availableConfigs, setAvailableConfigs] = useState(configs);

  const requestedId = searchLevel
    ? (availableConfigs.find((c) => c.id === searchLevel)?.id ??
      initialConfigId)
    : undefined;

  const [selectedId, setSelectedId] = useState(requestedId ?? initialConfigId);

  const config = useMemo(
    () =>
      availableConfigs.find((c) => c.id === selectedId) ?? availableConfigs[0],
    [availableConfigs, selectedId],
  );

  const configIndex = availableConfigs.indexOf(config);

  // Use a ref for onReset so callbacks don't need it as a dependency —
  // avoids re-creating selectLevel/addAndSelectConfig on every render.
  const onResetRef = useRef(onReset);
  onResetRef.current = onReset;

  // Sync to URL search param changes
  useEffect(() => {
    if (!requestedId) return;
    if (requestedId === selectedId) return;

    const newConfig =
      availableConfigs.find((c) => c.id === requestedId) ?? availableConfigs[0];
    setSelectedId(requestedId);
    onResetRef.current?.(newConfig);
  }, [requestedId, selectedId, availableConfigs]);

  const selectLevel = useCallback((next: TConfig) => {
    setSelectedId(next.id);
    onResetRef.current?.(next);
  }, []);

  const addAndSelectConfig = useCallback((next: TConfig) => {
    setAvailableConfigs((current) => [
      next,
      ...current.filter((c) => c.id !== next.id),
    ]);
    setSelectedId(next.id);
    onResetRef.current?.(next);
  }, []);

  return {
    config,
    configIndex,
    availableConfigs,
    selectLevel,
    addAndSelectConfig,
  };
}
