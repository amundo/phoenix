const DEFAULT_COLUMNS = 8
const DEFAULT_ROWS = 6
const DEFAULT_TERRAIN = 'grass'

const ITEM_DEFAULTS = {
  key: { emoji: '🗝️', portable: true },
  door: { emoji: '🚪', solid: true },
  scroll: { emoji: '📜', portable: true },
  flower: { emoji: '🌼', portable: true },
  apple: { emoji: '🍎', portable: true },
  lantern: { emoji: '🏮', portable: true },
  coin: { emoji: '🪙', portable: true },
  'crystal-ball': { emoji: '🔮', portable: true },
}

function parseRealmMarkup(text, {
  DOMParser: Parser = globalThis.DOMParser,
  title = 'My realm',
  playerName = 'Player',
  emojiAliases = new Map(),
  columnCount = DEFAULT_COLUMNS,
  rowCount = DEFAULT_ROWS,
} = {}) {
  if (!Parser) {
    throw new Error('A DOMParser implementation is required.')
  }

  validateMarkup(text)

  const doc = new Parser().parseFromString(text, 'text/html')
  const realmEl = doc?.querySelector('realm')

  if (!realmEl) {
    throw new Error('Add one <realm> tag around everything.')
  }

  if (doc.querySelectorAll('realm').length > 1) {
    throw new Error('You can only have one <realm> tag.')
  }

  const root = realmEl
  const playerEls = [...root.querySelectorAll(':scope > player')]
  const playerEl = playerEls[0]

  if (playerEls.length === 0) {
    throw new Error('Add one <player> tag.')
  }

  if (playerEls.length > 1) {
    throw new Error('You can only have one <player> tag.')
  }

  const parserContext = {
    emojiAliases,
    columnCount,
    rowCount,
    playerName: playerName.trim() || 'Player',
  }

  return {
    title: title.trim() || 'My realm',
    playerName: parserContext.playerName,
    background: realmEl.getAttribute('background')?.trim() || DEFAULT_TERRAIN,
    player: parsePlayer(playerEl, parserContext),
    bots: [...root.querySelectorAll(':scope > bot')].map((el, index) =>
      parseBot(el, index, parserContext)
    ),
    items: [...root.querySelectorAll(':scope > item')].map((el, index) =>
      parseItem(el, index, parserContext)
    ),
  }
}

function parsePlayer(el, context) {
  return {
    id: 'player',
    kind: 'player',
    name: context.playerName,
    emoji: resolveEmojiValue(el.getAttribute('emoji') || 'child', 'player', context.emojiAliases),
    x: readCoordinate(el, 'x', context.columnCount),
    y: readCoordinate(el, 'y', context.rowCount),
  }
}

function parseBot(el, index, context) {
  const kind = el.getAttribute('kind')?.trim() || slugify(el.getAttribute('emoji') || 'bot') || 'bot'
  return {
    id: `${slugify(kind)}-${index + 1}`,
    kind,
    name: el.getAttribute('name')?.trim() || `Bot ${index + 1}`,
    emoji: resolveEmojiValue(el.getAttribute('emoji') || kind || 'robot', 'bot', context.emojiAliases),
    x: readCoordinate(el, 'x', context.columnCount),
    y: readCoordinate(el, 'y', context.rowCount),
    speech: el.querySelector('speech')?.textContent?.trim() ?? '',
  }
}

function parseItem(el, index, context) {
  const emojiName = el.getAttribute('emoji')?.trim()
  if (!emojiName) {
    throw new Error('Every <item> needs an emoji.')
  }

  const kind = el.getAttribute('kind')?.trim() || slugify(emojiName)
  const defaults = ITEM_DEFAULTS[kind] ?? {}
  return {
    id: el.getAttribute('id')?.trim() || `${slugify(kind)}-${index + 1}`,
    kind,
    name: el.getAttribute('name')?.trim() || titleCase(kind),
    emoji: resolveEmojiValue(emojiName || defaults.emoji || kind, 'item', context.emojiAliases),
    x: readCoordinate(el, 'x', context.columnCount),
    y: readCoordinate(el, 'y', context.rowCount),
    portable: readBoolean(el.getAttribute('portable'), defaults.portable ?? false),
    solid: readBoolean(el.getAttribute('solid'), defaults.solid ?? false),
  }
}

