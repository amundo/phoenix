class SpeechBubble extends HTMLElement {
  #text = ''
  #cleanupTimer = null

  static get observedAttributes() {
    return ['animation']
  }

  connectedCallback() {
    if (!this.dataset.ready) {
      this.#text = this.textContent ?? ''
      this.renderPlainText()
      this.dataset.ready = 'true'
    }

    requestAnimationFrame(() => this.play())
  }

  disconnectedCallback() {
    this.clearCleanupTimer()
    this.cancelLetterAnimations()
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'animation' && oldValue !== newValue && this.isConnected) {
      requestAnimationFrame(() => this.play())
    }
  }

  get animationName() {
    return this.getAttribute('animation') || 'float'
  }

  get letterSpans() {
    return [...this.querySelectorAll('.letter')]
  }

  get textValue() {
    return this.#text
  }

  buildAnimatedFragment() {
    const fragment = document.createDocumentFragment()

    const wordSegmenter = new Intl.Segmenter(undefined, {
      granularity: 'word'
    })

    const characterSegmenter = new Intl.Segmenter(undefined, {
      granularity: 'grapheme'
    })

    for (const { segment, isWordLike } of wordSegmenter.segment(this.#text)) {
      if (!isWordLike) {
        // spaces, punctuation, etc.
        fragment.append(document.createTextNode(segment))
        continue
      }

      const word = document.createElement('span')
      word.className = 'word'
      word.setAttribute('aria-hidden', 'true')

      for (const { segment: character } of characterSegmenter.segment(segment)) {
        const letter = document.createElement('span')
        letter.className = 'letter'
        letter.textContent = character
        letter.setAttribute('aria-hidden', 'true')
        word.append(letter)
      }

      fragment.append(word)
    }

    return fragment
  }

  getTiming(letterCount) {
    const totalCap = 700
    const minStagger = 10
    const maxStagger = 36

    const stagger = Math.max(
      minStagger,
      Math.min(maxStagger, totalCap / Math.max(letterCount, 1))
    )

    return {
      duration: 180,
      stagger
    }
  }

  getKeyframes(name) {
    switch (name) {
      case 'pop':
        return [
          { transform: 'scale(0.6)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1 }
        ]

      case 'fade':
        return [
          { opacity: 0 },
          { opacity: 1 }
        ]

      case 'float':
      default:
        return [
          { transform: 'translateY(-0.45em)', opacity: 0 },
          { transform: 'translateY(0)', opacity: 1 }
        ]
    }
  }

  renderPlainText() {
    this.cancelLetterAnimations()
    this.replaceChildren(document.createTextNode(this.#text))
    this.setAttribute('aria-label', this.#text)
  }

  renderAnimatedText() {
    this.replaceChildren(this.buildAnimatedFragment())
    this.setAttribute('aria-label', this.#text)
  }

  cancelLetterAnimations() {
    for (const letter of this.letterSpans) {
      letter.getAnimations().forEach(animation => animation.cancel())
    }
  }

  clearCleanupTimer() {
    if (this.#cleanupTimer) {
      clearTimeout(this.#cleanupTimer)
      this.#cleanupTimer = null
    }
  }

  play() {
    if (!this.#text) {
      this.renderPlainText()
      return
    }

    this.clearCleanupTimer()
    this.renderAnimatedText()

    const letters = this.letterSpans
    const { duration, stagger } = this.getTiming(letters.length)
    const keyframes = this.getKeyframes(this.animationName)

    letters.forEach((letter, index) => {
      letter.getAnimations().forEach(animation => animation.cancel())

      letter.animate(keyframes, {
        duration,
        delay: index * stagger,
        easing: 'ease-out',
        fill: 'both'
      })
    })

    const totalDuration = duration + Math.max(0, letters.length - 1) * stagger
    this.#cleanupTimer = setTimeout(() => {
      this.renderPlainText()
      this.#cleanupTimer = null
    }, totalDuration + 20)
  }

  setText(text) {
    this.#text = text ?? ''
    this.renderPlainText()

    if (this.isConnected) {
      this.play()
    }
  }
}

customElements.define('speech-bubble', SpeechBubble)
export {
  SpeechBubble
}
