class Catalog {
  #items = []
  #byName = {}

  constructor(items = []) {
    this.#items = items
    this.#byName = Object.fromEntries(
      items.map(item => [item.name, item])
    )
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
  
  [Symbol.iterator]() {
    return this.#items[Symbol.iterator]()
  }
}

export { Catalog }