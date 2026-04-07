class World {
  constructor({ rowCount, columnCount }) {
    this.rowCount = rowCount
    this.columnCount = columnCount
    this.grid = Array.from({ length: rowCount }, (_, y) =>
      Array.from({ length: columnCount }, (_, x) =>
        new Cell({ x, y, terrain: 'grassland' })
      )
    )
  }

  at(x, y) {
    return this.grid[y]?.[x] ?? null
  }

  isInside(x, y) {
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

class Player {
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

class Enemy {
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

class Item {
  constructor({ name, emoji, x, y }) {
    this.name = name
    this.emoji = emoji
    this.x = x
    this.y = y
  }
}


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

  set data(value) {
    this.#data = value
    this.render()
  }

  get data() {
    return this.#data
  }

  speak(message) {
    const bubble = this.querySelector('.speech-bubble')
    let messageLength = message.length
    bubble.textContent = message
    bubble.style.display = 'block'
    setTimeout(() => {
      bubble.style.display = 'none'
    }, 1000 + messageLength * 2000)
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

class GameBoard extends HTMLElement {
  #world = null

  constructor() {
    super()
    this.innerHTML = `<main id="game-board"></main>`
    this.root = this.querySelector('#game-board')
    this.cellElements = new Map()
  }

  set data(worldData) {
    this.#world = worldData
    this.render()
  }

  get data() {
    return this.#world
  }

  findAvatarForEntity(entity) {
    return this.root.querySelectorAll('player-avatar, enemy-avatar, item-avatar')
      .find?.(avatar => avatar.data === entity) ?? null
  }

  speak(entity, message) {
    const avatars = this.root.querySelectorAll('player-avatar, enemy-avatar, item-avatar')
    for (const avatar of avatars) {
      if (avatar.data === entity) {
        avatar.speak(message)
        break
      }
    }
  }

  getCellElement(x, y) {
    return this.cellElements.get(`${x},${y}`) ?? null
  }

  render() {
    if (!this.#world) return

    this.root.innerHTML = ''
    this.cellElements.clear()

    this.root.style.display = 'grid'
    this.root.style.gridTemplateColumns = `repeat(${this.#world.columnCount}, 1fr)`
    this.root.style.gridTemplateRows = `repeat(${this.#world.rowCount}, 1fr)`

    this.#world.grid.forEach(row =>
      row.forEach(cellData => {
        const cell = new GameCell()
        cell.data = cellData
        this.cellElements.set(`${cellData.x},${cellData.y}`, cell)
        this.root.append(cell)
      })
    )
  }

  clearEntities() {
    this.root
      .querySelectorAll('player-avatar, enemy-avatar, item-avatar')
      .forEach(el => el.remove())
  }

  renderItems(items) {
    items.forEach(item => {
      const cell = this.getCellElement(item.x, item.y)
      if (!cell) return

      const avatar = new ItemAvatar()
      avatar.data = item
      cell.append(avatar)
    })
  }

  renderCharacters(characters) {
    characters.forEach(character => {
      const cell = this.getCellElement(character.x, character.y)
      if (!cell) return

      const avatar = character instanceof Player
        ? new PlayerAvatar()
        : new EnemyAvatar()

      avatar.data = character
      cell.append(avatar)
    })
  }

  renderEntities({ items = [], characters = [] }) {
    this.clearEntities()
    this.renderItems(items)
    this.renderCharacters(characters)
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

    this.player = new Player({
      ...this.#data.player,
      x: 0,
      y: 0,
    })

    this.enemies = this.#data.enemies.map((enemy, index) =>
      new Enemy({
        ...enemy,
        x: index + 2,
        y: 2,
      })
    )

    this.items = this.#data.items.map((item, index) =>
      new Item({
        ...item,
        x: index + 4,
        y: 5,
      })
    )

    this.gameBoard = document.querySelector('game-board')
    this.gameBoard.data = this.world
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

    if (!this.world.isInside(nextX, nextY)) {
      return { type: 'speech', actor: this.player, message: 'Edge of the world!' }
    }

    if (this.enemies.some(enemy => enemy.x === nextX && enemy.y === nextY)) {
      return { type: 'speech', actor: this.player, message: 'Enemy ahead!' }
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