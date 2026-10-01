// 25 · "The stones will speak My will" (the climax, held to 150 s)
// It opens on s24's refusal, whole: the three steel control pylons with their rigid cable-vipers
// wound tight round them, the access rails, the wall of frozen LED faces behind. On "stones" white-hot
// light cracks through the pylons under the coils and through the wall behind them, and the vipers
// stand in hard silhouette against it, unbent, not destroyed. Then the camera widens in held steps,
// one per word, and the system's own materials testify: the wall between the pylons, the dead face
// screens (each face gives way to light), the floor slab: each lights from within, cracking white-hot
// round the word it carries. "My" is the one gold-white light, on the centre screen. On the held
// "will" everything blazes.
import { grade, rgb, linesFrom, clamp01, ease, mix } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { VIPER_GLSL } from '/song/lib/x-viper.js';
import { CYBER_GLSL } from '/song/lib/x-cyber.js';
import { XB_GLSL } from '/song/lib/x-b.js';
import { XF_GLSL } from '/song/lib/x-f.js';

const [L] = linesFrom('The stones will speak');

// the six surfaces that carry the words: world centre of the word zone, right axis, up axis,
// zone half size (m) and the word's cap height (m)
export const SURF = [
  // laid out in reading order: THE STONES WILL across the face screens, SPEAK MY on the wall
  // between the pylons, and the held WILL on the floor slab
  { c: [-1.25, 2.05, -2.535], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0.36, 0.22], h: 0.3 },   // The: left face screen
  { c: [0.0, 2.05, -2.535], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0.46, 0.22], h: 0.3 },     // stones: centre face screen
  { c: [1.25, 2.05, -2.535], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0.36, 0.22], h: 0.3 },    // will: right face screen
  { c: [-0.62, 0.78, -2.535], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0.5, 0.2], h: 0.3 },     // speak: wall, left of centre
  { c: [0.62, 0.78, -2.535], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0.34, 0.26], h: 0.4 },    // My: wall, right of centre
  { c: [0.0, 0.021, 0.95], ax: [1, 0, 0], ay: [0, 0, -1], hs: [0.74, 0.34], h: 0.44 },     // will: floor slab
];
const v3 = (a) => `vec3(${a.map((x) => x.toFixed(3)).join(', ')})`;
const v2 = (a) => `vec2(${a.map((x) => x.toFixed(3)).join(', ')})`;

// camera keys: close on the pylons, then held steps outward, one per word
const K = [
  { pos: [0.0, 1.1, 2.45], tg: [0.0, 1.05, -0.4], fov: 44 },
  // v3: tighter, the screen words high in frame and the pylons filling it below (no dead dark top)
  { pos: [-0.1, 1.7, 2.2], tg: [-0.12, 1.2, -1.0], fov: 44 },
  { pos: [0.0, 1.6, 2.3], tg: [0.0, 1.12, -1.0], fov: 44 },
  { pos: [0.0, 1.5, 2.6], tg: [0.0, 1.02, -1.0], fov: 44 },
  { pos: [0.0, 1.25, 3.9], tg: [0.0, 0.8, -0.8], fov: 44 },
  { pos: [0.0, 1.2, 3.75], tg: [0.0, 0.8, -0.8], fov: 44 },
];

export function rig(P) {
  const ws = L.words;               // The stones will speak My will
  const on = ws.map((w) => w.start);
  // segments [t0, t1, fromKey, toKey]: each word lands while the camera holds still
  const seg = [
    [on[1] + 0.14, on[2] - 0.02, 0, 1],
    [on[2] + 0.14, on[3] - 0.01, 1, 2],
    [on[3] + 0.14, on[4] - 0.02, 2, 3],
    [on[4] + 0.15, on[5] - 0.02, 3, 4],
    [on[5] + 0.16, P.to, 4, 5],
  ];
  const lerpK = (a, b, k) => ({ pos: mix(a.pos, b.pos, k), tg: mix(a.tg, b.tg, k), fov: mix(a.fov, b.fov, k) });
  const camera = (t) => {
    let c = K[0];
    for (const [t0, t1, a, b] of seg) {
      if (t < t0) break;
      const last = b === 5;
      const k = last ? ((x) => x * x * (3 - 2 * x))(clamp01((t - t0) / (t1 - t0))) : ease.inOut3(clamp01((t - t0) / (t1 - t0)));
      c = lerpK(K[a], K[b], k);
    }
    return { pos: c.pos, target: c.tg, fov: c.fov, roll: 0 };
  };
  // how brightly each surface burns: nothing before its word, a flare on the onset, then a steady
  // burn that grows on the held "will"
  const all = (t) => ease.inOut3(clamp01((t - on[5]) / 2.4));
  const glow = (t, i) => {
    if (t < on[i] - 0.03) return 0;
    const u = t - on[i];
    return 0.9 + 1.3 * Math.exp(-u * 5) + 1.4 * all(t);
  };
  // the pylons crack on "stones"
  const pylon = (t) => (t < on[1] - 0.03 ? 0 : 0.8 + 1.6 * Math.exp(-(t - on[1]) * 3) + 1.2 * all(t));
  return { camera, glow, all, pylon, ws, on };
}

