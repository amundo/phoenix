class AdminDialog extends HTMLElement {
  #realmOptions = []
  #catalogs = null
  #game = null
  #realm = null

  constructor() {
    super()
    this.innerHTML = `
      <dialog closedby="any" class="admin-dialog">
        <form method="dialog" class="admin-shell">
          <header class="admin-header">
            <h2>Settings</h2>
            <button type="submit" class="admin-close" aria-label="Close">Close</button>
          </header>

          <label class="admin-field">
            <span>Realm</span>
            <select class="realm-select"></select>
          </label>

          <section class="admin-catalogs">
            <div class="admin-tabs" role="tablist" aria-label="Catalogs"></div>
            <div class="admin-panel">
              <div class="admin-summary"></div>
              <div class="admin-catalog-tree tree"></div>
            </div>
          </section>

          <section class="admin-data">
            <h3>Game Data</h3>
            <div class="admin-game-tree tree"></div>
          </section>
        </form>
      </dialog>
    `

    this.dialog = this.querySelector('.admin-dialog')
    this.realmSelect = this.querySelector('.realm-select')
    this.tabs = this.querySelector('.admin-tabs')
    this.summary = this.querySelector('.admin-summary')
    this.catalogTree = this.querySelector('.admin-catalog-tree')
    this.gameTree = this.querySelector('.admin-game-tree')

    this.handleRealmChange = this.handleRealmChange.bind(this)
  }

  connectedCallback() {
    this.realmSelect?.addEventListener('change', this.handleRealmChange)
  }

  disconnectedCallback() {
    this.realmSelect?.removeEventListener('change', this.handleRealmChange)
  }

  open() {
    this.dialog?.showModal()
  }

  close() {
    this.dialog?.close()
  }

  setData({ realmOptions = [], game = null, catalogs = null, realm = null } = {}) {
    this.#realmOptions = realmOptions
    this.#game = game
    this.#catalogs = catalogs
    this.#realm = realm

    this.renderRealmOptions()
    this.renderCatalogTabs()
    this.renderGameData()
  }

  handleRealmChange(event) {
    this.dispatchEvent(new CustomEvent('realmchange', {
      bubbles: true,
      detail: {
        realmName: event.target.value,
      },
    }))
  }

  renderRealmOptions() {
    if (!this.realmSelect) return

    this.realmSelect.replaceChildren(
      ...this.#realmOptions.map(({ value, label }) => {
        const option = document.createElement('option')
        option.value = value
        option.textContent = label
        return option
      })
    )

    if (this.#realm?.id) {
      this.realmSelect.value = this.#realm.id
    }
  }

  renderCatalogTabs() {
    const entries = Object.entries(this.#catalogs ?? {})
    this.tabs.replaceChildren()
    this.catalogTree.replaceChildren()
    this.summary.textContent = ''

    if (!entries.length) return

    const byName = new Map(entries)

    const selectTab = (name) => {
      const catalog = byName.get(name)
      if (!catalog) return

      for (const button of this.tabs.querySelectorAll('.admin-tab')) {
        button.setAttribute('aria-selected', String(button.dataset.catalog === name))
      }

      const items = this.getCatalogItems(catalog)
      this.summary.textContent = `${name} catalog · ${items.length} item${items.length === 1 ? '' : 's'}`
      this.catalogTree.replaceChildren(this.makeNode(name, items))
    }

    entries.forEach(([name], index) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'admin-tab'
      button.dataset.catalog = name
      button.setAttribute('role', 'tab')
      button.setAttribute('aria-selected', 'false')
      button.textContent = name
      button.addEventListener('click', () => selectTab(name))
      this.tabs.append(button)

      if (index === 0) {
        selectTab(name)
      }
    })
  }

  renderGameData() {
    const gameData = {
      game: this.#game,
      catalogs: this.#catalogs,
      realm: this.#realm,
    }

    this.gameTree.replaceChildren(this.makeNode('gameData', gameData))
  }

  getCatalogItems(catalog) {
    if (!catalog) return []
    if (typeof catalog.values === 'function') {
      return catalog.values()
    }

    return Array.from(catalog)
  }

  formatPrimitive(value) {
    if (value === null) {
      return this.makeSpan('null', 'null')
    }

    switch (typeof value) {
      case 'string':
        return this.makeSpan('string', JSON.stringify(value))
      case 'number':
        return this.makeSpan('number', String(value))
      case 'boolean':
        return this.makeSpan('boolean', String(value))
      default:
        return this.makeSpan('', String(value))
    }
  }

  makeSpan(className, text) {
    const span = document.createElement('span')
    if (className) span.className = className
    span.textContent = text
    return span
  }

  describeValue(value) {
    if (Array.isArray(value)) return `Array(${value.length})`
    if (value && typeof value === 'object') return `Object(${Object.keys(value).length})`
    if (value === null) return 'null'
    return typeof value
  }

  isPlainObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
  }

  shouldRenderAsTable(value) {
    if (!Array.isArray(value) || value.length === 0) return false
    if (!value.every(item => this.isPlainObject(item))) return false
    return this.getSharedKeys(value).length > 0
  }

  getSharedKeys(rows) {
    const keys = new Set()
    rows.forEach(row => {
      Object.keys(row).forEach(key => keys.add(key))
    })
    return [...keys]
  }

  formatCellValue(value) {
    if (value === null) return 'null'
    if (Array.isArray(value) || this.isPlainObject(value)) {
      return JSON.stringify(value)
    }
    return String(value)
  }

  makeTable(rows) {
    const columns = this.getSharedKeys(rows)
    const wrap = document.createElement('div')
    wrap.className = 'table-wrap'

    const table = document.createElement('table')
    const thead = document.createElement('thead')
    const tbody = document.createElement('tbody')
    const headRow = document.createElement('tr')

    const indexHead = document.createElement('th')
    indexHead.textContent = '(index)'
    headRow.append(indexHead)

    columns.forEach(column => {
      const th = document.createElement('th')
      th.textContent = column
      headRow.append(th)
    })

    thead.append(headRow)

    rows.forEach((row, index) => {
      const tr = document.createElement('tr')

      const indexCell = document.createElement('td')
      indexCell.textContent = String(index)
      tr.append(indexCell)

      columns.forEach(column => {
        const td = document.createElement('td')
        td.textContent = this.formatCellValue(row[column])
        tr.append(td)
      })

      tbody.append(tr)
    })

    table.append(thead, tbody)
    wrap.append(table)
    return wrap
  }

  makeNode(key, value) {
    const isObject = value && typeof value === 'object'

    if (!isObject) {
      const div = document.createElement('div')
      div.className = 'leaf'
      div.append(this.makeSpan('key', `${key}: `), this.formatPrimitive(value))
      return div
    }

    if (this.shouldRenderAsTable(value)) {
      const details = document.createElement('details')
      details.open = true

      const summary = document.createElement('summary')
      summary.append(
        this.makeSpan('key', key),
        this.makeSpan('type', ` — ${this.describeValue(value)}`)
      )

      details.append(summary, this.makeTable(value))
      return details
    }

    const details = document.createElement('details')
    details.open = key === 'gameData'

    const summary = document.createElement('summary')
    summary.append(
      this.makeSpan('key', key),
      this.makeSpan('type', ` — ${this.describeValue(value)}`)
    )

    details.append(summary)

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        details.append(this.makeNode(index, item))
      })
    } else {
      for (const [childKey, childValue] of Object.entries(value)) {
        details.append(this.makeNode(childKey, childValue))
      }
    }

    return details
  }
}

customElements.define('admin-dialog', AdminDialog)

export { AdminDialog }
