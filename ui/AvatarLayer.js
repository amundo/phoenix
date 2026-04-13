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
    if (entity instanceof Item) return new ItemAvatar()
  }
}
customElements.define('avatar-layer', AvatarLayer)

export { AvatarLayer }
