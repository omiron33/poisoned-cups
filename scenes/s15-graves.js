// 15 · "You paint the graves / With your incense and your skill"
// The white monolith from s03, cracked, grime bleeding from it. Two robotic spray arms work it over,
// sweeping fresh gloss white across the crack; on "incense" (camera snap) LED incense is pumped in
// and rolls over it, and by "skill" the arms have won: the crack is sealed flawless white and nothing
// shows through. That is the lie (s16's light sees through it).
import { grade, rgb, orbit, linesFrom, spring, clamp01, ease, mix } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';

const [L1, L2] = linesFrom('You paint the graves', 'With your incense');
const W = (L, k) => L.words.find((w) => w.w.toLowerCase().replace(/[^a-z]/g, '').startsWith(k));

export default (P) => {
  const t0 = P.from;
  const tPaint = W(L1, 'paint').start, tGr = W(L1, 'graves').start, tIn = W(L2, 'incense').start, tSk = W(L2, 'skill').start;
  const camera = (t) => {
    const u = t - t0;
    const snap = ease.out5((t - tIn) / 0.2);
    return orbit(t, {
      target: mix([-0.55, 1.05, 0.0], [-0.35, 1.15, 0.05], snap),
      yaw: mix(0.42 - 0.04 * u, -0.35 - 0.03 * u, snap),
      pitch: mix(0.12, 0.02, snap),
      dist: mix(4.0 - 0.12 * u, 3.4 - 0.1 * u, snap), fov: 34, drift: 0.007,
    });
  };
  // nozzle heights: they sweep up and down the crack, faster once the grime is winning
  const noz = (t, side) => 1.1 + 0.75 * Math.sin((t - t0) * (2.2 + 0.5 * clamp01((t - tGr) / 3)) + side * 1.9);
  return {
    name: 's15-graves', from: P.from, to: P.to,
    frag: STUDIO_GLSL + /* glsl */ `
uniform float uCrack, uNozL, uNozR;
const vec3 MC = vec3(0.0, 1.12, 0.0);
const vec3 MB = vec3(0.42, 1.12, 0.14);
float crackX(float y) { return 0.03 * sin(y * 7.0) + 0.05 * (vnoise(vec2(y * 5.0, 1.0)) - 0.5); }
vec3 nozzle(float side, float ny) { return vec3(side * 0.16, ny, 0.34); }
float arm(vec3 p, float side, float ny) {
  vec3 base = vec3(side * 1.05, 0.0, 0.7);
  vec3 sh = vec3(side * 1.05, 0.95, 0.7);
  vec3 N = nozzle(side, ny);
  vec3 E = (sh + N) * 0.5 + vec3(side * 0.35, 0.25, 0.25);
  float d = sdCyl(p - base - vec3(0, 0.06, 0), 0.16, 0.06);
  d = min(d, sdCapsule(p, base, sh, 0.07));
  d = min(d, sdCapsule(p, sh, E, 0.055));
  d = min(d, sdCapsule(p, E, N + vec3(0, 0, 0.1), 0.04));
  d = min(d, length(p - sh) - 0.095);
  d = min(d, length(p - E) - 0.075);
  return d;
}
float mapObj(vec3 p, out int id) {
  id = 1;
  float d = sdRoundBox(p - MC, MB, 0.02);
  float pl = sdRoundBox(p - vec3(0.0, 0.04, 0.0), vec3(0.62, 0.04, 0.3), 0.01);
  if (pl < d) { d = pl; id = 2; }
  float aL = arm(p, -1.0, uNozL), aR = arm(p, 1.0, uNozR);
  if (aL < d) { d = aL; id = 3; }
  if (aR < d) { d = aR; id = 3; }
  float nz = min(sdCapsule(p, nozzle(-1.0, uNozL), nozzle(-1.0, uNozL) + vec3(0, 0, 0.1), 0.025), sdCapsule(p, nozzle(1.0, uNozR), nozzle(1.0, uNozR) + vec3(0, 0, 0.1), 0.025));
  if (nz < d) { d = nz; id = 4; }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 1) {
    Mat m = LACQUER(vec3(0.93, 0.93, 0.92)); m.rough = 0.1;
    float y = p.y;
    // fresh paint where a nozzle has just passed (its own half of the face)
    float fresh = smoothstep(0.3, 0.05, abs(y - (p.x < 0.0 ? uNozL : uNozR)));
    // the main crack down the face, and branches off it, opening with uCrack
    float dx = abs(p.x - crackX(y));
    float main = smoothstep(0.012 + 0.02 * uCrack, 0.004, dx) * step(0.0, uCrack * 2.4 - abs(y - 1.1) * 1.6);
    vec2 uv = vec2(p.x, y) * 9.0;
    float e = voronoiEdge(uv).x;
    float branch = smoothstep(0.03, 0.01, e) * smoothstep(0.4 * uCrack + 0.02, 0.0, dx) * uCrack;
    float crack = max(main, branch) * (1.0 - 0.85 * fresh);
    // grime bleeding down from the crack in streaks
    float streak = smoothstep(0.4, 0.8, fbm(vec2(p.x * 30.0, y * 1.4 + 2.0), 3)) * smoothstep(0.45 * uCrack + 0.03, 0.0, dx);
    float bleed = sat(streak * 1.2 * uCrack + smoothstep(0.08, 0.0, dx) * uCrack * 0.6) * (1.0 - 0.7 * fresh);
    m.alb = mix(m.alb, vec3(0.1, 0.085, 0.06), bleed);
    m.alb = mix(m.alb, vec3(0.03, 0.01, 0.008), crack);
    m.rough = mix(m.rough, 0.8, sat(crack + bleed)) * (1.0 - 0.8 * fresh);
    m.clear = mix(m.clear * (1.0 - bleed), 1.0, fresh);
    return m;
  }
  if (id == 2) return dirty(M(vec3(0.3, 0.3, 0.29), 0.7, 0.0), p, 0.8);
  if (id == 4) { Mat m = M(vec3(0.1), 0.4, 0.0); m.emit = vec3(0.5, 3.0, 0.7); return m; }
  Mat m = M(vec3(0.7, 0.68, 0.64), 0.35, 0.0); m.clear = 0.6;
  return dirty(m, p, 0.6);
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('92, 76, 66', 1.0), uCycB: rgb('34, 32, 36', 0.8),
      uFloorCol: rgb('64, 62, 58', 1.0), uFloorRough: 0.1, uFloorGrain: 1.5,
      uGrime: 0.9, uHaze: 0.04, uHazeCol: [0.08, 0.085, 0.08],
      uKeyDir: [0.5, 0.75, 0.6], uKeyCol: [3.0, 2.7, 2.3], uKeySize: 0.35,
      uRimA: [2.6, 1.2, 0.3], uRimB: [1.6, 1.9, 2.1],
      uP1: [0, 1.1, 0.6], uP1c: [0.2, 0.9, 0.3],
      uCrack: 0, uNozL: 1, uNozR: 1,
    },
    camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      const nl = noz(t, -1), nr = noz(t, 1);
      u.uNozL.value = nl; u.uNozR.value = nr;
      u.uP1.value = [0, (nl + nr) / 2, 0.6];
      // cracks open in steps on the hits: paint, graves, incense, skill
      // the crack opens on "paint" and "graves"; from "incense" the arms seal it, flawless by "skill"
      const open = 0.25 * spring(t, tPaint, 0.5, 0.2) + 0.55 * spring(t, tGr, 0.5, 0.2);
      const seal = ease.inOut3((t - tIn) / Math.max(0.5, tSk - tIn - 0.2));
      u.uCrack.value = open * (1 - seal);
      // LED incense pumped in: the haze thickens and glows green
      const inc = clamp01((t - tIn + 0.5) / 2.0);
      u.uHaze.value = 0.04 + 0.07 * inc;
      u.uHazeCol.value = [0.08 + 0.03 * inc, 0.085 + 0.05 * inc, 0.08 + 0.03 * inc];
    },
    post(t) { return grade(t, { exposure: 1.0, vignette: 0.5 }); },
  };
};
