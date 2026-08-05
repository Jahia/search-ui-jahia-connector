import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The suite was written for Jest: describe/it/expect/beforeEach are used as globals, and `vi`
    // (Jest's `jest`) likewise. Enabling globals keeps the specs unchanged apart from jest.fn -> vi.fn.
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.js'],
    // Carried over from the Jest config: every spec re-stubs global fetch/Headers in beforeEach,
    // so mock state must not leak between tests.
    clearMocks: true,
  },
});
