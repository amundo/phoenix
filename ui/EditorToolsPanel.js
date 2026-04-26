import { TerrainSelector } from './terrain-selector/TerrainSelector.js'

class EditorToolsPanel extends HTMLElement {
  #tool = 'select'
  #toolLabel = 'Selecting entities'
  #selectedTerrain = 'grass'
  #terrainChoices = []
  #toolStatus = null
  #terrainSelector = null
  #toolButtons = null

  constructor() {
    super()

    this.innerHTML = `
      <section class="ui-panel editor-sidebar-panel editor-tools-panel">
        <h2>Terrain</h2>
        <div class="editor-toolbar-group">
          <button type="button" class="editor-action" data-tool="select">Select</button>
          <button type="button" class="editor-action" data-tool="paint-terrain">Paint Terrain</button>
        </div>
        <div class="editor-tool-status" aria-live="polite"></div>
        <div class="editor-toolbar-field">
          <span>Terrain Palette</span>
        </div>
        <terrain-selector class="editor-terrain-selector"></terrain-selector>
      </section>
    `

    this.#toolStatus = this.querySelector('.editor-tool-status')
    this.#terrainSelector = this.querySelector('terrain-selector')
    this.#toolButtons = [...this.querySelectorAll('[data-tool]')]

    this.#terrainSelector?.addEventListener('terrainselect', event => {
      this.dispatchEvent(new CustomEvent('terrainchange', {
        bubbles: true,
        detail: { terrain: event.detail?.terrainId ?? '' },
      }))
    })

    this.#toolButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('toolchange', {
          bubbles: true,
          detail: { tool: button.dataset.tool ?? 'select' },
        }))
      })
    })
  }

  setData({
    tool = 'select',
    toolLabel = 'Selecting entities',
    selectedTerrain = 'grass',
    terrainChoices = [],
  } = {}) {
    this.#tool = tool
    this.#toolLabel = toolLabel
    this.#selectedTerrain = selectedTerrain
    this.#terrainChoices = terrainChoices
    this.render()
  }

  render() {
    this.renderToolState()
    this.renderTerrainChoices()
  }

  renderToolState() {
    this.#toolButtons?.forEach(button => {
      button.toggleAttribute('aria-pressed', button.dataset.tool === this.#tool)
    })

    if (this.#toolStatus) {
      this.#toolStatus.textContent = `Mode: ${this.#toolLabel}`
      this.#toolStatus.dataset.tool = this.#tool
    }
  }

  renderTerrainChoices() {
    if (!this.#terrainSelector) return
    this.#terrainSelector.data = this.#terrainChoices
    this.#terrainSelector.selectedTerrain = this.#selectedTerrain
  }
}

customElements.define('editor-tools-panel', EditorToolsPanel)

export { EditorToolsPanel }
