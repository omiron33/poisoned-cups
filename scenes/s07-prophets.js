// 07 · "You honor prophets / That your fathers tried to kill"   (v2)
// A memorial feed wall: six giant LED screens in a black bezel grid on a wet concrete floor, each
// showing a sanitised heroic face in cold white line light, ringed by a silver UI laurel, with
// tribute candles flickering along the foot. From "That" the signal corrupts: bands tear across the
// screens and expose the archive underneath (the same faces in red, blindfolded by noise, a
// targeting reticle on each, cracked layers and deleted-pixel checkerboard). On "kill" every screen
// fails to the archive, and red deletion artefacts bleed down the wall in pixel drips and spill
// across the floor toward the lens as the camera tilts down to it.
import { ease, grade, rgb, linesFrom, spring } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { CYBER_GLSL } from '/song/lib/x-cyber.js';
import { XC_GLSL } from '/song/lib/x-c.js';

const [L1, L2] = linesFrom('You honor prophets', 'That your fathers tried to kill');
export const prophetTimes = () => ({ tB: L2.words[0].start, tT: L2.words[L2.words.length - 3].start, tK: L2.words[L2.words.length - 1].start });
const mixv = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
export const prophetsCamera = (t0, to) => {
  const { tB, tK } = prophetTimes();
  return (t) => {
    const d = 0.005 * (Math.sin(t * 0.8) + 0.5 * Math.sin(t * 2.2));
    const u = t - t0, v = Math.max(0, t - tB), w = Math.max(0, t - tK);
    const A = { pos: [0.3 - 0.05 * u, 0.45 + 0.03 * u, 3.7 - 0.2 * u], target: [0, 1.28, 0], fov: 42 };
    const B = { pos: [0.45 - 0.04 * v, 1.52, 2.3 - 0.08 * v], target: [0.05, 1.5, 0], fov: 34 };
    const C = { pos: [0.18 - 0.02 * w, 1.62, 1.3 - 0.05 * w], target: [0.0, 1.62, 0], fov: 32 };
    const D = { pos: [0.35, 1.0 - 0.05 * w, 2.3 + 0.05 * w], target: [0.1, 0.12, 0.9], fov: 46 };
    const m1 = spring(t, tB, 0.55, 0.15), m2 = spring(t, tK, 0.4, 0.2);
    const m3 = ease.inOut3((t - (tK + 0.55)) / Math.max(0.6, to - (tK + 0.55) + 0.2));
    let pos = mixv(mixv(mixv(A.pos, B.pos, m1), C.pos, m2), D.pos, m3);
    let target = mixv(mixv(mixv(A.target, B.target, m1), C.target, m2), D.target, m3);
    const fov = ((A.fov * (1 - m1) + B.fov * m1) * (1 - m2) + C.fov * m2) * (1 - m3) + D.fov * m3;
    pos = [pos[0] + d, pos[1] + d * 0.5, pos[2]];
    return { pos, target, fov, roll: 0.01 * Math.sin(u * 0.5) };
  };
};

