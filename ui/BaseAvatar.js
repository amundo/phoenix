class BaseAvatar extends HTMLElement {
  #data = null
  #emotions = {}
  static #emotionsPromise = null;

  constructor() {
    super()
    this.classList.add('avatar')
    this.innerHTML = `
      <span class="avatar-emoji"></span>
      <span class="emotion-badge" hidden></span>
      <span class="speech-bubble"></span>
    `
  }

  get data() {
    return this.#data
  }

  set data(entityData) {
    this.#data = entityData
    this.render()
  }

  get emotions() {
    return this.#emotions;
  }

  set emotions(mapping) {
    this.#emotions = mapping;
  }

  static async loadEmotions() {
    if (!BaseAvatar.#emotionsPromise) {
      BaseAvatar.#emotionsPromise = fetch(
        new URL('../data/catalogs/emotions.json', import.meta.url)
      )
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to load emoji-emotions.json');
          }
          return response.json();
        })
        .then(data =>
          Object.fromEntries(data.map(e => [e.name, e.emoji]))
        );
    }

    return BaseAvatar.#emotionsPromise;
  }

  async ensureEmotionsLoaded() {
    if (Object.keys(this.emotions).length) return this.emotions;

    try {
      this.emotions = await BaseAvatar.loadEmotions();
    } catch (error) {
      console.error(error);
      this.emotions = {
        angry: '😠',
        happy: '😀',
        sad: '😢',
        surprised: '😲',
        confused: '😕',
        grimace: '😬',
        zany: '🤪',
      };
    }

    return this.emotions;
  }

  async connectedCallback() {
    await this.ensureEmotionsLoaded();
  }

  speak(message) {
    const bubble = this.querySelector('.speech-bubble')
    const messageLength = message.length
    bubble.textContent = message
    bubble.hidden = false
    bubble.style.position = 'absolute'
    setTimeout(() => {
      bubble.hidden = true
    }, 1000 + messageLength * 10)
  }

  fadeOutBadge(badge) {
    badge.getAnimations().forEach(animation => animation.cancel());

    badge.style.opacity = '1';

    const animation = badge.animate(
      [
        {
          opacity: 1,
          translate: '0 0',
          scale: '1',
        },
        {
          opacity: 0,
          translate: '-0.8em -0.8em',
          scale: '1.8',
        }
      ],
      {
        duration: 800,
        iterations: 3,
        easing: 'ease-out',
        fill: 'forwards',
      }
    );

    animation.onfinish = () => {
      badge.hidden = true;
      badge.style.opacity = '';
    };
  }

  async emote(emotion) {
    await this.ensureEmotionsLoaded();

    const badge = this.querySelector('.emotion-badge');
    if (!badge) return;

    badge.textContent = this.emotions[emotion] || '❓';
    badge.hidden = false;
    this.fadeOutBadge(badge);
  }

  placeAt(localX, localY) {
    this.style.gridColumn = localX + 1
    this.style.gridRow = localY + 1
  }

  render() {
    if (!this.data) return;

    const avatarEmoji = this.querySelector('.avatar-emoji');
    if (avatarEmoji) {
      avatarEmoji.textContent = this.data.emoji ?? '🙂';
    }
  }

}

customElements.define('base-avatar', BaseAvatar)
export { BaseAvatar }
