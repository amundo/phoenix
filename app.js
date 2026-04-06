const ROW_COUNT = 10
const COLUMN_COUNT = 13

class World {
  constructor({ rowCount, columnCount }) {
    Object.assign(this, { rowCount, columnCount })
    this.grid = new Array(rowCount).fill().map((rowIndex, y) =>
      new Array(columnCount).fill().map((columnIndex, x) => {
        return { x, y }
      })
    )
  }
}
class Player {
  constructor({ name, emoji, x, y }) {
    Object.assign(this, { name, emoji, x, y })
  }
}

class PlayerAvatar extends HTMLElement {
  #player = {}
  constructor() {
    super()
  }
  set data(playerData) { this.#player = playerData }
  get data() { return this.#player }
  render() {
    this.style.gridRow = this.#player.y
    this.style.gridColumn = this.#player.x
    this.textContent = this.#player.emoji
  }
  move({ x, y }) {

  }
}
customElements.define('player-avatar', PlayerAvatar)

class Cell {
  constructor({ x, y }) {
    this.x = x
    this.y = y
    this.items = []
    this.terrain = null
  }
}
class GameCell extends HTMLElement {
  #cell = {}
  constructor() {
    super()
  }
  set data(cellData) {
    this.#cell = cellData
  }
  get data() { return this.#cell }
}

class GameBoard extends HTMLElement {
  #world = {}
  constructor() {
    super()
    this.innerHTML = `<main id=game-board></main>`
    this.root = this.querySelector('#game-board')
  }
  set data(worldData) {
    this.#world = worldData
    this.render()
  }
  get data() {
    return this.#world
  }
  render() {
    this.root.innerHTML = ""

    this.root.style.display = "grid"
    this.root.style.gridTemplateColumns = `repeat(${this.#world.columnCount}, 1fr)`
    this.root.style.gridTemplateRows = `repeat(${this.#world.rowCount}, 1fr)`
    this.root.style.height = "100%"
    this.root.style.width = "100%"

    this.#world.grid.forEach(worldRow =>
      worldRow.forEach(({ x, y }) => {
        const cell = document.createElement("div")
        cell.classList.add("cell")
        cell.style.gridColumn = x + 1
        cell.style.gridRow = y + 1
        this.root.appendChild(cell)
      })
    )
  }
  place({ x, y }) {

  }
}
customElements.define('game-board', GameBoard)

const world = new World({ rowCount: ROW_COUNT, columnCount: COLUMN_COUNT })
const gameBoard = document.querySelector('game-board')
gameBoard.data = world

// boot everything and start game loop
class Game {
  constructor() {

  }
  initialize() {

  }
}

let player = new Player({ emoji: "🐦‍🔥", name: "Phoenix" })
let playerAvatar = new PlayerAvatar()
playerAvatar.data = player

let handleKeyDown = ({ key }) => {
  console.log(key.replace('Arrow', '').toLowerCase())

}

addEventListener('keydown', handleKeyDown)
