# Custom Events

This document describes the current custom DOM event protocol used by the game UI and realm editor.

The project mostly uses bubbling `CustomEvent`s with compact `detail` payloads. When adding new events, prefer:

- lower-case event names
- noun or action names without prefixes unless needed for scope
- narrow `detail` payloads with only the data needed by listeners

## Current events

| Event | Emitted by | Listened to by | `detail` |
| --- | --- | --- | --- |
| `realmchange` | `game-ui` | `game-app` | `{ realmName }` |
| `realmchange` | `admin-dialog` | `game-ui` | `{ realmName }` |
| `editoropen` | `game-ui` | `game-app` | none |
| `avatarselect` | avatar nodes in `avatar-layer` | `RealmEditController` board listener | `{ entity }` |
| `editorinspect` | `RealmEditController` | `game-app` | `{ node }` |
| `draftsave` | `RealmEditController` | `game-app` | `{ realm }` |
| `draftcancel` | `RealmEditController` | `game-app` | none |
| `emojiselect` | `search-emoji` | parent editor UI | `{ emoji, entry }` |

## Event flow

### Realm switching

1. `admin-dialog` dispatches `realmchange` when its realm `<select>` changes.
2. `game-ui` mirrors the selected value into its own realm picker and re-dispatches `realmchange`.
3. `game-app` handles the event, loads the requested realm, and restarts the game state.

The header realm picker in `game-ui` also dispatches `realmchange` directly with the same payload shape.

### Entering the editor

1. `game-ui` dispatches `editoropen`.
2. `game-app` stops the game loop, creates a `RealmEditController`, and mounts the editor panels into the existing layout slots.

### Selecting an entity from the board

1. A rendered avatar node dispatches `avatarselect` with the runtime entity instance.
2. `RealmEditController` resolves that runtime entity back to a draft entity selection.
3. `RealmEditController` dispatches `editorinspect` with a ready-to-mount DOM node for the right sidebar.
4. `game-app` mounts `detail.node` into the right sidebar slot.

The current contract for `editorinspect` is intentionally simple: the editor owns inspector DOM construction and the app just mounts the node.

### Saving or cancelling an editor draft

- `draftsave` carries a structured clone of the full draft realm object.
- `draftcancel` carries no payload and means "discard editor changes and return to the current realm state."

## Payload conventions

### `realmchange`

```js
{
  realmName: 'overworld'
}
```

### `avatarselect`

```js
{
  entity: runtimeEntity
}
```

This is a runtime entity instance from the current `GameEngine`, not a serialized draft object.

### `editorinspect`

```js
{
  node: HTMLElement
}
```

### `draftsave`

```js
{
  realm: {
    id: 'tiny',
    name: 'Tiny Realm',
    entities: { ... },
    realmMap: { ... }
  }
}
```

### `emojiselect`

```js
{
  emoji: '🧙',
  entry: {
    emoji: '🧙',
    description: 'mage',
    ...
  }
}
```

## Guidelines for new events

- Prefer domain-level events such as `entitychange` or `terrainchange` over UI-specific names like `buttonclick`.
- Keep payloads patch-oriented when possible.
- Reuse payload shapes across similar components.
- Use properties or direct method calls for large state transfer; use custom events for user intent and interaction results.

Good future examples for the realm editor:

```js
{ entityId, changes }
{ tool: 'paint-terrain' }
{ terrain: 'grass' }
{ dx: 0, dy: -1 }
```
