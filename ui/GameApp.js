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

  constructor() {
    super()
    this.initializeLayout()
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleRealmChange = this.handleRealmChange.bind(this)
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
    this.#ui.onRealmChange = (realmName) => {
      this.handleRealmChange({ detail: { realmName } })
    }
    this.#ui.addEventListener('realmchange', this.handleRealmChange)
    this.append(this.#gameBoard, this.#ui)
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
      await this.loadRealmIntoGame(sharedData.world.startRealm)
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
      this.initializeLayout()
    }

    this.#engine = new GameEngine(gameData)
    this.#commandQueue = []
    this.render()
    this.#ui?.setInventory(this.#engine.player?.inventory ?? [])
    this.#ui?.setCurrentRealm(this.#currentRealmName ?? gameData.realm?.id ?? '')
    this.#ui?.setAdminData({
      realmOptions: this.getRealmOptions(),
      world: gameData.world,
      catalogs: gameData.catalogs,
      realm: {
        ...gameData.realm,
        id: this.#currentRealmName ?? gameData.realm?.id,
      },
    })
    this.startLoop()

    removeEventListener('keydown', this.handleKeyDown)
    addEventListener('keydown', this.handleKeyDown)
  }

  render() {
    if (!this.#engine || !this.#gameBoard) return
    this.#gameBoard.render(this.#engine.getState())
    this.#ui?.setInventory(this.#engine.player?.inventory ?? [])
    this.#ui?.setCurrentRealm(this.#currentRealmName ?? this.#engine?.world?.id ?? '')
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
