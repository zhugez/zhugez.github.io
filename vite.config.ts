import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-cloudflare';

export default defineConfig({
  plugins: [sveltekit({ adapter: adapter({ config: 'wrangler.app.jsonc' }), files: { assets: 'public' } })],
  server: { host: '127.0.0.1', port: 4321, strictPort: true, allowedHosts: ['lyngocvu.tech'] },
  build: {
    target: 'es2022',
    rolldownOptions: { output: { codeSplitting: { groups: [
      { name: 'three-core', test: /three[\\/]build[\\/]three\.core\.js/ },
      { name: 'three-renderer', test: /three[\\/]build[\\/]three\.module\.js/ }
    ] } } }
  }
});
