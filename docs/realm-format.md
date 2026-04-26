# Realm Format

This document describes the canonical `realm.json` shape used by the current runtime.

A realm defines one playable map along with the entities, camera, and authored terrain data needed to render it.

At a high level, a realm describes:

- the realm identity
- the world dimensions
- the initial camera viewport
- the terrain and scenery
- the player, bots, items, and optional scenery data inside the realm

## Top-level shape

Example:

```json
{
  "id": "tiny-realm",
  "owner": "Student Name",
  "name": "Tiny Realm",
  "description": "A small fishing spot.",
  "rowCount": 8,
  "columnCount": 10,
  "camera": {},
  "entities": {},
  "realmMap": {}
}
```

## Top-level fields

### `id`

String.

A stable identifier for the realm.

Example:

```json
"id": "joe-and-porters-world"
```

### `name`

String.

The human-facing display name of the realm.

### `owner`

Optional string.

The person responsible for the realm.

For classroom use, this should usually be the student owner name.

### `description`

Optional string.

This is currently used by the app welcome/info banner.

### `rowCount`
### `columnCount`

Numbers.

These define the overall size of the playable world grid.

The runtime currently reads these top-level values when constructing `RealmMap`.

### `camera`

Optional object.

Defines the starting camera viewport.

### `entities`

Required in practice.

Contains the authored entity data for the realm.

### `realmMap`

Optional object, but effectively required for authored map data.

Contains terrain, legend, and map-specific information.

## `camera`

Example:

```json
"camera": {
  "x": 0,
  "y": 0,
  "rowCount": 8,
  "columnCount": 10
}
```

Fields:

- `x`
- `y`
- `rowCount`
- `columnCount`

`x` and `y` are the top-left origin of the viewport.

`rowCount` and `columnCount` describe the visible viewport size in tiles.

If camera values are omitted, the editor/runtime provides fallbacks.

## `entities`

The runtime currently expects this general shape:

```json
"entities": {
  "player": {},
  "bots": [],
  "items": [],
  "scenery": []
}
```

`scenery` is optional and may also be supplied through map cells or legend-driven placement.

### `entities.player`

The player object defines the player’s starting data.

Example:

```json
"player": {
  "kind": "player",
  "name": "Phoenix",
  "emoji": "🧒",
  "x": 1,
  "y": 1,
  "inventory": []
}
```

Common fields:

- `kind`
- `name`
- `emoji`
- `x`
- `y`
- `inventory`

### `entities.bots`

An array of bot definitions.

Example:

```json
"bots": [
  {
    "id": "bot-1",
    "kind": "villager",
    "name": "Guide",
    "emoji": "🧙",
    "x": 4,
    "y": 2,
    "speech": "Welcome!"
  }
]
```

Bots may also inherit defaults from the actors catalog when `kind` matches a catalog entry.

### `entities.items`

An array of item definitions.

Example:

```json
"items": [
  {
    "id": "item-1",
    "kind": "coin",
    "x": 5,
    "y": 4,
    "portable": true,
    "solid": false,
    "emoji": "🪙"
  }
]
```

Items may also inherit defaults from the items catalog when `kind` matches a catalog entry.

Useful authored fields include:

- `id`
- `kind`
- `name`
- `emoji`
- `x`
- `y`
- `portable`
- `solid`
- `category`
- `description`
- `on`
- `requires`

### `entities.scenery`

Optional array of scenery definitions.

Example:

```json
"scenery": [
  {
    "id": "tree-1",
    "kind": "tree",
    "x": 3,
    "y": 5,
    "solid": true
  }
]
```

Scenery may also come from:

- `realmMap.cells[].scenery`
- `realmMap.legend` entries used by `asciiMap`

## `realmMap`

The `realmMap` object describes authored terrain and map decorations.

Example:

```json
"realmMap": {
  "rowCount": 8,
  "columnCount": 10,
  "defaultTerrain": "grass",
  "asciiMap": [
    "WWGGGGGGGG",
    "WGGGGFGGGG",
    "GGGGGTTGGG"
  ],
  "legend": {
    "W": "water",
    "G": "grass",
    "T": {
      "terrain": "forest-floor",
      "scenery": "tree"
    }
  }
}
```

Supported `realmMap` fields include:

- `rowCount`
- `columnCount`
- `defaultTerrain`
- `asciiMap`
- `legend`
- `terrainRows`
- `cells`

### `defaultTerrain`

Optional string.

The terrain used to fill the grid before specific overrides are applied.

If omitted, the runtime normalizes to `grass`.

The runtime also normalizes `grassland` to `grass`.

### `asciiMap`

Optional array of strings.

Each string is one row of the map.

Each character is interpreted through `legend`.

### `legend`

Optional object mapping single-character symbols to meaning.

A legend entry may be:

- a terrain id string
- a marker name string
- an object with `terrain`, `scenery`, and/or `marker`

Examples:

```json
"W": "water"
```

```json
"@": "spawn-marker"
```

```json
"T": {
  "terrain": "forest-floor",
  "scenery": "tree"
}
```

### `terrainRows`

Optional row-based terrain definition.

Each row may be:

- an array of terrain ids
- a whitespace-separated string of terrain ids

### `cells`

Optional sparse per-cell overrides.

Each cell object may contain:

- `x`
- `y`
- `terrain`
- `scenery`

Example:

```json
{
  "x": 5,
  "y": 2,
  "terrain": "forest-floor",
  "scenery": "tree"
}
```

## Runtime interpretation notes

The runtime builds `RealmMap` from:

- top-level `rowCount`
- top-level `columnCount`
- `realmMap.defaultTerrain`
- `realmMap.asciiMap`
- `realmMap.legend`
- `realmMap.terrainRows`
- `realmMap.cells`

If both top-level and nested map dimensions exist, the current runtime prefers the top-level `rowCount` and `columnCount` when constructing the grid.

## Editor notes

The realm editor currently works by mutating a structured clone of the realm and writing terrain paint operations into `realm.realmMap.cells`.

Important current behavior:

- explicit terrain paint creates or updates sparse `cells` entries
- painting a cell back to the realm default terrain does not currently remove the sparse override
- save/export uses the draft realm object directly

## Suggested invariants

These rules are worth preserving as the format evolves:

- realm ids should be stable
- `owner` should be present for student-authored realms
- terrain ids should exist in the terrain catalog
- `entities.player` should always exist
- `entities.bots` and `entities.items` should be arrays, even when empty
- authored coordinates should be integers inside map bounds
- `defaultTerrain` should use normalized terrain ids
