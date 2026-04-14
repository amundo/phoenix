import { Entity } from "./Entity.js"

class Player extends Entity {
  constructor(data) {
    super(data)
    this.inventory ??= []
  }

  hasItem(item) {
    return this.inventory.includes(item)
  }

  hasKind(kind) {
    return this.inventory.some(item => item.kind === kind)
  }

  hasItemId(id) {
    return this.inventory.some(item => item.id === id)
  }

  findKind(kind) {
    return this.inventory.find(item => item.kind === kind) ?? null
  }

  take(item) {
    if (!this.hasItem(item)) {
      this.inventory.push(item)
    }
  }
}

export { Player }