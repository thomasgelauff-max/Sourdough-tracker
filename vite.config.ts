import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

// Served from https://<user>.github.io/Sourdough-tracker/ on GitHub Pages.
export default defineConfig({
  base: '/Sourdough-tracker/',
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Sourdough Tracker',
        short_name: 'Sourdough',
        description: 'Recipe calculator, bake log and fermentation planner.',
        theme_color: '#8a5a2b',
        background_color: '#faf6f0',
        display: 'standalone',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' }],
      },
    }),
  ],
});
