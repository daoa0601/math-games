// ========================================
// VoxelBitboard — Packed bit representation for solver
// 1 bit per cell, packed into Uint32Array words.
// Enables O(1) placement checks via bitwise AND/OR.
// ========================================

export class VoxelBitboard {
  readonly width: number
  readonly height: number
  readonly depth: number
  readonly totalCells: number
  private data: Uint32Array

  constructor(width: number, height: number, depth: number) {
    this.width = width
    this.height = height
    this.depth = depth
    this.totalCells = width * height * depth
    this.data = new Uint32Array(Math.ceil(this.totalCells / 32))
  }

  private index(x: number, y: number, z: number): number {
    return x * this.height * this.depth + y * this.depth + z
  }

  get(x: number, y: number, z: number): boolean {
    const idx = this.index(x, y, z)
    const word = idx >>> 5 // divide by 32
    const bit = idx & 31 // mod 32
    return (this.data[word] & (1 << bit)) !== 0
  }

  set(x: number, y: number, z: number): void {
    const idx = this.index(x, y, z)
    const word = idx >>> 5
    const bit = idx & 31
    this.data[word] |= 1 << bit
  }

  clear(x: number, y: number, z: number): void {
    const idx = this.index(x, y, z)
    const word = idx >>> 5
    const bit = idx & 31
    this.data[word] &= ~(1 << bit)
  }

  /**
   * Check if a piece mask can be placed (no overlap).
   * Returns true if (this AND mask) === 0 (no bits in common).
   */
  canPlace(mask: VoxelBitboard): boolean {
    for (let i = 0; i < this.data.length; i++) {
      if ((this.data[i] & mask.data[i]) !== 0) return false
    }
    return true
  }

  /**
   * Place a piece by ORing in its mask.
   */
  place(mask: VoxelBitboard): void {
    for (let i = 0; i < this.data.length; i++) {
      this.data[i] |= mask.data[i]
    }
  }

  /**
   * Remove a piece by ANDing with the complement of its mask.
   */
  remove(mask: VoxelBitboard): void {
    for (let i = 0; i < this.data.length; i++) {
      this.data[i] &= ~mask.data[i]
    }
  }

  /**
   * Check if this bitboard equals target (all required cells are filled).
   */
  isSolved(target: VoxelBitboard): boolean {
    for (let i = 0; i < this.data.length; i++) {
      // Every bit set in target must be set in this
      if ((this.data[i] & target.data[i]) !== target.data[i]) return false
    }
    return true
  }

  clone(): VoxelBitboard {
    const copy = new VoxelBitboard(this.width, this.height, this.depth)
    copy.data.set(this.data)
    return copy
  }

  /** Count of set bits. */
  popcount(): number {
    let count = 0
    for (let v of this.data) {
      // Brian Kernighan's algorithm
      while (v !== 0) {
        v &= v - 1
        count++
      }
    }
    return count
  }

  static create(width: number, height: number, depth: number): VoxelBitboard {
    return new VoxelBitboard(width, height, depth)
  }

  /**
   * Create a bitboard mask from a list of positions.
   * Used to pre-compute piece masks for each (piece, rotation, position).
   */
  static fromPositions(
    positions: { x: number; y: number; z: number }[],
    width: number,
    height: number,
    depth: number,
  ): VoxelBitboard {
    const bb = new VoxelBitboard(width, height, depth)
    for (const p of positions) {
      if (
        p.x >= 0 &&
        p.x < width &&
        p.y >= 0 &&
        p.y < height &&
        p.z >= 0 &&
        p.z < depth
      ) {
        bb.set(p.x, p.y, p.z)
      }
    }
    return bb
  }
}
