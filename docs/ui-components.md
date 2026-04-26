# UI Components Guide

This document describes how UI components should be used in this project, with a focus on the realm editor refactor direction captured in `work/realm-editor-refactor/component-map.md`.

The core idea is:

- use custom elements for substantial interactive units
- keep layout shells and simple wrappers as plain DOM
- let orchestration code mount a set of defined components into the existing app shell

## Current app shell

The main shell already has the right structure for composition.

`GameUI` owns the page frame and provides slots for:

- left sidebar
- stage
- right sidebar
- footer

That means both play mode and editor mode can reuse the same outer layout.

## Component criteria

Use a custom element when a UI surface has one or more of these:

- its own state
- its own event handling
- a reusable interaction pattern
- a meaningful public API through properties, methods, or events
- a lifecycle that benefits from encapsulation

Keep it as plain DOM when it is mostly:

- a styled wrapper
- layout glue
- a one-off section with no independent behavior

## Realm editor component map

The component map below is adapted from the existing refactor note in `work/realm-editor-refactor/component-map.md`.

### Top level

Keep [ui/RealmEditController.js](/Users/pathall/Sites/Games/phoenix/ui/RealmEditController.js) as the coordinator.

Its responsibilities should be:

- own the draft realm state
- own selection state
- own current tool state
- translate board interactions into state updates
- mount and update the major editor components
- listen for component events and mutate the draft

It should not be responsible for hand-building most inspector and toolbar DOM long term.

### Component map

Center:

- `GameBoard`
- stays as the main interactive board surface

Left sidebar:

- `<editor-tools-panel>`
- owns tool buttons, terrain picker, and terrain summary
- emits `toolchange`
- emits `terrainchange`

Right sidebar:

- `<realm-inspector>`
- shown when nothing specific is selected, or when editing realm-level data
- emits `realmchange`

- `<entity-list>`
- optional compact index of player, bots, items, and scenery
- emits `entityselect`

- `<edit-player>`
- detailed editor for player fields
- emits `entitychange`

- `<edit-bot>`
- emits `entitychange`

- `<edit-item>`
- emits `entitychange`

- `<edit-scenery>`
- emits `entitychange`

Footer:

- `<editor-footer>`
- owns pan buttons, save, cancel, and status text
- emits `pan`
- emits `centerplayer`
- emits `save`
- emits `cancel`

Dialog:

- `<save-realm-dialog>`
- owns preview, download, and confirm-save UI
- emits `confirmsave`

## Selection routing

Selection should determine which inspector component is mounted.

Suggested routing:

- no selection:
  - mount `<realm-inspector>`
  - optionally mount `<entity-list>`

- selected player:
  - mount `<edit-player>`

- selected bot:
  - mount `<edit-bot>`

- selected item:
  - mount `<edit-item>`

- selected scenery:
  - mount `<edit-scenery>`

This routing logic belongs in `RealmEditController`.

## Compact versus detailed views

The editor should support both compact and detailed representations of the same data.

Recommended split:

- compact:
  - `<entity-list>`
  - possibly `<entity-list-item>`

- detailed:
  - `<edit-player>`
  - `<edit-bot>`
  - `<edit-item>`
  - `<edit-scenery>`

This is cleaner than a single giant component with too many variants once the editing behavior diverges.

## API conventions

Use the same interface pattern across editor components where possible.

### Incoming data

Prefer properties or `setData(...)` for rich internal app data.

Examples:

- `.entity`
- `.realm`
- `.catalogs`
- `.tool`
- `.selectedTerrain`

Example method:

```js
setData({ entity, catalogs })
```

### Outgoing events

Prefer narrow custom events that express user intent or edits.

Recommended event names:

- `toolchange`
- `terrainchange`
- `entityselect`
- `entitychange`
- `realmchange`
- `pan`
- `centerplayer`
- `save`
- `cancel`
- `confirmsave`

Recommended payload shapes:

```js
{ entityId, changes }
{ tool: 'paint-terrain' }
{ terrain: 'grass' }
{ dx: 0, dy: -1 }
```

Avoid passing the full editor state through every event.

## First component APIs

The first three extracted editor components should follow these contracts.

### `<editor-tools-panel>`

Purpose:

- tool selection
- terrain selection
- terrain summary display

Properties:

- `.tool`
- `.selectedTerrain`
- `.terrainOptions`
- `.terrainSummary`

Events:

- `toolchange`
  - detail: `{ tool }`
- `terrainchange`
  - detail: `{ terrain }`

Method:

```js
setData({ tool, selectedTerrain, terrainOptions, terrainSummary })
```

Notes:

- keep it stateless except for its own local UI state
- normalize `terrainOptions` to simple view data

Example:

```js
[{ value: 'grass', label: 'Grass' }]
```

### `<editor-footer>`

Purpose:

- save and cancel actions
- camera controls
- footer status display

Properties:

- `.cameraStatus`
- `.footerStatus`

Events:

- `pan`
  - detail: `{ dx, dy }`
- `centerplayer`
- `save`
- `cancel`

Method:

```js
setData({ cameraStatus, footerStatus })
```

Notes:

- this component should own the buttons and visible status text only
- it should not contain camera logic itself

### `<edit-player>`

Purpose:

- detailed player editing

Properties:

- `.entity`
- `.catalogs`
- optionally `.markup` if raw markup editing remains part of this editor

Events:

- `entitychange`
  - detail: `{ entityId, changes }`
- optionally `markupchange`
  - detail: `{ entityId, markup }`

Method:

```js
setData({ entity, catalogs })
```

Expected payload:

```js
{
  entityId: 'player',
  changes: {
    name: 'Phoenix',
    emoji: '🧒',
    x: 3,
    y: 4
  }
}
```

Notes:

- emit partial changes, not whole realm objects
- let `RealmEditController` merge patches into the draft

## What should remain plain DOM

These are usually too thin to justify a component unless they gain real behavior:

- footer panel shell
- sidebar shell
- header shell
- stage frame
- generic titled section wrappers
- one-off button rows

Those should usually be built by:

- plain DOM assembly
- a small shared DOM helper module
- CSS classes

## Decision rule for new components

Before creating a new custom element, ask:

1. Does it materially simplify the parent file?
2. Does it have a stable name and responsibility?
3. Does it have a real event or method contract?
4. Would rebuilding this logic elsewhere be annoying?

If the answer to `3` and at least one other question is yes, it is probably a good component candidate.

## Implementation order

The recommended low-risk order remains:

1. `<editor-tools-panel>`
2. `<editor-footer>`
3. `<save-realm-dialog>`
4. right-side editor inspectors
5. optional `<entity-list>`

This gives the realm editor clearer boundaries without forcing a premature rewrite of its board and draft logic.
