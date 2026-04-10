import { Item  } from "../entities/Item.js"
import { BaseAvatar } from "./BaseAvatar.js"
class ItemAvatar extends BaseAvatar { }

customElements.define('item-avatar', ItemAvatar)

export { ItemAvatar }
