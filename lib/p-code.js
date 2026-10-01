// Premium "made of code" look: a lit Three.js scene is rendered off screen and redrawn as a fine
// grid of code glyphs (half-width katakana, digits and operators, mirrored like terminal rain).
// Each glyph is picked by how bright the picture is under it, and its strokes carry the picture's
// own light inside the cell, so faces, hands and cloth folds resolve at near-photographic detail
// while everything on screen is characters. Columns of brighter "rain" run down over the form.
//
//   import { codeLook } from '/song/lib/p-code.js';
//   const look = codeLook(THREE, renderer, W, H, { cell: 7 });
//   build():  return { scene: look.scene };       // the engine renders this (a full-screen grid)
//   update(t, { camera }): look.render(inner, camera, t);   // draw the real scene for this sub-frame
//   look.set({ form, glitch, dir })   form 0..1 swirls the picture in out of code; glitch forces a burst
// Spontaneous glitches (torn bands with split channels, inverted blocks, blocks dropping to the raw
// picture) fire a few times a second at random (glitchRate, default 0.8).
//
// Options: cell (px, default 7), ink [r,g,b] (default toxic green), hot (the colour of the brightest
//   strokes), rain (0..1 strength of the falling columns), speed, keepHue (0..1: saturated colours in
//   the picture, like a red scan line, keep their hue instead of turning green), floor (glyph level in
//   empty black, the faint background code).

const GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789:.=*+-<>|{}()[];/\\#$%&Z';

function atlas(THREE) {
  const N = [...GLYPHS].length, G = 64, cols = 16, rows = Math.ceil(N / cols);
  const cv = document.createElement('canvas'); cv.width = cols * G; cv.height = rows * G;
  const x = cv.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, cv.width, cv.height);
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = `600 ${G * 0.78}px "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Osaka", "MS Gothic", monospace`;
  const glyphs = [...GLYPHS];
  glyphs.forEach((g, i) => {
    const cx = (i % cols) * G + G / 2, cy = Math.floor(i / cols) * G + G / 2;
    x.save(); x.beginPath(); x.rect(cx - G / 2, cy - G / 2, G, G); x.clip();   // each glyph stays in its own cell
    x.translate(cx, cy); x.scale(-1, 1); x.fillText(g, 0, 2); x.restore();   // mirrored, like the rain
  });
  // order the glyphs by ink, so brightness picks a denser glyph
  const img = x.getImageData(0, 0, cv.width, cv.height).data;
  const ink = glyphs.map((_, i) => {
    let s = 0; const ox = (i % cols) * G, oy = Math.floor(i / cols) * G;
    for (let yy = 0; yy < G; yy++) for (let xx = 0; xx < G; xx++) s += img[4 * ((oy + yy) * cv.width + ox + xx)];
    return [i, s];
  }).sort((a, b) => a[1] - b[1]);
  const order = new Float32Array(N); ink.forEach(([i], r) => { order[r] = i; });
  const tex = new THREE.CanvasTexture(cv);
  tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = true;
  tex.colorSpace = THREE.NoColorSpace;
  // a small lookup texture: rank -> glyph index
  const lut = new THREE.DataTexture(order, N, 1, THREE.RedFormat, THREE.FloatType); lut.needsUpdate = true;
  return { tex, lut, N, cols, rows };
}

