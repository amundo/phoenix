---
title: Scenery reference
author: Patrick Hall
---

# What `Scenery` is

`Scenery` is the class for **static foreground world objects**.

These are things like:

* trees
* rocks
* cliffs
* walls
* bridges

They are part of the world, but they are **not** terrain and they are **not** pickup items.

So the main idea is:

* **terrain** = the ground under your feet
* **scenery** = visible world objects placed on top of the ground

---

# Why this class exists

Originally, some impassable things like trees were modeled as terrain.

That worked for movement rules, but visually it meant a tree was just a colored tile in the background.

`Scenery` fixes that split:

* the ground can stay something like `forest-floor`
* the tree can render above it as a foreground object

That gives combinations like:

* `forest-floor` + `tree`
* `grass` + `rock`
* `water` + `bridge`

---

# The class itself

```js
import { Entity } from './Entity.js'

class Scenery extends Entity {}
```

This is intentionally small.

`Scenery` inherits from `Entity`, so it automatically gets the normal entity fields and behavior such as:

* `id`
* `x`
* `y`
* `moveTo(...)`

Right now, `Scenery` does not add extra methods of its own. Its main job is to give the engine and renderer a distinct type they can recognize.

---

# How scenery gets created

Scenery is usually authored in the world data, not as a moving actor.

For example, an ASCII legend entry can now look like:

```json
"T": {
  "terrain": "forest-floor",
  "scenery": "tree"
}
```

That means:

* paint the ground as `forest-floor`
* place a `tree` scenery object on top

The `RealmMap` class collects those scenery definitions, and then `GameEngine` turns them into `Scenery` instances.

---

# How scenery is resolved

When the engine creates scenery, it tries to resolve the scenery `kind` against:

1. the terrain catalog
2. the item catalog

That lets scenery reuse shared definitions like:

* `name`
* `emoji`
* `solid`
* `description`

So a `tree` scenery object can inherit its emoji and blocking behavior from `terrain.json`.

---

# How scenery is rendered

Scenery is rendered in the `avatar-layer`, not the `terrain-layer`.

That matters because it means scenery:

* appears above the ground
* can visually overlap the tile beneath it
* uses the same general rendering path as other visible entities

There is a dedicated `SceneryAvatar` class for this.

---

# How scenery affects movement

Scenery can block movement.

If a scenery object is `solid`, the player cannot walk through it.

So terrain and scenery now have different jobs:

* terrain decides the base surface
* scenery can add visible blockers on top of that surface

---

# When to use scenery

Use `Scenery` when something is:

* part of the world
* visually above the ground
* usually static
* not meant to be picked up

Good examples:

* tree
* wall
* cliff
* rock
* bridge

Do **not** use scenery for:

* the player
* enemies
* portable objects like keys

---

# In one sentence

`Scenery` is the layer of static world objects that sits **on top of terrain** and helps the map feel like a place instead of just a colored grid.
