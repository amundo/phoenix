class BaseLayer extends HTMLElement {
  #world = null
  #camera = null

  constructor() {
    super()
    this.style.display = 'grid'
    this.style.gridColumn = '1 / -1'
    this.style.gridRow = '1 / -1'
    this.style.gridTemplateColumns = 'subgrid'
    this.style.gridTemplateRows = 'subgrid'
  }

  setContext({ world = null, camera = null } = {}) {
    this.#world = world
    this.#camera = camera
  }

  get world() {
    return this.#world
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
