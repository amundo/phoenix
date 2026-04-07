/* DATA LAYER */
class World {
  constructor({ rowCount, columnCount }) {
    this.rowCount = rowCount
    this.columnCount = columnCount
    this.worldGrid = Array.from({ length: rowCount }, (_, y) =>
      Array.from({ length: columnCount }, (_, x) =>
        new Cell({ x, y, terrain: 'grassland' })
      )
    )
  }

  at(x, y) {
    return this.worldGrid[y]?.[x] ?? null
  }

  contains(x, y) {
    return (
      y >= 0 &&
      y < this.rowCount &&
      x >= 0 &&
      x < this.columnCount
    )
  }
}

window.ENTITIES = [] 

class Cell {
  constructor({ x, y, terrain = 'grassland' }) {
    this.x = x
    this.y = y
    this.terrain = terrain
  }
}

class Character {
  constructor({ name, emoji, x, y }) {
    this.name = name
    this.emoji = emoji
    this.x = x
    this.y = y
  }

  moveTo({ x, y }) {
    this.x = x
    this.y = y
  }
}

class Player extends Character { }
class Enemy extends Character { }

class Item {
  constructor({ name, emoji, x, y }) {
    this.name = name
    this.emoji = emoji
    this.x = x
    this.y = y
  }
}

/* UI LAYER */

// Base avatar class that character and item avatars will extend from
class BaseAvatar extends HTMLElement {
  #data = null

  constructor() {
    super()
    this.classList.add('avatar')
    this.innerHTML = `
      <span class="avatar-emoji"></span>
      <span class="speech-bubble"></span>
    `
  }

  set data(entityData) {
    this.#data = entityData
    this.render()
  }

  get data() {
    return this.#data
  }

  speak(message) {
    const bubble = this.querySelector('.speech-bubble')
    const messageLength = message.length
    bubble.textContent = message
    bubble.style.display = 'block'
    bubble.style.position = 'absolute'
    setTimeout(() => {
      bubble.style.display = 'none'
    }, 1000 + messageLength * 10)
  }

  placeAt(localX, localY) {
    this.style.gridColumn = localX + 1
    this.style.gridRow = localY + 1
  }

  render() {
    if (!this.#data) return
    this.querySelector('.avatar-emoji').textContent = this.#data.emoji
  }
}

class PlayerAvatar extends BaseAvatar { }
class EnemyAvatar extends BaseAvatar { }
class ItemAvatar extends BaseAvatar { }

customElements.define('base-avatar', BaseAvatar)
customElements.define('player-avatar', PlayerAvatar)
customElements.define('enemy-avatar', EnemyAvatar)
customElements.define('item-avatar', ItemAvatar)

class GameCell extends HTMLElement {
  #cell = null

  constructor() {
    super()
    this.classList.add('cell')
  }

  set data(cellData) {
    this.#cell = cellData
    this.render()
  }

  get data() {
    return this.#cell
  }

