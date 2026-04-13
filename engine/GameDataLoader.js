class GameDataLoader {
  #dataRoot = null
  #index = null

  constructor(dataRoot) {
    this.#dataRoot = dataRoot
  }

  async fetchJSON(path) {
    const url = new URL(path, this.#dataRoot)
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to load ${path}: ${response.status}`)
    }

    return response.json()
  }

  async loadIndex() {
    if (this.#index) {
      return this.#index
    }

    this.#index = await this.fetchJSON('index.json')
    return this.#index
  }

  indexByName(list) {
    return Object.fromEntries(list.map(item => [item.name, item]))
  }

  makeCatalog(list) {
    return {
      list,
      byName: this.indexByName(list),
    }
  }

  async loadCatalogs() {
    const index = await this.loadIndex()
    const entries = Object.entries(index.catalogs)

    const results = await Promise.all(
      entries.map(([, path]) => this.fetchJSON(path))
    )

    let catalogMap = Object.fromEntries(
      entries.map(([name], i) => [name, this.makeCatalog(results[i])])
    )
console.log(`items: ${catalogMap.items.list.length}`)
    return catalogMap
  }

  async loadWorld() {
    const index = await this.loadIndex()
    return this.fetchJSON(index.world)
  }

  async loadRealm(realmName) {
    const index = await this.loadIndex()

    const path = index.realms[realmName]

    if (!path) {
      throw new Error(`Unknown realm: ${realmName}`)
    }

    return this.fetchJSON(path)
  }

  async loadSharedData() {
    const [world, catalogs] = await Promise.all([
      this.loadWorld(),
      this.loadCatalogs(),
    ])

    return { world, catalogs }
  }

  async loadGameData() {
    const sharedData = await this.loadSharedData()

    const realmName = sharedData.world.startRealm

    if (!realmName) {
      throw new Error('world.json is missing "startRealm"')
    }

    const realm = await this.loadRealm(realmName)

    const data = {
      ...sharedData,
      realm,
    }

    return data
  }
}

export {
    GameDataLoader,
}