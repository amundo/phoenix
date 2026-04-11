class Cell {
  constructor({ x, y, terrain = 'grassland' }) {
    this.x = x
    this.y = y
    this.terrain = terrain
  }
}

export {
  Cell
}