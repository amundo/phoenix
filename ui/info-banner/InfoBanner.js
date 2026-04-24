import { SpeechBubble } from '../speech-bubble/SpeechBubble.js'

class InfoBanner extends SpeechBubble {
  connectedCallback() {
    if (!this.hasAttribute('animation')) {
      this.setAttribute('animation', 'type')
    }

    super.connectedCallback()
  }

  getTiming(letterCount) {
    const totalCap = 1200
    const minStagger = 22
    const maxStagger = 52

    const stagger = Math.max(
      minStagger,
      Math.min(maxStagger, totalCap / Math.max(letterCount, 1))
    )

    return {
      duration: 220,
      stagger,
    }
  }

  getKeyframes(name) {
    if (name === 'type') {
      return [
        { transform: 'translateY(0.16em)', opacity: 0 },
        { transform: 'translateY(0)', opacity: 1 },
      ]
    }

    return super.getKeyframes(name)
  }
}

customElements.define('info-banner', InfoBanner)

export { InfoBanner }
