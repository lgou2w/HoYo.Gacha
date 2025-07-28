// OsInfo
//   See: os-info-3.8.2/src/info.rs

export interface OsInfo {
  os_type: string
  version:
    | 'Unknown'
    | { Semantic: [number, number, number] }
    | { Rolling: string | null }
    | { Custom: string }
  edition: string | null
  codename: string | null
  bitness: 'Unknown' | 'X32' | 'X64'
  architecture: string | null
}

export function stringifyOsInfoVersion (version: OsInfo['version']) {
  if (typeof version === 'string') {
    return version
  } else if ('Semantic' in version) {
    const [major, minor, patch] = version.Semantic
    return `${major}.${minor}.${patch}`
  } else if ('Rolling' in version) {
    return version.Rolling || String(null)
  } else if ('Custom' in version) {
    return version.Custom
  } else {
    return String(undefined)
  }
}
