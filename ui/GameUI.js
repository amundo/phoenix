class GameUI extends HTMLElement { 
    constructor(){
        super()
        this.innerHTML = `
            <section id=inventory>
                <h2>Inventory</h2>
                <div id=inventory-items></div>
            </section>
        `
    }

    setInventory(items){
        const container = this.querySelector('#inventory-items')
        container.replaceChildren()

        items.forEach(item => {
            const element = document.createElement('div')
            element.className = 'inventory-item'
            element.textContent = `${item.emoji} ${item.name}`
            container.append(element)
        })
    }

}
customElements.define('game-ui', GameUI)

export { GameUI }
