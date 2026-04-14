class GameBoard extends HTMLElement {
  #emotions = {}

  constructor() {
    super()
    this.innerHTML = `
      <terrain-layer></terrain-layer>
      <avatar-layer></avatar-layer>
    `

    this.terrainLayer = this.querySelector('terrain-layer')
    this.avatarLayer = this.querySelector('avatar-layer')
  }

  get emotions() {
    return this.#emotions
  }

  set emotions(emotions) {
    this.#emotions = emotions ?? {}
  }

  speak(entity, message) {
    this.avatarLayer.speak(entity, message)
  }

  emote(entity, emotion) {
    this.avatarLayer.emote(entity, emotion)
  }

  render(gameState) {
    const { camera, catalogs } = gameState
    this.style.setProperty('--column-count', camera.columnCount)
    this.style.setProperty('--row-count', camera.rowCount)

    this.terrainLayer.render(gameState)
    this.measureTileSize()

    this.avatarLayer.render(gameState)
  }

  measureTileSize() {
    const firstCell = this.querySelector('game-cell')
    if (!firstCell) return

    const tileSize = firstCell.getBoundingClientRect().width
    this.style.setProperty('--tile-size', `${tileSize}px`)
  }
}

customElements.define('game-board', GameBoard)
export { GameBoard }