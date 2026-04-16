import { World } from './World.js'
import { Camera } from './Camera.js'
import { Item } from '../entities/index.js'
import { Player } from '../entities/index.js'
import { Enemy } from '../entities/index.js'
import { Scenery } from '../entities/index.js'

class GameEngine {
  constructor(gameData) {
    this.initialize(gameData)
  }

  initialize(gameData) {
    this.world = new World(gameData.realm, gameData.catalogs.terrain)
    this.camera = new Camera(gameData.realm.camera)

    this.emotions = gameData.catalogs.emotions
    this.catalogs = gameData.catalogs
    this.animations = gameData.catalogs.animations

    this.player = new Player(gameData.realm.entities.player)
    this.player.emotions = gameData.catalogs.emotions

    const playerMarker = this.world.findMarker('player')
    if (playerMarker) {
      this.player.moveTo(playerMarker)
    }

    this.enemies = gameData.realm.entities.enemies.map(enemy => new Enemy(enemy))
    this.scenery = this.createScenery(gameData)
    this.items = gameData.realm.entities.items.map(item =>
      new Item(this.resolveCatalogEntity(gameData.catalogs.items, item))
    )

    this.centerCameraOnPlayer()
  }

  resolveCatalogEntity(catalog, instanceData = {}) {
    const key = instanceData.catalogId ?? instanceData.kind
    const catalogData = key ? catalog?.get?.(key) : null

    if (!catalogData) {
      return instanceData
    }

    const merged = {
      ...catalogData,
      ...instanceData,
      catalogId: catalogData.id ?? instanceData.catalogId ?? null,
      definition: catalogData,
    }

    if (catalogData.on || instanceData.on) {
      merged.on = {
        ...(catalogData.on ?? {}),
        ...(instanceData.on ?? {}),
      }
    }

    if (catalogData.requires || instanceData.requires) {
      merged.requires = {
        ...(catalogData.requires ?? {}),
        ...(instanceData.requires ?? {}),
      }
    }

    return merged
  }

  get entities() {
    return [...this.scenery, this.player, ...this.enemies, ...this.items]
  }

  getEntitiesAt(x, y) {
    return this.entities.filter(entity => entity.x === x && entity.y === y)
  }

  createScenery(gameData) {
    const realmScenery = gameData.realm.entities.scenery ?? gameData.realm.scenery ?? []
    const combined = [...this.world.scenery, ...realmScenery]

    return combined.map(data =>
      new Scenery(this.resolveSceneryEntity(gameData.catalogs, data))
    )
  }

  resolveSceneryEntity(catalogs, instanceData = {}) {
    const key = instanceData.catalogId ?? instanceData.kind
    const terrainData = key ? catalogs?.terrain?.get?.(key) : null
    const itemData = key ? catalogs?.items?.get?.(key) : null
    const catalogData = terrainData ?? itemData

    return {
      ...(catalogData ?? {}),
      ...instanceData,
      catalogId: catalogData?.id ?? instanceData.catalogId ?? null,
      definition: catalogData ?? null,
      solid: instanceData.solid ?? catalogData?.solid ?? (catalogData?.walkable === false),
      name: instanceData.name ?? catalogData?.name ?? instanceData.kind ?? 'Scenery',
      emoji:
        instanceData.emoji ??
        catalogData?.emoji ??
        this.getDefaultSceneryEmoji(instanceData.kind),
    }
  }

  getDefaultSceneryEmoji(kind) {
    const fallback = {
      tree: '🌲',
      rock: '🪨',
      cliff: '🪨',
      wall: '🧱',
      bridge: '🪵',
    }

    return fallback[kind] ?? null
  }

  getState() {
    return {
      world: this.world,
      camera: this.camera,
      entities: this.entities,
      catalogs: this.catalogs,
    }
  }

  handleCommand(command) {
    if (!command) {
      return {
        stateChanged:
          false, effects: []
      }
    }

    switch (command.type) {
      case 'move':
        return this.moveActorBy(command.actor, command.dx, command.dy)

      case 'interact':
        return this.handleInteract(command.actor)

      case 'speak':
        return {
          stateChanged: false,
          effects: [{
            type: 'speak',
            actor: command.actor,
            message: command.message,
          }],
        }

      case 'emote':
        return {
          stateChanged: false,
          effects: [{
            type: 'emote',
            actor: command.actor,
            emotion: command.emotion,
          }],
        }

      default:
        return { stateChanged: false, effects: [] }
    }
  }

  update(commands = []) {
    let stateChanged = false
    let effects = []

    const generatedCommands = this.getAutonomousCommands()

    for (const command of [...commands, ...generatedCommands]) {
      const result = this.handleCommand(command)
      if (!result) continue

      if (result.stateChanged) stateChanged = true
      if (result.effects?.length) effects.push(...result.effects)
    }

    return { stateChanged, effects }
  }
  getAutonomousCommands() {
    return []
  }

