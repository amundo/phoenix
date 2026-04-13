
import { Cell } from "./Cell.js"

class World {
  constructor({ rowCount, columnCount }) {
    this.rowCount = rowCount
    this.columnCount = columnCount
    this.worldGrid = Array.from({ length: rowCount }, (_, y) =>
      Array.from({ length: columnCount }, (_, x) =>
        new Cell({ x, y, terrain: 'grassland' })
      )
    )
  }

  at(x, y) {
    return this.worldGrid[y]?.[x] ?? null
  }

  contains(x, y) {
    return (
      y >= 0 &&
      y < this.rowCount &&
      x >= 0 &&
      x < this.columnCount
    )
  }
}

export {
    World
}