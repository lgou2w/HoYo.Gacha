/** @type {import('eslint').ESLint.ConfigData} */

module.exports = {
  root: true,
  env: {
    node: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  extends: [
    'standard',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended'
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    semi: [2, 'never']
  },
  settings: {
    react: {
      version: '18'
    }
  }
}
