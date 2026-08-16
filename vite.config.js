import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  // Use relative production assets so one build works at both:
  //   https://viudiratech.github.io/web/
  //   https://viudiratech.rainyland.top/
  // A hard-coded `/web/` breaks the custom-domain root because the browser
  // then requests `/web/assets/index-*.js` and `/web/assets/index-*.css`.
  base: process.env.VITE_BASE_PATH || (mode === 'production' ? './' : '/'),
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    assetsInlineLimit: 4096,
  },
}));
