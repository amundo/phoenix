import { BaseAvatar } from './BaseAvatar.js'

class PlayerAvatar extends BaseAvatar {
  constructor() {
    super()
    this.id = 'player'
  }

  connectedCallback() {
    super.connectedCallback()
  }
}

customElements.define('player-avatar', PlayerAvatar)

export { PlayerAvatar }