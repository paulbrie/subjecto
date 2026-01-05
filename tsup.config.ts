import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    core: 'src/core.ts',
    helpers: 'src/helpers.ts',
    'react/index': 'src/react/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: true,
  treeshake: true,
  splitting: false,
  outDir: 'dist',
  tsconfig: 'tsconfig.build.json',
  external: ['react'],
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
})
