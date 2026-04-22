import { GameEngine } from '../engine/GameEngine.js'
import { Camera } from '../engine/Camera.js'
import { GameBoard } from './GameBoard.js'

class RealmEditor extends HTMLElement {
  #draft = null
  #game = null
  #catalogs = null
  #engine = null
  #board = null
  #selectedRef = null
  #sourceRealm = null
  #camera = null
  #tool = 'select'

  constructor() {
    super()
    this.tabIndex = 0

    this.#board = new GameBoard()
    this.#board.addEventListener('avatarselect', event => {
      this.selectEntity(event.detail?.entity)
    })
    this.#board.addEventListener('click', event => {
      this.handleBoardClick(event)
    })

    this.innerHTML = `
      <section class="realm-editor-shell">
        <div class="realm-editor-toolbar">
          <div class="editor-toolbar-group">
            <button type="button" class="editor-action save-draft">Save</button>
            <button type="button" class="editor-action cancel-draft">Cancel</button>
          </div>
          <div class="editor-toolbar-group editor-nav-controls" aria-label="Map navigation">
            <button type="button" class="editor-icon-action pan-up" aria-label="Pan up">↑</button>
            <button type="button" class="editor-icon-action pan-left" aria-label="Pan left">←</button>
            <button type="button" class="editor-icon-action pan-down" aria-label="Pan down">↓</button>
            <button type="button" class="editor-icon-action pan-right" aria-label="Pan right">→</button>
            <button type="button" class="editor-action center-player">Player</button>
          </div>
          <div class="editor-toolbar-group">
            <button type="button" class="editor-action add-item">Add Item</button>
            <button type="button" class="editor-action add-bot">Add Bot</button>
            <button type="button" class="editor-action place-player" data-tool="place-player" aria-pressed="false">Place Player</button>
          </div>
          <div class="editor-camera-status" aria-live="polite"></div>
        </div>
        <div class="realm-editor-board"></div>
      </section>
    `

    this.querySelector('.realm-editor-board')?.append(this.#board)
    this.querySelector('.save-draft')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('draftsave', {
        bubbles: true,
        detail: { realm: structuredClone(this.#draft) },
      }))
    })
    this.querySelector('.cancel-draft')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('draftcancel', {
        bubbles: true,
      }))
    })
    this.querySelector('.pan-up')?.addEventListener('click', () => this.panCamera(0, -1))
    this.querySelector('.pan-left')?.addEventListener('click', () => this.panCamera(-1, 0))
    this.querySelector('.pan-down')?.addEventListener('click', () => this.panCamera(0, 1))
    this.querySelector('.pan-right')?.addEventListener('click', () => this.panCamera(1, 0))
    this.querySelector('.center-player')?.addEventListener('click', () => this.centerCameraOnPlayer())
    this.querySelector('.add-item')?.addEventListener('click', () => this.addEntity('items'))
    this.querySelector('.add-bot')?.addEventListener('click', () => this.addEntity('bots'))
    this.querySelector('.place-player')?.addEventListener('click', () => this.setTool('place-player'))
    this.addEventListener('keydown', event => this.handleKeyDown(event))
    this.addEventListener('click', () => this.focus())
  }

  setData({ game = null, catalogs = null, realm = null } = {}) {
    this.#game = game
    this.#catalogs = catalogs
    this.#sourceRealm = realm
    this.#draft = structuredClone(realm)
    this.#camera = this.createEditorCamera(this.#draft)
    this.#selectedRef = null
    this.setTool('select')
    this.renderDraft()
    this.showEmptyInspector()
  }

  get draft() {
    return this.#draft
  }

  renderDraft() {
    if (!this.#draft || !this.#catalogs) return

    this.#engine = new GameEngine({
      game: this.#game,
      catalogs: this.#catalogs,
      realm: this.#draft,
    })
    this.#engine.camera = this.#camera
    this.#board.render(this.#engine.getState())
    this.updateCameraStatus()
  }

  createEditorCamera(realm) {
    const cameraData = realm.camera ?? {}
    return new Camera({
      x: cameraData.x ?? 0,
      y: cameraData.y ?? 0,
      columnCount: cameraData.columnCount ?? Math.min(realm.columnCount ?? 8, 12),
      rowCount: cameraData.rowCount ?? Math.min(realm.rowCount ?? 6, 8),
    })
  }

  handleKeyDown(event) {
    const keys = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    }

    const delta = keys[event.key]
    if (!delta) return

    event.preventDefault()
    this.panCamera(delta[0], delta[1])
  }

  panCamera(dx, dy) {
    if (!this.#camera || !this.#engine?.realmMap) return

    const maxX = Math.max(0, this.#engine.realmMap.columnCount - this.#camera.columnCount)
    const maxY = Math.max(0, this.#engine.realmMap.rowCount - this.#camera.rowCount)
    this.#camera.x = Math.max(0, Math.min(this.#camera.x + dx, maxX))
    this.#camera.y = Math.max(0, Math.min(this.#camera.y + dy, maxY))
    this.renderDraft()
  }

  centerCameraOnPlayer() {
    if (!this.#camera || !this.#engine?.realmMap || !this.#draft?.entities?.player) return
    const { x = 0, y = 0 } = this.#draft.entities.player
    this.#camera.centerOn(Number(x), Number(y), this.#engine.realmMap)
    this.renderDraft()
  }

  updateCameraStatus() {
    const status = this.querySelector('.editor-camera-status')
    if (!status || !this.#camera || !this.#engine?.realmMap) return

    status.textContent =
      `View ${this.#camera.x},${this.#camera.y} of ${this.#engine.realmMap.columnCount}×${this.#engine.realmMap.rowCount}`
  }

  setTool(tool) {
    this.#tool = tool
    this.querySelectorAll('[data-tool]').forEach(button => {
      button.toggleAttribute('aria-pressed', button.dataset.tool === tool)
    })
  }

  handleBoardClick(event) {
    const cell = event.target.closest?.('game-cell')
    if (!cell?.data) return

    if (this.#tool === 'place-player') {
      this.movePlayerTo(cell.data.worldX, cell.data.worldY)
      this.setTool('select')
    }
  }

  movePlayerTo(x, y) {
    if (!this.#draft?.entities?.player) return
    this.#draft.entities.player.x = x
    this.#draft.entities.player.y = y
    this.renderDraft()
    this.selectDraftRef({
      label: 'Player',
      entity: this.#draft.entities.player,
      collection: 'player',
    })
  }

  addEntity(collection) {
    if (!this.#draft?.entities) return
    this.#draft.entities[collection] ??= []

    const entity = collection === 'bots'
      ? this.createBot()
      : this.createItem()

    this.#draft.entities[collection].push(entity)
    this.renderDraft()
    this.selectDraftRef({
      label: collection === 'bots' ? 'Bot' : 'Item',
      collection,
      index: this.#draft.entities[collection].length - 1,
      entity,
    })
  }

  createItem() {
    const { x, y } = this.getVisibleCenter()
    const index = (this.#draft.entities.items?.length ?? 0) + 1
    return {
      id: `item-${index}`,
      kind: 'item',
      name: `Item ${index}`,
      emoji: '📦',
      x,
      y,
      portable: false,
      solid: false,
    }
  }

  createBot() {
    const { x, y } = this.getVisibleCenter()
    const index = (this.#draft.entities.bots?.length ?? 0) + 1
    return {
      id: `bot-${index}`,
      kind: 'bot',
      name: `Bot ${index}`,
      emoji: '🙂',
      x,
      y,
      speech: '',
    }
  }

  getVisibleCenter() {
    return {
      x: this.#camera.x + Math.floor(this.#camera.columnCount / 2),
      y: this.#camera.y + Math.floor(this.#camera.rowCount / 2),
    }
  }

  selectEntity(runtimeEntity) {
    const ref = this.findDraftEntity(runtimeEntity)
    if (!ref) {
      this.showEmptyInspector('This avatar comes from generated map scenery and is not directly editable yet.')
      return
    }

    this.#selectedRef = ref
    this.dispatchInspector(this.buildInspector(ref))
  }

  selectDraftRef(ref) {
    this.#selectedRef = ref
    this.dispatchInspector(this.buildInspector(ref))
  }

  findDraftEntity(runtimeEntity) {
    if (!runtimeEntity || !this.#draft?.entities) return null

    if (runtimeEntity === this.#engine?.player) {
      return {
        label: 'Player',
        entity: this.#draft.entities.player,
        collection: 'player',
      }
    }

    const collections = [
      ['bots', 'Bot', this.#engine?.bots],
      ['items', 'Item', this.#engine?.items],
      ['scenery', 'Scenery', this.#engine?.scenery],
    ]

    for (const [collection, label, runtimeItems] of collections) {
      const draftItems = this.#draft.entities[collection]
      if (!Array.isArray(runtimeItems) || !Array.isArray(draftItems)) continue

      const index = runtimeItems.indexOf(runtimeEntity)

      if (index >= 0 && draftItems[index]) {
        return {
          label,
          collection,
          index,
          entity: draftItems[index],
        }
      }
    }

    return null
  }

  showEmptyInspector(message = 'Click an avatar to edit its source entity.') {
    const panel = document.createElement('section')
    panel.className = 'ui-panel editor-inspector'
    panel.innerHTML = `
      <h2>Editor</h2>
      <p class="status-empty"></p>
    `
    panel.querySelector('p').textContent = message
    this.dispatchInspector(panel)
  }

  dispatchInspector(node) {
    this.dispatchEvent(new CustomEvent('editorinspect', {
      bubbles: true,
      detail: { node },
    }))
  }

  buildInspector(ref) {
    const { entity } = ref
    const panel = document.createElement('section')
    panel.className = 'ui-panel editor-inspector'

    const title = document.createElement('h2')
    title.textContent = ref.label
    panel.append(title)

    const form = document.createElement('form')
    form.className = 'editor-form'
    form.addEventListener('submit', event => event.preventDefault())

    for (const field of this.getEditableFields(ref)) {
      form.append(this.createField(entity, field))
    }

    const markupField = document.createElement('label')
    markupField.className = 'editor-field editor-field-markup'

    const markupLabel = document.createElement('span')
    markupLabel.textContent = 'Entity Markup'

    const markupInput = document.createElement('textarea')
    markupInput.spellcheck = false
    markupInput.value = this.entityToMarkup(ref)
    markupInput.addEventListener('change', () => {
      try {
        this.applySelectedMarkup(markupInput.value)
        markupInput.classList.remove('is-invalid')
      } catch {
        markupInput.classList.add('is-invalid')
      }
    })

    markupField.append(markupLabel, markupInput)
    form.append(markupField)
    panel.append(form)
    return panel
  }

  getEditableFields(ref) {
    const fields = [
      { key: 'id', type: 'text' },
      { key: 'kind', type: 'text' },
      { key: 'name', type: 'text' },
      { key: 'emoji', type: 'text' },
      { key: 'x', type: 'number' },
      { key: 'y', type: 'number' },
    ]

    if (ref.collection === 'items' || ref.collection === 'scenery') {
      fields.push(
        { key: 'portable', type: 'checkbox' },
        { key: 'solid', type: 'checkbox' },
      )
    }

    return fields
  }

  createField(entity, field) {
    const label = document.createElement('label')
    label.className = 'editor-field'

    const text = document.createElement('span')
    text.textContent = field.key

    const input = document.createElement('input')
    input.name = field.key
    input.type = field.type

    if (field.type === 'checkbox') {
      input.checked = Boolean(entity[field.key])
    } else {
      input.value = entity[field.key] ?? ''
    }

    input.addEventListener('input', () => {
      this.updateSelectedField(field.key, this.readFieldValue(input, field))
    })

    label.append(text, input)
    return label
  }

  readFieldValue(input, field) {
    if (field.type === 'checkbox') return input.checked
    if (field.type === 'number') return Number(input.value)
    return input.value
  }

  updateSelectedField(key, value) {
    const ref = this.#selectedRef
    if (!ref) return
    ref.entity[key] = value
    this.renderDraft()
  }

  replaceSelectedEntity(nextEntity) {
    const ref = this.#selectedRef
    if (!ref) return

    if (ref.collection === 'player') {
      this.#draft.entities.player = nextEntity
      ref.entity = this.#draft.entities.player
    } else {
      this.#draft.entities[ref.collection][ref.index] = nextEntity
      ref.entity = this.#draft.entities[ref.collection][ref.index]
    }

    this.renderDraft()
    this.dispatchInspector(this.buildInspector(ref))
  }

  applySelectedMarkup(markup) {
    const ref = this.#selectedRef
    if (!ref) return

    const parsed = this.parseEntityMarkup(markup, ref)
    this.replaceSelectedEntity({
      ...ref.entity,
      ...parsed,
    })
  }

  parseEntityMarkup(markup, ref) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(`<realm>${markup}</realm>`, 'text/html')
    const el = doc.body.querySelector('player, bot, item')

    if (!el) {
      throw new Error('Use a <player>, <bot>, or <item> tag.')
    }

    const expected = this.getMarkupTag(ref)
    if (el.tagName.toLowerCase() !== expected) {
      throw new Error(`Use a <${expected}> tag for this ${ref.label.toLowerCase()}.`)
    }

    const next = {}

    for (const field of this.getEditableFields(ref)) {
      if (!el.hasAttribute(field.key)) continue
      next[field.key] = this.readAttributeValue(el.getAttribute(field.key), field)
    }

    const speech = el.querySelector('speech')?.textContent?.trim()
    if (speech && ref.collection === 'bots') {
      next.speech = speech
    }

    return next
  }

  readAttributeValue(value, field) {
    if (field.type === 'number') return Number(value)
    if (field.type === 'checkbox') return value === 'true'
    return value
  }

  entityToMarkup(ref) {
    const tag = this.getMarkupTag(ref)
    const entity = ref.entity
    const attrs = this.getEditableFields(ref)
      .filter(field => entity[field.key] !== undefined && entity[field.key] !== null && entity[field.key] !== '')
      .map(field => `${field.key}="${this.escapeAttribute(entity[field.key])}"`)
      .join(' ')
    const openTag = attrs ? `<${tag} ${attrs}>` : `<${tag}>`

    if (tag === 'bot' && entity.speech) {
      return `${openTag}\n  <speech>${this.escapeText(entity.speech)}</speech>\n</${tag}>`
    }

    return `${openTag}\n</${tag}>`
  }

  getMarkupTag(ref) {
    if (ref.collection === 'player') return 'player'
    if (ref.collection === 'bots') return 'bot'
    return 'item'
  }

  escapeAttribute(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
  }

  escapeText(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
  }
}

customElements.define('realm-editor', RealmEditor)

export { RealmEditor }
