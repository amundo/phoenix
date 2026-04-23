class TerrainViewer extends HTMLElement {
  #data = {} 
  constructor(){
    super()
  }

  async fetch(url){
    let response = await fetch(url)
    let data = await response.json()
    this.data = data
  }

  connectedCallback(){

  }

  static get observedAttributes(){
    return ["src"]
  }

  attributeChangedCallback(attribute, oldValue, newValue){
    if(attribute == "src"){
      this.fetch(newValue)
    }
  }

  set data(data){
    this.#data = data
    this.render()
  }

  get data(){
    return this.#data
  }

  /*
  sample data:

   {
    "id": "grass",
    "name": "Grass",
    "category": "field",
    "description": "Open grassy ground for general exploration.",
    "color": "var(--color-grass)",
    "walkable": true,
    "palette": {
      "lightness1": 62,
      "lightness2": 54,
      "chroma1": 0.13,
      "chroma2": 0.11,
      "hue1": 132,
      "hue2": 128,
      "lightnessVariance": 5,
      "chromaVariance": 0.016,
      "hueVariance": 10
    }
  },

  */

  renderTerrainCard(terrain){
    let card = document.createElement('article')
    card.classList.add('card')
    card.innerHTML = `

      <h3>${terrain.name}</h3>
      <div class="color-swatch" style="background-color: ${terrain.color}"></div>
      <p>${terrain.description}</p>
    `
    return card
    
  }

  render(){
    this.#data.forEach(terrain => {
      console.log(terrain)
      let card = this.renderTerrainCard(terrain)
      this.appendChild(card)
    })
  }

  listen(){
    /* write event listeners here */
  }
}

export {TerrainViewer}
customElements.define('terrain-viewer', TerrainViewer)
