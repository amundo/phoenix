#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write

const HELP_TEXT = `
Realm CLI

Usage:
  deno task realms list
  deno task realms get <id> [--output <file>]
  deno task realms create --file <file>
  deno task realms update <id> --file <file>
  deno task realms delete <id>

Options:
  --base-url <url>        Base site URL. Default: https://www.minicurso.me
  --api-base-url <url>    Override API collection URL. Default: <base-url>/api/realms
  --realm-base-url <url>  Override public realm URL. Default: <base-url>/realms
  --file, -f <file>       Read request JSON from a file
  --stdin                 Read request JSON from stdin
  --output, -o <file>     Write response JSON to a file
  --header <k:v>          Add a request header. Can be repeated
  --quiet                 Suppress success messages
  --help, -h              Show this help

Examples:
  deno task realms list
  deno task realms get tiny --output ./tiny.json
  deno task realms create --file ./data/realms/tiny/realm.json
  deno task realms update tiny --file ./data/realms/tiny/realm.json
  deno task realms delete tiny
`.trim()

function parseArgs(argv) {
  const options = {
    headers: [],
    positionals: [],
  }

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]

    if (!token.startsWith('-')) {
      options.positionals.push(token)
      continue
    }

    if (token === '--help' || token === '-h') {
      options.help = true
      continue
    }

    if (token === '--stdin') {
      options.stdin = true
      continue
    }

    if (token === '--quiet') {
      options.quiet = true
      continue
    }

    if (token.startsWith('--header=')) {
      options.headers.push(token.slice('--header='.length))
      continue
    }

    if (token === '--header') {
      options.headers.push(argv[index + 1] ?? '')
      index += 1
      continue
    }

    const normalizedToken = token === '-f'
      ? '--file'
      : token === '-o'
        ? '--output'
        : token

    const [key, inlineValue] = normalizedToken.split(/=(.*)/s, 2)

    if (inlineValue !== undefined) {
      assignOption(options, key, inlineValue)
      continue
    }

    assignOption(options, key, argv[index + 1] ?? '')
    index += 1
  }

  return options
}

function assignOption(options, key, value) {
  switch (key) {
    case '--base-url':
      options.baseUrl = value
      break
    case '--api-base-url':
      options.apiBaseUrl = value
      break
    case '--realm-base-url':
      options.realmBaseUrl = value
      break
    case '--file':
      options.file = value
      break
    case '--output':
      options.output = value
      break
    default:
      throw new Error(`Unknown option: ${key}`)
  }
}

function joinUrl(baseUrl, path) {
  return new URL(path, ensureTrailingSlash(baseUrl)).toString()
}

function ensureTrailingSlash(value) {
  return value.endsWith('/') ? value : `${value}/`
}

function buildHeaders(headerList = []) {
  const headers = new Headers({
    Accept: 'application/json',
  })

  for (const header of headerList) {
    const separatorIndex = header.indexOf(':')
    if (separatorIndex < 0) {
      throw new Error(`Invalid header format: ${header}`)
    }

    const key = header.slice(0, separatorIndex).trim()
    const value = header.slice(separatorIndex + 1).trim()
    headers.set(key, value)
  }

  return headers
}

async function readStdinText() {
  const chunks = []
  for await (const chunk of Deno.stdin.readable) {
    chunks.push(chunk)
  }

  return new TextDecoder().decode(concatChunks(chunks))
}

function concatChunks(chunks) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const output = new Uint8Array(totalLength)
  let offset = 0

  for (const chunk of chunks) {
    output.set(chunk, offset)
    offset += chunk.length
  }

  return output
}

async function readJsonInput(options) {
  let text = ''

  if (options.stdin) {
    text = await readStdinText()
  } else if (options.file) {
    text = await Deno.readTextFile(options.file)
  } else {
    throw new Error('Provide request JSON with --file <path> or --stdin.')
  }

  try {
    return JSON.parse(text)
  } catch (error) {
    throw new Error(`Invalid JSON input: ${error.message}`)
  }
}

async function requestJson(url, { method = 'GET', headers = new Headers(), body } = {}) {
  const requestHeaders = new Headers(headers)

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body,
  })

  if (response.status === 204) {
    return null
  }

  const responseText = await response.text()
  const contentType = response.headers.get('content-type') ?? ''
  const isJson = contentType.includes('application/json')
  const data = isJson && responseText ? JSON.parse(responseText) : responseText

  if (!response.ok) {
    const detail = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
    throw new Error(`${response.status} ${response.statusText}\n${detail}`.trim())
  }

  return data
}

async function writeOutput(data, outputPath) {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2)

  if (outputPath) {
    await Deno.writeTextFile(outputPath, `${text}\n`)
    return
  }

  console.log(text)
}

function requirePositional(positionals, index, name) {
  const value = positionals[index]
  if (!value) {
    throw new Error(`Missing required ${name}.`)
  }

  return String(value)
}

function encodeRealmId(realmId) {
  return encodeURIComponent(realmId)
}

if (import.meta.main) {
  try {
    const options = parseArgs(Deno.args)
    const [command] = options.positionals

    if (options.help || !command) {
      console.log(HELP_TEXT)
      Deno.exit(0)
    }

    const baseUrl = options.baseUrl ?? 'https://www.minicurso.me'
    const apiBaseUrl = options.apiBaseUrl ?? joinUrl(baseUrl, 'api/realms')
    const headers = buildHeaders(options.headers)

    switch (command) {
      case 'list': {
        const data = await requestJson(apiBaseUrl, { headers })
        await writeOutput(data, options.output)
        break
      }

      case 'get': {
        const realmId = requirePositional(options.positionals, 1, 'realm id')
        const data = await requestJson(
          `${ensureTrailingSlash(apiBaseUrl)}${encodeRealmId(realmId)}`,
          { headers },
        )
        await writeOutput(data, options.output)
        break
      }

      case 'create': {
        const payload = await readJsonInput(options)
        const data = await requestJson(apiBaseUrl, {
          method: 'POST',
          headers: new Headers({
            ...Object.fromEntries(headers.entries()),
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(payload),
        })
        await writeOutput(data, options.output)
        if (!options.output && !options.quiet) {
          console.error('Created realm.')
        }
        break
      }

      case 'update': {
        const realmId = requirePositional(options.positionals, 1, 'realm id')
        const payload = await readJsonInput(options)
        const data = await requestJson(
          `${ensureTrailingSlash(apiBaseUrl)}${encodeRealmId(realmId)}`,
          {
            method: 'PUT',
            headers: new Headers({
              ...Object.fromEntries(headers.entries()),
              'Content-Type': 'application/json',
            }),
            body: JSON.stringify(payload),
          },
        )
        await writeOutput(data, options.output)
        if (!options.output && !options.quiet) {
          console.error(`Updated realm ${realmId}.`)
        }
        break
      }

      case 'delete': {
        const realmId = requirePositional(options.positionals, 1, 'realm id')
        await requestJson(`${ensureTrailingSlash(apiBaseUrl)}${encodeRealmId(realmId)}`, {
          method: 'DELETE',
          headers,
        })

        if (!options.quiet) {
          console.log(`Deleted realm ${realmId}.`)
        }
        break
      }

      default:
        throw new Error(`Unknown command: ${command}`)
    }
  } catch (error) {
    console.error(error.message)
    console.error('\nRun with --help for usage.')
    Deno.exit(1)
  }
}
