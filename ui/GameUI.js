import { AdminDialog } from './AdminDialog.js'

class GameUI extends HTMLElement {
  onRealmChange = null

  constructor() {
    super()
    this.innerHTML = `
      <section id="inventory">
        <h2>Inventory</h2>
        <div class="current-realm"></div>
        <div id="inventory-items"></div>
      </section>
      <button type="button" class="admin-launch">Admin</button>
      <admin-dialog></admin-dialog>
    `

    this.adminDialog = this.querySelector('admin-dialog')
    this.querySelector('.admin-launch')?.addEventListener('click', () => {
      this.adminDialog?.open()
    })

    this.adminDialog?.addEventListener('realmchange', event => {
      this.onRealmChange?.(event.detail?.realmName)
      this.dispatchEvent(new CustomEvent('realmchange', {
        bubbles: true,
        detail: event.detail,
      }))
    })
  }

  setInventory(items) {
    const container = this.querySelector('#inventory-items')
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
  }

  setAdminData(data) {
    this.adminDialog?.setData(data)
  }
}
customElements.define('game-ui', GameUI)

export { GameUI }
