/** @type {import('eslint').ESLint.ConfigData} */

module.exports = {
  root: true,
  env: {
    node: true,
    es2020: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: [
    '@typescript-eslint',
    'import',
    'promise',
    'react',
    'react-refresh',
    'jest',
    'jest-dom',
    'testing-library'
  ],
  extends: [
    'standard',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:promise/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  overrides: [{
    files: [
      '**/__tests__/**/*.+(ts|tsx)',
      '**/?(*.)+(spec|test).+(ts|tsx)'
    ],
    extends: [
      'plugin:jest/recommended',
      'plugin:jest-dom/recommended',
      'plugin:testing-library/react'
    ]
  }],
  settings: {
    react: {
      version: '18'
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true
      }
    }
  },
  rules: {
    semi: ['error', 'never'],
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    'import/no-unresolved': 'error',
    'import/default': 'off',
    'import/no-named-as-default': 'off',
    'import/no-named-as-default-member': 'off',
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          ['sibling', 'parent'],
          'index'
        ],
        pathGroups: [
          {
            pattern: 'react*',
            group: 'builtin',
            position: 'before'
          },
          {
            pattern: '@/**',
            group: 'internal'
          },
          {
            pattern: '@*/**',
            group: 'external'
          }
        ],
        pathGroupsExcludedImportTypes: [],
        'newlines-between': 'never',
        alphabetize: {
          order: 'asc',
          orderImportKind: 'asc',
          caseInsensitive: false
        }
      }
    ]
  }
}
