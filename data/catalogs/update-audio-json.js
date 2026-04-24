const path = Deno.args[0] ?? "sounds.json"

const text = await Deno.readTextFile(path)
const data = JSON.parse(text)

for (const item of data) {
  item.filename = item.filename.replace(/\.(wav|aiff|aif|flac|ogg|m4a|aac|wma|opus|mp3)$/i, ".mp3")
}

await Deno.writeTextFile(path, JSON.stringify(data, null, 2) + "\n")

console.log(`Updated filenames in ${path}`)
