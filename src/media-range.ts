export async function mediaRange(request: Request, asset: Response, assetSize?: number): Promise<Response> {
  if (asset.status !== 200) return asset;
  const headers = new Headers(asset.headers);
  headers.set('Accept-Ranges', 'bytes');
  const declaredSize = Number(headers.get('Content-Length'));
  const size = declaredSize > 0 ? declaredSize : assetSize ?? NaN;
  if (Number.isSafeInteger(size) && size > 0) headers.set('Content-Length', String(size));
  const range = request.method === 'GET' ? request.headers.get('Range') : null;
  const ifRange = request.headers.get('If-Range');
  const etag = headers.get('ETag');
  const modified = headers.get('Last-Modified');
  const matches = !ifRange || (ifRange.startsWith('"') ? !etag?.startsWith('W/') && ifRange === etag : !ifRange.startsWith('W/') && !!modified && Number.isFinite(Date.parse(ifRange)) && Date.parse(modified) <= Date.parse(ifRange));
  if (!range?.startsWith('bytes=') || range.includes(',') || !matches || !Number.isSafeInteger(size) || size <= 0) {
    if (request.method === 'HEAD') { await asset.body?.cancel(); return new Response(null, { status: 200, headers }); }
    return new Response(asset.body, { status: 200, headers });
  }
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  const start = match?.[1] ? Number(match[1]) : Math.max(0, size - Number(match?.[2]));
  const end = match?.[1] ? (match[2] ? Math.min(Number(match[2]), size - 1) : size - 1) : size - 1;
  if (!match || (!match[1] && !match[2]) || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start || (!match[1] && Number(match[2]) <= 0)) {
    await asset.body?.cancel();
    headers.set('Content-Range', `bytes */${size}`);
    headers.set('Content-Length', '0');
    return new Response(null, { status: 416, headers });
  }
  headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
  headers.set('Content-Length', String(end - start + 1));
  const reader = asset.body!.getReader();
  let offset = 0;
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) { controller.close(); return; }
          const from = Math.max(0, start - offset), to = Math.min(value.length, end + 1 - offset);
          offset += value.length;
          if (to > from) controller.enqueue(value.slice(from, to));
          if (offset > end) { controller.close(); await reader.cancel(); return; }
          if (to > from) return;
        }
      } catch (error) { controller.error(error); }
    },
    cancel: reason => reader.cancel(reason),
  });
  return new Response(stream, { status: 206, headers });
}