  render() {
    if (!this.#cell) return
    this.style.gridColumn = this.#cell.x + 1
    this.style.gridRow = this.#cell.y + 1
    this.setAttribute('terrain', this.#cell.terrain || 'grassland')
  }
}

customElements.define('game-cell', GameCell)

class Camera {
  constructor({ x = 0, y = 0, columnCount = 8, rowCount = 6 }) {
    this.x = x
    this.y = y
    this.columnCount = columnCount
    this.rowCount = rowCount
  }

  contains(x, y) {
    return (
      x >= this.x &&
      x < this.x + this.columnCount &&
      y >= this.y &&
      y < this.y + this.rowCount
    )
  }

  toLocalX(worldX) {
    return worldX - this.x
  }

  toLocalY(worldY) {
    return worldY - this.y
  }

  centerOn(x, y, world) {
    let nextX = x - Math.floor(this.columnCount / 2)
    let nextY = y - Math.floor(this.rowCount / 2)

    let maxX = Math.max(0, world.columnCount - this.columnCount)
    let maxY = Math.max(0, world.rowCount - this.rowCount)

    this.x = Math.max(0, Math.min(nextX, maxX))
    this.y = Math.max(0, Math.min(nextY, maxY))
  }
}

class GameBoard extends HTMLElement {
  #world = null
  #camera = null

  constructor() {
    super()
    this.innerHTML = `
      <section class="tile-layer"></section>
      <section class="avatar-layer"></section>
    `

    this.tileLayer = this.querySelector('.tile-layer')
    this.avatarLayer = this.querySelector('.avatar-layer')

    this.cellElements = new Map()
    this.avatarElements = new Map()
  }

  set data({ world, camera }) {
    this.#world = world
    this.#camera = camera
    this.renderTiles()
  }

  get data() {
    return {
      world: this.#world,
      camera: this.#camera,
    }
  }

  createAvatar(entity) {
    if (entity instanceof Player) return new PlayerAvatar()
    if (entity instanceof Enemy) return new EnemyAvatar()
    return new ItemAvatar()
  }

  renderTiles() {
    if (!this.#world || !this.#camera) return

    let { columnCount, rowCount } = this.#camera

    this.style.setProperty('--column-count', this.#camera.columnCount)
    this.style.setProperty('--row-count', this.#camera.rowCount)


    this.tileLayer.innerHTML = ''
    this.cellElements.clear()

    for (let localY = 0; localY < rowCount; localY++) {
      for (let localX = 0; localX < columnCount; localX++) {
        let worldX = this.#camera.x + localX
        let worldY = this.#camera.y + localY
        let cellData = this.#world.at(worldX, worldY)
        if (!cellData) continue

        let cell = new GameCell()
        cell.data = {
          ...cellData,
          x: localX,
          y: localY,
        }

        this.cellElements.set(`${localX},${localY}`, cell)
        this.tileLayer.append(cell)
      }
    }
  }

  syncEntity(entity) {
    let avatar = this.avatarElements.get(entity)

    if (!avatar) {
      avatar = this.createAvatar(entity)
      this.avatarElements.set(entity, avatar)
      this.avatarLayer.append(avatar)
    }

    avatar.data = entity
console.log(entity.name, this.#camera, entity.x, entity.y)
    if (!this.#camera.contains(entity.x, entity.y)) {
      avatar.hidden = true
      return
    }

    avatar.hidden = false

    let localX = this.#camera.toLocalX(entity.x)
    let localY = this.#camera.toLocalY(entity.y)


    avatar.placeAt(localX, localY)
    ENTITIES.push(entity.name, {
      localX,
      localY,
      gridColumn: avatar.style.gridColumn,
      gridRow: avatar.style.gridRow,
      hidden: avatar.hidden,
      tag: avatar.localName
    })
  }

  removeMissingEntities(liveEntities) {
    for (let [entity, avatar] of this.avatarElements) {
      if (!liveEntities.includes(entity)) {
        avatar.remove()
        this.avatarElements.delete(entity)
      }
    }
  }

  renderEntities({ items = [], characters = [] }) {
    let entities = [...items, ...characters]
    entities.forEach(entity => this.syncEntity(entity))
    this.removeMissingEntities(entities)
  }

  speak(entity, message) {
    let avatar = this.avatarElements.get(entity)
    if (avatar) avatar.speak(message)
  }
}

customElements.define('game-board', GameBoard)

class GameManager {
  #data = null

  constructor(gameData) {
    this.data = gameData
  }

  set data(gameData) {
    this.#data = gameData
    this.initialize()
  }

  get characters() {
    return [this.player, ...this.enemies]
  }

  initialize() {
    this.world = new World({
      columnCount: this.#data.columnCount,
      rowCount: this.#data.rowCount,
    })

    this.camera = new Camera({
      x: 0,
      y: 0,
      columnCount: 13,
      rowCount: 10,
    })

    this.player = new Player(this.#data.player)
this.enemies = this.#data.enemies.map(enemy => new Enemy(enemy))
this.items = this.#data.items.map(item => new Item(item))

    this.gameBoard = document.querySelector('game-board')
    this.gameBoard.data = {
        world: this.world,
        camera: this.camera,
    }
    this.render()
  }

  render() {
    this.gameBoard.renderEntities({
      items: this.items,
      characters: this.characters,
    })
  }

  movePlayerBy(dx, dy) {
    const nextX = this.player.x + dx
    const nextY = this.player.y + dy

    if (!this.world.contains(nextX, nextY)) {
      return { type: 'speech', actor: this.player, message: 'Edge of the world!' }
    }

    if (this.enemies.some(enemy => enemy.x === nextX && enemy.y === nextY)) {
      let enemy = this.enemies.find(enemy => enemy.x === nextX && enemy.y === nextY)
      return { type: 'speech', actor: this.player, message: `Look out! ${enemy.name}!` }
    }

    this.player.moveTo({ x: nextX, y: nextY })
    return { type: 'render' }
  }

  handleInput(key) {
    let effect = null

    if (key === 'ArrowUp') effect = this.movePlayerBy(0, -1)
    if (key === 'ArrowDown') effect = this.movePlayerBy(0, 1)
    if (key === 'ArrowLeft') effect = this.movePlayerBy(-1, 0)
    if (key === 'ArrowRight') effect = this.movePlayerBy(1, 0)

    this.render()

    if (effect?.type === 'speech') {
      this.gameBoard.speak(effect.actor, effect.message)
    }
  }
}


export {
  GameManager,
}


Object.assign(window, {
  Camera,
  World,
  Cell,
  Character,
  Player,
  Enemy,
  Item,
  BaseAvatar,
  PlayerAvatar,
  EnemyAvatar,
  ItemAvatar,
  GameCell,
  GameBoard,

})