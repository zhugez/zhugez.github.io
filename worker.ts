import app from './.svelte-kit/cloudflare/_worker.js';
import { mediaRange } from './src/media-range';
import { mediaSizes } from './src/media-sizes';

type AssetBinding = { fetch(request: Request): Promise<Response> };
type WorkerEnv = { ASSETS: AssetBinding };

export default {
  async fetch(request: Request, env: WorkerEnv, context: { waitUntil(promise: Promise<unknown>): void; passThroughOnException(): void }) {
    const pathname = new URL(request.url).pathname;
    if (Object.hasOwn(mediaSizes, pathname) && (request.method === 'GET' || request.method === 'HEAD')) {
      const headers = new Headers(request.headers);
      headers.delete('Range');
      headers.delete('If-Range');
      const asset = await env.ASSETS.fetch(new Request(request, { headers }));
      return mediaRange(request, asset, mediaSizes[pathname]);
    }
    return (app as { fetch(request: Request, env: unknown, context: unknown): Promise<Response> })
      .fetch(request, env, context);
  },
};
