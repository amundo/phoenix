# Effects

Effects are transient runtime outputs from `GameEngine.update(...)`.

They describe things the player should perceive, but that do not necessarily change persistent game state on their own. The engine returns them alongside `stateChanged`.

## Effect shape

Current effects are plain objects with a `type` field.

### `speak`

```js
{
  type: 'speak',
  actor,
  message: 'Hello!'
}
```

### `emote`

```js
{
  type: 'emote',
  actor,
  emotion: 'happy'
}
```

### `play-sound`

```js
{
  type: 'play-sound',
  sound: 'pickup-coin'
}
```

## Source of effects

Effects are produced in `engine/GameEngine.js`.

Common sources:

- explicit commands:
  - `speak`
  - `emote`
- movement results:
  - blocked by world bounds
  - blocked by terrain
  - bumping into bots
- nearby interaction:
  - talking to a bot
- item logic:
  - pickup
  - blocked requirements
  - success outcomes
  - bump reactions

Effects are intentionally composable: one action can yield multiple effects in order.

Example:

```js
[
  { type: 'play-sound', sound: 'error' },
  { type: 'speak', actor, message: 'It’s the edge of the world!' },
  { type: 'emote', actor, emotion: 'pain' }
]
```

## Consumption path

1. `GameEngine.update(commands)` returns `{ stateChanged, effects }`.
2. `GameApp.step()` calls `handleEffects(result.effects)`.
3. `GameApp` routes each effect to the appropriate UI surface.

Current routing:

- `speak`
  - if `effect.actor === player`, show the message in the info banner via `game-ui`
  - otherwise show speech on the board via `game-board.speak(...)`
- `emote`
  - route to `game-board.emote(...)`
- `play-sound`
  - route to `AudioPlayer.play(...)`

## Board-level rendering

`game-board` resolves board effects further:

- `speak` is forwarded to `avatar-layer`, which calls `avatar.speak(message)`
- `emote` resolves an emotion entry from the emotion catalog and an animation from the animation catalog, then asks `effect-layer` to display it

Emotion alias handling currently lives in `GameBoard.emotionAliases`, for example:

- `confused` -> `confusion`
- `curious` -> `curiosity`
- `surprised` -> `surprise`

## Effect design rules

When adding new effects:

- Keep them serializable plain objects.
- Prefer effect names that describe the perceived result, not the implementation.
- Do not use effects for persistent state mutation; mutate state in the engine, then emit effects describing the feedback.
- Make routing explicit in `GameApp.handleEffects(...)`.

If the effect list grows, a dispatch table in `GameApp` would likely be cleaner than the current `if` chain.
