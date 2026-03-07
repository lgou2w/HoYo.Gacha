import stylistic from '@stylistic/eslint-plugin'
import { defineConfig } from 'eslint/config'
import importPlugin from 'eslint-plugin-import'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import * as tseslint from 'typescript-eslint'

const baseConfig = {
  plugins: {
    '@stylistic': stylistic,
  },
  extends: [
    tseslint.configs.recommended,
    tseslint.configs.stylistic,

    react.configs.flat.recommended,
    react.configs.flat['jsx-runtime'],
    reactHooks.configs.flat.recommended,

    importPlugin.flatConfigs.recommended,
    importPlugin.flatConfigs.typescript,
    importPlugin.flatConfigs.react,

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
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: 'tsconfig.json',
      },
    },
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
    'import/order': [
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
}

export default defineConfig([
  {
    name: 'App',
    basePath: './',
    files: [
      'eslint.config.mjs',
      'vite.config.ts',
      'app/**/*.ts',
      'app/**/*.tsx',
    ],
    ...baseConfig,
  },
])
