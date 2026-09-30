// 17 · 'You say "we see" / So your darkness stays'
// Outside: a gold headset with black lenses on a concrete plinth in a cold data hall; God's warm
// white light falls on the gold and dies on the lenses, which reflect nothing. Inside: on
// "darkness" the light narrows and the camera pushes into the right
// lens until its black fills the frame (s18 opens from that dark).
import { grade, rgb, orbit, linesFrom, linesAt, spring, clamp01, keys, ease, mix } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';

const LENS = [0.145, 0.86, 0.09];

export default (P) => {
  const t0 = P.from;
  const [L1, L2] = linesAt(P.from - 0.6, 'You say', 'So your darkness');
  const tDark = L2.words.find((w) => /darkness/i.test(w.w)).start;
  const camera = (t) => {
    const u = t - t0;
    const push = ease.inOut3((t - (tDark - 0.2)) / (P.to - tDark + 0.2));
    const tgt = mix([0.0, 0.84, 0.0], LENS, push);
    return orbit(t, { target: tgt, yaw: -0.28 + 0.06 * u - 0.12 * push, pitch: 0.12 + 0.02 * u * (1 - push), dist: mix(2.1 - 0.08 * u, 0.12, ease.in2(push) * 0.35 + push * 0.62), fov: 32, drift: 0.006 * (1 - push) });
  };
  return {
    name: 's17-we-see', from: P.from, to: P.to,
    frag: STUDIO_GLSL + /* glsl */ `
uniform float uDark;
float mapObj(vec3 p, out int id) {
  id = 3;
  // concrete plinth
  float d = sdRoundBox(p - vec3(0.0, 0.36, -0.05), vec3(0.42, 0.36, 0.3), 0.015);
  float bnd = sdBox(p - vec3(0.0, 0.88, 0.0), vec3(0.4, 0.16, 0.36));
  if (bnd > 0.1) return min(d, bnd);
  vec3 q = p - vec3(0.0, 0.86, 0.0);
  vec3 a = vec3(abs(q.x), q.y, q.z);
  // lens cups (axis z)
  vec3 lq = a - vec3(0.145, 0.0, 0.03);
  float cup = sdCyl(lq.xzy, 0.105, 0.05) - 0.012;
  float g = cup; id = 1;
  // rim ring round each lens face
  float rim = length(vec2(length(lq.xy) - 0.108, lq.z - 0.062)) - 0.012;
  g = min(g, rim);
  // bridge
  g = smin(g, sdCapsule(q, vec3(-0.06, 0.02, 0.05), vec3(0.06, 0.02, 0.05), 0.022), 0.03);
  // strap: an ellipse ring round the back
  vec3 sq = q - vec3(0.0, 0.0, -0.12);
  sq.z *= 1.25;
  float strap = sdTorus(sq, vec2(0.24, 0.018)) ;
  strap = max(strap, sq.z - 0.05);
  strap = max(strap, abs(q.y) - 0.035);
  g = min(g, strap);
  if (g < d) { d = g; id = 1; }
  // black lens faces
  float lens = sdCyl((lq - vec3(0.0, 0.0, 0.062)).xzy, 0.098, 0.006);
  if (lens < d) { d = lens; id = 2; }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 1) { Mat m = GOLD(); m.rough = 0.12 + 0.1 * vnoise(p * 70.0); return dirty(m, p, 0.12); }
  if (id == 2) {
    // a black mirror: the hall is in it until uDark, then it goes flat
    // a black lens that reflects nothing: the warm light falls on the gold and dies here
    Mat m = M(vec3(0.012, 0.012, 0.014), 0.6, 0.0);
    m.emit = vec3(0.004, 0.004, 0.005);
    return m;
  }
  Mat m = M(vec3(0.2, 0.2, 0.2), 0.75, 0.0);
  m.alb *= 0.85 + 0.3 * fbm(p * 6.0, 3);
  return dirty(m, p, 0.7);
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('96, 116, 130', 1.0), uCycB: rgb('32, 40, 50', 0.8),
      uFloorCol: rgb('60, 68, 74', 1.0), uFloorRough: 0.08, uFloorGrain: 1.5,
      uGrime: 0.85, uHaze: 0.06, uHazeCol: [0.06, 0.08, 0.1],
      uKeyDir: [-0.3, 0.8, 0.55], uKeyCol: [3.6, 3.2, 2.7], uKeySize: 0.4,
      uRimA: [2.4, 2.7, 3.0], uRimB: [0.5, 2.2, 0.6],
      uP1: [0.6, 1.4, 0.9], uP1c: [0.6, 0.8, 1.0],
      uDark: 0,
    },
    camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      // on "darkness" the warm light narrows and dims round the goggles (never out)
      const k = ease.inOut3((t - tDark + 0.05) / 0.5);
      u.uDark.value = k;
      u.uKeyCol.value = [3.6, 3.2, 2.7].map((c) => c * (1 - 0.45 * k));
      u.uKeySize.value = 0.4 - 0.2 * k;
    },
    post(t) { return grade(t, { exposure: 1.0, vignette: 0.45 }); },
  };
};
