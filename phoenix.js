import { GameApp } from './ui/GameApp.js'
import { Player, Enemy } from './entities/index.js'
customElements.define('game-app', GameApp)


/* UI LAYER */

// Base avatar class that character and item avatars will extend from
class BaseAvatar extends HTMLElement {
  #data = null

  constructor() {
    super()
    this.classList.add('avatar')
    this.innerHTML = `
      <span class="avatar-emoji"></span>
      <span class="emotion-badge" hidden></span>
      <span class="speech-bubble"></span>
    `
  }

  set data(entityData) {
    this.#data = entityData
    this.render()
  }

  get data() {
    return this.#data
  }

  speak(message) {
    const bubble = this.querySelector('.speech-bubble')
    const messageLength = message.length
    bubble.textContent = message
    bubble.hidden = false
    bubble.style.position = 'absolute'
    setTimeout(() => {
      bubble.hidden = true
    }, 1000 + messageLength * 10)
  }

  emote(emotion) {
    const badge = this.querySelector('.emotion-badge')

    badge.textContent = typeof emotion === 'string'
      ? emotion
      : emotion.emoji

    badge.hidden = false

    clearTimeout(this.emoteTimeout)
    this.emoteTimeout = setTimeout(() => {
      badge.hidden = true
    }, 1200)
  }

  placeAt(localX, localY) {
    this.style.gridColumn = localX + 1
    this.style.gridRow = localY + 1
  }

  render() {
    if (!this.#data) return
    this.querySelector('.avatar-emoji').textContent = this.#data.emoji
  }
}

class PlayerAvatar extends BaseAvatar { }
class EnemyAvatar extends BaseAvatar { }
class ItemAvatar extends BaseAvatar { }

customElements.define('base-avatar', BaseAvatar)
customElements.define('player-avatar', PlayerAvatar)
customElements.define('enemy-avatar', EnemyAvatar)
customElements.define('item-avatar', ItemAvatar)

class GameCell extends HTMLElement {
  #cell = null

  constructor() {
    super()
    this.classList.add('cell')
  }

  set data(cellData) {
    this.#cell = cellData
    this.render()
  }

  get data() {
    return this.#cell
  }

  render() {
    if (!this.#cell) return
    this.style.gridColumn = this.#cell.x + 1
    this.style.gridRow = this.#cell.y + 1
    this.setAttribute('terrain', this.#cell.terrain || 'grassland')
  }
}

customElements.define('game-cell', GameCell)

class BaseLayer extends HTMLElement {
  #world = null
  #camera = null

  constructor() {
    super()
    this.style.display = 'grid'
    this.style.gridColumn = '1 / -1'
    this.style.gridRow = '1 / -1'
    this.style.gridTemplateColumns = 'subgrid'
    this.style.gridTemplateRows = 'subgrid'
  }

  setContext({ world = null, camera = null } = {}) {
    this.#world = world
    this.#camera = camera
  }

  get world() {
    return this.#world
  }

  get camera() {
    return this.#camera
  }

  toLocalX(worldX) {
    return worldX - this.#camera.x
  }

  toLocalY(worldY) {
    return worldY - this.#camera.y
  }

  contains(x, y) {
    return this.#camera?.contains(x, y)
  }

  render() { }
}



class AvatarLayer extends BaseLayer {
  constructor() {
    super()
    this.avatarElements = new Map()
  }

  render({ world, camera, entities = [] }) {
    this.setContext({ world, camera })

    entities.forEach(entity => this.syncEntity(entity, camera))
    this.removeMissingEntities(entities)
  }

  syncEntity(entity) {
    let avatar = this.avatarElements.get(entity)

    if (!avatar) {
      avatar = this.createAvatar(entity)
      this.avatarElements.set(entity, avatar)
      this.append(avatar)
    }

    avatar.data = entity

    const localX = this.toLocalX(entity.x)
    const localY = this.toLocalY(entity.y)

    avatar.placeAt(localX, localY)
    avatar.hidden = !this.camera.contains(entity.x, entity.y)
  }

  speak(entity, message) {
    const avatar = this.avatarElements.get(entity)
    if (avatar) avatar.speak(message)
  }

  emote(entity, emotion) {
    const avatar = this.avatarElements.get(entity)
    if (avatar) avatar.emote(emotion)
  }

  removeMissingEntities(liveEntities) {
    for (const [entity, avatar] of this.avatarElements) {
      if (!liveEntities.includes(entity)) {
        avatar.remove()
        this.avatarElements.delete(entity)
      }
    }
  }

  createAvatar(entity) {
    if (entity instanceof Player) return new PlayerAvatar()
    if (entity instanceof Enemy) return new EnemyAvatar()
    return new ItemAvatar()
  }
}
customElements.define('avatar-layer', AvatarLayer)

class TerrainLayer extends BaseLayer {
  render({ world, camera }) {
    this.setContext({ world, camera })
    this.replaceChildren()

    for (let localY = 0; localY < camera.rowCount; localY++) {
      for (let localX = 0; localX < camera.columnCount; localX++) {
        const worldX = camera.x + localX
        const worldY = camera.y + localY
        const cellData = world.at(worldX, worldY)
        if (!cellData) continue

        const cell = new GameCell()
        cell.data = {
          ...cellData,
          x: localX,
          y: localY,
        }

        this.append(cell)
      }
    }
  }
}

customElements.define('terrain-layer', TerrainLayer)

class GameBoard extends HTMLElement {
  constructor() {
    super()
    this.innerHTML = `
      <terrain-layer></terrain-layer>
      <avatar-layer></avatar-layer>
    `

    this.terrainLayer = this.querySelector('terrain-layer')
    this.avatarLayer = this.querySelector('avatar-layer')
  }

  speak(entity, message) {
    this.avatarLayer.speak(entity, message)
  }

  emote(entity, emotion) {
    this.avatarLayer.emote(entity, emotion)
  }

  render({ world, camera, entities }) {
    this.style.setProperty('--column-count', camera.columnCount)
    this.style.setProperty('--row-count', camera.rowCount)

    this.terrainLayer.render({ world, camera, entities })

    this.measureTileSize()
    this.avatarLayer.render({ world, camera, entities })
  }

  measureTileSize() {
    const firstCell = this.querySelector('game-cell')
    if (!firstCell) return

    let tileSize = firstCell.getBoundingClientRect().width

    this.style.setProperty('--tile-size', `${tileSize}px`)
  }
}
customElements.define('game-board', GameBoard)

