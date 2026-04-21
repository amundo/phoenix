---
title: "How to Build a Realm Editor for Your Game"
date: 2024-04-21
---

The easiest decent path is to build the realm editor as another `main.stage` mode inside the app, not as a totally separate editor. You already have the right architecture for it now: `GameUI` owns the shell, `GameBoard` renders a realm, and `AdminDialog` can inspect data. The editor can reuse most of that.

I’d implement it in layers.

**Recommended Approach**
Create an `EditorMode`/`RealmEditor` component that mounts into the same `main.stage` area where `game-board` lives. It should edit a plain mutable realm draft object, then render that draft through the existing board/engine pipeline.

Basic shape:

```html
<main class="game-stage">
  <realm-editor>
    <game-board></game-board>
  </realm-editor>
</main>
```

Or, if you want to keep `GameBoard` generic:

```js
ui.mountStageContent(editor)
editor.mountBoard(gameBoard)
```

The important idea is: editor mode owns tools and draft data; `GameBoard` remains the visual board.

**Data Model**
Use a draft realm object as the source of truth while editing:

```js
this.draftRealm = structuredClone(currentRealm)
```

Then editor actions mutate the draft:

```js
setTerrain(x, y, terrainId)
placeItem(x, y, itemData)
moveEntity(id, x, y)
updateEntity(id, patch)
```

Do not mutate the live engine state directly. Instead, after each edit, rebuild or refresh from the draft. At first, rebuilding is simplest and probably fine for your map sizes.

**Terrain Painting**
Start with click-to-paint and drag-to-paint.

You need `GameCell` clicks to report world coordinates. Your `TerrainLayer` already gives each cell:

```js
worldX,
worldY,
terrain
```

So the simplest addition is dispatching a custom event from `GameCell`:

```js
this.dispatchEvent(new CustomEvent('cellclick', {
  bubbles: true,
  detail: {
    x: this.#cell.worldX,
    y: this.#cell.worldY,
    cell: this.#cell,
  }
}))
```

Then `RealmEditor` listens for `cellclick` or pointer events and applies the selected tool.

**Object Placement**
Treat bots/items/scenery as selectable palettes.

A minimal editor toolbar could have:

- tool: `paint-terrain`
- tool: `place-item`
- tool: `place-bot`
- tool: `place-scenery`
- tool: `select`
- selected terrain/catalog object

On cell click:

```js
if (tool === 'paint-terrain') {
  draft.realmMap.cells.push({ x, y, terrain: selectedTerrain })
}

if (tool === 'place-item') {
  draft.entities.items.push({
    ...selectedItemDefaults,
    x,
    y,
  })
}
```

Later you can normalize duplicate terrain cells, but don’t overbuild that first.

**Object Editing**
Start with selection. Clicking an avatar selects the underlying entity and shows a side panel.

The panel can edit common fields:

- `name`
- `emoji`
- `x`
- `y`
- `solid`
- `portable`
- `kind`
- `catalogId`
- `on.pickup.message`
- `on.bump.message`

This can just be a form bound to the selected object:

```js
selectedEntity.name = input.value
editor.renderDraft()
```

At first, object editing can live in the right sidebar. That is exactly what your new shell layout is good for.

**Save/Export**
The simplest save system is “export JSON” first.

Add buttons:

- `Copy realm JSON`
- `Download realm.json`
- maybe `Reset draft`

Browser apps generally cannot write back to your repo files without a backend or local file picker permissions, so export/copy is the easiest low-friction route.

Later, if you want real file saving, add a tiny local dev server endpoint or use the File System Access API in supported browsers.

**Suggested Build Order**
1. Add editor mode toggle from hamburger menu.
2. Add `RealmEditor` component with a toolbar and a draft realm.
3. Make `GameCell` emit world-coordinate click/pointer events.
4. Implement terrain painting.
5. Add object selection by clicking avatars.
6. Add object placement from catalogs.
7. Add right-sidebar property editor.
8. Add export/copy JSON.

**Key Design Choice**
Keep three concepts separate:

- `realm.json`: authored source data
- `RealmMap`: runtime map model built from realm data
- `RealmEditor`: draft mutation tools for authoring realm data

That separation will keep the editor from turning into a tangled mix of runtime state and file format concerns.

If you want the fastest useful first version, I’d start with terrain painting plus JSON export. That gives you immediate value and proves the editor architecture before adding object editing.