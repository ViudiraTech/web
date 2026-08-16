import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  // GitHub Pages project site: https://viudiratech.github.io/web/
  // VITE_BASE_PATH can still override this for previews or a future rename.
  base: process.env.VITE_BASE_PATH || (mode === 'production' ? '/web/' : '/'),
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    assetsInlineLimit: 4096,
  },
}));
