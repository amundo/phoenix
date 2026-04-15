import { BaseLayer } from './BaseLayer.js'

import { PlayerAvatar } from './PlayerAvatar.js'
import { EnemyAvatar } from './EnemyAvatar.js'
import { ItemAvatar } from './ItemAvatar.js'

import { Player } from '../entities/index.js'
import { Enemy } from '../entities/index.js'
import { Item } from '../entities/index.js'

class AvatarLayer extends BaseLayer {
  constructor() {
    super()
    this.avatarElements = new Map()
    this.catalogs = {}
  }

  setCatalogs(catalogs) {
    this.catalogs = catalogs
  }

  render(gameState) {
    const { world, camera, entities, catalogs } = gameState
    this.setContext({ world, camera })
    this.catalogs = catalogs

    entities.forEach(entity => this.syncEntity(entity))
    this.removeMissingEntities(entities)
  }

  syncEntity(entity) {
    let avatar = this.avatarElements.get(entity)

    if (!avatar) {
      avatar = this.createAvatar(entity)
      avatar.emotions = this.emotions
      this.avatarElements.set(entity, avatar)
      this.append(avatar)
    }

    avatar.emotions = this.emotions
    avatar.data = entity

    const localX = this.toLocalX(entity.x)
    const localY = this.toLocalY(entity.y)

    avatar.placeAt(localX, localY)
    avatar.hidden = !this.camera.contains(entity.x, entity.y)
  }

  speak(entity, message) {
    const avatar = this.avatarElements.get(entity)
    if (typeof avatar?.speak === 'function') {
      avatar.speak(message)
    }
  }

  emote(entity, emotionName) {
    const avatar = this.avatarElements.get(entity)
    if (!avatar) return

    const emotion = this.emotionCatalog?.byName?.[emotionName]

    if (!emotion) return
    const animation =
      this.animationCatalog?.byName?.[emotion.animation ?? 'burst'] ?? null

    avatar.showEmotion({ emotion, animation })
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
    if (entity instanceof Item) return new ItemAvatar()
    throw new Error(`No avatar class for entity: ${entity?.constructor?.name}`)
  }
}

customElements.define('avatar-layer', AvatarLayer)
export { AvatarLayer }
