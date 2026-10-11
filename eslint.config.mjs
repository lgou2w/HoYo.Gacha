import path from 'node:path'
import stylistic from '@stylistic/eslint-plugin'
import { defineConfig, includeIgnoreFile } from 'eslint/config'
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'
import { createNodeResolver, importX } from 'eslint-plugin-import-x'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import { reactRefresh } from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

const gitignorePath = path.join(import.meta.dirname, '.gitignore')
const gitignoreConfig = includeIgnoreFile(gitignorePath, {
  name: 'Imported .gitignore patterns',
  gitignoreResolution: true,
})

const baseConfigs = defineConfig({
  plugins: {
    '@stylistic': stylistic,
  },
  extends: [
    tseslint.configs.recommended,
    tseslint.configs.stylistic,

    react.configs.flat.recommended,
    react.configs.flat['jsx-runtime'],
    reactHooks.configs.flat.recommended,
    reactRefresh.configs.vite(),

    importX.flatConfigs.recommended,
    importX.flatConfigs.typescript,
    importX.flatConfigs.react,

    stylistic.configs.customize({
      indent: 2,
      quotes: 'single',
      semi: false,
      jsx: true,
      arrowParens: true,
      braceStyle: '1tbs',
      blockSpacing: true,
      quoteProps: 'as-needed',
      commaDangle: 'always-multiline',
      severity: 'error',
    }),
  ],
  languageOptions: {
    ...react.configs.flat.recommended.languageOptions,
  },
  settings: {
    react: {
      version: '19',
    },
    'import-x/resolver-next': [
      createNodeResolver(),
      createTypeScriptImportResolver({
        alwaysTryTypes: true,
        project: 'tsconfig.json',
      }),
    ],
  },
  rules: {
    '@stylistic/space-before-function-paren': ['error', 'always'],
    '@typescript-eslint/no-unused-expressions': 'off',
    'sort-imports': [
      'error',
      {
        allowSeparatedGroups: true,
        ignoreCase: false,
        ignoreDeclarationSort: true,
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
      },
    ],
    'import-x/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          ['sibling', 'parent'],
          'index',
        ],
        pathGroups: [
          {
            pattern: 'react*',
            group: 'builtin',
            position: 'before',
          },
          {
            pattern: '@/**',
            group: 'internal',
          },
          {
            pattern: '@*/**',
            group: 'external',
          },
        ],
        pathGroupsExcludedImportTypes: [],
        'newlines-between': 'never',
        alphabetize: {
          order: 'asc',
          orderImportKind: 'asc',
          caseInsensitive: false,
        },
      },
    ],
  },
})

export default defineConfig([
  gitignoreConfig,
  {
    name: 'App',
    basePath: './',
    files: [
      'eslint.config.mjs',
      'vite.config.ts',
      'app/**/*.ts',
      'app/**/*.tsx',
    ],
    extends: baseConfigs,
  },
])
