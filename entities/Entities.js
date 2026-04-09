
class Character {
  constructor({ name, emoji, x, y }) {
    this.name = name
    this.emoji = emoji
    this.x = x
    this.y = y
  }

  moveTo({ x, y }) {
    this.x = x
    this.y = y
  }
}

class Player extends Character { }
class Enemy extends Character { }

class Item {
  constructor({ name, emoji, x, y }) {
    this.name = name
    this.emoji = emoji
    this.x = x
    this.y = y
  }
}


export {
  Player,
  Enemy,
  Item,
  
}