class BaseLayer extends HTMLElement {
  #realmMap = null
  #camera = null

  constructor() {
    super()
    this.style.display = 'grid'
    this.style.gridColumn = '1 / -1'
    this.style.gridRow = '1 / -1'
    this.style.gridTemplateColumns = 'subgrid'
    this.style.gridTemplateRows = 'subgrid'
  }

  setContext({ realmMap = null, camera = null } = {}) {
    this.#realmMap = realmMap
    this.#camera = camera
  }

  get realmMap() {
    return this.#realmMap
  }

  get camera() {
    return this.#camera
  }

  toLocalX(worldX) {
    return worldX - this.#camera.x
  }

  toLocalY(worldY) {
    return worldY - this.#camera.y
  }

  contains(x, y) {
    return this.#camera?.contains(x, y)
  }

  render() { }
}



export { BaseLayer }
