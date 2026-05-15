export class BoundsIndex {
  private readonly cells = new Map<string, string[]>();
  private readonly cellSize: number;

  constructor(
    entries: ReadonlyMap<string, { x: number; y: number; width: number; height: number }>,
    cellSize = 400,
  ) {
    this.cellSize = cellSize;
    for (const [id, bounds] of entries) {
      this.insert(id, bounds);
    }
  }

  /** Returns ids of all elements whose buckets overlap the query area. */
  query(x: number, y: number, radius: number): Set<string> {
    const result = new Set<string>();
    const minCx = Math.floor((x - radius) / this.cellSize);
    const minCy = Math.floor((y - radius) / this.cellSize);
    const maxCx = Math.floor((x + radius) / this.cellSize);
    const maxCy = Math.floor((y + radius) / this.cellSize);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const cell = this.cells.get(`${cx},${cy}`);
        if (cell) {
          for (const id of cell) result.add(id);
        }
      }
    }
    return result;
  }

  private insert(id: string, b: { x: number; y: number; width: number; height: number }): void {
    const minCx = Math.floor(b.x / this.cellSize);
    const minCy = Math.floor(b.y / this.cellSize);
    const maxCx = Math.floor((b.x + b.width) / this.cellSize);
    const maxCy = Math.floor((b.y + b.height) / this.cellSize);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const key = `${cx},${cy}`;
        let cell = this.cells.get(key);
        if (!cell) {
          cell = [];
          this.cells.set(key, cell);
        }
        cell.push(id);
      }
    }
  }
}
