import { World } from './World.js'
import { Camera } from './Camera.js'
import { Item } from '../entities/index.js'
import { Player  } from '../entities/index.js'  
import { Enemy } from '../entities/index.js'

class GameEngine {
  constructor(gameData) {
    this.initialize(gameData)
  }

  initialize(gameData) {
    this.world = new World(gameData.realm)
    this.camera = new Camera(gameData.realm.camera)

    this.player = new Player(gameData.realm.entities.player)
    this.enemies = gameData.realm.entities.enemies.map(enemy => new Enemy(enemy))
    this.items = gameData.realm.entities.items.map(item => new Item(item))
    this.emotions = gameData.catalogs.emotions
    this.animations = gameData.catalogs.animations

  }

  get entities() {
    return [this.player, ...this.enemies, ...this.items]
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
    const effects = []

    const nextX = this.player.x + dx
    const nextY = this.player.y + dy

    if (!this.world.contains(nextX, nextY)) {
      effects.push({
        type: 'speak',
        actor: this.player,
        message: 'Oof!',
      })


    effects.push({
      type: 'emote',
      actor: this.player,
      emotion: '', // happy
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

    return {
      stateChanged: true,
      effects,
    }
  }
}

export { GameEngine }