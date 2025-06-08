// .eslintrc.js
module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    env: {
      node: true,
      es2021: true,
    },
    plugins: ['@typescript-eslint'],
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'prettier', // optional
    ],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error'],
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
    },
  };
  