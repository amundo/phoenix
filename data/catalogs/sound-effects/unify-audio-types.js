#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run

const targetType = Deno.args[0]?.toLowerCase()

if (!targetType) {
  console.error('Usage: unify-audio-types mp3')
  Deno.exit(1)
}

if (targetType !== 'mp3') {
  console.error('Only mp3 is currently supported.')
  Deno.exit(1)
}

const audioExtensions = new Set([
  '.mp3',
  '.wav',
  '.aiff',
  '.aif',
  '.flac',
  '.ogg',
  '.m4a',
  '.aac',
  '.wma',
  '.opus',
])

function extname(path) {
  const match = path.match(/(\.[^./]+)$/)
  return match ? match[1] : ''
}

function basenameWithoutExt(path) {
  const ext = extname(path)
  return ext ? path.slice(0, -ext.length) : path
}

async function fileExists(path) {
  try {
    await Deno.stat(path)
    return true
  } catch {
    return false
  }
}

async function uniquePath(path) {
  if (!(await fileExists(path))) return path

  const base = basenameWithoutExt(path)
  const ext = extname(path)

  let i = 2
  while (true) {
    const candidate = `${base}-${i}${ext}`
    if (!(await fileExists(candidate))) return candidate
    i++
  }
}

async function run(command, args) {
  const process = new Deno.Command(command, {
    args,
    stdout: 'inherit',
    stderr: 'inherit',
  })

  const { code } = await process.output()
  return code === 0
}

for await (const entry of Deno.readDir('.')) {
  if (!entry.isFile) continue

  const name = entry.name
  const ext = extname(name)
  const lowerExt = ext.toLowerCase()

  if (!audioExtensions.has(lowerExt)) continue

  // Normalize .MP3, .Mp3, etc. to .mp3
  if (lowerExt === '.mp3') {
    if (ext !== '.mp3') {
      const normalized = `${basenameWithoutExt(name)}.mp3`
      const finalPath = await uniquePath(normalized)

      console.log(`Renaming: ${name} → ${finalPath}`)
      await Deno.rename(name, finalPath)
    }

    continue
  }

  const output = await uniquePath(`${basenameWithoutExt(name)}.mp3`)

  console.log(`Converting: ${name} → ${output}`)

  const ok = await run('ffmpeg', [
    '-i',
    name,
    '-codec:a',
    'libmp3lame',
    '-qscale:a',
    '2',
    output,
  ])

  if (ok) {
    console.log(`Converted: ${output}`)
  } else {
    console.error(`Failed: ${name}`)
  }
}