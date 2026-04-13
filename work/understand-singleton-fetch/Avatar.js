import { loadEmojiData } from './emoji-loader.js'

class Avatar {
  constructor(name) {
    this.name = name
  }

  async init() {
    console.log(`[${this.name}] requesting emoji data...`)

    const data = await loadEmojiData()

    console.log(`[${this.name}] received data:`, Object.keys(data))
  }
}

export { Avatar }