import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: [
        'node_modules/',
        '**/*.d.ts',
        'src/server.js',
        'src/__tests__/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@': './src'
    }
  }
});
