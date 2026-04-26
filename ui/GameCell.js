import { getTerrainPalette } from './terrain-selector/getTerrainPalette.js'

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
    this.setAttribute('terrain', this.#cell.terrain || 'grass')
    this.applyTerrainVariation()
  }

  applyTerrainVariation() {
    const {
      terrain = 'grass',
      terrainDefinition = null,
      worldX = this.#cell.x,
      worldY = this.#cell.y
    } = this.#cell
    const seed = this.hash(worldX, worldY, terrain)
    const palette = getTerrainPalette(terrainDefinition)
    const values = this.getVariationValues(seed, palette)

    this.style.setProperty('--terrain-base-lightness-1', `${palette.lightness1}%`)
    this.style.setProperty('--terrain-base-lightness-2', `${palette.lightness2}%`)
    this.style.setProperty('--terrain-base-chroma-1', `${palette.chroma1}`)
    this.style.setProperty('--terrain-base-chroma-2', `${palette.chroma2}`)
    this.style.setProperty('--terrain-base-hue-1', `${palette.hue1}deg`)
    this.style.setProperty('--terrain-base-hue-2', `${palette.hue2}deg`)
    this.style.setProperty('--terrain-lightness-delta', `${values.lightness}%`)
    this.style.setProperty('--terrain-chroma-delta', `${values.chroma}`)
    this.style.setProperty('--terrain-hue-delta', `${values.hue}deg`)
  }

  getVariationValues(seed, palette) {
    const centered = (offset) => this.randomFromSeed(seed + offset) - 0.5

    return {
      lightness: centered(5) * palette.lightnessVariance,
      chroma: centered(17) * palette.chromaVariance,
      hue: centered(29) * palette.hueVariance,
    }
  }

  hash(x, y, terrain) {
    let value = x * 374761393 + y * 668265263

    for (const char of terrain) {
      value = Math.imul(value ^ char.charCodeAt(0), 1274126177)
    }

    return value >>> 0
  }

  randomFromSeed(seed) {
    const next = Math.imul(seed ^ 0x9e3779b9, 1597334677) >>> 0
    return next / 0xffffffff
  }
}

customElements.define('game-cell', GameCell)

export { GameCell }