export function codeLook(THREE, renderer, W, H, o = {}) {
  const A = atlas(THREE);
  const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4, depthBuffer: true });
  const u = {
    src: { value: rt.texture }, glyphs: { value: A.tex }, lut: { value: A.lut }, N: { value: A.N },
    grid: { value: new THREE.Vector2(A.cols, A.rows) }, res: { value: new THREE.Vector2(W, H) },
    cell: { value: o.cell ?? 7 }, time: { value: 0 },
    ink: { value: new THREE.Vector3(...(o.ink ?? [0.16, 1.0, 0.36])) },
    hot: { value: new THREE.Vector3(...(o.hot ?? [0.82, 1.0, 0.86])) },
    rain: { value: o.rain ?? 0.6 }, speed: { value: o.speed ?? 1 }, keepHue: { value: o.keepHue ?? 0.9 },
    bgLevel: { value: o.floor ?? 0.035 }, gain: { value: o.gain ?? 2.4 }, detail: { value: o.detail ?? 0.65 }, raw: { value: o.raw ? 1 : 0 },
    form: { value: 1 }, glitch: { value: 0 }, glitchRate: { value: o.glitchRate ?? 0.8 }, swirlDir: { value: 1 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: u, depthTest: false, depthWrite: false,
    vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform sampler2D src, glyphs, lut; uniform float raw, form, glitch, glitchRate, swirlDir; uniform float N, cell, time, rain, speed, keepHue, bgLevel, gain, detail;
      uniform vec2 grid, res; uniform vec3 ink, hot;
      float h11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
      float h21(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
      float lum(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
      void main() {
        vec2 px = gl_FragCoord.xy;
        vec2 c = floor(px / cell), f = fract(px / cell);
        // ---- spontaneous glitches: a few short bursts a second, plus forced ones (kicks) ----
        float slice = floor(time * 15.0);
        float burst = clamp(glitch + glitchRate * step(0.9, h11(slice * 1.7)) * (0.5 + 0.5 * h11(slice * 9.3)), 0.0, 1.0);
        float bandH = 2.0 + floor(h11(slice * 3.1) * 9.0);
        float band = floor(c.y / bandH);
        float tear = burst * step(0.62, h21(vec2(band, slice)));
        float shift = floor((h21(vec2(band + 5.0, slice)) - 0.5) * 46.0) * tear;
        vec2 blk = floor(c / vec2(9.0 + floor(h11(slice) * 8.0), 4.0 + floor(h11(slice * 2.0) * 5.0)));
        float hk = h21(blk + slice * 7.1);
        float rawBlock = burst * step(0.972, hk);
        float invBlock = burst * step(0.94, hk) * (1.0 - rawBlock);
        // ---- the swirl: cells stream in along a spiral and lock onto the picture as form -> 1 ----
        vec2 asp = vec2(res.x / res.y, 1.0);
        vec2 q = ((c + 0.5) * cell / res - 0.5) * asp;
        float d = length(q), ang = atan(q.y, q.x);
        float k = clamp((form * 1.45 - (h21(c + 3.3) * 0.45 + d * 0.5)) / 0.18, 0.0, 1.0);
        float spin = (1.0 - k) * (1.0 - k) * (2.5 + 5.0 * (1.0 - min(d, 1.0))) * swirlDir;
        float sa = ang + spin, sd = d * mix(0.35 + 0.65 * h21(c + 8.0), 1.0, k);
        vec2 sq = vec2(cos(sa), sin(sa)) * sd / asp + 0.5;
        vec2 sc = floor(sq * res / cell) + vec2(shift, 0.0);
        // the picture under the (moved) cell (5 taps) and under this pixel
        vec2 cc = (sc + 0.5) * cell / res, o = vec2(cell * 0.3) / res;
        vec3 C = texture2D(src, cc).rgb * 0.4 + 0.15 * (texture2D(src, cc + o).rgb + texture2D(src, cc - o).rgb + texture2D(src, cc + vec2(o.x, -o.y)).rgb + texture2D(src, cc + vec2(-o.x, o.y)).rgb);
        vec2 pu = (sc + f) * cell / res;
        vec3 P = texture2D(src, pu).rgb;
        float L = lum(C), Lp = lum(P);
        // the rain: each column has its own speed and phase; a bright head with a fading trail
        float col = c.x, sp = (0.35 + 0.9 * h11(col * 7.13)) * speed;
        float head = fract(time * sp * 0.22 + h11(col * 3.7)) * 1.4 - 0.2;
        float y = 1.0 - (c.y + 0.5) * cell / res.y;
        float dy = y - head;
        float trail = dy < 0.0 ? exp(dy * 9.0) : exp(-dy * 400.0);
        float r = rain * trail * (0.55 + 0.45 * h11(col * 1.9));
        // brightness picks the glyph; glyphs re-roll at their own rate (faster under the rain head,
        // in a burst, and while the cell is still swirling)
        float v = pow(max(1.0 - exp(-gain * L), 0.0), 0.9);
        float tick = floor(time * (2.0 + 10.0 * h21(c) + 30.0 * burst * tear + 24.0 * (1.0 - k)) + 6.0 * trail);
        float jit = (h21(c + tick * 1.37) - 0.5) * (7.0 + 30.0 * tear);
        // the spiral arms carry the unformed code
        float arms = pow(0.5 + 0.5 * sin(ang * 3.0 - d * 16.0 + time * 7.0 * swirlDir), 6.0) * smoothstep(1.1, 0.1, d);
        float vs = mix(arms * 0.9 + 0.05 * h21(c + tick), v, k);
        float rank = clamp(floor(vs * (N - 1.0) + jit), 2.0, N - 1.0);
        float gi = texture2D(lut, vec2((rank + 0.5) / N, 0.5)).r;
        vec2 g = vec2(mod(gi, grid.x), floor(gi / grid.x));
        vec2 guv = (g + vec2(0.06 + 0.88 * f.x, 1.0 - (0.06 + 0.88 * f.y))) / grid;
        float m = texture2D(glyphs, vec2(guv.x, 1.0 - guv.y)).r;
        // the light inside the strokes: the cell's level, sharpened toward the pixel's own level
        float level = mix(v, pow(max(1.0 - exp(-gain * Lp), 0.0), 0.9), detail);
        level = mix(arms * 1.1, level, k) + bgLevel * (0.4 + 0.6 * h21(c + 11.0)) + r * 0.55;
        if (invBlock > 0.5) level = max(0.0, 0.85 - level);
        float s = m * level;
        // colour: green ink, hot strokes go pale; saturated picture colours keep their hue
        float sat = (max(C.r, max(C.g, C.b)) - min(C.r, min(C.g, C.b))) / max(1e-4, max(C.r, max(C.g, C.b)));
        vec3 hue = C / max(1e-4, max(C.r, max(C.g, C.b)));
        // only a strong red (the scan line, warning lights) keeps its hue; everything else is green ink
        float red = smoothstep(1.8, 3.0, C.r / max(1e-4, max(C.g, C.b))) * smoothstep(0.82, 0.97, sat);
        vec3 base = mix(ink, hue, keepHue * k * red * smoothstep(0.02, 0.12, L));
        vec3 colr = mix(base * s, hot * s * 1.15, smoothstep(0.55, 1.0, level) * 0.75);
        colr += hot * m * r * 0.25;
        // a torn band splits its channels
        if (tear > 0.5) colr = vec3(colr.r * 1.6 + 0.08 * m, colr.g * 0.75, colr.b * 1.8 + 0.1 * m);
        // a dropped block shows the raw picture underneath, pixelated
        if (rawBlock > 0.5) colr = texture2D(src, (floor(pu * res / 4.0) * 4.0 + 2.0) / res).rgb * 1.2;
        gl_FragColor = raw > 0.5 ? vec4(P, 1.0) : vec4(colr * 1.6, 1.0);
      }`,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  quad.frustumCulled = false;
  const scene = new THREE.Scene(); scene.add(quad);
  return {
    scene, uniforms: u, target: rt,
    // form 0..1 (0: all code swirling, 1: the picture locked in), glitch 0..1 (a forced burst),
    // dir +1 swirls in, -1 swirls out
    set({ form, glitch, dir } = {}) { if (form != null) u.form.value = form; if (glitch != null) u.glitch.value = glitch; if (dir != null) u.swirlDir.value = dir; },
    render(inner, camera, t) {
      u.time.value = t;
      const prev = renderer.getRenderTarget();
      renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 1); renderer.clear(true, true, true);
      renderer.render(inner, camera);
      renderer.setRenderTarget(prev);
    },
  };
}
