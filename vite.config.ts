/// <reference types="vitest/config" />

import path from 'node:path'
import griffel from '@griffel/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import packageJson from './package.json' with { type: 'json' }

export default defineConfig((env) => {
  const isDev = env.command === 'serve'
  const isProd = env.command === 'build'

  return {
    test: {
      include: ['app\/**\/*.{test,spec}.?(c|m)[jt]s?(x)'],
    },
    publicDir: 'public',
    build: {
      outDir: 'dist',
      target: 'baseline-widely-available',
      minify: isProd ? 'oxc' : false,
      sourcemap: isDev,
    },
    plugins: [
      isProd && griffel({
        include: ['app\/**\/*.{ts,tsx}'],
        babelOptions: {
          compact: false,
          presets: [
            '@babel/preset-typescript',
            '@babel/preset-react',
          ],
        },
      }),
      react(),
    ],
    define: {
      __APP_NAME__: `"${packageJson.displayName}"`,
      __APP_VERSION__: `"${packageJson.version}"`,
      __APP_DESCRIPTION__: `"${packageJson.description}"`,
      __APP_AUTHOR__: `"${packageJson.author}"`,
      __APP_HOMEPAGE__: `"${packageJson.homepage}"`,
      __APP_REPOSITORY__: `"${packageJson.repository}"`,
      __APP_ISSUES__: `"${packageJson.bugs}"`,
    },
    resolve: {
      tsconfigPaths: true,
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      alias: {
        '@': path.resolve(import.meta.dirname, 'app'),
      },
    },
    clearScreen: false,
    server: {
      port: 1420,
      strictPort: true,
      hmr: {
        protocol: 'ws',
        port: 1421,
      },
      watch: {
        ignored: [
          '**/node_modules/**',
          '**/target/**',
          '**/tauri/**',
        ],
      },
    },
  }
})
