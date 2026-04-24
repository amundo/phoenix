import { AdminDialog } from './AdminDialog.js'

class GameUI extends HTMLElement {
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
          <details class="game-menu">
            <summary class="menu-toggle" aria-label="Open menu">☰</summary>
            <div class="menu-panel">
              <button type="button" class="menu-action editor-link">🖋 Edit your realm!</button>
              <button type="button" class="menu-action admin-link">🔬 Admin Inspector</button>
            </div>
          </details>
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
      <admin-dialog></admin-dialog>
    `

    this.adminDialog = this.querySelector('admin-dialog')
    this.menu = this.querySelector('.game-menu')
    this.realmSelect = this.querySelector('.realm-select')
    this.stageSlot = this.querySelector('.stage-slot')
    this.leftSidebarSlot = this.querySelector('.sidebar-slot-left')
    this.rightSidebarSlot = this.querySelector('.sidebar-slot-right')
    this.footerSlot = this.querySelector('.footer-slot')

    this.handleRealmChange = this.handleRealmChange.bind(this)

    this.querySelector('.editor-link')?.addEventListener('click', () => {
      this.closeMenu()
      this.dispatchEvent(new CustomEvent('editoropen', { bubbles: true }))
    })
    this.querySelector('.admin-link')?.addEventListener('click', () => {
      this.closeMenu()
      this.adminDialog?.open()
    })
    this.realmSelect?.addEventListener('change', this.handleRealmChange)

    this.adminDialog?.addEventListener('realmchange', event => {
      if (this.realmSelect) {
        this.realmSelect.value = event.detail?.realmName ?? ''
      }
      this.dispatchEvent(new CustomEvent('realmchange', {
        bubbles: true,
        detail: event.detail,
      }))
    })

    this.restorePlayPanels()
  }

  disconnectedCallback() {
    this.realmSelect?.removeEventListener('change', this.handleRealmChange)
  }

  handleRealmChange(event) {
    const realmName = event.target.value
    this.dispatchEvent(new CustomEvent('realmchange', {
      bubbles: true,
      detail: { realmName },
    }))
  }

  closeMenu() {
    if (this.menu) {
      this.menu.open = false
    }
  }

  mountStageContent(node) {
    if (!this.stageSlot || !node) return
    this.stageSlot.replaceChildren(node)
  }

  mountLeftSidebarContent(node) {
    if (!this.leftSidebarSlot || !node) return
    this.leftSidebarSlot.replaceChildren(node)
  }

  mountRightSidebarContent(node) {
    if (!this.rightSidebarSlot || !node) return
    this.rightSidebarSlot.replaceChildren(node)
  }

  mountFooterContent(node) {
    if (!this.footerSlot || !node) return
    this.footerSlot.replaceChildren(node)
  }

  restorePlayPanels() {
    this.mountLeftSidebarContent(this.createInventoryPanel())
    this.mountRightSidebarContent(this.createStatusPanel())
    this.mountFooterContent(this.createFooterPanel())
  }

  createInventoryPanel() {
    const panel = document.createElement('section')
    panel.id = 'inventory'
    panel.className = 'ui-panel'
    panel.innerHTML = `
      <h2>Inventory</h2>
      <div class="current-realm"></div>
      <div id="inventory-items"></div>
    `
    return panel
  }

  createStatusPanel() {
    const panel = document.createElement('section')
    panel.className = 'ui-panel status-panel'
    panel.innerHTML = `
      <h2>Status</h2>
      <p class="status-empty">Health, quests, and other status widgets can live here.</p>
    `
    return panel
  }

  createFooterPanel() {
    const panel = document.createElement('section')
    panel.className = 'ui-panel footer-panel'
    panel.innerHTML = `
      <p class="footer-copy">footer</p>
    `
    return panel
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
    container.replaceChildren()

    items.forEach(item => {
      const element = document.createElement('div')
      element.className = 'inventory-item'

      if (item.kind) {
        element.dataset.kind = item.kind
      }

      if (item.category) {
        element.dataset.category = item.category
      }

      element.title = item.description ?? item.name ?? item.kind ?? ''

      const emoji = document.createElement('span')
      emoji.className = 'inventory-item-emoji'
      emoji.textContent = item.emoji ?? '📦'

      const name = document.createElement('span')
      name.className = 'inventory-item-name'
      name.textContent = item.name ?? item.kind ?? 'Unknown item'

      element.append(emoji, name)

      if (item.category) {
        const category = document.createElement('span')
        category.className = 'inventory-item-category'
        category.textContent = item.category
        element.append(category)
      }

      container.append(element)
    })
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
      ...realmOptions.map(({ value, label }) => {
        const option = document.createElement('option')
        option.value = value
        option.textContent = label
        return option
      })
    )
  }

  setAdminData(data) {
    this.setRealmOptions(data?.realmOptions ?? [])
    this.setCurrentRealm(data?.realm?.id ?? '')
    this.adminDialog?.setData(data)
  }
}
customElements.define('game-ui', GameUI)

export { GameUI }
