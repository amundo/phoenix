class BaseAvatar extends HTMLElement {
  #data = null
  #emotions = {}

  constructor() {
    super()
    this.classList.add('avatar')
    this.innerHTML = `
      <span class="avatar-emoji"></span>
      <span class="emotion-badge" hidden></span>
      <span class="speech-bubble" hidden></span>
    `
  }

  get data() {
    return this.#data
  }

  set data(entityData) {
    this.#data = entityData
    this.render()
  }

  get emotions() {
    return this.#emotions
  }

  set emotions(mapping) {
    this.#emotions = mapping ?? {}
  }

  connectedCallback() {
    this.render()
  }

  speak(message) {
    const bubble = this.querySelector('.speech-bubble')
    if (!bubble) return

    bubble.textContent = message
    bubble.hidden = false
    bubble.style.position = 'absolute'

    const messageLength = message.length
    setTimeout(() => {
      bubble.hidden = true
    }, 1000 + messageLength * 10)
  }

  fadeOutBadge(badge) {
    badge.getAnimations().forEach(animation => animation.cancel())

    badge.style.opacity = '1'
    badge.style.transform = 'translate(0, 0) scale(1)'

    const animation = badge.animate(
      [
        {
          opacity: 1,
          translate: '0 0',
          scale: '1',
        },
        {
          opacity: 0,
          translate: '-0.8em -0.8em',
          scale: '1.8',
        }
      ],
      {
        duration: 800,
        iterations: 3,
        easing: 'ease-out',
        fill: 'forwards',
      }
    )

    animation.onfinish = () => {
      badge.hidden = true
      badge.style.opacity = ''
      badge.style.transform = ''
    }
  }

  showEmotion({ emotion, animation }) {
    const badge = this.querySelector('.emotion-badge')
    if (!badge) return

    badge.textContent = emotion.emoji ?? '❓'
    badge.hidden = false

    if (animation) {
      this.playAnimation(badge, animation)
    }
  }

  placeAt(localX, localY) {
    this.style.gridColumn = localX + 1
    this.style.gridRow = localY + 1
  }

  render() {
    if (!this.data) return

    const avatarEmoji = this.querySelector('.avatar-emoji')
    if (avatarEmoji) {
      avatarEmoji.textContent = this.data.emoji ?? '🙂'
    }
  }
}

customElements.define('base-avatar', BaseAvatar)

export { BaseAvatar }