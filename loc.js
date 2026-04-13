#!/usr/bin/env -S deno run --allow-read

import { parseArgs } from "jsr:@std/cli/parse-args"

const args = parseArgs(Deno.args, {
  string: ["exclude"],
  default: { exclude: "" },
})

const excludePatterns = args.exclude
  .split(",")
  .map(s => s.trim())
  .filter(Boolean)

function shouldExclude(path) {
  return excludePatterns.some(pattern => path.includes(pattern))
}

async function* walk(dir) {
  for await (const entry of Deno.readDir(dir)) {
    const path = `${dir}/${entry.name}`

    if (shouldExclude(path)) continue

    if (entry.isDirectory) {
      yield* walk(path)
    } else {
      yield path
    }
  }
}

async function countLines(filePath) {
  const text = await Deno.readTextFile(filePath)
  return text.split("\n").length
}

let totalLines = 0
let results = []

for await (const path of walk(".")) {
  if (!path.endsWith(".js")) continue

  try {
    const lines = await countLines(path)
    results.push({ path, lines })
    totalLines += lines
  } catch (err) {
    console.warn(`Skipping ${path}: ${err.message}`)
  }
}

// sort biggest → smallest
results.sort((a, b) => b.lines - a.lines)

// pretty print
for (const { path, lines } of results) {
  console.log(`${lines.toString().padStart(6)}  ${path}`)
}

console.log("\n---")
console.log(`Files: ${results.length}`)
console.log(`Total lines: ${totalLines}`)