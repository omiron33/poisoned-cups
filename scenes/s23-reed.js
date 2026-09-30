// 23 · "A cracked reed bruised / I will never crush or kill"
// Among scattered gold trim in the rubble of the fallen empire (s22 ends there), on wet concrete: one green reed, cracked and bent at a node
// but not broken off, and beside it a clay lamp whose wick only smoulders. Mercy: the warm light
// gathers round them (the wick catches, the room warms) and nothing breaks. It ends on the flame's
// glint, which s24 picks up.
import { grade, rgb, orbit, linesFrom, spring, clamp01, ease, mix } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { FLAME_GLSL } from '/song/lib/flame.js';

const [L1, L2] = linesFrom('A cracked reed', 'I will never crush');
const WICK = [0.36, 0.085, 0.2];

export default (P) => {
  const t0 = P.from;
  const tI = L2.words[0].start;
  const camera = (t) => {
    const u = t - t0;
    const push = ease.inOut3((t - (P.to - 1.6)) / 1.6);
    return orbit(t, { target: mix([0.12, 0.42, 0.05], [0.3, 0.2, 0.18], push), yaw: 0.2 + 0.04 * u, pitch: 0.12 + 0.012 * u, dist: 2.0 - 0.07 * u - 0.5 * push, fov: 34, drift: 0.006 });
  };
  const warm = (t) => 0.15 + 0.45 * ease.inOut3((t - L1.words[0].start) / 3.0) + 0.4 * spring(t, tI, 0.9, 0.1);
  return {
    name: 's23-reed', from: P.from, to: P.to,
    frag: '#define FIRE\n' + STUDIO_GLSL + FLAME_GLSL + /* glsl */ `
uniform float uWarm, uFlame, uSway;
const vec3 K = vec3(0.0, 0.62, 0.0);
vec3 tipDir() { float a = 0.95 + 0.04 * uSway; return vec3(sin(a), cos(a), 0.18); }
float fireDen(vec3 p) {
  vec3 w = vec3(${WICK.join(', ')});
  if (length(p - w - vec3(0, 0.06, 0)) > 0.2) return 0.0;
  return candleFlame(p, w + vec3(0, 0.012, 0), uFlame, 0.016, 3.0) * 1.3;
}
float mapObj(vec3 p, out int id) {
  id = 1;
  float d = 1e9;
  // the reed: a tapering stalk to the crack, then the bruised top bent over but still attached
  float s = sdRoundCone(p, vec3(0.0, 0.0, 0.0), K, 0.02, 0.016);
  vec3 T = K + normalize(tipDir()) * 0.55;
  s = min(s, sdRoundCone(p, K, T, 0.016, 0.006));
  // nodes
  float nd = length(vec2(length(p.xz) - 0.019, (p.y - 0.28))) - 0.006;
  nd = min(nd, length(vec2(length(p.xz) - 0.017, (p.y - 0.5))) - 0.006);
  s = min(s, nd);
  // a leaf blade from the lower node
  vec3 lq = p - vec3(-0.08, 0.5, 0.0);
  lq.xy *= rot(-0.5);
  s = min(s, sdEllipsoid(lq, vec3(0.1, 0.22, 0.004)));
  if (s < d) { d = s; id = 1; }
  // clay lamp
  vec3 lp = p - vec3(${WICK[0]}, 0.0, ${WICK[2]});
  float lamp = sdCyl(lp - vec3(0, 0.035, 0), 0.075, 0.03) - 0.012;
  lamp = max(lamp, -(length(lp - vec3(0, 0.1, 0)) - 0.07));
  lamp = smin(lamp, sdCapsule(lp, vec3(0.0, 0.05, 0.0), vec3(0.0, 0.05, 0.1), 0.02), 0.02);
  if (lamp < d) { d = lamp; id = 2; }
  float wick = sdCapsule(lp, vec3(0.0, 0.05, 0.02), vec3(0.0, 0.085, 0.0), 0.004);
  if (wick < d) { d = wick; id = 3; }
  // rubble: broken concrete chunks round them
  if (length(p - vec3(0.0, 0.1, 0.0)) < 1.3) {
    for (int i = 0; i < 9; i++) {
      float fi = float(i);
      float a = fi * 2.4 + 0.6, r = 0.3 + 0.45 * hash11(fi + 1.3);
      vec3 c = vec3(cos(a) * r - 0.1, 0.0, sin(a) * r * 0.7 - 0.15);
      if (length(c.xz - vec2(${WICK[0]}, ${WICK[2]})) < 0.32 || c.z > 0.15) c.z -= 0.45;   // keep the lamp in view
      vec3 b = vec3(0.07, 0.05, 0.06) + 0.1 * vec3(hash11(fi + 3.0), hash11(fi + 5.0) * 0.6, hash11(fi + 7.0));
      vec3 q = p - c - vec3(0.0, b.y * 0.6, 0.0);
      q.xz *= rot(fi * 1.7); q.xy *= rot(0.3 * (hash11(fi + 9.0) - 0.5));
      // every third piece is gold trim from the fallen empire: a thin bent bar
      bool gold = mod(fi, 3.0) < 0.5;
      if (gold) b = vec3(b.x * 1.6, 0.012, 0.018);
      float rb = sdRoundBox(q, b, gold ? 0.006 : 0.008) + (gold ? 0.0 : 0.004 * (vnoise(q * 22.0) - 0.5));
      if (rb < d) { d = rb; id = gold ? 5 : 4; }
    }
  } else d = min(d, length(p - vec3(0.0, 0.1, 0.0)) - 1.2);
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 1) {
    // living green with fibres; bruised yellow-brown round the crack, split fibres dark
    float fib = vnoise(vec2(atan(p.z, p.x) * 20.0, p.y * 4.0));
    vec3 g = mix(vec3(0.05, 0.22, 0.03), vec3(0.14, 0.34, 0.06), fib);
    float br = exp(-length(p - K) * 14.0);
    g = mix(g, vec3(0.3, 0.2, 0.05), br);
    g *= 1.0 - 0.7 * br * smoothstep(0.6, 0.8, vnoise(vec2(atan(p.z, p.x) * 30.0, p.y * 60.0)));
    Mat m = M(g, 0.4, 0.0); m.sheen = 0.5; m.clear = 0.3;
    return m;
  }
  if (id == 2) return dirty(M(vec3(0.42, 0.2, 0.1), 0.7, 0.0), p, 0.4);
  if (id == 5) { Mat m = GOLD(); m.rough = 0.22; return dirty(m, p, 0.5); }
  if (id == 3) { Mat m = M(vec3(0.05), 0.8, 0.0); m.emit = vec3(2.0, 0.6, 0.1) * smoothstep(0.06, 0.085, p.y) * (0.6 + uWarm); return m; }
  Mat m = M(vec3(0.3, 0.29, 0.27) * (0.7 + 0.5 * fbm(p * 9.0, 3)), 0.85, 0.0);
  return dirty(m, p, 0.9);
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('120, 82, 56', 1.0), uCycB: rgb('40, 30, 28', 0.8),
      uFloorCol: rgb('70, 62, 56', 1.0), uFloorRough: 0.1, uFloorGrain: 1.5,
      uGrime: 1.0, uHaze: 0.08, uHazeCol: [0.1, 0.07, 0.045],
      uKeyDir: [-0.4, 0.85, 0.3], uKeyCol: [1.6, 1.7, 1.9], uKeySize: 0.4,
      uRimA: [2.2, 1.0, 0.3], uRimB: [1.0, 1.0, 1.1],
      uP1: [WICK[0], WICK[1] + 0.09, WICK[2]], uP1c: [0, 0, 0],
      uP2: [-0.9, 0.9, 1.2], uP2c: [0, 0, 0],
      uWarm: 0, uFlame: 0.05, uSway: 0,
    },
    camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      const w = warm(t);
      const glint = 0.8 * ease.inOut3((t - (P.to - 0.6)) / 0.6);
      const fl = 0.85 + 0.15 * Math.sin(t * 13.0) * Math.sin(t * 7.3);
      u.uWarm.value = w;
      u.uFlame.value = 0.035 + 0.075 * w;
      u.uSway.value = Math.sin((t - t0) * 1.3);
      u.uP1c.value = [2.4, 1.1, 0.35].map((c) => c * (w + glint) * fl * 0.5);
      u.uP2c.value = [3.2, 2.0, 1.0].map((c) => c * w * 1.3);
      // cold, flat light at first; warm gathers
      u.uKeyCol.value = mix([1.6, 1.7, 1.9], [3.0, 2.3, 1.5], w);
      u.uCycA.value = rgb('120, 82, 56', 0.6 + 0.8 * w);
      u.uExpo.value = 1.0 + 0.25 * glint;
    },
    post(t) { return grade(t, { exposure: 1.0, vignette: 0.45, bloom: 0.1 }); },
  };
};
