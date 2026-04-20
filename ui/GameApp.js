import { GameEngine } from '../engine/GameEngine.js'
import { GameDataLoader } from '../engine/GameDataLoader.js'
import { GameBoard } from './GameBoard.js'
import { GameUI } from './GameUI.js'

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

  constructor() {
    super()
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleRealmChange = this.handleRealmChange.bind(this)
    this.initializeLayout()
  }

  enqueueCommand(command) {
    this.#commandQueue.push(command)
  }

  startLoop() {
    if (this.#loopId) return

    this.#loopId = setInterval(() => {
      this.step()
    }, 250)
  }

  stopLoop() {
    if (!this.#loopId) return
    clearInterval(this.#loopId)
    this.#loopId = null
  }

  step() {
    if (!this.#engine) return

    const commands = this.#commandQueue.splice(0)
    const result = this.#engine.update(commands)

    if (result.stateChanged) {
      this.#gameBoard.render(this.#engine.getState())
      this.#ui?.setInventory(this.#engine.player?.inventory ?? [])
      this.syncAdminData()
    }

    this.handleEffects(result.effects)
  }

  initializeLayout() {
    if (this.#ui) {
      this.#ui.removeEventListener('realmchange', this.handleRealmChange)
    }

    this.replaceChildren()
    this.#gameBoard = new GameBoard()
    this.#ui = new GameUI()
    this.#ui.mountStageContent(this.#gameBoard)
    this.#ui.addEventListener('realmchange', this.handleRealmChange)
    this.append(this.#ui)
  }

  get src() {
    const value = this.getAttribute('src')
    if (!value) return null
    return new URL(value, document.baseURI).href
  }

  connectedCallback() {
    this.#hasConnected = true

    if (this.src && !this.#engine && !this.#isLoading) {
      this.loadGameData(this.src)
    }
  }

  disconnectedCallback() {
    this.stopLoop()
    removeEventListener('keydown', this.handleKeyDown)
  }

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

  get engine() {
    return this.#engine
  }

  start(gameData) {
    if (this.#engine) {
      this.stopLoop()
      this.initializeLayout()
    }

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

  render() {
    if (!this.#engine || !this.#gameBoard) return
    this.#gameBoard.render(this.#engine.getState())
    this.#ui?.setInventory(this.#engine.player?.inventory ?? [])
    this.#ui?.setCurrentRealm(this.#currentRealmName ?? this.#engine?.realmMap?.id ?? '')
    this.syncAdminData()
  }

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

  handleKeyDown(event) {
    if (!this.#engine) return

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

  async loadRealmIntoGame(realmName) {
    if (!realmName || !this.#loader || !this.#sharedData) return

    const realm = await this.#loader.loadRealm(realmName)
    this.#currentRealmName = realmName

    this.start({
      ...this.#sharedData,
      realm,
    })
  }

  getRealmOptions() {
    return Object.keys(this.#index?.realms ?? {}).map(realmName => ({
      value: realmName,
      label: realmName,
    }))
  }
}

customElements.define('game-app', GameApp)

export { GameApp }
