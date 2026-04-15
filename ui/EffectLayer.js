class EffectLayer extends HTMLElement {
  #context = null
  #defaultAnimation = {
    name: 'float-up',
    keyframes: [
      { opacity: 1, translate: '0 0', scale: '1' },
      { opacity: 0, translate: '0 -1em', scale: '1' }
    ],
    options: {
      duration: 1000,
      easing: 'ease-out',
      fill: 'forwards',
    }
  }

  get context() {
    return this.#context
  }

  set context(value) {
    this.#context = value
  }

  showEmote(entity, emotion, animation) {
    if (!this.#context) return

    animation ??= this.#defaultAnimation

    if (emotion.animation === 'burst') {
      this.showBurst(entity, emotion, animation, 4)
      return
    }

    this.spawnParticle(entity, emotion, animation)
  }

  showBurst(entity, emotion, animation, count = 4) {
    for (let i = 0; i < count; i++) {
      this.spawnParticle(entity, emotion, animation, i * 60)
    }
  }

  spawnParticle(entity, emotion, animation, delay = 0) {
    if (!this.#context) return

    const { camera, tileSize } = this.#context

    const el = document.createElement('div')
    el.className = 'emote-effect'
    el.textContent = emotion.emoji ?? emotion

    const { x, y } = this.getEffectAnchor(entity, camera, tileSize)

    const jitterX = (Math.random() - 0.5) * tileSize * 0.4
    const jitterY = (Math.random() - 0.5) * tileSize * 0.2

    el.style.left = `${x + jitterX}px`
    el.style.top = `${y + jitterY}px`

    this.appendChild(el)

    const options = {
      ...animation.options,
      delay,
    }

    delete options.fill

    const anim = el.animate(animation.keyframes, options)
    anim.onfinish = () => el.remove()
  }

  getEffectAnchor(entity, camera, tileSize) {
    return {
      x: (entity.x - camera.x) * tileSize + tileSize / 2,
      y: (entity.y - camera.y) * tileSize + tileSize / 2,
    }
  }
}

customElements.define('effect-layer', EffectLayer)
export { EffectLayer }
