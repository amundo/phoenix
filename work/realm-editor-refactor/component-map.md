Here is the component map I would use for the realm editor.

**Top Level**

Keep [ui/RealmEditController.js](/Users/pathall/Sites/Games/phoenix/ui/RealmEditController.js) as the coordinator.

Its responsibilities:
- own the draft realm state
- own selection state
- own current tool state
- translate board interactions into state updates
- mount/update the major editor components
- listen for component events and mutate the draft

It should not be responsible for hand-building most inspector/tool DOM.

**Component Map**

Center:

- `GameBoard`
- stays as the main interactive board surface

Left sidebar:

- `<editor-tools-panel>`
- owns tool buttons, terrain picker, terrain summary
- emits `toolchange`
- emits `terrainchange`

Right sidebar:

- `<realm-inspector>`
- shown when nothing specific is selected, or when editing realm-level data
- emits `realmchange`

- `<entity-list>`
- optional, if you want a compact browsable index of player/bots/items/scenery
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
- owns pan buttons, save, cancel, status text
- emits `pan`
- emits `centerplayer`
- emits `save`
- emits `cancel`

Dialog:

- `<save-realm-dialog>`
- owns preview/download/confirm save UI
- emits `confirmsave`

**Selection Routing**

Make selection determine the inspector component.

Suggested routing:

- no selection: mount `<realm-inspector>` and maybe `<entity-list>`
- selected player: mount `<edit-player>`
- selected bot: mount `<edit-bot>`
- selected item: mount `<edit-item>`
- selected scenery: mount `<edit-scenery>`

That logic should live in `RealmEditController`, probably in one method like `renderInspector()` or `mountInspectorForSelection()`.

**Compact Vs Detailed**

I would use two levels, not one giant polymorphic component.

Compact:

- `<entity-list>`
- possibly `<entity-list-item>`

Detailed:

- `<edit-player>`
- `<edit-bot>`
- `<edit-item>`
- `<edit-scenery>`

That is cleaner than a single mega `<entity-view variant="...">` once editing behavior diverges.

**Event Flow**

Board to controller:

- avatar click -> `avatarselect`
- cell click / paint gesture -> controller updates draft

Tools panel to controller:

- `toolchange`
- `terrainchange`

Entity list to controller:

- `entityselect`

Inspector editor to controller:

- `entitychange` with patched fields
- possibly `deleteentity`, `duplicateentity`, `focusentity`

Footer to controller:

- `pan`
- `centerplayer`
- `save`
- `cancel`

Save dialog to controller:

- `confirmsave`

Controller back to components:

- set `.data`, `.entity`, `.realm`, `.tool`, `.selectedTerrain`, `.status`
- re-render board
- re-mount or update inspector

**Data Shape**

I would standardize event payloads so components stay simple.

Examples:

```js
{ entityId, changes }
{ tool: 'paint-terrain' }
{ terrain: 'grass' }
{ dx: 0, dy: -1 }
```

Avoid passing whole global editor state through every event.

**Implementation Order**

Best low-risk extraction order:

1. `<editor-tools-panel>`
2. `<editor-footer>`
3. `<save-realm-dialog>`
4. right sidebar inspector split:
   - `<realm-inspector>`
   - `<edit-player>`
   - `<edit-bot>`
   - `<edit-item>`
   - `<edit-scenery>`
5. optional `<entity-list>`

That order gives quick wins without disturbing board/editor logic too early.

**What Stays In `RealmEditController`**

Keep these there:

- draft mutation logic
- camera logic
- terrain painting logic
- selection state
- serialization/save orchestration
- inspector routing

So the controller becomes the brain, and the components become reusable UI surfaces.

Here’s the API shape I’d start with for the first 3 components: `<editor-tools-panel>`, `<editor-footer>`, and `<edit-player>`.

**`<editor-tools-panel>`**

Purpose: tool selection + terrain selection.

Properties:

- `.tool`
- `.selectedTerrain`
- `.terrainOptions`
- `.terrainSummary`

Events:

- `toolchange`
  detail: `{ tool }`
- `terrainchange`
  detail: `{ terrain }`

Methods:

- `setData({ tool, selectedTerrain, terrainOptions, terrainSummary })`

Notes:

- Keep it stateless except for its own local UI state.
- `terrainOptions` should just be normalized data like:

```js
[{ value: 'grass', label: 'Grass' }]
```

**`<editor-footer>`**

Purpose: save/cancel, camera controls, footer status.

Properties:

- `.cameraStatus`
- `.footerStatus`

Events:

- `pan`
  detail: `{ dx, dy }`
- `centerplayer`
- `save`
- `cancel`

Methods:

- `setData({ cameraStatus, footerStatus })`

Notes:

- This should own the buttons and displayed status text only.
- It should not know how camera movement works.

**`<edit-player>`**

Purpose: detailed editor for the player entity.

Properties:

- `.entity`
- `.catalogs` or narrower props if needed
- `.markup` if you keep raw markup editing here

Events:

- `entitychange`
  detail: `{ entityId, changes }`
- optionally `markupchange`
  detail: `{ entityId, markup }`

Methods:

- `setData({ entity, catalogs })`

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

- Emit partial changes, not whole realm objects.
- Let `RealmEditController` merge patches into the draft.

**Recommended Conventions**

Use the same pattern for all editor components:

- `setData(...)` for incoming state
- narrow custom events for outgoing actions
- no direct mutation of global draft state inside the component

Suggested naming consistency:

- `toolchange`
- `terrainchange`
- `entityselect`
- `entitychange`
- `realmchange`

That consistency matters more than the exact component count.

**One Important Design Choice**

Prefer properties / `setData(...)` over attributes for rich editor data. These components are app-internal and stateful, so property-based APIs will be simpler and cleaner than serializing JSON into attributes.

If you want, I can next write the concrete skeleton code for these three components so you can see how the pattern would feel in this repo.
