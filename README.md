---
title: Phoenix RPG Game Project
authors: 
    - Patrick Hall
    - Ed Dorrington
---

This project is a small browser-based Zelda-style prototype built with vanilla Javascript, with no frameworks. Rather than using `<canvas>`, the game uses standard `DOM` elements for rendering. The app boots from [index.html](./index.html), which mounts a `<game-app>` element pointed at the `data/` folder; [phoenix.js](./phoenix.js) just registers the UI components.

## Initialization

[ui/GameApp.js](./ui/GameApp.js) is the client-side entry point and top-level controller.

## Game Data Structure

 `GameApp.js` uses [engine/GameDataLoader.js](./engine/GameDataLoader.js) to load [data/index.json](./data/index.json), which contains references to all data files, including shared data catalogs (`actors.json`, `animations.json`, `effects.json`, `emoji.json`, `emotions.json`, `items.json`, `terrain.json`) plus the current realm JSON. The data catalogs contain reusable definitions for terrain types, items, emotions, and animations. Graphics are all emoji, which keeps things simple and fun.

## Realm

A realm defines the map size, camera, player, bots, items, and terrain layout, while the catalogs provide reusable definitions for terrain, items, emotions, and animations. The realm JSON defines the map layout, bots, items, and scripted interactions. 

## Game Engine and Rules

The game rules live in [engine/GameEngine.js](./engine/GameEngine.js). It builds a [RealmMap](./engine/RealmMap.js), creates entity objects for the player, bots, scenery, and items, then processes queued commands like movement and interaction on a 250ms loop. Movement checks map bounds, terrain walkability, collisions, pickup behavior, and simple scripted effects such as speech and emotes. The player inventory is just an in-memory array on the [Player](./entities/Player.js) entity.

## Rendering and UI

Rendering is split into layers inside [ui/GameBoard.js](./ui/GameBoard.js): [TerrainLayer](./ui/TerrainLayer.js) draws visible cells from the camera window, [AvatarLayer](./ui/AvatarLayer.js) places entity avatars, and [EffectLayer](./ui/EffectLayer.js) animates floating emoji/emotion effects. The terrain visuals are data-driven too: [ui/GameCell.js](./ui/GameCell.js) reads a single `oklchHue` from terrain catalog entries and generates per-tile variation with seeded randomness.

## 

The side UI in [ui/GameUI.js](./ui/GameUI.js) shows inventory and opens [ui/AdminDialog.js](./ui/AdminDialog.js), which acts like an in-game inspector. That dialog can switch realms and browse the loaded catalogs and game data tree, so the project doubles as both a playable prototype and a lightweight data-driven world editor/debug viewer.

## Realm CLI

There is also a Deno CLI in [realms.js](./realms.js) for working with the remote realm API.

```sh
deno task realms list
deno task realms get tiny --output ./tiny.json
deno task realms create --file ./data/realms/tiny/realm.json
deno task realms update tiny --file ./data/realms/tiny/realm.json
deno task realms delete tiny
```
