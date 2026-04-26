# Editor Architecture

This document describes the current architecture around the realm editor and the direction that best fits the codebase as it evolves.

The key idea is that the realm editor should be a composed set of UI surfaces mounted into the existing app shell, rather than a separate application with a separate rendering stack.

## Current structure

The main runtime pieces are:

- `GameApp`
- `GameUI`
- `GameBoard`
- `RealmEditController`

Their current responsibilities are:

- `GameApp`
  - loads data
  - owns the game loop
  - switches between play mode and editor mode
  - mounts content into the `GameUI` slots

- `GameUI`
  - owns the page shell
  - provides layout slots for left sidebar, stage, right sidebar, and footer
  - dispatches shell-level events such as `realmchange` and `editoropen`

- `GameBoard`
  - renders the visible board
  - knows how to render terrain, avatars, and effects
  - stays generic enough to work in both play mode and editor mode

- `RealmEditController`
  - owns the mutable draft realm
  - owns selection state
  - owns current tool state
  - mutates draft data in response to editor actions
  - rebuilds runtime state from the draft for preview

## Current editor flow

Today the editor is already mounted into the same shell as play mode.

The flow is:

1. `game-ui` dispatches `editoropen`.
2. `GameApp` stops the game loop and constructs `RealmEditController`.
3. `RealmEditController` builds editor panels and exposes a board node.
4. `GameApp` mounts those editor surfaces into the existing `GameUI` slots.

That means the editor is already structurally a mode inside the app, not a separate product.

## Recommended direction

The next step is to make the editor more component-driven.

The goal is:

- `RealmEditController` stays the orchestration layer
- editor panels become defined reusable components
- `GameApp` mounts a set of editor components rather than receiving large hand-built DOM trees

This is a better fit for the codebase because the editor already behaves like composition:

- left side: tools
- center: board
- right side: inspector
- footer: navigation, save, cancel, status

## Recommended boundaries

Keep `RealmEditController` as the coordinator.

Its long-term responsibilities should be:

- own the draft realm state
- own selection state
- own current tool state
- translate board interactions into draft mutations
- choose which editor components are mounted
- pass state into those components
- listen for component events and merge patches into the draft

It should move away from being the place that hand-builds most inspector and toolbar DOM.

## Proposed editor composition

The realm editor should be composed from these main pieces:

- stage:
  - `GameBoard`

- left sidebar:
  - `<editor-tools-panel>`

- right sidebar:
  - `<realm-inspector>`
  - `<entity-list>` optionally
  - `<edit-player>`
  - `<edit-bot>`
  - `<edit-item>`
  - `<edit-scenery>`

- footer:
  - `<editor-footer>`

- dialog:
  - `<save-realm-dialog>`

These components are described in more detail in [ui-components.md](./ui-components.md).

## Selection routing

The right-side inspector should be selected by current editor state.

Suggested routing:

- no selection:
  - mount `<realm-inspector>`
  - optionally also show `<entity-list>`

- selected player:
  - mount `<edit-player>`

- selected bot:
  - mount `<edit-bot>`

- selected item:
  - mount `<edit-item>`

- selected scenery:
  - mount `<edit-scenery>`

That routing logic should live in one place inside `RealmEditController`.

A method like `renderInspector()` or `mountInspectorForSelection()` is the right level of indirection.

## Compact and detailed views

The editor will likely need both compact summary views and detailed editing views for the same underlying data.

A good split is:

- compact:
  - `<entity-list>`
  - possibly `<entity-list-item>`

- detailed:
  - `<edit-player>`
  - `<edit-bot>`
  - `<edit-item>`
  - `<edit-scenery>`

This is better than one giant polymorphic component once editing behavior diverges.

## Event protocol for editor components

The editor component model should use:

- properties or `setData(...)` for incoming rich state
- narrow `CustomEvent`s for outgoing user intent

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

Avoid passing the entire global editor state through every event.

## What should stay inside `RealmEditController`

The following logic still belongs in the controller even after UI extraction:

- draft mutation logic
- camera logic
- terrain painting logic
- board interaction handling
- selection state
- serialization/save orchestration
- inspector routing

That keeps the controller as the editor brain while allowing UI surfaces to become reusable.

## Implementation order

The lowest-risk extraction order is:

1. `<editor-tools-panel>`
2. `<editor-footer>`
3. `<save-realm-dialog>`
4. right sidebar inspectors:
   - `<realm-inspector>`
   - `<edit-player>`
   - `<edit-bot>`
   - `<edit-item>`
   - `<edit-scenery>`
5. optional `<entity-list>`

This sequence gives the clearest gains without rewriting the board or draft logic too early.

## Design rules

When deciding whether part of the editor should become a component:

- use a component when the UI has its own state, interaction pattern, or public event contract
- keep it plain DOM when it is mostly layout glue
- prefer a few substantial editor components over many thin wrappers

For this project, the realm editor should evolve toward mounted, reusable components, but not toward a forest of tiny layout-only tags.
