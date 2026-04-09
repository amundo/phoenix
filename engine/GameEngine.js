import { World } from './World.js'
import { Camera } from './Camera.js'
import { Player, Enemy, Item } from '../entities/Entities.js'

class GameEngine {
  constructor(gameData) {
    this.initialize(gameData)
  }

  initialize(gameData) {
    this.world = new World(gameData.world)
    this.camera = new Camera(gameData.camera)

    this.player = new Player(gameData.entities.player)
    this.enemies = gameData.entities.enemies.map(enemy => new Enemy(enemy))
    this.items = gameData.entities.items.map(item => new Item(item))
  }

  get entities() {
    return [this.player, ...this.enemies, ...this.items]
  }

  getState() {
    return {
      world: this.world,
      camera: this.camera,
      entities: this.entities,
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
        message: 'Edge of the world!',
      })


    effects.push({
      type: 'emote',
      actor: this.player,
      emotion: '😠',
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