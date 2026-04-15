import { BaseLayer } from './BaseLayer.js'
import { GameCell } from './GameCell.js'

class TerrainLayer extends BaseLayer {
  render({ world, camera, catalogs }) {
    this.setContext({ world, camera })
    this.replaceChildren()

    for (let localY = 0; localY < camera.rowCount; localY++) {
      for (let localX = 0; localX < camera.columnCount; localX++) {
        const worldX = camera.x + localX
        const worldY = camera.y + localY
        const cellData = world.at(worldX, worldY)
        if (!cellData) continue
        const terrainDefinition = catalogs?.terrain?.get?.(cellData.terrain)

        const cell = new GameCell()
        cell.data = {
          ...cellData,
          x: localX,
          y: localY,
          worldX,
          worldY,
          terrainDefinition,
        }

        this.append(cell)
      }
    }
  }
}

customElements.define('terrain-layer', TerrainLayer)

export { 
  TerrainLayer 
}
