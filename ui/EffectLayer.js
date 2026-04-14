class EffectLayer extends HTMLElement {
  showEmote(entity, emotion, context) {
    if (emotion.animation === 'burst') {
      this.showBurst(entity, emotion, { ...context, count: 4 })
      return
    }

    this.spawnParticle(entity, emotion, context)
  }

  showBurst(entity, emotion, { camera, tileSize, animation, count = 4 }) {
    for (let i = 0; i < count; i++) {
      this.spawnParticle(entity, emotion, {
        camera,
        tileSize,
        animation,
        delay: i * 60,
      })
    }
  }

  spawnParticle(entity, emotion, { camera, tileSize, animation, delay = 0 }) {
    const el = document.createElement('div')
    el.className = 'emote-effect'
    el.textContent = emotion.emoji ?? emotion

    const baseX = (entity.x - camera.x) * tileSize + tileSize / 2
    const baseY = (entity.y - camera.y) * tileSize + tileSize / 2

    const jitterX = (Math.random() - 0.5) * tileSize * 0.4
    const jitterY = (Math.random() - 0.5) * tileSize * 0.2

    el.style.left = `${baseX + jitterX}px`
    el.style.top = `${baseY + jitterY}px`

    this.appendChild(el)

    const options = {
      ...animation.options,
      delay,
    }

    delete options.fill

    const anim = el.animate(animation.keyframes, options)
    anim.onfinish = () => el.remove()
  }
}

customElements.define('effect-layer', EffectLayer)

export { EffectLayer }