export { shapeArchitectModule } from "./module";
export * from "./logic";
export * from "./catalog";
export * from "./solution-forge";
export { ShapeArchitectCompletion } from "./schema";
export { useSolverWorker } from "./logic/useSolverWorker";
// three-scene is intentionally NOT re-exported here: the barrel is statically
// imported app-wide (registry, i18n), so re-exporting it would pull three.js
// into the shared client chunk. Consumers dynamic-import the subpath instead.
export * from "./rendering/isometric";
export * from "./logic/engine";
export * from "./logic/types";
export { VoxelGrid } from "./logic/voxel-grid";
