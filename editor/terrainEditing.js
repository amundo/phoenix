function getRealmMapData(realm) {
  realm.realmMap ??= {
    rowCount: realm.rowCount ?? 0,
    columnCount: realm.columnCount ?? 0,
    defaultTerrain: realm.defaultTerrain ?? 'grass',
  }

  return realm.realmMap
}

function ensureTerrainCells(realm) {
  const realmMap = getRealmMapData(realm)
  realmMap.cells ??= []
  return realmMap.cells
}

function findTerrainCell(cells, x, y) {
  return cells.find(cell => cell.x === x && cell.y === y) ?? null
}

function setTerrainOverride(realm, { x, y, terrain }) {
  if (!realm || !terrain) return false

  const cells = ensureTerrainCells(realm)
  const existing = findTerrainCell(cells, x, y)

  if (existing) {
    if (existing.terrain === terrain) return false
    existing.terrain = terrain
    return true
  }

  cells.push({ x, y, terrain })
  return true
}

function getTerrainOverride(realm, x, y) {
  const cells = realm?.realmMap?.cells
  if (!Array.isArray(cells)) return null
  return findTerrainCell(cells, x, y)
}

export {
  ensureTerrainCells,
  getRealmMapData,
  getTerrainOverride,
  setTerrainOverride,
}
