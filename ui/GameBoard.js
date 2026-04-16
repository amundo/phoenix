class GameBoard extends HTMLElement {
  static emotionAliases = {
    confused: 'confusion',
    curious: 'curiosity',
    disgusted: 'disgust',
    surprised: 'surprise',
  }

  constructor() {
    super()
    this.innerHTML = `
      <terrain-layer></terrain-layer>
      <effect-layer></effect-layer>
      <avatar-layer></avatar-layer>
    `

    this.terrainLayer = this.querySelector('terrain-layer')
    this.avatarLayer = this.querySelector('avatar-layer')
    this.effectLayer = this.querySelector('effect-layer')

    this.catalogs = null
    this.camera = null
    this.tileSize = null
  }

  speak(entity, message) {
    this.avatarLayer.speak(entity, message)
  }

  emote(entity, emotionName) {
    if (!this.catalogs) return

    const emotion = this.resolveEmotion(emotionName)
    if (!emotion) return

    const animation = this.resolveAnimation(emotion)

    this.effectLayer.showEmote(entity, emotion, animation)
  }

  render(gameState) {
    const { camera, catalogs } = gameState

    if (!this.catalogs) {
      this.catalogs = catalogs
      this.avatarLayer.setCatalogs(catalogs)
    }

    this.camera = camera

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

    this.tileSize = firstCell.getBoundingClientRect().width
    this.style.setProperty('--tile-size', `${this.tileSize}px`)
  }

  resolveEmotion(emotionName) {
    const emotionCatalog = this.catalogs?.emotions
    if (!emotionCatalog || !emotionName) return null

    return (
      emotionCatalog.get(emotionName) ??
      emotionCatalog.get(GameBoard.emotionAliases[emotionName]) ??
      null
    )
  }

  resolveAnimation(emotion) {
    const animationCatalog = this.catalogs?.animations
    if (!animationCatalog) return null

    const animationName =
      emotion?.animation ??
      (emotion?.arousal >= 0.6 ? 'burst' : 'float-up')

    return (
      animationCatalog.get(animationName) ??
      animationCatalog.get('float-up') ??
      animationCatalog.get('burst') ??
      null
    )
  }
}

customElements.define('game-board', GameBoard)
export { GameBoard }