export default (P) => {
  const R = rig(P);
  return {
    name: 's25-stones', from: P.from, to: P.to,
    frag: STUDIO_GLSL + CYBER_GLSL + VIPER_GLSL + XB_GLSL + XF_GLSL + /* glsl */ `
uniform float uGlow[6];
uniform float uPy, uAll;
${SURF.map((s, i) => `const vec3 SC${i} = ${v3(s.c)}; const vec2 SH${i} = ${v2(s.hs)};`).join('\n')}
// s24's pylons, rails and vipers, exactly
const float PR = 0.17, PHT = 2.0;
vec3 pyl(int k) { return k == 0 ? vec3(-1.15, 0.0, 0.1) : (k == 1 ? vec3(0.0, 0.0, -0.25) : vec3(1.15, 0.0, 0.1)); }
const vec3 HOT = vec3(3.2, 3.0, 2.7);
float mapObj(vec3 p, out int id) {
  id = 5;
  float d = sdBox(p - vec3(0.0, 1.5, -2.6), vec3(3.4, 1.5, 0.06));
  for (int k = 0; k < 3; k++) {
    vec3 q = p - pyl(k);
    float v = sdCyl(q - vec3(0.0, PHT * 0.5, 0.0), PR, PHT * 0.5);
    v = min(v, sdRoundBox(q - vec3(0.0, 0.06, 0.0), vec3(0.27, 0.06, 0.27), 0.01));
    v = min(v, sdCyl(q - vec3(0.0, PHT + 0.04, 0.0), PR + 0.04, 0.04));
    if (v < d) { d = v; id = 2 + k; }
  }
  float r = sdCapsule(p, vec3(-1.15, 1.05, 0.1), vec3(1.15, 1.05, 0.1), 0.028);
  r = min(r, sdCapsule(p, vec3(-1.15, 0.55, 0.1), vec3(1.15, 0.55, 0.1), 0.022));
  if (r < d) { d = r; id = 6; }
  gVipFlick = 0.8;
  for (int k = 0; k < 3; k++) {
    vec3 q = p - pyl(k);
    if (k == 1) q.x = -q.x;
    float fk = float(k);
    float v = helixViper(q, PR + 0.075, 0.075, 0.48 + 0.05 * fk, 0.14, 1.55 + 0.12 * fk, 0.7 + 2.1 * fk, 0.42, 0.3);
    if (v < d) { d = v; id = 1; keepViper(); }
  }
  gVipFlick = -1.0;
  // the floor slab in front of the pylons
  float fl = sdRoundBox(p - vec3(0.0, 0.0, 1.05), vec3(1.6, 0.02, 0.6), 0.005);
  if (fl < d) { d = fl; id = 7; }
  return d;
}
vec3 zoneLight(vec2 f, vec2 hs, float g, float seed, inout Mat m) {
  vec2 c = crackLight(f, hs, seed, 0.12 + 0.18 * min(g, 3.0) + 0.9 * uAll);
  m.alb *= 1.0 - 0.85 * c.y * step(0.01, g);
  m.rough = mix(m.rough, 0.9, c.y * step(0.01, g));
  return HOT * g * c.x;
}
Mat concrete(vec3 p, float k) {
  Mat m = M(vec3(0.3, 0.3, 0.3) * (0.65 + 0.5 * fbm(p * 7.0, 3)), 0.85, 0.0);
  return dirty(m, p, k);
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 1) { Mat m = viperMat(1.0); m.alb *= 0.5; return dirty(m, p, 0.2); }
  if (id == 6) { Mat m = M(vec3(0.7, 0.71, 0.74), 0.18, 1.0); return dirty(m, p, 0.3); }
  if (id == 5) {
    Mat m = M(vec3(0.02, 0.02, 0.025), 0.3, 0.0);
    if (n.z > 0.7) {
      // the three face screens: frozen frowning faces, going dark as their word takes the screen
      float i = clamp(floor(p.x / 1.25 + 0.5), -1.0, 1.0);
      vec2 uv = vec2((p.x - i * 1.25) / 0.52, (p.y - 2.05) / 0.64);
      float g = i < 0.0 ? uGlow[2] : (i > 0.0 ? uGlow[4] : uGlow[3]);
      if (abs(uv.x) < 1.0 && abs(uv.y) < 1.0) {
        vec3 ink = i == 0.0 ? vec3(0.9, 0.95, 1.1) : (i < 0.0 ? vec3(0.9, 0.3, 1.4) : vec3(0.35, 1.3, 0.5));
        m.emit = faceScreen(uv, -0.45, 0.0, 5.0 + i * 7.0, ink, 30.0) * 0.6 * (1.0 - smoothstep(0.0, 0.6, g));
        m.emit *= 1.0 + 1.5 * smoothstep(0.03, 0.0, abs(uv.y - 0.1 - 0.2 * i));
        m.alb = vec3(0.012); m.rough = 0.08; m.clear = 1.0;
        vec3 sc = i < 0.0 ? SC2 : (i > 0.0 ? SC4 : SC3);
        vec2 hs = i < 0.0 ? SH2 : (i > 0.0 ? SH4 : SH3);
        vec3 e = zoneLight(p.xy - sc.xy, hs, g, 4.0 + i, m) * scanlines(p.y * 900.0, 1.0);
        if (i > 0.0) e *= vec3(1.05, 0.9, 0.62);
        m.emit += e;
      } else {
        m = concrete(p, 0.7);
        m.alb *= 0.5;
        m.emit = zoneLight(p.xy - SC0.xy, SH0, uGlow[0], 1.0, m) + zoneLight(p.xy - SC1.xy, SH1, uGlow[1], 2.0, m);
        // behind the vipers the wall itself splits with light on "stones"
        m.emit += HOT * (0.6 * uPy + 1.3 * uAll) * fractureLines(p.xy, 11.0, 1.8) * step(p.y, 1.55);
      }
      m.emit += HOT * uAll * 1.1 * fractureLines(p.xy + 3.0, 13.0, 2.2) * (1.0 - step(abs(uv.x), 1.0) * step(abs(uv.y), 1.0) * 0.6);
    }
    return m;
  }
  if (id == 7) {
    Mat m = concrete(p, 0.9);
    m.rough = 0.35;
    vec2 pg = abs(fract(p.xz / vec2(0.8, 0.6)) - 0.5);
    m.alb *= 1.0 - 0.5 * smoothstep(0.49, 0.497, max(pg.x, pg.y));
    vec2 f = vec2(p.x - SC5.x, -(p.z - SC5.z));
    m.emit = zoneLight(f, SH5, uGlow[5], 6.0, m);
    return m;
  }
  // pylon steel, brushed; under the coils white-hot light cracks through its skin
  vec3 q = p - pyl(id - 2);
  float a = atan(q.z, q.x);
  Mat m = M(vec3(0.5, 0.51, 0.54), 0.2 + 0.12 * vnoise(vec2(a * 40.0, q.y * 2.0)), 1.0);
  m = dirty(m, p, 0.35);
  float band = smoothstep(0.05, 0.25, q.y) * smoothstep(1.95, 1.6, q.y);
  float cr = fractureLines(vec2(a * PR * 1.4, q.y), float(id) * 3.0, 6.0) * band;
  m.emit = HOT * uPy * cr * 1.6 + HOT * 0.03 * uPy * band;
  return m;
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('62, 46, 88', 1.3), uCycB: rgb('14, 12, 22', 1.0),
      uFloorCol: rgb('70, 72, 74', 0.8), uFloorRough: 0.1, uGrime: 0.9,
      uKeyDir: [-0.4, 0.8, 0.45], uKeyCol: [1.6, 1.65, 1.9], uKeySize: 0.3, uExpo: 1.0,
      uRimA: [1.8, 0.7, 2.6], uRimB: [0.7, 2.4, 0.9],
      uHaze: 0.05, uHazeCol: [0.03, 0.025, 0.045],
      uGlow: [0, 0, 0, 0, 0, 0], uPy: 0, uAll: 0,
    },
    camera: R.camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      const G = SURF.map((_, i) => R.glow(t, i));
      u.uGlow.value = G;
      const py = R.pylon(t), all = R.all(t);
      u.uPy.value = py; u.uAll.value = all;
      // light from the burning pylons, from behind the coils (silhouette), and from the newest word
      u.uP1.value = [0.0, 1.0, -1.6];
      u.uP1c.value = [3.0, 2.8, 2.5].map((c) => c * py * 0.5);
      let last = -1; R.on.forEach((o, i) => { if (t >= o) last = i; });
      if (last >= 0) {
        const s = SURF[last];
        const nrm = last === 5 ? [0, 1, 0] : [0, 0, 1];
        u.uP2.value = s.c.map((v, k) => v + nrm[k] * 0.45);
        const warm = last === 4 ? [3.2, 2.6, 1.6] : [3.0, 2.85, 2.6];
        u.uP2c.value = warm.map((c) => c * G[last] * 0.35);
      }
      u.uHaze.value = 0.05 + 0.05 * all;
      u.uHazeCol.value = [0.03 + 0.1 * all, 0.025 + 0.095 * all, 0.045 + 0.08 * all];
      u.uCycB.value = mix(rgb('10, 10, 16', 1.0), rgb('236, 228, 214', 0.4), all);
    },
    post(t) { return grade(t, { exposure: 1.0, bloom: 0.1, threshold: 1.1, ca: 0.2 }); },
  };
};
