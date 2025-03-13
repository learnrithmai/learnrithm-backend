import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  outDir: 'dist',
  sourcemap: false,
  external: ['path', 'os', 'http-errors', 'depd'],
  noExternal: ['@prisma/client'],
  platform: 'node',
  target: 'node16',
  banner: {
    js: `import { createRequire } from 'module';
const require = createRequire(import.meta.url);`
  },
});
