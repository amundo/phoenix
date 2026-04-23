import {
  ensureTerrainCells,
  getRealmMapData,
  getTerrainOverride,
  setTerrainOverride,
} from './terrainEditing.js'

function assertEquals(actual, expected) {
  const actualJson = JSON.stringify(actual)
  const expectedJson = JSON.stringify(expected)
  if (actualJson !== expectedJson) {
    throw new Error(`Expected ${expectedJson}, got ${actualJson}`)
  }
}

Deno.test('ensureTerrainCells creates a realmMap cells collection when missing', () => {
  const realm = {
    rowCount: 6,
    columnCount: 8,
  }

  const realmMap = getRealmMapData(realm)
  const cells = ensureTerrainCells(realm)

  assertEquals(realmMap, {
    rowCount: 6,
    columnCount: 8,
    defaultTerrain: 'grass',
    cells: [],
  })
  assertEquals(cells, [])
})

Deno.test('setTerrainOverride updates an existing explicit terrain cell', () => {
  const realm = {
    realmMap: {
      cells: [{ x: 2, y: 3, terrain: 'grass', scenery: 'tree' }],
    },
  }

  const changed = setTerrainOverride(realm, { x: 2, y: 3, terrain: 'water' })

  assertEquals(changed, true)
  assertEquals(realm.realmMap.cells, [{ x: 2, y: 3, terrain: 'water', scenery: 'tree' }])
})

Deno.test('setTerrainOverride appends a new explicit terrain cell when none exists', () => {
  const realm = {
    realmMap: {
      cells: [],
    },
  }

  const changed = setTerrainOverride(realm, { x: 4, y: 1, terrain: 'sand' })

  assertEquals(changed, true)
  assertEquals(getTerrainOverride(realm, 4, 1), { x: 4, y: 1, terrain: 'sand' })
})
