import { getTerrainPalette } from './getTerrainPalette.js'

class TerrainSelector extends HTMLElement {
  #data = []
  #selectedTerrain = ''

  constructor() {
    super()
  }

  async fetch(url) {
    let response = await fetch(url)
    let data = await response.json()
    this.data = data
  }

  connectedCallback() {
    this.render()
  }

  static get observedAttributes() {
    return ['src']
  }

  attributeChangedCallback(attribute, oldValue, newValue) {
    if (attribute === 'src' && newValue && oldValue !== newValue) {
      this.fetch(newValue)
    }
  }

  set data(data) {
    if (typeof data?.values === 'function' && !Array.isArray(data)) {
      this.#data = Array.from(data.values())
    } else {
      this.#data = Array.isArray(data) ? data : []
    }
    this.render()
  }

  get data() {
    return this.#data
  }

  set selectedTerrain(value) {
    this.#selectedTerrain = value ?? ''
    this.render()
  }

  get selectedTerrain() {
    return this.#selectedTerrain
  }

  renderTerrainCard(terrain) {
    const card = document.createElement('button')
    card.type = 'button'
    card.classList.add('terrain-card')
    card.toggleAttribute('aria-pressed', terrain.id === this.#selectedTerrain)
    card.dataset.terrainId = terrain.id ?? ''

    const palette = getTerrainPalette(terrain)

    const swatch = document.createElement('div')
    swatch.className = 'color-swatch'
    swatch.style.background = `
      linear-gradient(
        180deg,
        oklch(${palette.lightness1}% ${palette.chroma1} ${palette.hue1}deg),
        oklch(${palette.lightness2}% ${palette.chroma2} ${palette.hue2}deg)
      )
    `

    const name = document.createElement('h3')
    name.className = 'terrain-name'
    name.textContent = terrain.name ?? terrain.id ?? 'Unknown terrain'

    const description = document.createElement('p')
    description.className = 'terrain-description'
    description.textContent = terrain.description ?? 'No description.'

    card.title = terrain.category
      ? `${terrain.name ?? terrain.id} (${terrain.category})`
      : terrain.name ?? terrain.id ?? 'Unknown terrain'

    card.append(swatch, name, description)
    card.addEventListener('click', () => this.selectTerrain(terrain))
    return card
  }

  render() {
    this.replaceChildren(...this.#data.map(terrain => this.renderTerrainCard(terrain)))
  }

  selectTerrain(terrain) {
    this.#selectedTerrain = terrain?.id ?? ''
    this.render()
    this.dispatchEvent(new CustomEvent('terrainselect', {
      bubbles: true,
      detail: {
        terrainId: terrain?.id ?? '',
        terrain,
      },
    }))
  }
}

export { TerrainSelector }
customElements.define('terrain-selector', TerrainSelector)