export default (P) => {
  const t0 = P.from;
  const { tB, tT, tK } = prophetTimes();
  const hits = [tB, tT, tK];
  return {
    name: 's07-prophets', from: P.from, to: P.to,
    frag: STUDIO_GLSL + CYBER_GLSL + XC_GLSL + /* glsl */ `
uniform float uCor, uDead, uBleed, uRun, uTear;
const vec2 SH = vec2(0.52, 0.36);
// which screen a point on the wall face is on: centre, index
vec2 scrCentre(vec2 p, out float idx) {
  float cx = p.x < -0.575 ? -1.15 : (p.x > 0.575 ? 1.15 : 0.0);
  float cy = p.y < 1.25 ? 0.85 : 1.65;
  idx = (cx + 1.15) / 1.15 + (cy > 1.0 ? 3.0 : 0.0);
  return vec2(cx, cy);
}
// red pixel spill on the floor: a pool under the wall and runs toward the lens
float spill2D(vec2 p) {
  float d = 1e9;
  for (int i = 0; i < 3; i++) {
    float x = -1.15 + 1.15 * float(i);
    float L = 3.2 * (1.0 - exp(-uRun * (0.8 + 0.3 * float(i))));
    float zz = clamp(p.y - 0.1, 0.0, L);
    float cx = x + 0.18 * sin(zz * 2.2 + float(i) * 2.0) + 0.1 * zz * (float(i) - 1.0);
    float w = 0.12 + 0.06 * sin(zz * 7.0 + float(i)) + 0.1 * zz;
    float dz = max(p.y - 0.1 - L, 0.1 - p.y);
    d = smin(d, max(abs(p.x - cx) - w, dz), 0.12);
  }
  float pool = max(abs(p.x) - 1.75 * sat(uRun * 1.5), abs(p.y - 0.25) - 0.18);
  return min(d, pool);
}
float mapObj(vec3 p, out int id) {
  id = 1;
  // the wall: a black slab, the screens set into it a little
  float wall = sdBox(p - vec3(0, 1.3, -0.15), vec3(1.8, 1.25, 0.15));
  float d = wall;
  if (wall < 0.1) {
    float idx; vec2 c = scrCentre(p.xy, idx);
    float scr = sdBox(p - vec3(c, 0.0), vec3(SH, 0.02));
    d = max(d, -scr);
    float face = sdBox(p - vec3(c, -0.012), vec3(SH, 0.004));
    if (face < d) { d = face; id = 2; }
  }
  if (uRun > 0.0 && p.y < 0.05 && p.z > -0.1) {
    float s = max(spill2D(p.xz), p.y - 0.004);
    if (s < d) { d = s; id = 4; }
  }
  return d;
}
vec3 heroLayer(vec2 uv, float idx) {
  vec2 fu = uv * vec2(SH.x / SH.y, 1.0);
  vec3 bg = mix(vec3(0.03, 0.02, 0.07), vec3(0.09, 0.06, 0.16), 0.5 + 0.5 * uv.y);
  float face = neonFace(fu * 1.35 + vec2(0.0, -0.05), 0.0, -1.0, idx * 3.7 + 1.0);
  float laurel = laurelRing(fu * vec2(1.0, 1.05), 0.98, 9.0);
  // tribute strip: a row of candle bars flickering along the foot, a hairline over them
  float foot = step(uv.y, -0.8) * step(-0.97, uv.y);
  float cand = step(0.7, fract(fu.x * 9.0)) * smoothstep(-0.97, -0.9, uv.y) * step(uv.y, -0.84 + 0.04 * vnoise(vec2(floor(fu.x * 9.0) * 3.0, uTime * 6.0)));
  float rule = smoothstep(0.012, 0.0, abs(uv.y + 0.76)) * step(abs(fu.x), 1.2);
  vec3 col = bg + vec3(1.3, 1.4, 1.6) * face * 1.2 + vec3(0.85, 0.9, 1.1) * laurel * 1.1;
  col += vec3(0.9, 0.85, 1.2) * (cand * foot * 1.3 + rule * 0.9);
  return col * scanlines(uv.y, 220.0);
}
vec3 archiveLayer(vec2 uv, float idx) {
  vec2 fu = uv * vec2(SH.x / SH.y, 1.0);
  vec3 bg = vec3(0.05, 0.0, 0.01);
  float face = neonFace(fu * 1.35 + vec2(0.0, -0.05), -0.4, 1.0, idx * 3.7 + 1.0);
  // the reticle: a ring and cross hairs on the face
  float r = length(fu - vec2(0.0, 0.1));
  float ret = smoothstep(0.02, 0.0, abs(r - 0.42)) + smoothstep(0.012, 0.0, abs(fu.x)) * step(0.25, abs(fu.y - 0.1)) * step(abs(fu.y - 0.1), 0.6)
            + smoothstep(0.012, 0.0, abs(fu.y - 0.1)) * step(0.25, abs(fu.x)) * step(abs(fu.x), 0.6);
  // deleted pixels: blocks of transparency checker
  vec2 blk = floor(fu * vec2(4.0, 3.0) + idx * 1.7);
  float del = step(0.62, hash12(blk + floor(uTime * 4.0) * 0.0)) * (0.35 + 0.35 * checker(fu, 18.0));
  float cr = crackMask(fu + idx, 3.0, 0.03);
  vec3 col = bg + vec3(1.8, 0.08, 0.2) * face + vec3(1.6, 0.15, 0.5) * ret * 0.9;
  col = mix(col, vec3(0.5, 0.48, 0.52) * (0.4 + 0.6 * checker(fu, 18.0)), del * 0.8);
  col += vec3(1.4, 1.3, 1.4) * cr * 0.8;
  return col * scanlines(uv.y, 140.0);
}
// red deletion artefacts: columns of pixel blocks bleeding down from the foot of each screen row,
// over the screens below, the bezels and the plinth, to the floor
float drip(vec2 p) {
  float col = floor(p.x / 0.035);
  float h = hash11(col * 1.37 + 3.0);
  float len = uBleed * (0.25 + 1.3 * h * h) * step(0.3, h);
  float inCol = step(abs(p.x - (p.x < -0.575 ? -1.15 : (p.x > 0.575 ? 1.15 : 0.0))), SH.x - 0.02);
  float m = max(step(1.29 - len, p.y) * step(p.y, 1.29), step(0.49 - len * 1.4, p.y) * step(p.y, 0.49));
  float px = step(0.22, fract(p.y / 0.035)) * step(0.15, fract(p.x / 0.035));
  float flick = 0.6 + 0.4 * hash12(vec2(col, floor(p.y / 0.035) + floor(uTime * 10.0)));
  return m * inCol * px * flick;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 4) {
    // the spill: wet black film with blocks of red pixels burning in it
    Mat m = M(vec3(0.02, 0.0, 0.005), 0.08, 0.0); m.clear = 1.0;
    vec2 g = floor(p.xz * 28.0);
    float on = step(0.35, hash12(g + floor(uTime * 8.0) * 0.37));
    m.emit = vec3(1.6, 0.03, 0.1) * on * (0.4 + 0.6 * hash12(g));
    return m;
  }
  float idx; vec2 c = scrCentre(p.xy, idx);
  if (id == 1) {
    Mat m = M(vec3(0.02, 0.02, 0.025), 0.3, 0.2); m.clear = 0.6;
    m.emit = vec3(1.5, 0.02, 0.1) * drip(p.xy);
    return m;
  }
  // the screen
  vec2 uv = (p.xy - c) / SH;
  Mat m = M(vec3(0.01), 0.25, 0.0); m.clear = 0.35;
  // bands tear to the archive as the corruption rises; after "kill" the archive holds
  float band = floor(uv.y * 9.0 + 9.0);
  float h = hash12(vec2(band + idx * 17.0, floor(uTime * 12.0)));
  float rev = max(step(h, uCor * 0.75), uDead);
  float sx = rev > 0.5 && uDead < 0.5 ? (hash12(vec2(band, floor(uTime * 24.0))) - 0.5) * 0.3 : 0.0;
  vec3 col = rev > 0.5 ? archiveLayer(uv + vec2(sx, 0.0), idx) : heroLayer(uv, idx);
  // LED pixels
  vec2 cen;
  float led = ledMask(uv * vec2(SH.x / SH.y, 1.0), 48.0, cen);
  m.emit = col * (0.35 + 0.65 * led) * 1.1;
  float dr = drip(p.xy);
  m.emit = mix(m.emit, vec3(1.8, 0.03, 0.12), dr);
  return m;
}
vec3 shade(vec2 fc) {
  fc = glitchTear(fc, uTear);
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('40, 30, 56', 1.0), uCycB: rgb('10, 8, 16', 1.0),
      uFloorCol: rgb('80, 78, 88', 1.0), uFloorRough: 0.08, uGrime: 0.85,
      uKeyDir: [-0.35, 0.85, 0.45], uKeyCol: [2.4, 2.6, 3.0], uKeySize: 0.25,
      uRimA: [1.8, 2.0, 2.3], uRimB: [1.4, 0.3, 1.6],
      uP1: [0, 2.8, 2.6], uP1c: [0.6, 0.6, 0.9],
      uP2: [0, 0.3, 1.6], uP2c: [0, 0, 0],
      uHaze: 0.05, uHazeCol: [0.06, 0.05, 0.09],
      uFogFar: 26,
      uCor: 0, uDead: 0, uBleed: 0, uRun: 0, uTear: 0,
    },
    camera: prophetsCamera(t0, P.to),
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      u.uCor.value = t < tB ? 0 : Math.min(1, 0.25 + 0.75 * (t - tB) / Math.max(0.3, tK - tB));
      u.uDead.value = t >= tK ? 1 : 0;
      u.uBleed.value = t < tT ? 0 : ease.out3((t - tT) / 1.6) * 1.2;
      u.uRun.value = Math.max(0, t - tK - 0.2) * 0.9;
      let tear = 0;
      for (const h of hits) { const d = t - h; if (d >= 0 && d < 0.1) tear = Math.max(tear, 1 - d / 0.1); }
      u.uTear.value = tear;
      const dead = u.uDead.value;
      u.uP1c.value = dead ? [1.2, 0.05, 0.15] : [0.6, 0.6, 0.9];
      const r = Math.min(1, u.uRun.value * 2);
      u.uP2c.value = [1.4 * r, 0.02 * r, 0.12 * r];
    },
    post(t) { return grade(t, { exposure: 1.05 }); },
  };
};
