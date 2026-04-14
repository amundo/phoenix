class Item {
  constructor(data) {
    Object.assign(this, data)
    this.x = Number(this.x)
    this.y = Number(this.y)
  }
}

export {
  Item
}