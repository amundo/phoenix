import { Cell } from "./Cell.js"

class World {
  #terrainCatalog = null

  constructor(realm = {}, terrainCatalog = null) {
    const worldData = realm.world ?? realm

    this.rowCount = realm.rowCount ?? worldData.rowCount ?? 0
    this.columnCount = realm.columnCount ?? worldData.columnCount ?? 0
    this.#terrainCatalog = terrainCatalog

    const defaultTerrain = this.normalizeTerrainId(
      worldData.defaultTerrain ?? realm.defaultTerrain ?? 'grassland'
    )

    this.worldGrid = Array.from({ length: this.rowCount }, (_, y) =>
      Array.from({ length: this.columnCount }, (_, x) =>
        new Cell({ x, y, terrain: defaultTerrain })
      )
    )

    this.applyTerrainRows(worldData.terrainRows ?? realm.terrainRows)
    this.applyTerrainCells(worldData.cells ?? realm.cells)
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

  setTerrainAt(x, y, terrain) {
    if (!this.contains(x, y)) return

    const cell = this.at(x, y)
    if (!cell) return

    cell.terrain = this.normalizeTerrainId(terrain)
  }

  isWalkable(x, y) {
    const cell = this.at(x, y)
    if (!cell) return false

    const terrainDefinition = this.#terrainCatalog?.get?.(cell.terrain)
    if (!terrainDefinition) return true

    return terrainDefinition.walkable !== false
  }

  normalizeTerrainId(terrain) {
    if (!terrain) return 'grass'
    if (terrain === 'grassland') return 'grass'
    return terrain
  }

  applyTerrainRows(rows) {
    if (!Array.isArray(rows)) return

    rows.forEach((row, y) => {
      const cells = Array.isArray(row)
        ? row
        : typeof row === 'string'
          ? row.trim().split(/\s+/)
          : []

      cells.forEach((terrain, x) => {
        if (terrain) {
          this.setTerrainAt(x, y, terrain)
        }
      })
    })
  }

  applyTerrainCells(cells) {
    if (!Array.isArray(cells)) return

    for (const cell of cells) {
      this.setTerrainAt(cell.x, cell.y, cell.terrain)
    }
  }
}

export {
    World
}
