import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

// https://astro.build
export default defineConfig({
  site: 'https://zhugez.github.io',
  integrations: [preact()],
});
