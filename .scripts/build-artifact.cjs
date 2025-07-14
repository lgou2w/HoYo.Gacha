'use strict'

const fs = require('node:fs')
const path = require('node:path')
const packageJson = require('../package.json')

const isWindows = process.platform === 'win32'
const executable = isWindows ? 'exe' : undefined
const cwd = path.resolve(__dirname, '..')

const buildDir = path.join(cwd, 'target', 'release')
const buildFile = executable && path.join(buildDir, `${packageJson.name}.${executable}`)
if (!buildFile || !fs.existsSync(buildFile)) {
  console.error(`Build file not found: ${buildFile}`)
  process.exit(1)
}

const distFilename = packageJson.displayName + '.' + executable
const distFile = path.join(buildDir, distFilename)
fs.copyFileSync(buildFile, distFile)
console.log(distFile)
