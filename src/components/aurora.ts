const FS = [
  'precision mediump float;',
  'uniform vec2 u_res; uniform float u_time; uniform vec2 u_mouse; uniform vec3 u_a; uniform vec3 u_b;',
  'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
  'float noise(vec2 p){vec2 i=floor(p),f=fract(p);float a=hash(i),b=hash(i+vec2(1.0,0.0)),c=hash(i+vec2(0.0,1.0)),d=hash(i+vec2(1.0,1.0));vec2 u=f*f*(3.0-2.0*f);return mix(a,b,u.x)+(c-a)*u.y*(1.0-u.x)+(d-b)*u.x*u.y;}',
  'float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.02;a*=0.5;}return v;}',
  'void main(){vec2 uv=gl_FragCoord.xy/u_res.xy;vec2 p=uv;p.x*=u_res.x/u_res.y;',
  'float t=u_time*0.05;vec2 m=(u_mouse-0.5);',
  'float f=fbm(p*2.4+vec2(t,t*0.6)+m*0.7);f+=0.5*fbm(p*4.2-vec2(t*0.8,t));',
  'float band=smoothstep(0.25,1.05,f);',
  'vec3 col=mix(u_a,u_b,clamp(f*1.1,0.0,1.0));col*=band;',
  'col*=smoothstep(1.25,0.2,length(uv-0.5));',
  'col+=pow(band,2.0)*0.45*u_b;',
  'gl_FragColor=vec4(col,clamp(band*0.85,0.0,0.8));}'
].join('\n');

const hslRgb = (h: number, s: number, l: number) => {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => { const k = (n + h * 12) % 12; return l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1))); };
  return [f(0), f(8), f(4)];
};

export function mountAurora(cv: HTMLCanvasElement, getHue: () => number, getPointer: () => [number, number]) {
  const gl = cv.getContext('webgl', { antialias: false, depth: false, powerPreference: 'low-power' });
  if (!gl) return () => {};
  const sh = (type: number, src: string) => { const o = gl.createShader(type)!; gl.shaderSource(o, src); gl.compileShader(o); return o; };
  const prog = gl.createProgram()!;
  const vertex = sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}');
  const fragment = sh(gl.FRAGMENT_SHADER, FS);
  gl.attachShader(prog, vertex);
  gl.attachShader(prog, fragment);
  gl.linkProgram(prog);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { gl.deleteProgram(prog); return () => {}; }
  gl.useProgram(prog);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = (n: string) => gl.getUniformLocation(prog, n);
  const uRes = u('u_res'), uTime = u('u_time'), uMouse = u('u_mouse'), uA = u('u_a'), uB = u('u_b');

  // ponytail: fixed 0.3 render scale; the noise is soft, so CSS upscaling hides it. Raise only if banding shows.
  const SCALE = 0.3;
  const still = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const start = performance.now();
  let shown = performance.now();
  const render = (now: number) => {
    shown = now;
    const hue = getHue(), [px, py] = getPointer();
    const a = hslRgb(hue / 360, 0.62, 0.42), b = hslRgb(((hue + 40) % 360) / 360, 0.72, 0.6);
    gl.uniform2f(uRes, cv.width, cv.height);
    gl.uniform1f(uTime, (now - start) / 1000);
    gl.uniform2f(uMouse, px / innerWidth, 1 - py / innerHeight);
    gl.uniform3f(uA, a[0], a[1], a[2]); gl.uniform3f(uB, b[0], b[1], b[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const resize = () => {
    cv.width = Math.ceil(innerWidth * SCALE); cv.height = Math.ceil(innerHeight * SCALE);
    gl.viewport(0, 0, cv.width, cv.height);
    render(shown);
  };
  resize(); addEventListener('resize', resize, { passive: true });

  let raf = 0, drawn = 0, probeFrom = 0, ticks = 0;
  const loop = (now: number) => {
    if (!probeFrom) probeFrom = now + 1000;
    else if (probeFrom > 0 && now > probeFrom) {
      ticks++;
      if (now - probeFrom > 1500) {
        const rate = ticks / ((now - probeFrom) / 1000);
        probeFrom = -1;
        if (rate < 20) return;
      }
    }
    raf = requestAnimationFrame(loop);
    if (document.hidden || now - drawn < 33) return;
    drawn = now;
    render(now);
  };
  const restartProbe = () => { if (probeFrom > 0) { probeFrom = 0; ticks = 0; } };
  document.addEventListener('visibilitychange', restartProbe);
  if (!still) raf = requestAnimationFrame(loop);
  cv.classList.add('on');
  return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); document.removeEventListener('visibilitychange', restartProbe); gl.deleteBuffer(buffer); gl.deleteProgram(prog); gl.getExtension('WEBGL_lose_context')?.loseContext(); };
}
