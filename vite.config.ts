import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    // Prepend the script if it is not a production environment and the React developer tools are enabled
    // See:
    //   https://github.com/facebook/react/tree/main/packages/react-devtools#usage-with-react-dom
    //   https://vitejs.dev/guide/api-plugin.html#transformindexhtml
    {
      name: 'react-devtools-script-plugin',
      transformIndexHtml () {
        // Example usage:
        //   Default url:
        //     REACT_DEVTOOLS=1 pnpm tauri dev
        //   Custom url:
        //     REACT_DEVTOOLS_URL=http://localhost:4567 pnpm tauri dev
        //
        if (process.env.NODE_ENV !== 'production' &&
          (process.env.REACT_DEVTOOLS === '1' ||
          typeof process.env.REACT_DEVTOOLS_URL !== 'undefined')
        ) {
          return [{
            injectTo: 'head-prepend',
            tag: 'script',
            attrs: {
              src: process.env.REACT_DEVTOOLS_URL || 'http://localhost:8097'
            }
          }]
        }
      }
    }
  ],
  define: {
    __APP_VERSION__: `"${process.env.npm_package_version}"`,
    __APP_DESCRIPTION__: `"${process.env.npm_package_description}"`,
    __APP_AUTHOR__: `"${process.env.npm_package_author}"`,
    __APP_HOMEPAGE__: `"${process.env.npm_package_homepage}"`
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true
  },
  envPrefix: [
    'VITE_',
    'TAURI_'
  ],
  build: {
    target: [
      'es2021',
      'chrome100',
      'safari13'
    ],
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG
  }
})
