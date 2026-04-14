import { World } from './World.js'
import { Camera } from './Camera.js'
import { Item } from '../entities/index.js'
import { Player } from '../entities/index.js'
import { Enemy } from '../entities/index.js'

class GameEngine {
  constructor(gameData) {
    this.initialize(gameData)
  }

  initialize(gameData) {
    this.world = new World(gameData.realm)
    this.camera = new Camera(gameData.realm.camera)

    this.emotions = gameData.catalogs.emotions
    this.catalogs = gameData.catalogs
    this.animations = gameData.catalogs.animations

    this.player = new Player(gameData.realm.entities.player)
    this.player.emotions = gameData.catalogs.emotions

    this.enemies = gameData.realm.entities.enemies.map(enemy => new Enemy(enemy))
    this.items = gameData.realm.entities.items.map(item => new Item(item))
  }

  get entities() {
    return [this.player, ...this.enemies, ...this.items]
  }

  getEntitiesAt(x, y) {
    return this.entities.filter(entity => entity.x === x && entity.y === y)
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
        stateChanged: false,
        effects: [],
      }
    }

    let result = {
      stateChanged: false,
      effects: [],
    }

    if (command.type === 'move') {
      result = this.movePlayerBy(command.dx, command.dy)
    }

    this.camera.centerOn(this.player.x, this.player.y, this.world)
    return result
  }

  movePlayerBy(dx, dy) {
    const nextX = this.player.x + dx
    const nextY = this.player.y + dy

    if (!this.world.contains(nextX, nextY)) {
      return {
        stateChanged: false,
        effects: this.getBlockedByWorldEffects(),
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
            actor: this.player,
            message: `Look out! ${enemy.name}!`,
          },
        ],
      }
    }

    const itemsHere = this.getItemsAt(nextX, nextY)

    const effects = []
    effects.push(...this.resolveItemInteractions(itemsHere))
    effects.push(...this.getTouchEffects(itemsHere))

    if (this.hasSolidItem(itemsHere)) {
      return {
        stateChanged: false,
        effects,
      }
    }

    this.player.moveTo({ x: nextX, y: nextY })

    const pickedUpItems = this.pickUpPortableItems(itemsHere)
    effects.push(...this.getPickupEffects(pickedUpItems))

    return {
      stateChanged: true,
      effects,
    }
  }

  getItemsAt(x, y) {
    return this.items.filter(item => item.x === x && item.y === y)
  }

  hasSolidItem(items) {
    return items.some(item => item.solid)
  }

  pickUpPortableItems(items) {
    const portableItems = items.filter(item => item.portable)

    for (const item of portableItems) {
      this.player.take(item)
      this.items = this.items.filter(other => other !== item)
    }

    return portableItems
  }

  getPickupEffects(items) {
    return items.map(item => ({
      type: 'speak',
      actor: this.player,
      message: item.on?.pickup?.message ?? `Got ${item.name}!`,
    }))
  }

  resolveItemInteractions(items) {
    const effects = []

    for (const item of items) {
      if (!item.requires) continue

      const ok = this.meetsRequirement(item.requires)

      if (!ok) {
        const blocked = item.on?.blocked

        if (blocked?.message) {
          effects.push({
            type: 'speak',
            actor: this.player,
            message: blocked.message,
          })
        }

        if (blocked?.emotion) {
          effects.push({
            type: 'emote',
            actor: this.player,
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
          actor: this.player,
          message: success.message,
        })
      }

      if (success?.emotion) {
        effects.push({
          type: 'emote',
          actor: this.player,
          emotion: success.emotion,
        })
      }
    }

    return effects
  }

  meetsRequirement(requirement) {
    if (!requirement) return true

    if (requirement.id) {
      return this.player.hasItemId(requirement.id)
    }

    if (requirement.kind) {
      return this.player.hasKind(requirement.kind)
    }

    return true
  }
  // playerHasItem(kind) {
  //   return this.player.inventory.some(item => item.kind === kind)
  // }

  getBlockedByWorldEffects() {
    return [
      { type: 'speak', actor: this.player, message: 'D’oh!' },
      { type: 'emote', actor: this.player, emotion: 'ouch' },
    ]
  }

  getTouchEffects(items) {
    const effects = []

    for (const item of items) {
      const touch = item.on?.touch
      if (!touch) continue

      if (touch.message) {
        effects.push({
          type: 'speak',
          actor: this.player,
          message: touch.message,
        })
      }

      if (touch.emotion) {
        effects.push({
          type: 'emote',
          actor: this.player,
          emotion: touch.emotion,
        })
      }
    }

    return effects
  }
}

export { GameEngine }