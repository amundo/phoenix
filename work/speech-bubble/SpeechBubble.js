class SpeechBubble extends HTMLElement {
  static get observedAttributes() {
    return ['animation']
  }

  connectedCallback() {
    if (!this.dataset.ready) {
      this.prepareText()
      this.dataset.ready = 'true'
    }

    requestAnimationFrame(() => this.play())
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

  prepareText() {
    const text = this.textContent
    const fragment = document.createDocumentFragment()

    const wordSegmenter = new Intl.Segmenter(undefined, {
      granularity: 'word'
    })

    const chararcterSegmenter = new Intl.Segmenter(undefined, {
      granularity: 'grapheme'
    })

    for (const { segment, isWordLike } of wordSegmenter.segment(text)) {
      if (!isWordLike) {
        // spaces, punctuation, etc.
        fragment.append(document.createTextNode(segment))
        continue
      }

      const word = document.createElement('span')
      word.className = 'word'

      for (const { segment: character } of chararcterSegmenter.segment(segment)) {
        const letter = document.createElement('span')
        letter.className = 'letter'
        letter.textContent = character
        word.append(letter)
      }

      fragment.append(word)
    }

    this.replaceChildren(fragment)
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

  play() {
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
  }

  setText(text) {
    this.textContent = text
    this.prepareText()
    this.play()
  }
}

customElements.define('speech-bubble', SpeechBubble)
export {
  SpeechBubble
}