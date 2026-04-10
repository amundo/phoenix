#!/usr/bin/env -S deno run -A

const inputPath = Deno.args[0]

if (!inputPath) {
  console.error("Usage: deno run -A split.js <file>")
  Deno.exit(1)
}

const text = await Deno.readTextFile(inputPath)

// --- STEP 1: Extract all customElements.define lines ---
const defineRegex = /customElements\.define\([^)]+\)/g
const defines = text.match(defineRegex) || []

// Map: ClassName -> define line
const defineMap = new Map()

for (const line of defines) {
  // try to extract the class name (second arg)
  const match = line.match(/,\s*(\w+)\s*\)/)
  if (match) {
    defineMap.set(match[1], line)
  }
}

// --- STEP 2: Split classes ---
const parts = text.split(/(?=class\s+\w+)/)

// Extract header (imports, etc.)
let header = ""
if (!parts[0].startsWith("class")) {
  header = parts.shift().trim()
}

const dir = inputPath.substring(0, inputPath.lastIndexOf("/")) || "."

let count = 0

for (const part of parts) {
  const match = part.match(/^class\s+(\w+)/)
  if (!match) continue

  const className = match[1]
  const fileName = `${dir}/${className}.js`

  // Attach define if exists
  const defineLine = defineMap.get(className) || ""

  const content = [
    header,
    "",
    part.trim(),
    "",
    defineLine,
    "",
    `export { ${className} }`,
    ""
  ].join("\n")

  await Deno.writeTextFile(fileName, content)
  console.log(`Created ${fileName}`)
  count++
}

console.log(`Done. Created ${count} files.`)