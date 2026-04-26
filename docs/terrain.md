# Terrain

Terrain is defined by the terrain catalog and then instantiated into a realm map through one or more map representations.

## Terrain catalog

The canonical catalog currently lives at `data/catalogs/terrain.json`.

Each terrain entry uses this general shape:

```json
{
  "id": "grass",
  "name": "Grass",
  "category": "field",
  "description": "Open grassy ground for general exploration.",
  "walkable": true,
  "oklchHue": 132
}
```

Common fields:

- `id`: stable terrain identifier used in realm data
- `name`: display label
- `category`: grouping for editor sorting and rendering heuristics
- `description`: editor and UI copy
- `walkable`: movement rule, defaults to walkable unless explicitly `false`
- `oklchHue`: base hue used by `game-cell` terrain rendering
- `emoji`: optional symbolic hint for some terrain types

## Runtime behavior

`RealmMap` is responsible for terrain normalization and lookup.

Current normalization rules:

- missing terrain -> `grass`
- `grassland` -> `grass`

Walkability is resolved through the terrain catalog:

- if a terrain entry exists, `walkable !== false` means it can be walked on
- if no catalog entry exists, the engine currently treats the terrain as walkable

## Realm map terrain sources

Realms can currently supply terrain in several forms:

### 1. `defaultTerrain`

Base terrain used to fill the grid before overrides are applied.

```json
{
  "realmMap": {
    "rowCount": 6,
    "columnCount": 8,
    "defaultTerrain": "grass"
  }
}
```

### 2. `terrainRows`

Row-based terrain assignment.

Supported forms:

- nested arrays
- whitespace-separated row strings

### 3. `cells`

Sparse per-cell overrides inside `realmMap.cells`.

```json
{
  "realmMap": {
    "cells": [
      { "x": 4, "y": 1, "terrain": "sand" }
    ]
  }
}
```

`cells` may also carry `scenery`, and `RealmMap.applyTerrainCells(...)` will place that scenery at the same coordinates.

### 4. `asciiMap` with `legend`

ASCII maps can resolve terrain, scenery, and markers through legend entries.

Legend entries can be:

- a terrain string
- a marker string
- an object containing `terrain`, `scenery`, and/or `marker`

## Editor terrain model

The realm editor currently paints terrain by writing sparse overrides into `realm.realmMap.cells`.

Helpers live in `editor/terrainEditing.js`.

Key behavior:

- `getRealmMapData(realm)` ensures `realm.realmMap` exists
- `ensureTerrainCells(realm)` ensures `realm.realmMap.cells` exists
- `setTerrainOverride(realm, { x, y, terrain })`
  - updates an existing cell override if one exists at the same `x`,`y`
  - otherwise appends a new sparse override record

Important detail:

- the editor does not currently remove an override when the painted terrain matches the realm default terrain
- as a result, `realmMap.cells.length` reflects explicit overrides, not necessarily only visual differences from `defaultTerrain`

## Rendering assumptions

Terrain visuals are handled by `game-cell`.

Current rendering inputs:

- `terrain`
- `terrainDefinition.category`
- `terrainDefinition.walkable`
- `terrainDefinition.oklchHue`

`game-cell` derives a palette and small per-cell variation from those values. Terrain rendering is DOM/CSS-based rather than sprite-sheet based.

## Suggested invariants

These are not all enforced everywhere yet, but they are good rules to preserve:

- terrain ids in realm data should exist in the terrain catalog
- `defaultTerrain` should be normalized to catalog ids
- blocked terrain should explicitly set `walkable: false`
- editor components should traffic in terrain ids, not display labels
