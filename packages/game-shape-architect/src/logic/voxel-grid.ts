import type { CellState, Position3D } from "./types";

export class VoxelGrid {
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  private data: Uint8Array;

  constructor(width: number, height: number, depth: number) {
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.data = new Uint8Array(width * height * depth);
  }

  private index(x: number, y: number, z: number): number {
    return x * this.height * this.depth + y * this.depth + z;
  }

  get(x: number, y: number, z: number): CellState {
    return this.data[this.index(x, y, z)] as CellState;
  }

  set(x: number, y: number, z: number, value: CellState): void {
    this.data[this.index(x, y, z)] = value;
  }

  clone(): VoxelGrid {
    const copy = new VoxelGrid(this.width, this.height, this.depth);
    copy.data.set(this.data);
    return copy;
  }

  get size(): [number, number, number] {
    return [this.width, this.height, this.depth];
  }

  static create(size: [number, number, number]): VoxelGrid {
    return new VoxelGrid(size[0], size[1], size[2]);
  }

  static fromLevel(
    targetVoxels: Position3D[],
    size: [number, number, number],
  ): VoxelGrid {
    const grid = VoxelGrid.create(size);
    for (const pos of targetVoxels) {
      if (grid.inBounds(pos.x, pos.y, pos.z)) {
        grid.set(pos.x, pos.y, pos.z, 1);
      }
    }
    return grid;
  }

  inBounds(x: number, y: number, z: number): boolean {
    return (
      x >= 0 &&
      x < this.width &&
      y >= 0 &&
      y < this.height &&
      z >= 0 &&
      z < this.depth
    );
  }

  toNestedArray(): CellState[][][] {
    const result: CellState[][][] = [];
    for (let x = 0; x < this.width; x++) {
      const plane: CellState[][] = [];
      for (let y = 0; y < this.height; y++) {
        const row: CellState[] = [];
        for (let z = 0; z < this.depth; z++) {
          row.push(this.get(x, y, z));
        }
        plane.push(row);
      }
      result.push(plane);
    }
    return result;
  }

  static fromNestedArray(arr: CellState[][][]): VoxelGrid {
    const width = arr.length;
    const height = width > 0 ? arr[0].length : 0;
    const depth = height > 0 ? arr[0][0].length : 0;
    const grid = new VoxelGrid(width, height, depth);
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        for (let z = 0; z < depth; z++) {
          grid.set(x, y, z, arr[x][y][z]);
        }
      }
    }
    return grid;
  }
}
