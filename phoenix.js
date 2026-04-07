const ROW_COUNT = 15
const COLUMN_COUNT = 20

class World {
  constructor({ rowCount, columnCount }) {
    Object.assign(this, { rowCount, columnCount })
    this.grid = new Array(rowCount).fill().map((_, y) =>
      new Array(columnCount).fill().map((_, x) => {
        return { x, y }
      })
    )
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

class Enemy extends Character {
  constructor({ aggressionLevel, ...characterParameters }) {
    super(characterParameters)
    this.aggressionLevel = aggressionLevel
  }
}

class Player extends Character {
  constructor(...parameters){
    super(...parameters)
  }
}

class CharacterAvatar extends HTMLElement {
  #character = {}

  set data(characterData) {
    this.#character = characterData
    this.render()
  }

  get data() {
    return this.#character
  }

  render() {
    this.style.gridRow = this.#character.y + 1
    this.style.gridColumn = this.#character.x + 1
    this.textContent = this.#character.emoji
  }

  move({ x, y }) {
    this.#character.x = x
    this.#character.y = y
    this.render()
  }
}

class EnemyAvatar extends CharacterAvatar {}
customElements.define('enemy-avatar', EnemyAvatar)

class PlayerAvatar extends CharacterAvatar {}
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
  get data() { 
    return this.#cell 
  }
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
    console.log(`rendering`)
    this.root.innerHTML = ""

    document.documentElement.style.setProperty('--board-columns', this.data.columnCount)
    document.documentElement.style.setProperty('--board-rows', this.data.rowCount)

    this.root.style.display = "grid"
    this.root.style.gridTemplateColumns = `repeat(${this.data.columnCount}, 1fr)`
    this.root.style.gridTemplateRows = `repeat(${this.data.rowCount}, 1fr)`
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


// boot everything and start game loop
class Game {
  #gameData = null
  constructor(gameData) { 
    this.data = gameData
  }

  initialize() {
    this.world = new World({ rowCount: ROW_COUNT, columnCount: COLUMN_COUNT })

    this.gameBoard = document.querySelector('game-board')
    this.gameBoard.data = this.world
    this.gameBoard.render()
  }

  set data(gameData){
    this.#gameData = gameData
    this.initialize()
  }

  startGameLoop(){
    
  }
}


let fantasyGameData = { 
  player: {
    name: "Phoenix",
    emoji: "🐦‍🔥",
  },
  enemies: [
    {
      name: "Giant Snake",
      emoji: "🐍"
    },
    {
      name: "Giant Spider",
      emoji: "🕷"
    },
    {
      name: "Giant Giant",
      emoji: "👹"
    }
  ],
  items: [
    {
      name: "Sword",
      emoji: "🗡"
    },
    {
      name: "Shield",
      emoji: "🛡"
    },
    {
      name: "Health Potion",
      emoji: "🧪"
    },
    {
      name: "Scroll",
      emoji: "📜"
    }
  ]
}

let game = new Game()

let player = new Player({ emoji: "🐦‍🔥", name: "Phoenix" })
let playerAvatar = new PlayerAvatar()
playerAvatar.data = player

let handleKeyDown = ({ key }) => {
  console.log(key.replace('Arrow', '').toLowerCase())

}

addEventListener('keydown', handleKeyDown)
