// eslint.config.js
import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintReact from '@eslint-react/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';       // optional, see note
import reactRefresh from 'eslint-plugin-react-refresh';   // keep if using Vite + React Fast Refresh

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),

  // JS & TS base rules
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // React presets from @eslint-react:
  // core  = renderer-agnostic (like react-x)
  // dom   = React DOM-specific (like react-dom)
  // web-api = browser Web API usage patterns
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { '@eslint-react': eslintReact },
    // Choose ONE of the two lines below:

    // (a) granular presets:
    ...eslintReact.configs.core,
    ...eslintReact.configs.dom,
    ...eslintReact.configs['web-api'],

    // (b) or a single combined preset:
    // ...eslintReact.configs.recommended,
  },

  // Optional: keep classic hooks & refresh helpers
  // Hooks rules are still valuable; @eslint-react focuses beyond just hooks.
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ...reactHooks.configs['recommended-latest'],
    // For Vite HMR overlay friendliness during dev:
    ...reactRefresh.configs.vite,
  },
]);