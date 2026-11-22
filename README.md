# ZhugeZ — profile and interactive studio

One SvelteKit app serves the profile, artworks, vinyl player and Three.js studio. The existing room, character, piano and audio modules are shared directly. The homepage is prerendered. Cloudflare's adapter also builds a Worker for application routing and error responses.

## Development and checks

Requires Node 24 and Docker Compose for the local hostname.

```sh
npm ci
npm run dev
npm run check
npm test
npm run build
npm run deploy:check
```

`npm run dev` listens on `127.0.0.1:4321`. `npm run preview` exercises the built Worker on `127.0.0.1:4322`.

Run browser checks sequentially against the built Worker:

```sh
node scripts/check-profile.mjs
node scripts/check-works.mjs http://127.0.0.1:4322/
node scripts/check-music.mjs http://127.0.0.1:4322/
node scripts/check-game.mjs http://127.0.0.1:4322/
```

`check-profile.mjs` starts its own Vite server and mounts the real `Profile.svelte` twice, asserting that unmounting calls `ProfileRuntime.dispose()`, loses the WebGL contexts and restores page state. The other three drive the built Worker.

The music check intercepts its own lyric fixture inside its named browser session. It does not modify music files. Do not control a test's browser session while the test runs.

## Local HTTPS container

```sh
npm run build
docker compose up -d
```

Map `lyngocvu.tech` to `127.0.0.1` in the host's hosts file. Open `https://lyngocvu.tech/`. Caddy publishes only loopback ports 80 and 443 and restarts with Docker. It serves the prerendered production assets. Cloudflare Static Assets answers range requests with the whole file, so `worker.ts` wraps the generated app Worker and streams byte ranges for the four album files whose sizes `scripts/prepare-media.mjs` records at build time. The local CA is stored in the `caddy-data` volume. Trust its public root certificate on each client device that needs HTTPS. Never distribute its private key.

The container mounts the parent `.svelte-kit` directory so rebuilding does not leave it serving a removed build directory. Run `docker compose restart vhost` after editing `Caddyfile`.

## Cloudflare

`wrangler.jsonc` targets Worker `zhugez` on `lyngocvu.tech`. It uses `worker.ts` as its entry point. `wrangler.app.jsonc` configures only the adapter build so Wrangler does not overwrite the generated `_worker.js`.

`npm run deploy:check` validates packaging without publishing. This branch's GitHub Actions workflow runs checks and dry-run packaging. To publish, run `npx wrangler deploy` from the intended Cloudflare account.

## Legacy site

The migration branch is `svelte-migration`. The old Astro page and Preact component are kept in `legacy/` for reference. This branch does not build them or deploy to GitHub Pages.
