
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

  emote(entity, emotion) {
    this.avatarLayer.emote(entity, emotion)
  }

  render({ world, camera, entities }) {
    this.style.setProperty('--column-count', camera.columnCount)
    this.style.setProperty('--row-count', camera.rowCount)

    this.terrainLayer.render({ world, camera, entities })

    this.measureTileSize()
    this.avatarLayer.render({ world, camera, entities })
  }

  measureTileSize() {
    const firstCell = this.querySelector('game-cell')
    if (!firstCell) return

    let tileSize = firstCell.getBoundingClientRect().width

    this.style.setProperty('--tile-size', `${tileSize}px`)
  }
}

customElements.define('game-board', GameBoard)

export { GameBoard }
