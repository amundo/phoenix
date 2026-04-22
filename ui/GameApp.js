import { GameEngine } from '../engine/GameEngine.js'
import { GameDataLoader } from '../engine/GameDataLoader.js'
import { GameBoard } from './GameBoard.js'
import { GameUI } from './GameUI.js'
import { RealmEditor } from './RealmEditor.js'

/*

This is the main application component for the game. 

It has these responsibilities: 

1. load data
2. create the UI
3. listen for keyboard input
4. run the update loop
5. route engine effects to the board

*/

class GameApp extends HTMLElement {
  #engine = null
  #gameBoard = null
  #hasConnected = false
  #isLoading = false
  #ui = null
  #commandQueue = []
  #loopId = null
  #loader = null
  #sharedData = null
  #index = null
  #currentRealmName = null
  #currentRealm = null
  #realmEditor = null
  #isEditing = false

  constructor() {
    super()

    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleRealmChange = this.handleRealmChange.bind(this)
    this.handleEditorOpen = this.handleEditorOpen.bind(this)
    this.handleEditorInspect = this.handleEditorInspect.bind(this)
    this.handleDraftSave = this.handleDraftSave.bind(this)
    this.handleDraftCancel = this.handleDraftCancel.bind(this)

    this.initializeLayout()
  }

  // Resolve the data root URL from the element's `src` attribute.
  get src() {
    const value = this.getAttribute('src')
    if (!value) return null
    return new URL(value, document.baseURI).href
  }

  // Expose the current engine instance for debugging and external inspection.
  get engine() {
    return this.#engine
  }

  // Start loading game data once the custom element enters the document.
  connectedCallback() {
    this.#hasConnected = true

    if (this.src && !this.#engine && !this.#isLoading) {
      this.loadGameData(this.src)
    }
  }

  // Stop active listeners and loops when the app leaves the document.
  disconnectedCallback() {
    this.stopLoop()
    removeEventListener('keydown', this.handleKeyDown)
  }

