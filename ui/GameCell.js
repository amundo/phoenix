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
    const palette = this.getTerrainPalette(terrainDefinition)
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

  getTerrainPalette(terrainDefinition) {
    const hue = Number(terrainDefinition?.oklchHue ?? 132)
    const category = terrainDefinition?.category ?? 'field'
    const isWalkable = terrainDefinition?.walkable !== false

    const profile = {
      field: {
        lightness1: 70,
        lightness2: 62,
        chroma1: 0.12,
        chroma2: 0.1,
        lightnessVariance: 4,
        chromaVariance: 0.012,
        hueVariance: 9,
      },
      forest: {
        lightness1: 56,
        lightness2: 46,
        chroma1: 0.1,
        chroma2: 0.08,
        lightnessVariance: 4,
        chromaVariance: 0.012,
        hueVariance: 8,
      },
      water: {
        lightness1: 64,
        lightness2: 54,
        chroma1: 0.16,
        chroma2: 0.14,
        lightnessVariance: 4,
        chromaVariance: 0.012,
        hueVariance: 7,
      },
      earth: {
        lightness1: 66,
        lightness2: 56,
        chroma1: 0.08,
        chroma2: 0.07,
        lightnessVariance: 4,
        chromaVariance: 0.009,
        hueVariance: 6,
      },
      road: {
        lightness1: 64,
        lightness2: 56,
        chroma1: 0.06,
        chroma2: 0.05,
        lightnessVariance: 3,
        chromaVariance: 0.007,
        hueVariance: 5,
      },
      structure: {
        lightness1: 58,
        lightness2: 48,
        chroma1: 0.05,
        chroma2: 0.04,
        lightnessVariance: 3,
        chromaVariance: 0.006,
        hueVariance: 5,
      },
      rock: {
        lightness1: 62,
        lightness2: 52,
        chroma1: 0.03,
        chroma2: 0.02,
        lightnessVariance: 3,
        chromaVariance: 0.004,
        hueVariance: 4,
      },
      cold: {
        lightness1: 92,
        lightness2: 86,
        chroma1: 0.03,
        chroma2: 0.02,
        lightnessVariance: 2,
        chromaVariance: 0.003,
        hueVariance: 4,
      },
      hazard: {
        lightness1: 58,
        lightness2: 44,
        chroma1: 0.18,
        chroma2: 0.15,
        lightnessVariance: 5,
        chromaVariance: 0.014,
        hueVariance: 8,
      },
    }[category] ?? {
      lightness1: 70,
      lightness2: 62,
      chroma1: 0.12,
      chroma2: 0.1,
      lightnessVariance: 4,
      chromaVariance: 0.012,
      hueVariance: 8,
    }

    if (isWalkable || category === 'hazard') {
      return {
        ...profile,
        hue1: hue,
        hue2: hue - Math.max(4, Math.round(profile.hueVariance * 0.8)),
      }
    }

    return {
      ...profile,
      lightness1: profile.lightness1 - 12,
      lightness2: profile.lightness2 - 12,
      chroma1: Math.max(0.02, profile.chroma1 - 0.01),
      chroma2: Math.max(0.015, profile.chroma2 - 0.01),
      hue1: hue,
      hue2: hue - Math.max(4, Math.round(profile.hueVariance * 0.8)),
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
