import { BaseAvatar } from "./BaseAvatar.js";
class PlayerAvatar extends BaseAvatar {
  #emotions = {};

  constructor() {
    super();
    this.innerHTML = `
      <span class="avatar-emoji">🧝</span>
      <span class="emotion-badge" hidden>😠</span>
      <span class="speech-bubble" hidden>Look out! Giant Spider!</span>
    `;
  }

  fadeOutBadge(badge) {
    badge.getAnimations().forEach(animation => animation.cancel());

    badge.style.opacity = '1';
    badge.style.transform = 'translate(0, 0) scale(1)';

    const animation = badge.animate(
      [
        {
          opacity: 1,
          translate: '0 0',
          scale: '1'
        },
        {
          opacity: 0,
          scale: '1.8',
          translate: '-0.8em -0.8em',
        }
      ],
      {
        duration: 800,
        iterations: 3,
        easing: 'ease-out',
        fill: 'forwards'
      }
    );

    animation.onfinish = () => {
      badge.hidden = true;
      badge.style.opacity = '';
      badge.style.transform = '';
    };
  }

  get emotions(){
    return this.#emotions;
  }

  set emotions(emotions) {
    this.#emotions = emotions;
  }

  emote(emotion) {
    const badge = this.querySelector('.emotion-badge');
    badge.textContent = this.emotions[emotion] || '❓';
    badge.hidden = false;
    this.fadeOutBadge(badge);
  }

  async connectedCallback() {
    try {
      this.emote('angry');
    } catch (error) {
      console.error(error);
      this.emotions = {
        angry: '😠',
        happy: '😀',
        sad: '😢',
      };
    }
  }
}

customElements.define('player-avatar', PlayerAvatar);

export {
    PlayerAvatar
}