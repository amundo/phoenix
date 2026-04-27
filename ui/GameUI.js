class GameUI extends HTMLElement {
  #infoMessageTimer = null
  #infoFadeTimer = null
  #defaultInfoMessage = 'Walk the world and discover what is here.'
  #slotMap = null

  constructor() {
    super()
    this.innerHTML = `
      <header class="game-header">
        <div class="ui-panel header-panel">
          <label class="realm-picker">
            <span>Realm</span>
            <select class="realm-select"></select>
          </label>
          <div class="mode-indicator" role="status" aria-live="polite" hidden>
            <span class="mode-dot"></span>
            <span class="mode-label">Editing</span>
          </div>
          <button type="button" class="edit-realm-button editor-link" aria-label="Edit your realm">✏️</button>
        </div>
      </header>
      <aside class="game-sidebar game-sidebar-left">
        <div class="sidebar-slot sidebar-slot-left"></div>
      </aside>
      <main class="game-stage">
        <section class="stage-frame">
          <div class="stage-slot"></div>
        </section>
      </main>
      <aside class="game-sidebar game-sidebar-right">
        <div class="sidebar-slot sidebar-slot-right"></div>
      </aside>
      <footer class="game-footer">
        <div class="footer-slot"></div>
      </footer>
    `

    this.realmSelect = this.querySelector('.realm-select')
    this.stageSlot = this.querySelector('.stage-slot')
    this.leftSidebarSlot = this.querySelector('.sidebar-slot-left')
    this.rightSidebarSlot = this.querySelector('.sidebar-slot-right')
    this.footerSlot = this.querySelector('.footer-slot')
    this.#slotMap = {
      stage: this.stageSlot,
      leftSidebar: this.leftSidebarSlot,
      rightSidebar: this.rightSidebarSlot,
      footer: this.footerSlot,
    }

    this.handleRealmChange = this.handleRealmChange.bind(this)

    this.querySelector('.editor-link')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('editoropen', { bubbles: true }))
    })
    this.realmSelect?.addEventListener('change', this.handleRealmChange)

    this.restorePlayPanels()
  }

  disconnectedCallback() {
    this.realmSelect?.removeEventListener('change', this.handleRealmChange)
    this.clearInfoMessageTimers()
  }

  handleRealmChange(event) {
    const realmName = event.target.value
    this.dispatchEvent(new CustomEvent('realmchange', {
      bubbles: true,
      detail: { realmName },
    }))
  }

  mountContent(slotName, node) {
    const slot = this.#slotMap?.[slotName]
    if (!slot || !node) return
    slot.replaceChildren(node)
  }

  mountStageContent(node) {
    this.mountContent('stage', node)
  }

  mountLeftSidebarContent(node) {
    this.mountContent('leftSidebar', node)
  }

  mountRightSidebarContent(node) {
    this.mountContent('rightSidebar', node)
  }

  mountFooterContent(node) {
    this.mountContent('footer', node)
  }

  restorePlayPanels() {
    this.mountLeftSidebarContent(this.createInventoryPanel())
    this.mountRightSidebarContent(this.createStatusPanel())
    this.mountFooterContent(this.createFooterPanel())
  }

  createPanel({ className, id = '', html }) {
    const panel = document.createElement('section')
    panel.className = className
    if (id) {
      panel.id = id
    }
    panel.innerHTML = html
    return panel
  }

  createInventoryPanel() {
    return this.createPanel({
      id: 'inventory',
      className: 'ui-panel',
      html: `
        <h2>Inventory</h2>
        <div class="current-realm"></div>
        <div id="inventory-items"></div>
      `,
    })
  }

  createStatusPanel() {
    return this.createPanel({
      className: 'ui-panel status-panel',
      html: `
        <h2>Status</h2>
        <p class="status-empty">Health, quests, and other status widgets can live here.</p>
      `,
    })
  }

  createFooterPanel() {
    return this.createPanel({
      className: 'ui-panel footer-panel',
      html: `
        <div class="info-banner-shell" hidden>
          <info-banner
            class="info-banner"
            role="status"
            aria-live="polite"
          >${this.#defaultInfoMessage}</info-banner>
        </div>
      `,
    })
  }

  clearInfoMessageTimers() {
    if (this.#infoMessageTimer) {
      clearTimeout(this.#infoMessageTimer)
      this.#infoMessageTimer = null
    }

    if (this.#infoFadeTimer) {
      clearTimeout(this.#infoFadeTimer)
      this.#infoFadeTimer = null
    }
  }

  setMode(mode) {
    const isEditing = mode === 'editor'
    this.querySelector('.editor-link')?.toggleAttribute('hidden', isEditing)
    this.querySelector('.mode-indicator')?.toggleAttribute('hidden', !isEditing)
    this.classList.toggle('is-editing', isEditing)
  }

  setInventory(items) {
    const container = this.querySelector('#inventory-items')
    if (!container) return
    container.replaceChildren(...items.map(item => this.createInventoryItem(item)))
  }

  createInventoryItem(item) {
    const element = document.createElement('div')
    element.className = 'inventory-item'

    if (item.kind) {
      element.dataset.kind = item.kind
    }

    if (item.category) {
      element.dataset.category = item.category
    }

    element.title = item.description ?? item.name ?? item.kind ?? ''

    element.append(
      this.createTextElement('span', 'inventory-item-emoji', item.emoji ?? '📦'),
      this.createTextElement('span', 'inventory-item-name', item.name ?? item.kind ?? 'Unknown item'),
    )

    if (item.category) {
      element.append(this.createTextElement('span', 'inventory-item-category', item.category))
    }

    return element
  }

  setCurrentRealm(realmName) {
    const label = this.querySelector('.current-realm')
    if (!label) return
    label.textContent = realmName ? `Realm: ${realmName}` : ''
    if (this.realmSelect && realmName) {
      this.realmSelect.value = realmName
    }
  }

  setRealmOptions(realmOptions = []) {
    if (!this.realmSelect) return

    this.realmSelect.replaceChildren(
      ...realmOptions.map(({ value, label }) => this.createOption(value, label))
    )
  }

  createTextElement(tagName, className, text) {
    const element = document.createElement(tagName)
    element.className = className
    element.textContent = text
    return element
  }

  createOption(value, label) {
    const option = document.createElement('option')
    option.value = value
    option.textContent = label
    return option
  }

  setAdminData(data) {
    this.setRealmOptions(data?.realmOptions ?? [])
    this.setCurrentRealm(data?.realm?.id ?? '')
  }

  setDefaultInfoMessage(message) {
    this.#defaultInfoMessage = message || 'Walk the world and discover what is here.'
  }

  setInfoMessage(message) {
    const bubble = this.querySelector('.info-banner')
    const shell = this.querySelector('.info-banner-shell')
    if (!bubble || !shell) return

    const nextMessage = message || this.#defaultInfoMessage
    this.clearInfoMessageTimers()
    shell.hidden = false
    shell.classList.remove('is-fading')
    bubble.setText?.(nextMessage)

    const visibleDuration = Math.max(4800, 2200 + nextMessage.length * 90)
    const fadeDuration = 520

    this.#infoFadeTimer = setTimeout(() => {
      shell.classList.add('is-fading')
      this.#infoFadeTimer = null
    }, visibleDuration)

    this.#infoMessageTimer = setTimeout(() => {
      shell.hidden = true
      shell.classList.remove('is-fading')
      this.#infoMessageTimer = null
    }, visibleDuration + fadeDuration)
  }
}
customElements.define('game-ui', GameUI)

export { GameUI }
