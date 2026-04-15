
class Entity {
  constructor(data) {
    Object.assign(this, data)
    this.id ??= crypto.randomUUID()
  }


  moveTo({ x, y }) {
    this.x = x
    this.y = y
  }
}

export { Entity }
