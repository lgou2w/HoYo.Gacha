const fs = require('node:fs')
const path = require('node:path')
const child_process = require('node:child_process')
const crypto = require('node:crypto')
const packageJson = require('../package.json')

// HACK: See -> src-tauri/Tauri.toml
const mainBinaryName = 'HoYo_Gacha'
const isWindows = process.platform === 'win32'
const executable = isWindows ? 'exe' : undefined

const cwd = path.resolve(__dirname, '..')
const gitHash = child_process
  .execSync('git rev-parse --short HEAD', { cwd })
  .toString('utf-8')
  .trim()

const buildDir = path.join(cwd, 'target', 'release')
const buildFile = executable && path.join(buildDir, `${mainBinaryName}.${executable}`)
if (!buildFile || !fs.existsSync(buildFile)) {
  console.error(`Build file not found: ${buildFile}`);
  process.exit(1);
}

const distFilename = packageJson.displayName + '.' + packageJson.version + '.git-' + gitHash + '.' + executable
const distFile = path.join(buildDir, distFilename)
fs.copyFileSync(buildFile, distFile)

const hashFile = path.join(buildDir, distFilename + '.sha256')
const hasher = crypto.createHash('sha256')
fs.createReadStream(distFile)
  .pipe(hasher)
  .once('error', (error) => {
    console.error('Error hashing file:', error);
    process.exit(1);
  })
  .once('finish', () => {
    const hash = hasher.read().toString('hex')
    fs.writeFileSync(hashFile, hash)
  })
