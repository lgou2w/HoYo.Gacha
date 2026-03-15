/// <reference types="vitest/config" />
import path from 'node:path'
import griffel from '@griffel/vite-plugin'
import babel from '@rolldown/plugin-babel'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import packageJson from './package.json'

export default defineConfig ((env) => {
  const isDev = env.command === 'serve'
  const isProd = env.command === 'build'
  const isCicd = env.mode === 'cicd'

  // Babel options for both griffel and @rollup/plugin-babel
  const babelOptions = {
    compact: false,
    include: ['app\/**\/*.{ts,tsx}'],
    exclude: ['**\/node_modules\/**'],
    presets: [
      '@babel/preset-typescript',
      '@babel/preset-react',
    ],
  }

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
        include: babelOptions.include,
        exclude: babelOptions.exclude,
        babelOptions: {
          compact: babelOptions.compact,
          presets: babelOptions.presets,
        },
      }),
      react(),
      babel({
        ...babelOptions,
      }),
    ],
    define: {
      __CICD__: `${isCicd}`,
      __APP_NAME__: `"${packageJson.displayName}"`,
      __APP_VERSION__: `"${packageJson.version}"`,
      __APP_DESCRIPTION__: `"${packageJson.description}"`,
      __APP_AUTHOR__: `"${packageJson.author}"`,
      __APP_HOMEPAGE__: `"${packageJson.homepage}"`,
      __APP_REPOSITORY__: `"${packageJson.repository}"`,
      __APP_ISSUES__: `"${packageJson.bugs}"`,
    },
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      alias: {
        '@': path.resolve(__dirname, 'app'),
      },
    },
    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    //
    // 1. prevent Vite from obscuring rust errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is not available
    server: {
      port: 1420,
      strictPort: true,
      hmr: {
        protocol: 'ws',
        port: 1421,
      },
      watch: {
        // 3. tell Vite to ignore watching `src-tauri`
        ignored: ['**/tauri/**'],
      },
    },
  }
})
