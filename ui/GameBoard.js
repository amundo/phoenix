class GameBoard extends HTMLElement {
  #emotions = {}

  constructor() {
    super()
    this.innerHTML = `
      <terrain-layer></terrain-layer>
      <avatar-layer></avatar-layer>
      <effect-layer></effect-layer>
    `

    this.terrainLayer = this.querySelector('terrain-layer')
    this.avatarLayer = this.querySelector('avatar-layer')
    this.effectLayer = this.querySelector('effect-layer')
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

  _emote(entity, emotion) {
    this.avatarLayer.emote(entity, emotion)
  }

  emote(entity, emotionName) {
    if (!emotion) return
    if (!animation) return
    
    const emotion = this.catalogs.emotions.find(e => e.name === emotionName)

    const animation = this.catalogs.animations.find(
      a => a.name === emotion.animation
    )

    const tileSize = parseFloat(
      getComputedStyle(this).getPropertyValue('--tile-size')
    )

    this.effectLayer.showEmote(entity, emotion, {
      camera: this.camera,
      tileSize: this.tileSize,
      animation
    })
  }

  _render(gameState) {
    const { camera, catalogs } = gameState
    this.style.setProperty('--column-count', camera.columnCount)
    this.style.setProperty('--row-count', camera.rowCount)

    this.terrainLayer.render(gameState)
    this.measureTileSize()

    this.avatarLayer.render(gameState)
  }

  render(gameState) {
    const { camera, catalogs } = gameState

    this.camera = camera
    this.catalogs = catalogs

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

    this.tileSize = tileSize
    this.style.setProperty('--tile-size', `${tileSize}px`)
  }
}

customElements.define('game-board', GameBoard)
export { GameBoard }