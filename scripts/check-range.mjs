import assert from 'node:assert/strict';
import { mediaRange } from '../src/media-range.ts';

const body = '0123456789';
const asset = () => new Response(new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('012')); c.enqueue(new TextEncoder().encode('3456')); c.enqueue(new TextEncoder().encode('789')); c.close(); } }), { headers: { 'Content-Length': '10', 'Content-Type': 'audio/mp4', ETag: '"test"', 'Last-Modified': 'Fri, 20 Nov 2026 00:00:00 GMT' } });
const request = (range, extra = {}, method = 'GET') => new Request('https://example.test/media/vinyl/adele-30-a.m4a', { method, headers: { ...(range ? { Range: range } : {}), ...extra } });
for (const [range, expected, status] of [['bytes=0-3', '0123', 206], ['bytes=3-', '3456789', 206], ['bytes=-3', '789', 206], ['bytes=8-99', '89', 206], ['bytes=-20', body, 206], [null, body, 200], ['items=0-2', body, 200], ['bytes=0-1,4-5', body, 200]]) {
  const response = await mediaRange(request(range), asset());
  assert.equal(response.status, status);
  assert.equal(await response.text(), expected);
  assert.equal(response.headers.get('Accept-Ranges'), 'bytes');
}
for (const range of ['bytes=10-', 'bytes=5-2', 'bytes=-0', 'bytes=', 'bytes=abc']) {
  const response = await mediaRange(request(range), asset());
  assert.equal(response.status, 416);
  assert.equal(response.headers.get('Content-Range'), 'bytes */10');
}
for (const validator of ['"different"', 'W/"test"', 'Thu, 19 Nov 2026 00:00:00 GMT']) {
  assert.equal((await mediaRange(request('bytes=1-2', { 'If-Range': validator }), asset())).status, 200);
}
assert.equal((await mediaRange(request('bytes=1-2', { 'If-Range': '"test"' }), asset())).status, 206);
const unmeasured = asset();
unmeasured.headers.delete('Content-Length');
const fallback = await mediaRange(request('bytes=2-4'), unmeasured, body.length);
assert.equal(fallback.status, 206);
assert.equal(await fallback.text(), '234');
const head = await mediaRange(request('bytes=1-2', {}, 'HEAD'), asset());
assert.equal(head.status, 200); assert.equal(await head.text(), ''); assert.equal(head.headers.get('Content-Length'), '10');
for (const status of [304, 404]) { const upstream = new Response(null, { status }); assert.equal(await mediaRange(request('bytes=1-2'), upstream), upstream); }
console.log('PASS: streaming byte ranges across chunks, open/suffix/clipped ranges, HEAD, unsatisfiable ranges, If-Range, upstream conditional/error responses.');