function compileRealm(parsed, {
  columnCount = DEFAULT_COLUMNS,
  rowCount = DEFAULT_ROWS,
  defaultTerrain = DEFAULT_TERRAIN,
} = {}) {
  return {
    id: slugify(parsed.title),
    name: parsed.title,
    rowCount,
    columnCount,
    realmMap: {
      rowCount,
      columnCount,
      defaultTerrain,
      background: parsed.background,
    },
    camera: {
      x: 0,
      y: 0,
      rowCount,
      columnCount,
    },
    entities: {
      player: parsed.player,
      bots: parsed.bots,
      items: parsed.items,
    },
  }
}

function compileRealmMarkup(text, options = {}) {
  return compileRealm(parseRealmMarkup(text, options), options)
}

function validateMarkup(text) {
  validateQuotes(text)

  const allowedTags = new Set(['realm', 'player', 'bot', 'item', 'speech'])
  const tokenPattern = /<\/?([a-z-]+)\b[^>]*>/gi
  const stack = []
  let match

  while ((match = tokenPattern.exec(text)) !== null) {
    const raw = match[0]
    const tag = match[1].toLowerCase()
    const isClosing = raw.startsWith('</')
    const isVoidLike = raw.endsWith('/>')

    if (!allowedTags.has(tag)) {
      throw new Error(`I do not know the <${tag}> tag yet.`)
    }

    if (isClosing) {
      const expected = stack.at(-1)
      if (!expected) {
        throw new Error(`There is a </${tag}> tag with nothing to close.`)
      }
      if (expected !== tag) {
        throw new Error(`You opened <${expected}> but closed </${tag}>. Try </${expected}>.`)
      }
      stack.pop()
      continue
    }

    if (!isVoidLike) {
      stack.push(tag)
    }
  }

  if (stack.length > 0) {
    const tag = stack.at(-1)
    throw new Error(`Your <${tag}> tag still needs a closing </${tag}>.`)
  }
}

function validateQuotes(text) {
  let doubleQuoteCount = 0
  let singleQuoteCount = 0

  for (const char of text) {
    if (char === '"') doubleQuoteCount += 1
    if (char === "'") singleQuoteCount += 1
  }

  if (doubleQuoteCount % 2 !== 0) {
    throw new Error('A double quote is missing somewhere. Check values like name="Golden Key".')
  }

  if (singleQuoteCount % 2 !== 0) {
    throw new Error("A single quote is missing somewhere. Check values like name='Golden Key'.")
  }
}

function resolveEmoji(value, emojiAliases = new Map()) {
  const trimmed = value.trim()
  return emojiAliases.get(slugify(trimmed)) ?? trimmed
}

function resolveEmojiValue(value, role, emojiAliases = new Map()) {
  const trimmed = value.trim()
  const resolved = resolveEmoji(trimmed, emojiAliases)
  if (resolved !== trimmed) return resolved
  if (/^[a-z0-9-]+$/i.test(trimmed)) {
    throw new Error(`I do not know the ${role} emoji name "${trimmed}". Check the emoji reference.`)
  }
  return resolved
}

function readCoordinate(el, name, limit) {
  const value = Number(el.getAttribute(name))
  if (!Number.isInteger(value) || value < 0 || value >= limit) {
    throw new Error(`<${el.tagName.toLowerCase()}> needs ${name} from 0 to ${limit - 1}.`)
  }
  return value
}

function readBoolean(raw, fallback) {
  if (raw == null || raw === '') return fallback
  if (raw === 'true') return true
  if (raw === 'false') return false
  return fallback
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function titleCase(value) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join(' ')
}

export {
  DEFAULT_COLUMNS,
  DEFAULT_ROWS,
  DEFAULT_TERRAIN,
  ITEM_DEFAULTS,
  compileRealm,
  compileRealmMarkup,
  parseRealmMarkup,
  readBoolean,
  readCoordinate,
  resolveEmoji,
  resolveEmojiValue,
  slugify,
  titleCase,
  validateMarkup,
  validateQuotes,
}
