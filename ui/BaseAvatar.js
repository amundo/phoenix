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

customElements.define('base-avatar', BaseAvatar)
export { BaseAvatar }
