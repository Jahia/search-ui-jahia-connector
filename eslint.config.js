import js from '@eslint/js';
import globals from 'globals';

/**
 * Flat config, replacing the old .eslintrc.json + @jahia/eslint-config (which pulled in
 * babel-eslint — and Babel is gone). The default parser handles these sources: they are plain
 * modern ESM with no non-standard syntax.
 */
export default [
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // The specs rely on Vitest globals (describe/it/expect/beforeEach/vi) — see vitest.config.js.
    files: ['src/**/__tests__/**/*.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.vitest },
    },
  },
];
