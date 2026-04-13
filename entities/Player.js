import { Entity } from "./Entity.js"

class Player extends Entity { 

  constructor(data) {
    super(data)
    this.inventory ??= []
  }

  has(item) {
    return this.inventory.includes(item)
  }

  take(item) {
    if (!this.has(item)) {
      this.inventory.push(item)
    }
  }s
}



export { Player }
