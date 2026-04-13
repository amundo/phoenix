let emojiPromise = null

async function fetchEmojiData(url) {
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error('Failed to load emoji data')
  }

  const data = await res.json()
  console.log('[loader] Fetch resolved')
  return data
}

export function loadEmojiData() {
  if (emojiPromise) {
    console.log('[loader] Reusing existing promise')
    return emojiPromise
  }

  console.log('[loader] Starting fetch...')

  const url = new URL('../../data/emoji-emotions.json', import.meta.url)

  emojiPromise = fetchEmojiData(url).catch(err => {
    emojiPromise = null // allow retry
    throw err
  })

  return emojiPromise
}