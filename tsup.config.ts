// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  outDir: 'dist',
  sourcemap: false,
  external: ['os', 'path'],  // keep these external
  banner: {
    js: `import { createRequire } from 'module';
const require = createRequire(import.meta.url);`
  },
});
