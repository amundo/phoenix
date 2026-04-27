import { TerrainSelector } from './terrain-selector/TerrainSelector.js'

class EditorToolsPanel extends HTMLElement {
  static tabLabels = {
    terrain: 'Terrain',
    entities: 'Entities',
    realm: 'Realm',
  }

  #tool = 'select'
  #toolLabel = 'Selecting entities'
  #selectedTerrain = 'grass'
  #terrainChoices = []
  #activeTab = 'terrain'
  #toolStatus = null
  #terrainSelector = null
  #toolButtons = null
  #tabButtons = null
  #tabPanels = null
  #entitiesSlot = null
  #realmSlot = null
  #utilitySlot = null

  constructor() {
    super()

    this.innerHTML = `
      <section class="ui-panel editor-sidebar-panel editor-tools-panel">
        <div class="editor-tablist" role="tablist" aria-label="Realm editor sections">
          <button type="button" class="editor-tab" data-tab="realm" role="tab" aria-selected="false">🏰 Realm</button>
          <button type="button" class="editor-tab" data-tab="entities" role="tab" aria-selected="false">👤 Entities</button>
          <button type="button" class="editor-tab" data-tab="terrain" role="tab" aria-selected="true">🗺 Terrain</button>
        </div>
        <section class="editor-tab-panel editor-tab-panel-terrain" data-panel="terrain" role="tabpanel">
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
        <section class="editor-tab-panel" data-panel="entities" role="tabpanel" hidden>
          <div class="editor-tab-slot editor-entities-slot"></div>
        </section>
        <section class="editor-tab-panel" data-panel="realm" role="tabpanel" hidden>
          <div class="editor-tab-slot editor-realm-slot"></div>
        </section>
        <section class="editor-sidebar-utility">
          <div class="editor-tab-slot editor-utility-slot"></div>
        </section>
      </section>
    `

    this.#toolStatus = this.querySelector('.editor-tool-status')
    this.#terrainSelector = this.querySelector('terrain-selector')
    this.#toolButtons = [...this.querySelectorAll('[data-tool]')]
    this.#tabButtons = [...this.querySelectorAll('[data-tab]')]
    this.#tabPanels = new Map(
      [...this.querySelectorAll('[data-panel]')]
        .map(panel => [panel.dataset.panel ?? '', panel])
    )
    this.#entitiesSlot = this.querySelector('.editor-entities-slot')
    this.#realmSlot = this.querySelector('.editor-realm-slot')
    this.#utilitySlot = this.querySelector('.editor-utility-slot')

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

    this.#tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.setActiveTab(button.dataset.tab ?? 'terrain', { emit: true })
      })
    })
  }

  setData({
    tool = 'select',
    toolLabel = 'Selecting entities',
    selectedTerrain = 'grass',
    terrainChoices = [],
    activeTab = null,
  } = {}) {
    this.#tool = tool
    this.#toolLabel = toolLabel
    this.#selectedTerrain = selectedTerrain
    this.#terrainChoices = terrainChoices

    if (activeTab) {
      this.#activeTab = activeTab
    }

    this.render()
  }

  setActiveTab(tab, { emit = false } = {}) {
    const nextTab = this.#tabPanels?.has(tab) ? tab : 'terrain'
    this.#activeTab = nextTab
    this.renderTabState()

    if (emit) {
      this.dispatchEvent(new CustomEvent('tabchange', {
        bubbles: true,
        detail: { tab: nextTab },
      }))
    }
  }

  setEntitiesContent(node) {
    this.#entitiesSlot?.replaceChildren(...(node ? [node] : []))
  }

  setRealmContent(node) {
    this.#realmSlot?.replaceChildren(...(node ? [node] : []))
  }

  setUtilityContent(node) {
    this.#utilitySlot?.replaceChildren(...(node ? [node] : []))
  }

  render() {
    this.renderToolState()
    this.renderTerrainChoices()
    this.renderTabState()
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

  renderTabState() {
    const activeLabel = EditorToolsPanel.tabLabels[this.#activeTab] ?? EditorToolsPanel.tabLabels.terrain

    this.#tabButtons?.forEach(button => {
      const isActive = button.dataset.tab === this.#activeTab
      button.setAttribute('aria-selected', String(isActive))
      button.tabIndex = isActive ? 0 : -1
      button.toggleAttribute('data-active', isActive)
      button.setAttribute('aria-label', isActive ? `${button.textContent} tab, active` : `${button.textContent} tab`)
    })

    for (const [panelName, panel] of this.#tabPanels ?? []) {
      panel.hidden = panelName !== this.#activeTab
      panel.setAttribute('aria-label', `${activeLabel} editor panel`)
    }
  }
}

customElements.define('editor-tools-panel', EditorToolsPanel)

export { EditorToolsPanel }