  moveActorBy(actor, dx, dy) {
    const nextX = actor.x + dx
    const nextY = actor.y + dy

    if (!this.world.contains(nextX, nextY)) {
      return {
        stateChanged: false,
        effects: this.getBlockedByWorldEffects(actor)
      }
    }

    if (!this.world.isWalkable(nextX, nextY)) {
      return {
        stateChanged: false,
        effects: this.getBlockedByTerrainEffects(actor, this.world.at(nextX, nextY))
      }
    }

    const enemy = this.enemies.find(enemy =>
      enemy.x === nextX && enemy.y === nextY
    )

    if (enemy) {
      return {
        stateChanged: false,
        effects: [
          {
            type: 'speak',
            actor,
            message: `Look out! ${enemy.name}!`,
          },
          {
            type: 'emote',
            actor,
            emotion: 'pain',
          },
        ],
      }
    }

    const sceneryHere = this.getSceneryAt(nextX, nextY)
    const itemsHere = this.getItemsAt(nextX, nextY)
    const entitiesHere = [...sceneryHere, ...itemsHere]
    const effects = []

    effects.push(...this.getTouchEffects(actor, entitiesHere))
    effects.push(...this.resolveItemInteractions(actor, entitiesHere))

    if (this.hasSolidEntity(entitiesHere)) {
      return {
        stateChanged: false,
        effects,
      }
    }

    actor.moveTo({ x: nextX, y: nextY })
    this.centerCameraOnPlayer()

    const pickedUpItems = this.pickUpPortableItems(actor, itemsHere)

    effects.push(...this.getPickupEffects(actor, pickedUpItems))

    return {
      stateChanged: true,
      effects,
    }

  }
  handleInteract(actor) {
    return { stateChanged: false, effects: [] }
  }

  getItemsAt(x, y) {
    return this.items.filter(item => item.x === x && item.y === y)
  }

  getSceneryAt(x, y) {
    return this.scenery.filter(item => item.x === x && item.y === y)
  }

  hasSolidEntity(entities) {
    return entities.some(entity => entity.solid)
  }


  pickUpPortableItems(actor, items) {
    const portableItems = items.filter(item => item.portable)

    for (const item of portableItems) {
      if (actor.take) actor.take(item)
      this.items = this.items.filter(other => other !== item)
    }

    return portableItems
  }

  getPickupEffects(actor, items) {
    return items.map(item => ({
      type: 'speak',
      actor,
      message: item.on?.pickup?.message ?? `Got ${item.name}!`,
    }))
  }

  resolveItemInteractions(actor, items) {
    const effects = []

    for (const item of items) {
      if (!item.requires) continue

      const ok = this.meetsRequirement(actor, item.requires)

      if (!ok) {
        const blocked = item.on?.blocked

        if (blocked?.message) {
          effects.push({
            type: 'speak',
            actor,
            message: blocked.message,
          })
        }

        if (blocked?.emotion) {
          effects.push({
            type: 'emote',
            actor,
            emotion: blocked.emotion,
          })
        }

        continue
      }

      const success = item.on?.success

      if (success?.set) {
        Object.assign(item, success.set)
      }

      if (success?.message) {
        effects.push({
          type: 'speak',
          actor,
          message: success.message,
        })
      }

      if (success?.emotion) {
        effects.push({
          type: 'emote',
          actor,
          emotion: success.emotion,
        })
      }
    }

    return effects
  }

  meetsRequirement(actor, requirement) {
    if (!requirement) return true

    if (requirement.id) {
      return actor.hasItemId?.(requirement.id)
    }

    if (requirement.kind) {
      return actor.hasKind?.(requirement.kind)
    }

    return true
  }

  getBlockedByWorldEffects(actor) {
    return [
      { type: 'speak', actor, message: 'D’oh!' },
      { type: 'emote', actor, emotion: 'pain' },
    ]
  }

  getBlockedByTerrainEffects(actor, cell) {
    const terrainName = cell?.terrain ?? 'terrain'

    return [
      { type: 'speak', actor, message: `Can't walk on ${terrainName}.` },
      { type: 'emote', actor, emotion: 'confused' },
    ]
  }

  getTouchEffects(actor, items) {
    const effects = []

    for (const item of items) {
      const touch = item.on?.touch
      if (!touch) continue

      if (touch.message) {
        effects.push({
          type: 'speak',
          actor,
          message: touch.message,
        })
      }

      if (touch.emotion) {
        effects.push({
          type: 'emote',
          actor,
          emotion: touch.emotion,
        })
      }
    }

    return effects
  }

  centerCameraOnPlayer() {
    if (!this.player || !this.camera || !this.world) return
    this.camera.centerOn(this.player.x, this.player.y, this.world)
  }
}

export { GameEngine }
