import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',                 // <- index.html lives in src
  publicDir: '../public',      // serve/copy static assets
  build: {
    outDir: '../dist',         // output folder at repo root
    emptyOutDir: true
  },
  // IMPORTANT for GitHub Pages at user.github.io/<repo>:
  // replace <repo> with your repository name.
  base: process.env.GH_PAGES ? '/<repo>/' : '/',
});
