import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/matchObject.ts',
    'src/index.ts',
    'src/formatConverter.ts',
    'src/formatAdapter.ts'
  ],
  format: ['cjs', 'esm'],
  dts: true,
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  minify: false,
  splitting: false,
  treeshake: true,
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.mjs',
    };
  },
});
