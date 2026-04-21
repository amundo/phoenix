import { DOMParser } from 'jsr:@b-fuze/deno-dom'
import {
  compileRealmMarkup,
  parseRealmMarkup,
  validateMarkup,
} from './realmMarkup.js'

function assertEquals(actual, expected) {
  const actualJson = JSON.stringify(actual)
  const expectedJson = JSON.stringify(expected)
  if (actualJson !== expectedJson) {
    throw new Error(`Expected ${expectedJson}, got ${actualJson}`)
  }
}

function assertThrows(fn, expectedMessage) {
  try {
    fn()
  } catch (error) {
    if (!error.message.includes(expectedMessage)) {
      throw new Error(`Expected error containing "${expectedMessage}", got "${error.message}"`)
    }
    return
  }

  throw new Error(`Expected error containing "${expectedMessage}", but no error was thrown.`)
}

const emojiAliases = new Map([
  ['child', '🧒'],
  ['wizard', '🧙'],
  ['key', '🗝️'],
])

Deno.test('parseRealmMarkup parses player, bots, items, and metadata', () => {
  const parsed = parseRealmMarkup(`
    <realm background=teal>
      <player emoji=child x=1 y=4></player>
      <bot emoji=wizard x=5 y=1>
        <speech>Hello!</speech>
      </bot>
      <item emoji=key x=3 y=2></item>
    </realm>
  `, {
    DOMParser,
    title: 'Test Realm',
    playerName: 'Phoenix',
    emojiAliases,
  })

  assertEquals(parsed, {
    title: 'Test Realm',
    playerName: 'Phoenix',
    background: 'teal',
    player: {
      id: 'player',
      kind: 'player',
      name: 'Phoenix',
      emoji: '🧒',
      x: 1,
      y: 4,
    },
    bots: [{
      id: 'wizard-1',
      kind: 'wizard',
      name: 'Bot 1',
      emoji: '🧙',
      x: 5,
      y: 1,
      speech: 'Hello!',
    }],
    items: [{
      id: 'key-1',
      kind: 'key',
      name: 'Key',
      emoji: '🗝️',
      x: 3,
      y: 2,
      portable: true,
      solid: false,
    }],
  })
})

Deno.test('compileRealm builds a realm.json-compatible object', () => {
  const realm = compileRealmMarkup(`
    <realm background=teal>
      <player emoji=child x=1 y=4></player>
    </realm>
  `, {
    DOMParser,
    title: 'Test Realm',
    playerName: 'Phoenix',
    emojiAliases,
  })

  assertEquals(realm.id, 'test-realm')
  assertEquals(realm.realmMap, {
    rowCount: 6,
    columnCount: 8,
    defaultTerrain: 'grass',
    background: 'teal',
  })
  assertEquals(realm.entities.player.name, 'Phoenix')
})

Deno.test('validateMarkup reports mismatched tags before DOM parsing', () => {
  assertThrows(
    () => validateMarkup('<realm><player></realm>'),
    'You opened <player> but closed </realm>. Try </player>.'
  )
})

Deno.test('parseRealmMarkup validates required tags and coordinates', () => {
  assertThrows(
    () => parseRealmMarkup('<realm></realm>', { DOMParser, emojiAliases }),
    'Add one <player> tag.'
  )

  assertThrows(
    () => parseRealmMarkup('<realm><player emoji=child x=8 y=0></player></realm>', {
      DOMParser,
      emojiAliases,
    }),
    '<player> needs x from 0 to 7.'
  )
})
