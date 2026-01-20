import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      // Redirect v3 matchObject imports to v4 adapter
      '@/matchObject': path.resolve(__dirname, './src/v4-umo.ts'),
      '../../src/matchObject': path.resolve(__dirname, './src/v4-umo.ts'),
    },
  },
});
