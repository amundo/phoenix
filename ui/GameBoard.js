class GameBoard extends HTMLElement {
  static emotionAliases = {
    confused: 'confusion',
    curious: 'curiosity',
    disgusted: 'disgust',
    surprised: 'surprise',
  }

  constructor() {
    super()
    this.innerHTML = `
      <terrain-layer></terrain-layer>
      <avatar-layer></avatar-layer>
      <effect-layer></effect-layer>
      <speech-layer></speech-layer>
    `

    this.terrainLayer = this.querySelector('terrain-layer')
    this.avatarLayer = this.querySelector('avatar-layer')
    this.effectLayer = this.querySelector('effect-layer')
    this.speechLayer = this.querySelector('speech-layer')

    this.catalogs = null
    this.camera = null
    this.tileSize = null
    this.speechBubbles = new Map()
  }

  speak(entity, message) {
    if (!entity || !message || !this.speechLayer) return

    let entry = this.speechBubbles.get(entity)

    if (!entry) {
      const bubble = document.createElement('speech-bubble')
      bubble.className = 'board-speech-bubble'
      bubble.setAttribute('animation', 'float')
      this.speechLayer.append(bubble)

      entry = { bubble, timeoutId: null }
      this.speechBubbles.set(entity, entry)
    }

    const { bubble } = entry
    bubble.hidden = false
    bubble.setText?.(message)

    if (entry.timeoutId) {
      clearTimeout(entry.timeoutId)
    }

    this.layoutSpeechBubble(entity, bubble)

    entry.timeoutId = setTimeout(() => {
      bubble.remove()
      this.speechBubbles.delete(entity)
    }, 1200 + message.length * 45 )
  }

  emote(entity, emotionName) {
    if (!this.catalogs) return

    const emotion = this.resolveEmotion(emotionName)
    if (!emotion) return

    const animation = this.resolveAnimation(emotion)

    this.effectLayer.showEmote(entity, emotion, animation)
  }

  render(gameState) {
    const { camera, catalogs } = gameState

    if (!this.catalogs) {
      this.catalogs = catalogs
      this.avatarLayer.setCatalogs(catalogs)
    }

    this.camera = camera

    this.style.setProperty('--column-count', camera.columnCount)
    this.style.setProperty('--row-count', camera.rowCount)

    this.terrainLayer.render(gameState)
    this.measureTileSize()
    this.avatarLayer.render(gameState)

    this.effectLayer.context = {
      camera: this.camera,
      tileSize: this.tileSize,
    }

    this.layoutSpeechBubbles()
  }

  measureTileSize() {
    const firstCell = this.querySelector('game-cell')
    if (!firstCell) return

    this.tileSize = firstCell.getBoundingClientRect().width
    this.style.setProperty('--tile-size', `${this.tileSize}px`)
  }

  resolveEmotion(emotionName) {
    const emotionCatalog = this.catalogs?.emotions
    if (!emotionCatalog || !emotionName) return null

    return (
      emotionCatalog.get(emotionName) ??
      emotionCatalog.get(GameBoard.emotionAliases[emotionName]) ??
      null
    )
  }

  resolveAnimation(emotion) {
    const animationCatalog = this.catalogs?.animations
    if (!animationCatalog) return null

    const animationName =
      emotion?.animation ??
      (emotion?.arousal >= 0.6 ? 'burst' : 'float-up')

    return (
      animationCatalog.get(animationName) ??
      animationCatalog.get('float-up') ??
      animationCatalog.get('burst') ??
      null
    )
  }

  layoutSpeechBubbles() {
    for (const [entity, entry] of this.speechBubbles) {
      this.layoutSpeechBubble(entity, entry.bubble)
    }
  }

  layoutSpeechBubble(entity, bubble) {
    if (!bubble || !this.camera || !this.tileSize) return

    if (!this.camera.contains(entity.x, entity.y)) {
      bubble.hidden = true
      return
    }

    bubble.hidden = false
    bubble.style.maxInlineSize = `${Math.max(10 * this.tileSize, 180)}px`

    requestAnimationFrame(() => {
      if (!bubble.isConnected) return

      const margin = 12
      const bubbleRect = bubble.getBoundingClientRect()
      const bubbleWidth = bubbleRect.width
      const bubbleHeight = bubbleRect.height
      const boardWidth = this.clientWidth
      const boardHeight = this.clientHeight

      const anchorCenterX = (entity.x - this.camera.x + 0.5) * this.tileSize
      const anchorTopY = (entity.y - this.camera.y) * this.tileSize
      const anchorBottomY = (entity.y - this.camera.y + 1) * this.tileSize

      const minLeft = margin + bubbleWidth / 2
      const maxLeft = boardWidth - margin - bubbleWidth / 2
      const left = Math.max(minLeft, Math.min(anchorCenterX, maxLeft))

      let top = anchorTopY - bubbleHeight - 10
      let placement = 'top'

      if (top < margin) {
        top = Math.min(anchorBottomY + 10, boardHeight - bubbleHeight - margin)
        placement = 'bottom'
      }

      bubble.dataset.placement = placement
      bubble.style.left = `${left}px`
      bubble.style.top = `${top}px`
    })
  }
}

customElements.define('game-board', GameBoard)
export { GameBoard }
