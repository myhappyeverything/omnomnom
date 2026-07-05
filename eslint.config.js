// @ts-check
import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-config-prettier'

export default [
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/.wrangler/**',
      '**/node_modules/**',
      '**/*.d.ts',
      // A static, un-bundled bootstrap script served as-is by Cloudflare
      // Pages — a service worker context, not application code, so no-undef
      // (which flags `importScripts`) doesn't apply here.
      'apps/web/public/OneSignalSDKWorker.js',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      // TypeScript's compiler already catches undefined references (including ambient/global
      // types like D1Database or DOM globals); no-undef produces false positives on those.
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    // shadcn/ui's own convention (e.g. exporting `buttonVariants` alongside
    // `Button`) trips react-refresh/only-export-components. These files are
    // vendored from the shadcn registry, not hand-authored to our lint rules.
    files: ['apps/web/src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  prettier,
]
