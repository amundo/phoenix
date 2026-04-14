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
    
    this.player = new Player(gameData.realm.entities.player)
    this.player.emotions = gameData.catalogs.emotions

    this.enemies = gameData.realm.entities.enemies.map(enemy => new Enemy(enemy))
    
    this.items = gameData.realm.entities.items.map(item => new Item(item))
    
    this.animations = gameData.catalogs.animations
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

  resolvePlayerTouch(x, y) {
    const effects = []

    const itemsHere = this.items.filter(item => item.x === x && item.y === y)

    for (const item of itemsHere) {
      if (item.kind === 'cactus') {
        effects.push({
          type: 'emote',
          actor: this.player,
          emotion: 'ouch',
        })
      }

      if (item.kind === 'key') {
        if (!this.player.inventory) {
          this.player.inventory = []
        }

        if (!this.player.inventory.includes('key')) {
          this.player.inventory.push('key')
        }

        this.items = this.items.filter(it => it !== item)

        effects.push({
          type: 'pickup',
          actor: this.player,
          item,
        })

        effects.push({
          type: 'emote',
          actor: this.player,
          emotion: 'happy',
        })
      }

      if (item.kind === 'door') {
        const hasKey = this.player.inventory?.includes('key')

        if (hasKey) {
          effects.push({
            type: 'change-realm',
            actor: this.player,
            realm: item.to,
          })
        } else {
          effects.push({
            type: 'speak',
            actor: this.player,
            message: 'It is locked.',
          })

          effects.push({
            type: 'emote',
            actor: this.player,
            emotion: 'confused',
          })
        }
      }
    }

    return {
      stateChanged: false,
      effects,
    }
  }

  collectItemAt(x, y) {
    const effects = []

    const item = this.items.find(item => item.x === x && item.y === y)
    if (!item) return effects

    if (item.inventoryKey) {
      this.player.take(item.inventoryKey)
      this.items = this.items.filter(i => i !== item)

      effects.push({
        type: 'pickup',
        actor: this.player,
        item,
      })

      effects.push({
        type: 'speak',
        actor: this.player,
        message: `I found ${item.name || 'something'}!`,
      })
    }

    return effects
  }

  movePlayerBy(dx, dy) {
    const effects = []

    const nextX = this.player.x + dx
    const nextY = this.player.y + dy

    // Check whether the player hit the world bounds
    if (!this.world.contains(nextX, nextY)) {
      effects.push({
        type: 'speak',
        actor: this.player,
        message: 'Oof!',
      })

      effects.push({
        type: 'emote',
        actor: this.player,
        emotion: 'ouch',
      })

      return {
        stateChanged: false,
        effects,
      }
    }

    const enemy = this.enemies.find(enemy =>
      enemy.x === nextX && enemy.y === nextY
    )

    if (enemy) {
      effects.push({
        type: 'speak',
        actor: this.player,
        message: `Look out! ${enemy.name}!`,
      })

      return {
        stateChanged: false,
        effects,
      }
    }

    this.player.moveTo({ x: nextX, y: nextY })

    const collectEffects = this.collectItemAt(nextX, nextY)
    effects.push(...collectEffects)

    const touchResult = this.resolvePlayerTouch(nextX, nextY)
    effects.push(...touchResult.effects)

    return {
      stateChanged: true,
      effects,
    }
  }
}

export { GameEngine }