import js from '@eslint/js';
import globals from 'globals';
import svelte from 'eslint-plugin-svelte';

export default [
  // Ignores
  { ignores: ['dist/', 'node_modules/', '.svelte-kit/', 'build/'] },

  // Base JS recommended rules
  js.configs.recommended,

  // Svelte recommended rules (v3 flat config)
  ...svelte.configs.recommended,

  // Global settings for all JS/Svelte files
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  // Svelte-specific overrides
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: null, // Use default (no TS)
      },
    },
  },

  // Custom rules
  {
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'no-eval': 'error',
      'no-self-compare': 'error',
      'no-template-curly-in-string': 'warn',
      'no-constructor-return': 'error',
      'no-shadow-restricted-names': 'error',
    },
  },
];
