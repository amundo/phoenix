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

class BaseLayer extends HTMLElement {
  #world = null
  #camera = null

  constructor() {
    super()
    this.style.display = 'grid'
    this.style.gridColumn = '1 / -1'
    this.style.gridRow = '1 / -1'
    this.style.gridTemplateColumns = 'subgrid'
    this.style.gridTemplateRows = 'subgrid'
  }

  setContext({ world = null, camera = null } = {}) {
    this.#world = world
    this.#camera = camera
  }

  get world() {
    return this.#world
  }

  get camera() {
    return this.#camera
  }

  toLocalX(worldX) {
    return worldX - this.#camera.x
  }

  toLocalY(worldY) {
    return worldY - this.#camera.y
  }

  contains(x, y) {
    return this.#camera?.contains(x, y)
  }

  render() { }
}



class AvatarLayer extends BaseLayer {
  constructor() {
    super()
    this.avatarElements = new Map()
  }

  render({ world, camera, entities = [] }) {
    this.setContext({ world, camera })

    entities.forEach(entity => this.syncEntity(entity, camera))
    this.removeMissingEntities(entities)
  }

  syncEntity(entity, camera) {
    let avatar = this.avatarElements.get(entity)

    if (!avatar) {
      avatar = this.createAvatar(entity)
      this.avatarElements.set(entity, avatar)
      this.append(avatar)
    }

    avatar.data = entity

    const localX = this.toLocalX(entity.x)
    const localY = this.toLocalY(entity.y)

    avatar.placeAt(localX, localY)
    avatar.hidden = !camera.contains(entity.x, entity.y)
  }

  speak(entity, message) {
    const avatar = this.avatarElements.get(entity)
    if (avatar) avatar.speak(message)
  }

  removeMissingEntities(liveEntities) {
    for (const [entity, avatar] of this.avatarElements) {
      if (!liveEntities.includes(entity)) {
        avatar.remove()
        this.avatarElements.delete(entity)
      }
    }
  }

  createAvatar(entity) {
    if (entity instanceof Player) return new PlayerAvatar()
    if (entity instanceof Enemy) return new EnemyAvatar()
    return new ItemAvatar()
  }
}
customElements.define('avatar-layer', AvatarLayer)

class TerrainLayer extends BaseLayer {
  render({ world, camera }) {
    this.setContext({ world, camera })
    this.replaceChildren()

    for (let localY = 0; localY < camera.rowCount; localY++) {
      for (let localX = 0; localX < camera.columnCount; localX++) {
        const worldX = camera.x + localX
        const worldY = camera.y + localY
        const cellData = world.at(worldX, worldY)
        if (!cellData) continue

        const cell = new GameCell()
        cell.data = {
          ...cellData,
          x: localX,
          y: localY,
        }

        this.append(cell)
      }
    }
  }
}

customElements.define('terrain-layer', TerrainLayer)

class GameBoard extends HTMLElement {
  constructor() {
    super()
    this.innerHTML = `
      <terrain-layer></terrain-layer>
      <avatar-layer></avatar-layer>
    `

    this.terrainLayer = this.querySelector('terrain-layer')
    this.avatarLayer = this.querySelector('avatar-layer')
  }

  speak(entity, message) {
    this.avatarLayer.speak(entity, message)
  }

  render({ world, camera, entities }) {
    this.style.setProperty('--column-count', camera.columnCount)
    this.style.setProperty('--row-count', camera.rowCount)

    this.terrainLayer.render({ world, camera, entities })
    this.avatarLayer.render({ world, camera, entities })
  }
}
customElements.define('game-board', GameBoard)

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

  handleInput(key) {
    if (key === 'ArrowUp') this.movePlayerBy(0, -1)
    if (key === 'ArrowDown') this.movePlayerBy(0, 1)
    if (key === 'ArrowLeft') this.movePlayerBy(-1, 0)
    if (key === 'ArrowRight') this.movePlayerBy(1, 0)

    this.camera.centerOn(this.player.x, this.player.y, this.world)
    return effect
  }

  movePlayerBy(dx, dy) {
    const nextX = this.player.x + dx
    const nextY = this.player.y + dy

    if (!this.world.contains(nextX, nextY)) {
      return { 
        type: 'speech', 
        actor: this.player, 
        message: 'Edge of the world!' 
      }
    }

    this.player.moveTo({ x: nextX, y: nextY })
    return null
  }
}

class GameUI extends HTMLElement {}
customElements.define('game-ui', GameUI)

class GameApp extends HTMLElement {
  #engine = null
  #gameBoard = null
  #ui = null

  constructor() {
    super()
    this.innerHTML = `
      <game-board></game-board>
      <game-ui></game-ui>
    `

    this.#gameBoard = this.querySelector('game-board')
    this.#ui = this.querySelector('game-ui')

    this.handleKeyDown = this.handleKeyDown.bind(this)
  }

  static get observedAttributes() {
    return ['src']
  }

  get src() {
    return this.getAttribute('src')
  }

  connectedCallback() {
    if (this.src) {
      this.loadGameData(this.src)
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'src' && oldValue !== newValue && this.isConnected) {
      this.loadGameData(newValue)
    }
  }

  async loadGameData(url) {
    const gameData = await this.fetchJSON(url)
    this.start(gameData)
  }

  async fetchJSON(url) {
    const relativeUrl = new URL(url, import.meta.url)
    const response = await fetch(relativeUrl)
    return await response.json()
  }

  start(gameData) {
    this.#engine = new GameEngine(gameData)
    this.render()

    removeEventListener('keydown', this.handleKeyDown)
    addEventListener('keydown', this.handleKeyDown)
  }

  render() {
    if (!this.#engine || !this.#gameBoard) return
    this.#gameBoard.render(this.#engine.getState())
  }

  handleKeyDown(event) {
    if (!this.#engine) return

    const effect = this.#engine.handleInput(event.key)
    this.render()

    if (effect?.type === 'speech') {
      this.#gameBoard.speak(effect.actor, effect.message)
    }
  }
}

customElements.define('game-app', GameApp)

export {
  GameApp,
}
