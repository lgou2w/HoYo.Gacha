import path from 'node:path'
import griffel from '@griffel/vite-plugin'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

export default defineConfig(({ command }) => {
  const isDev = command === 'serve'
  const isProd = command === 'build'

  const env = process.env
  const isWindows = process.platform === 'win32' || env.TAURI_ENV_PLATFORM === 'windows'
  const appName = (isDev ? '__DEV__' : '') + env.npm_package_displayName

  return {
    plugins: [
      react(),
      isProd && griffel(),
      /*
       * Prepend the script if it is a dev environment and the React developer tools are enabled.
       * See:
       *   https://github.com/facebook/react/tree/main/packages/react-devtools#usage-with-react-dom
       *   https://vitejs.dev/guide/api-plugin.html#transformindexhtml
       *
       * Example usage:
       *   Default url:
       *     REACT_DEVTOOLS=1 pnpm tauri dev
       *   Custom url:
       *     REACT_DEVTOOLS_URL=http://localhost:4567 pnpm tauri dev
       */
      isDev && (env.REACT_DEVTOOLS === '1' || env.REACT_DEVTOOLS_URL) && {
        name: 'react-devtools-script-plugin',
        transformIndexHtml () {
          return [{
            injectTo: 'head-prepend',
            tag: 'script',
            attrs: {
              src: env.REACT_DEVTOOLS_URL || 'http://localhost:8097',
            },
          }]
        },
      },
    ],
    define: {
      __APP_NAME__: `"${appName}"`,
      __APP_VERSION__: `"${env.npm_package_version}"`,
      __APP_DESCRIPTION__: `"${env.npm_package_description}"`,
      __APP_AUTHOR__: `"${env.npm_package_author}"`,
      __APP_HOMEPAGE__: `"${env.npm_package_homepage}"`,
      __APP_REPOSITORY__: `"${env.npm_package_repository}"`,
    },
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    // Prevent vite from obscuring rust errors
    clearScreen: false,
    // Tauri expects a fixed port, fail if that port is not available
    server: {
      port: 1420,
      strictPort: true,
    },
    // To access the Tauri environment variables set by the CLI with information about the current target
    envPrefix: [
      'VITE_',
      'TAURI_',
    ],
    build: {
      sourcemap: isDev,
      minify: isProd ? 'esbuild' : false,
      // Tauri uses Chromium on Windows and WebKit on macOS and Linux
      target: isWindows ? 'chrome105' : 'safari13',
    },
  }
})
