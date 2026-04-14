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

  constructor() {
    super()
    this.initializeLayout()
    this.handleKeyDown = this.handleKeyDown.bind(this)
  }

  initializeLayout() {
    this.replaceChildren()

    this.#gameBoard = new GameBoard()
    this.#ui = new GameUI()

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

  async loadGameData(dataRoot) {
    this.#isLoading = true

    try {
      const loader = new GameDataLoader(dataRoot)
      const gameData = await loader.loadGameData()
      this.start(gameData)
    } catch (error) {
      console.error('[GameApp] Failed to load game data:', error)
    } finally {
      this.#isLoading = false
    }
  }

  get engine() { // debugging helper
    return this.#engine
  }

  start(gameData) {
    this.#engine = new GameEngine(gameData)
    this.render()

    // if we are restarting, remove old listener first
    removeEventListener('keydown', this.handleKeyDown) 
    addEventListener('keydown', this.handleKeyDown)
  }

  render() {
    if (!this.#engine || !this.#gameBoard) return
    this.#gameBoard.render(this.#engine.getState())
  }

  keyToCommand(key) {
    if (key === 'ArrowUp') return { type: 'move', dx: 0, dy: -1 }
    if (key === 'ArrowDown') return { type: 'move', dx: 0, dy: 1 }
    if (key === 'ArrowLeft') return { type: 'move', dx: -1, dy: 0 }
    if (key === 'ArrowRight') return { type: 'move', dx: 1, dy: 0 }
    return null
  }

  handleKeyDown(event) {
    const command = this.keyToCommand(event.key)
    if (!command) return
    this.runCommand(command)
  }

  runCommand(command) {
    if (!this.#engine) return

    const result = this.#engine.handleCommand(command)
    this.render()
    this.handleEffects(result.effects)
  }

  handleEffects(effects = []) {
    for (const effect of effects) {
      if (effect.type === 'speak') {
        this.#gameBoard.speak(effect.actor, effect.message)
      }

      if (effect.type === 'emote') {
        console.log(`GameApp.handleEffects: ${effect.actor.id} -> ${effect.emotion}`)
        this.#gameBoard.emote(effect.actor, effect.emotion)
      }
    }
  }
}

customElements.define('game-app', GameApp)

export { GameApp }