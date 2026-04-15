class Catalog {
  #items = []
  #byName = {}

  constructor(items = []) {
    this.#items = items
    this.#byName = {}

    for (const item of items) {
      if (item.name) {
        this.#byName[item.name] = item
      }

      if (item.id) {
        this.#byName[item.id] = item
      }
    }
  }

  get(name) {
    return this.#byName[name] ?? null
  }

  has(name) {
    return name in this.#byName
  }

  values() {
    return this.#items
  }

  toJSON(){
    return this.#items
  }
  
  [Symbol.iterator]() {
    return this.#items[Symbol.iterator]()
  }
}

export { Catalog }