  get ui(){ return this.#ui }

  // Build the UI shell and mount a fresh board into the stage.
  initializeLayout() {
    if (this.#ui) {
      this.#ui.removeEventListener('realmchange', this.handleRealmChange)
      this.#ui.removeEventListener('editoropen', this.handleEditorOpen)
    }

    this.replaceChildren()
    this.#gameBoard = new GameBoard()
    this.#ui = new GameUI()
    this.#ui.mountStageContent(this.#gameBoard)
    this.#ui.addEventListener('realmchange', this.handleRealmChange)
    this.#ui.addEventListener('editoropen', this.handleEditorOpen)
    this.append(this.#ui)
  }

  // Load the shared index/catalog data, then load the configured start realm.
  async loadGameData(dataRoot) {
    this.#isLoading = true

    try {
      this.#loader = new GameDataLoader(dataRoot)
      const [index, sharedData] = await Promise.all([
        this.#loader.loadIndex(),
        this.#loader.loadSharedData(),
      ])
      this.#index = index
      this.#sharedData = sharedData
      await this.loadRealmIntoGame(sharedData.game.startRealm)
    } catch (error) {
      console.error('[GameApp] Failed to load game data:', error)
    } finally {
      this.#isLoading = false
    }
  }

  // Create a new engine from game data and start rendering/updating it.
  start(gameData) {
    if (this.#engine) {
      this.stopLoop()
      this.initializeLayout()
    }

    this.#isEditing = false
    this.#realmEditor = null
    this.#engine = new GameEngine(gameData)
    this.#currentRealm = gameData.realm
    this.#commandQueue = []
    this.render()
    this.#ui?.setInventory(this.#engine.player?.inventory ?? [])
    this.#ui?.setCurrentRealm(this.#currentRealmName ?? gameData.realm?.id ?? '')
    this.syncAdminData(gameData.realm)
    this.startLoop()

    removeEventListener('keydown', this.handleKeyDown)
    addEventListener('keydown', this.handleKeyDown)
  }

  handleEditorOpen() {
    if (!this.#sharedData || !this.#currentRealm) return

    this.stopLoop()
    removeEventListener('keydown', this.handleKeyDown)

    this.#isEditing = true
    this.#realmEditor = new RealmEditor()
    this.#realmEditor.addEventListener('editorinspect', this.handleEditorInspect)
    this.#realmEditor.addEventListener('draftsave', this.handleDraftSave)
    this.#realmEditor.addEventListener('draftcancel', this.handleDraftCancel)
    this.#realmEditor.setData({
      game: this.#sharedData.game,
      catalogs: this.#sharedData.catalogs,
      realm: this.#currentRealm,
    })

    this.#ui?.setMode('editor')
    this.#ui?.mountStageContent(this.#realmEditor)
  }

  handleDraftCancel() {
    if (!this.#currentRealm || !this.#sharedData) return

    this.start({
      ...this.#sharedData,
      realm: this.#currentRealm,
    })
  }

  handleEditorInspect(event) {
    this.#ui?.mountRightSidebarContent(event.detail?.node)
  }

  handleDraftSave(event) {
    if (!event.detail?.realm || !this.#sharedData) return

    this.#currentRealm = event.detail.realm
    this.start({
      ...this.#sharedData,
      realm: this.#currentRealm,
    })
  }

  // Respond to realm selector changes by loading the requested realm.
  async handleRealmChange(event) {
    const realmName = event.detail?.realmName
    if (!realmName || !this.#loader || !this.#sharedData) return
    if (realmName === this.#currentRealmName && this.#engine) return

    this.#isLoading = true

    try {
      await this.loadRealmIntoGame(realmName)
    } catch (error) {
      console.error('[GameApp] Failed to switch realm:', error)
    } finally {
      this.#isLoading = false
    }
  }

  // Fetch a realm JSON file and restart the app with that realm.
  async loadRealmIntoGame(realmName) {
    if (!realmName || !this.#loader || !this.#sharedData) return

    const realm = await this.#loader.loadRealm(realmName)
    this.#currentRealmName = realmName

    this.start({
      ...this.#sharedData,
      realm,
    })
  }

  // Return realm selector options from the loaded data index.
  getRealmOptions() {
    return Object.keys(this.#index?.realms ?? {}).map(realmName => ({
      value: realmName,
      label: realmName,
    }))
  }

  // Start the fixed interval that advances the engine.
  startLoop() {
    if (this.#loopId) return

    this.#loopId = setInterval(() => {
      this.step()
    }, 250)
  }

  // Stop the active engine update interval.
  stopLoop() {
    if (!this.#loopId) return
    clearInterval(this.#loopId)
    this.#loopId = null
  }

  // Advance the engine one tick and apply any changed state or effects.
  step() {
    if (!this.#engine || this.#isEditing) return

    const commands = this.#commandQueue.splice(0)
    const result = this.#engine.update(commands)

    if (result.stateChanged) {
      this.#gameBoard.render(this.#engine.getState())
      this.#ui?.setInventory(this.#engine.player?.inventory ?? [])
      this.syncAdminData()
    }

    this.handleEffects(result.effects)
  }

  // Add a player or system command to be processed on the next tick.
  enqueueCommand(command) {
    this.#commandQueue.push(command)
  }

  // Render the current engine state into the board and side UI.
  render() {
    if (!this.#engine || !this.#gameBoard) return
    this.#gameBoard.render(this.#engine.getState())
    this.#ui?.setInventory(this.#engine.player?.inventory ?? [])
    this.#ui?.setCurrentRealm(this.#currentRealmName ?? this.#engine?.realmMap?.id ?? '')
    this.syncAdminData()
  }

  // Send the current game, realm, catalog, and runtime data into the admin dialog.
  syncAdminData(realm = null) {
    if (!this.#ui || !this.#engine) return
    const currentRealm = realm ?? this.#currentRealm

    this.#ui.setAdminData({
      realmOptions: this.getRealmOptions(),
      game: this.#sharedData?.game ?? null,
      catalogs: this.#engine.catalogs,
      realm: {
        ...(currentRealm ?? {}),
        id: this.#currentRealmName ?? currentRealm?.id,
      },
      runtime: {
        player: this.#engine.player,
        bots: this.#engine.bots,
        items: this.#engine.items,
        scenery: this.#engine.scenery,
        camera: this.#engine.camera,
      },
    })
  }

  // Convert keyboard input into engine commands.
  handleKeyDown(event) {
    if (!this.#engine || this.#isEditing) return

    const actor = this.#engine.player
    let command = null

    if (event.key === 'ArrowUp') {
      command = { type: 'move', actor, dx: 0, dy: -1 }
    }

    if (event.key === 'ArrowDown') {
      command = { type: 'move', actor, dx: 0, dy: 1 }
    }

    if (event.key === 'ArrowLeft') {
      command = { type: 'move', actor, dx: -1, dy: 0 }
    }

    if (event.key === 'ArrowRight') {
      command = { type: 'move', actor, dx: 1, dy: 0 }
    }

    if (event.key === ' ') {
      command = { type: 'interact', actor }
    }

    if (command) {
      event.preventDefault()
      this.enqueueCommand(command)
    }
  }

  // Route engine effects to the board's speech and emote layers.
  handleEffects(effects = []) {
    for (const effect of effects) {
      if (effect.type === 'speak') {
        this.#gameBoard.speak(effect.actor, effect.message)
      }

      if (effect.type === 'emote') {
        this.#gameBoard.emote(effect.actor, effect.emotion)
      }
    }
  }
}

customElements.define('game-app', GameApp)

export { GameApp }
