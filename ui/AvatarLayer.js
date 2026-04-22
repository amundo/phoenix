import { BaseLayer } from './BaseLayer.js'

import { PlayerAvatar } from './PlayerAvatar.js'
import { BotAvatar } from './BotAvatar.js'
import { ItemAvatar } from './ItemAvatar.js'
import { SceneryAvatar } from './SceneryAvatar.js'

import { Player } from '../entities/index.js'
import { Bot } from '../entities/index.js'
import { Item } from '../entities/index.js'
import { Scenery } from '../entities/index.js'

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
    const { realmMap, camera, entities, catalogs } = gameState
    this.setContext({ realmMap, camera })
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
    let avatar = null

    if (entity instanceof Scenery) avatar = new SceneryAvatar()
    if (entity instanceof Player) avatar = new PlayerAvatar()
    if (entity instanceof Bot) avatar = new BotAvatar()
    if (entity instanceof Item) avatar = new ItemAvatar()

    if (avatar) {
      avatar.addEventListener('click', event => {
        event.stopPropagation()
        avatar.dispatchEvent(new CustomEvent('avatarselect', {
          bubbles: true,
          composed: true,
          detail: { entity },
        }))
      })
      return avatar
    }

    throw new Error(`No avatar class for entity: ${entity?.constructor?.name}`)
  }
}

customElements.define('avatar-layer', AvatarLayer)
export { AvatarLayer }
