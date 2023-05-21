import Fontmin from 'fontmin'
import { glob } from 'glob'
import path from 'path'
import fs from 'fs'

// Collect all characters from all files

const AsciiChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890~!@#$%^&*()_+`-=[]{}|;:\'",./<>?\\'
const ChineseRegex = /[\u4e00-\u9fa5\u3000-\u301e\ufe10-\ufe19\ufe30-\ufe44\ufe50-\ufe6b\uff01-\uffee]/gmu

function collectChars (file) {
  const data = fs.readFileSync(file, 'utf8')
  const chars = data.match(ChineseRegex)
  return chars || []
}

function collectFileChars (files) {
  const table = {}
  for (const file of files) {
    console.log('Collecting chars from file:', file)
    const chars = collectChars(file)
    for (const char of chars) {
      table[char] = true
    }
  }
  const keys = Object.keys(table)
  console.log('Total chars:', keys.length)
  return keys.join('')
}

// fontmin

async function processFontmin (text, inputFont, outputDir) {
  await new Promise((resolve, reject) => {
    const inst = new Fontmin()
    inst.src(inputFont.file)
    inst.use(Fontmin.glyph({ text, hinting: false }))
    inst.use(Fontmin.ttf2eot())
    inst.use(Fontmin.ttf2woff())
    inst.use(Fontmin.ttf2woff2())
    inst.use(Fontmin.ttf2svg())
    inst.dest(outputDir)
    inst.run((err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })

  const family = inputFont.family
  const style = `@font-face {
  font-family: ${family};
  src: url('./${family}.eot');
  src:
    url('./${family}.eot') format('embedded-opentype'),
    url('./${family}.woff2') format('woff2'),
    url('./${family}.woff') format('woff'),
    url('./${family}.ttf') format('truetype'),
    url('./${family}.svg') format('svg');
  font-weight: normal;
  font-style: normal;
}
`

  const outputFile = path.resolve(outputDir, 'index.css')
  fs.writeFileSync(outputFile, style, 'utf8')
}

// entrypoint

async function run () {
  const files = await glob('src/**/*.{ts,tsx}')
  const text = collectFileChars(files) + AsciiChars

  await processFontmin(
    text,
    {
      family: '汉仪文黑-85W',
      file: 'src/assets/汉仪文黑-85W.ttf'
    },
    'src/assets/fontmin'
  )
}

run().catch((e) => {
  console.error('Fontmin failed: ', e)
  process.exit(1)
})
