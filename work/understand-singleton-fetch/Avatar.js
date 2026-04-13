import { loadEmojiData } from './emoji-loader.js'

class Avatar {
  constructor(name) {
    this.name = name
  }

  async init() {
    const data = await loadEmojiData()
  }
}

export { Avatar }