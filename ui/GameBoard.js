class GameBoard extends HTMLElement {
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

  speak(entity, message) {
    this.avatarLayer.speak(entity, message)
  }

  emote(entity, emotionName) {
    console.log(`GameBoard.emote: ${entity.id} -> ${emotionName}`)
    const emotion = this.catalogs.emotions.get(emotionName)

    if (!emotion) return

    const animation = this.catalogs.animations.get(emotion.animation)
    if (!animation) return

    this.effectLayer.showEmote(entity, emotion, animation)
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

    this.effectLayer.context = {
      camera: this.camera,
      tileSize: this.tileSize,
    }
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