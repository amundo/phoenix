
class Camera {
  constructor({ x = 0, y = 0, columnCount = 8, rowCount = 6 }) {
    this.x = x
    this.y = y
    this.columnCount = columnCount
    this.rowCount = rowCount
  }

  contains(x, y) {
    return (
      x >= this.x &&
      x < this.x + this.columnCount &&
      y >= this.y &&
      y < this.y + this.rowCount
    )
  }

  toLocalX(worldX) {
    return worldX - this.x
  }

  toLocalY(worldY) {
    return worldY - this.y
  }

  centerOn(x, y, world) {
    let nextX = x - Math.floor(this.columnCount / 2)
    let nextY = y - Math.floor(this.rowCount / 2)

    let maxX = Math.max(0, world.columnCount - this.columnCount)
    let maxY = Math.max(0, world.rowCount - this.rowCount)

    this.x = Math.max(0, Math.min(nextX, maxX))
    this.y = Math.max(0, Math.min(nextY, maxY))
  }
}

export {
  Camera
}