// 20 · "You stand in the door / Won't walk in / Or let the poor"
// A tall doorway of warm light in a wet, grimy concrete wall. In it stands the "you": an empty pair
// of white gloves, raised, backlit, never moving. On "Won't" steel security bars slam down in front
// of them. On "Or" a sub-cut drops the camera low behind what the poor left on the near side (a
// dented tin cup, a pair of small worn shoes, all silhouettes against the light), and on "poor" a
// gold barrier arm swings down across the threshold and stops a span above the cup. Hold; the warm
// light carries into the fire of s21.
import { keys, ease, grade, rgb, orbit, linesAt, spring } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { GLOVE_GLSL } from '/song/lib/x-gloves.js';

export default (P) => {
  const t0 = P.from;
  const [L1, L2, L3] = linesAt(P.from - 0.5, 'You stand in the door', 'Won', 'Or let the poor');
  const tWont = L2.words[0].start, tOr = L3.words[0].start, tPoor = L3.words[L3.words.length - 1].start;
  const camera = (t) => {
    if (t < tOr) {
      const u = t - t0;
      const kick = t > tWont ? Math.exp(-(t - tWont) * 10) * Math.sin((t - tWont) * 70) * 0.03 : 0;
      const c = orbit(t, { target: [0, 1.2, 0], yaw: 0.16 - 0.025 * u, pitch: 0.02 + kick, dist: 6.2 - 0.22 * u, fov: 38, drift: 0.004 });
      return c;
    }
    // low, behind the near-side things, looking up at the door; a slow creep, a jolt on "poor"
    const u = t - tOr;
    const jolt = t > tPoor ? Math.exp(-(t - tPoor) * 9) * Math.sin((t - tPoor) * 60) * 0.02 : 0;
    return orbit(t, { target: [-0.05, 0.62, 0.45], yaw: -0.12 + 0.01 * u, pitch: 0.14 + jolt, dist: 3.1 - 0.05 * u, fov: 42, drift: 0.003 });
  };
  return {
    name: 's20-door', from: P.from, to: P.to,
    frag: STUDIO_GLSL + GLOVE_GLSL + /* glsl */ `
uniform float uBars, uArm;
const float GS = 1.25;
vec3 gloveQ(vec3 p, float side) { return (p - vec3(side * 0.26, 0.92, -0.12)) / GS; }
float mapObj(vec3 p, out int id) {
  id = 1;
  // the wall with its doorway (door 1.1 wide, 2.3 tall)
  float wall = sdBox(p - vec3(0, 2.5, 0), vec3(4.0, 2.5, 0.15));
  float hole = sdBox(p - vec3(0, 1.15, 0), vec3(0.55, 1.15, 0.4));
  float d = max(wall, -hole);
  // a steel frame round the opening
  float fr = max(sdBox(p - vec3(0, 1.18, 0.14), vec3(0.62, 1.22, 0.025)), -sdBox(p - vec3(0, 1.15, 0), vec3(0.55, 1.15, 0.5)));
  if (fr < d) { d = fr; id = 2; }
  // the light box deep behind the door
  float lb = sdBox(p - vec3(0, 1.4, -1.1), vec3(1.2, 1.6, 0.05));
  if (lb < d) { d = lb; id = 3; }
  // the gloves, raised, palms out, standing in the doorway
  for (int s = 0; s < 2; s++) {
    float side = s == 0 ? 1.0 : -1.0;
    vec3 gq = gloveQ(p, side);
    float gb = gloveBound(gq) * GS;
    float gl = gb > 0.3 ? gb : glove(gq, vec3(0.05, 0.0, 0.1), side) * GS;
    if (gl < d) { d = gl; id = 4; }
  }
  // security bars: they drop out of the wall on "Won't"
  if (abs(p.x) < 0.6 && abs(p.z - 0.05) < 0.1) {
    float bx = clamp(floor(p.x / 0.13 + 0.5), -3.0, 3.0) * 0.13;
    float y0 = uBars;
    float bar = max(length(p.xz - vec2(bx, 0.05)) - 0.02, abs(p.y - (y0 + 1.2)) - 1.2);
    bar = min(bar, sdBox(p - vec3(0, y0 + 0.5, 0.05), vec3(0.5, 0.02, 0.028)));
    if (bar < d) { d = bar; id = 5; }
  } else d = min(d, max(abs(p.x) - 0.55, abs(p.z - 0.05) - 0.05));
  // the barrier arm: pivots on a post right of the door, swings down on "poor"
  vec3 pv = p - vec3(0.74, 1.0, 0.34);
  float post = sdRoundBox(p - vec3(0.74, 0.5, 0.34), vec3(0.05, 0.5, 0.05), 0.01);
  if (post < d) { d = post; id = 2; }
  vec2 ax = vec2(cos(uArm), sin(uArm));
  vec3 aq = vec3(dot(pv.xy, ax), dot(pv.xy, vec2(-ax.y, ax.x)), pv.z);
  float arm = sdRoundBox(aq - vec3(0.72, 0, 0), vec3(0.72, 0.035, 0.035), 0.01);
  arm = min(arm, sdCyl(pv.xzy, 0.06, 0.05));
  if (arm < d) { d = arm; id = 6; }
  // what the poor left on the near side: a dented tin cup, a pair of small worn shoes
  vec3 cp = p - vec3(-0.18, 0.0, 1.0);
  float cup = max(sdCyl(cp - vec3(0, 0.055, 0), 0.05, 0.055) - 0.004, -sdCyl(cp - vec3(0, 0.08, 0), 0.044, 0.06));
  cup = min(cup, sdTorus((cp - vec3(0.055, 0.06, 0)).xzy * vec3(1, 1, 1), vec2(0.025, 0.005)));
  if (cup < d) { d = cup; id = 7; }
  for (int s = 0; s < 2; s++) {
    float o = s == 0 ? 0.0 : 1.0;
    vec3 sp = p - vec3(0.22 + o * 0.09, 0.0, 1.05 + o * 0.03);
    sp.xz = rot(0.2 - o * 0.3) * sp.xz;
    float shoe = smin(sdEllipsoid(sp - vec3(0, 0.03, 0.03), vec3(0.035, 0.03, 0.07)), sdEllipsoid(sp - vec3(0, 0.045, -0.035), vec3(0.03, 0.045, 0.035)), 0.03);
    shoe = max(shoe, -sp.y + 0.002);
    if (shoe < d) { d = shoe; id = 7; }
  }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 1) {
    // wet, stained concrete
    float f = fbm(p * 3.0, 4);
    Mat m = M(vec3(0.3, 0.3, 0.28) * (0.7 + 0.5 * f), 0.75, 0.0);
    return dirty(m, p, 1.0);
  }
  if (id == 2) { Mat m = M(vec3(0.45, 0.46, 0.48), 0.45, 1.0); return dirty(m, p, 0.7); }
  if (id == 3) { Mat m = M(vec3(0.0), 1.0, 0.0); m.emit = vec3(4.2, 2.5, 1.1) * (0.9 + 0.1 * vnoise(p.xy * 3.0)); return m; }
  if (id == 4) { float side = p.x > 0.0 ? 1.0 : -1.0; return gloveMat(gloveQ(p, side)); }
  if (id == 5) { Mat m = M(vec3(0.5, 0.5, 0.52), 0.3, 1.0); return dirty(m, p, 0.5); }
  if (id == 6) { Mat m = GOLD(); m.rough = 0.12 + 0.08 * vnoise(p * 80.0); return m; }
  // the poor's things: dull, worn
  Mat m = M(vec3(0.12, 0.1, 0.09), 0.6, 0.3);
  return m;
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('90, 84, 76', 1.2), uCycB: rgb('50, 48, 46', 0.9),
      uFloorCol: rgb('80, 78, 72', 0.9), uFloorRough: 0.06, uFloorGrain: 1.6,
      uKeyDir: [-0.5, 0.75, 0.5], uKeyCol: [2.6, 2.8, 3.1], uKeySize: 0.3,
      uRimA: [2.6, 1.0, 0.25], uRimB: [1.4, 1.6, 1.9],
      uP1: [0, 1.3, -0.25], uP1c: [7.0, 3.8, 1.5],
      uP2: [-2.2, 3.2, 1.2], uP2c: [5.0, 2.2, 0.5],
      uGrime: 1.0, uHaze: 0.07, uHazeCol: [0.1, 0.075, 0.05],
      uBars: 2.5, uArm: Math.PI / 2,
    },
    camera,
    textPlane() { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      // the bars drop hard on "Won't" and bounce once on the sill
      const kb = t < tWont - 0.12 ? 0 : Math.min(1, ((t - tWont + 0.12) / 0.12) ** 2);
      const bounce = t > tWont ? 0.04 * Math.exp(-(t - tWont) * 12) * Math.abs(Math.sin((t - tWont) * 30)) : 0;
      u.uBars.value = 2.5 * (1 - kb) + bounce;
      // the barrier arm: up (pi/2) until it swings down across the door (pi) on "poor"
      const ka = t < tPoor - 0.22 ? 0 : spring(t, tPoor - 0.22, 0.22, 0.2);
      u.uArm.value = Math.PI / 2 + (Math.PI / 2) * ka;
      // the door's light breathes, then swells toward the fire at the end
      const s = 1 + 0.03 * Math.sin(t * 5.3) + 0.35 * ease.in2((t - (P.to - 0.8)) / 0.8);
      u.uP1c.value = [7.0 * s, 3.8 * s, 1.5 * s];
    },
    post(t) { return grade(t, { exposure: 1.0, vignette: 0.48 }); },
  };
};
