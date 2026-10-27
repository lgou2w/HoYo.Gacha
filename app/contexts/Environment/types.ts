import { createContext } from 'react'
import { Environment } from '@/api/App'

export type EnvironmentContextValue = Environment

export const EnvironmentContext = createContext<EnvironmentContextValue | null>(null)
EnvironmentContext.displayName = 'EnvironmentContext'

export function deviceSpec (env: Environment) {
  const appVersion = env.app.version

  const commitDate = __APP_COMMIT_DATE__
  const commitHash = __APP_COMMIT_HASH__
  const shortHash = commitHash && commitHash.substring(0, 7)
  const repoUrl = __APP_REPOSITORY__.replace(/\.git$/, '')

  return {
    OperatingSystem: env.osInfo.edition,
    SystemVersion: env.windowsVersion + ' ' + env.osInfo.architecture,
    WebView2: env.webviewVersion,
    Tauri: env.tauriVersion,
    GitCommit: commitHash || 'N/A',
    AppVersion: shortHash
      ? {
          value: appVersion,
          shortHash,
          date: commitDate!,
          text: `${appVersion}-git-${shortHash}`,
          href: `${repoUrl}/commit/${commitHash}`,
        }
      : appVersion,
  }
}
