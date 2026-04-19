---
title: realm.json format
author: Patrick Hall
---

# Purpose

A `realm.json` file defines one playable realm.

At a high level, a realm describes:

* the realm’s identity
* the size of the world
* the camera viewport
* the terrain and scenery
* the player, bots, and items inside the realm

---

# Top-level shape

```json
{
  "id": "example-realm",
  "name": "Example Realm",
  "rowCount": 8,
  "columnCount": 10,
  "realmMap": {},
  "camera": {},
  "entities": {}
}
```

## Top-level fields

### `id`

String. A stable identifier for the realm.

Example:

```json
"id": "joe-and-porters-world"
```

### `name`

String. The display name of the realm.

### `rowCount`
### `columnCount`

Numbers. The overall size of the playable world grid.

These are the main world dimensions used by the engine.

---

# `realmMap`

The `realmMap` object describes the map itself.

Example:

```json
"realmMap": {
  "rowCount": 8,
  "columnCount": 10,
  "asciiMap": [
    "WWGGGGGGGG",
    "WGGGGFGGGG",
    "GGGGGTTGGG"
  ],
  "legend": {
    "W": "water",
    "G": "grass",
    "F": "forest-floor",
    "T": {
      "terrain": "forest-floor",
      "scenery": "tree"
    },
    "@": "player"
  }
}
```

## Supported `realmMap` fields

### `rowCount`
### `columnCount`

Optional numbers inside `realmMap`.

These may appear, but the engine currently prefers the top-level `rowCount` and `columnCount` for the actual realm map size.

### `defaultTerrain`

Optional string.

The terrain used to fill the grid before more specific terrain data is applied.

If omitted, the engine defaults to `grass` / `grassland`.

### `asciiMap`

Optional array of strings.

Each string is one row of the map. Each character is interpreted through `legend`.

### `legend`

Optional object mapping single-character symbols to meanings.

A legend entry may be:

* a terrain name string
* a marker name string
* an object with `terrain`, `scenery`, and/or `marker`

Examples:

```json
"W": "water"
```

```json
"@": "player"
```

```json
"T": {
  "terrain": "forest-floor",
  "scenery": "tree"
}
```

### `terrainRows`

Optional array-based terrain definition.

Each row may be:

* an array of terrain names
* a whitespace-separated string of terrain names

### `cells`

Optional array of per-cell overrides.

Each cell object may contain:

* `x`
* `y`
* `terrain`
* `scenery`

Example:

```json
{
  "x": 5,
  "y": 2,
  "terrain": "forest-floor",
  "scenery": "tree"
}
```

---

# `camera`

The `camera` object defines the visible viewport.

Example:

```json
"camera": {
  "x": 0,
  "y": 0,
  "rowCount": 8,
  "columnCount": 10
}
```

## Camera fields

### `x`
### `y`

Numbers. The starting top-left camera position.

### `rowCount`
### `columnCount`

Numbers. The size of the visible viewport in tiles.

---

# `entities`

The `entities` object contains the living and interactive things in the realm.

Example:

```json
"entities": {
  "player": {},
  "enemies": [],
  "items": []
}
```

## Important terminology note

In the classroom and design language, these are now called **Bots**.

However, the runtime format currently still stores them under:

```json
"entities": {
  "enemies": []
}
```

So in documentation and teaching:

* **Bot** = preferred term

But in the current JSON format:

* Bots are still stored in `entities.enemies`

---

# `entities.player`

The player object defines the player’s starting data.

Example:

```json
"player": {
  "kind": "player",
  "name": "Phoenix",
  "emoji": "🧒",
  "x": 2,
  "y": 1,
  "inventory": []
}
```

## Common player fields

* `kind`
* `name`
* `emoji`
* `x`
* `y`
* `inventory`

If the map legend places a `player` marker such as `@`, that marker can override the player’s starting position.

---

# `entities.enemies` (Bots)

This is an array of Bot objects.

Example:

```json
"enemies": [
  {
    "name": "Guide Bot",
    "emoji": "🤖",
    "x": 6,
    "y": 2
  }
]
```

## Common Bot fields

* `id`
* `kind`
* `name`
* `emoji`
* `x`
* `y`

At the moment, Bots are mostly static blockers / characters. The format is simple and does not yet require a special behavior block.

---

# `entities.items`

This is an array of item definitions.

Items can be:

* portable
* solid
* bump-reactive
* pickup-reactive
* locked / gated by requirements

Example:

```json
{
  "id": "bronze-key-1",
  "kind": "key",
  "name": "Bronze key",
  "emoji": "🗝️",
  "x": 2,
  "y": 5,
  "portable": true,
  "on": {
    "pickup": {
      "message": "I found a shiny bronze key!",
      "emotion": "happy"
    }
  }
}
```

## Common item fields

* `id`
* `catalogId`
* `kind`
* `name`
* `emoji`
* `x`
* `y`
* `portable`
* `solid`
* `requires`
* `on`

## `kind` and catalog lookup

If an item has a `kind`, the engine uses that to resolve shared item data from the item catalog.

Example:

```json
"kind": "key"
```

Per-instance fields in the realm can override the catalog defaults.

## `requires`

Optional requirement object used for gated interactions.

Supported shapes include:

```json
"requires": { "id": "bronze-key-1" }
```

or

```json
"requires": { "kind": "key" }
```

## `on`

Optional interaction object.

Supported subkeys currently include:

* `bump`
* `pickup`
* `blocked`
* `success`

Example:

```json
"on": {
  "blocked": {
    "message": "Locked!",
    "emotion": "confused"
  },
  "success": {
    "message": "The door opens.",
    "emotion": "happy",
    "set": {
      "solid": false
    }
  }
}
```

---

# Optional scenery outside `entities`

Static scenery can come from the `realmMap` object instead of `entities`.

Examples:

* `legend` entries with `scenery`
* `realmMap.cells` entries with `scenery`

The engine converts that scenery into foreground entities internally.

At the moment, you may also see optional realm-level scenery arrays in code paths, but the most established authored forms are the `realmMap`-based ones.

---

# Minimal valid example

```json
{
  "id": "tiny-realm",
  "name": "Tiny Realm",
  "rowCount": 8,
  "columnCount": 10,
  "camera": {
    "x": 0,
    "y": 0,
    "rowCount": 8,
    "columnCount": 10
  },
  "entities": {
    "player": {
      "kind": "player",
      "name": "Phoenix",
      "emoji": "🧒",
      "x": 1,
      "y": 1,
      "inventory": []
    },
    "enemies": [],
    "items": []
  }
}
```

---

# Summary

As the format exists now:

* top-level `rowCount` / `columnCount` define the world size
* `realmMap` defines terrain, markers, and scenery
* `camera` defines the viewport
* `entities.player` defines the player
* `entities.enemies` currently stores Bots
* `entities.items` stores interactive objects
* item `kind` values can resolve shared data from catalogs
