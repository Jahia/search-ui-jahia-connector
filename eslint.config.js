import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Flat config, replacing the old .eslintrc.json + @jahia/eslint-config (which pulled in
 * babel-eslint — and Babel is gone). The sources are TypeScript now, so typescript-eslint supplies
 * the parser; the two config files at the root are still plain ESM JavaScript.
 */
export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // The specs rely on Vitest globals (describe/it/expect/beforeEach/vi) — see vitest.config.js.
    files: ['src/**/__tests__/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node, ...globals.vitest },
    },
  },
);
