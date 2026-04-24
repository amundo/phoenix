class AudioPlayer {
  #catalog = null
  #dataRoot = null
  #audioById = new Map()

  constructor({ catalog = null, dataRoot = null } = {}) {
    this.#catalog = catalog
    this.#dataRoot = dataRoot
  }

  setCatalog(catalog) {
    this.#catalog = catalog
    this.#audioById.clear()
  }

  setDataRoot(dataRoot) {
    this.#dataRoot = dataRoot
    this.#audioById.clear()
  }

  play(soundId) {
    if (!soundId || !this.#catalog || !this.#dataRoot) return

    const sound = this.#catalog.get(soundId)
    if (!sound?.filename) return

    let audio = this.#audioById.get(sound.id)
    if (!audio) {
      audio = new Audio(
        new URL(
          `catalogs/sound-effects/${String(sound.filename).replace(/^\.\//, '')}`,
          this.#dataRoot,
        ).href,
      )
      audio.preload = 'auto'
      this.#audioById.set(sound.id, audio)
    }

    const playable = audio.cloneNode()
    playable.volume = 0.8
    playable.play().catch(() => {})
  }
}

export { AudioPlayer }
