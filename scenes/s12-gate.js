// 12 · "You sell the gate / Then you guard the gate"
// v2. A neon corridor of wet concrete, purple and green tubes down both walls, ending in a sleek
// access portal: a chrome frame in a black wall, two panels of black smoked glass edged in green
// light. A biometric scan line sweeps the opening; on "gate" the panels slide apart for premium
// clearance and cold white light floods out of the paid side. On "guard" they slam shut, the edge
// light turns magenta and a lattice of red laser geometry snaps across the opening; on the last
// "gate" the lattice flares and holds hot (s13 takes that heat as fire). The storefront, the price
// tiers and the ACCESS DENIED lock are set in the lyric layer.
import { ease, grade, rgb, orbit, linesFrom, spring, clamp } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { E_GLSL } from '/song/lib/x-e.js';

const [L1, L2] = linesFrom('You sell the gate', 'Then you guard the gate');
export const W12 = {
  sell: L1.words[1].start, gate1: L1.words[3].start, then: L2.words[0].start,
  guard: L2.words[2].start, gate2: L2.words[4].start,
};

export default (P) => {
  const t0 = P.from;
  const camera = (t) => {
    const u = t - t0;
    const snap = t > W12.guard ? spring(t, W12.guard, 0.4, 0.3) : 0;
    const shake = t > W12.guard ? Math.exp(-(t - W12.guard) * 10) * Math.sin((t - W12.guard) * 80) * 0.012 : 0;
    const c = orbit(t, { target: [0, 1.25, 0], yaw: 0.04 - 0.008 * u, pitch: 0.03 + shake, dist: 6.2 - 0.22 * u - 0.9 * snap, fov: 36 - 3 * snap, drift: 0.004 });
    return c;
  };
  return {
    name: 's12-gate', from: P.from, to: P.to,
    frag: STUDIO_GLSL + E_GLSL + /* glsl */ `
uniform float uOpen, uScanY, uScan, uLaser, uHeat, uLock;
const float HW = 0.72, HH = 2.3;   // the opening's half width and height
float mapObj(vec3 p, out int id) {
  id = 1;
  // corridor walls and ceiling (we are inside it)
  float d = min(1.8 - abs(p.x), 3.2 - p.y);
  // the black portal wall with its opening
  float wall = max(abs(p.z) - 0.12, -sdBox(p - vec3(0, HH * 0.5, 0), vec3(HW, HH * 0.5, 0.3)));
  wall = max(wall, abs(p.x) - 1.8);
  if (wall < d) { d = wall; id = 2; }
  // the chrome frame round the opening
  float fr = max(sdBox(p - vec3(0, HH * 0.5 + 0.04, 0.14), vec3(HW + 0.07, HH * 0.5 + 0.08, 0.03)), -sdBox(p - vec3(0, HH * 0.5, 0), vec3(HW, HH * 0.5, 0.5)));
  if (fr < d) { d = fr; id = 3; }
  // the two smoked glass panels, sliding apart into the wall
  float slide = uOpen * (HW + 0.05);
  float pa = sdRoundBox(p - vec3(-HW * 0.5 - slide, HH * 0.5, 0.0), vec3(HW * 0.5 - 0.005, HH * 0.5 - 0.005, 0.025), 0.01);
  float pb = sdRoundBox(p - vec3(HW * 0.5 + slide, HH * 0.5, 0.0), vec3(HW * 0.5 - 0.005, HH * 0.5 - 0.005, 0.025), 0.01);
  float pn = max(min(pa, pb), abs(p.x) - HW);
  if (pn < d) { d = pn; id = 4; }
  // tubes down both walls: vertical, every 1.4 m, purple and green
  vec3 tq = vec3(abs(p.x) - 1.74, p.y, p.z);
  float k = clamp(floor(p.z / 1.4 + 0.5), 1.0, 6.0);
  float tube = tubeLight(tq - vec3(0, 0, k * 1.4), vec3(0, 0.25, 0), vec3(0, 2.9, 0));
  if (tube < d) { d = tube; id = mod(k + step(0.0, p.x), 2.0) < 0.5 ? 5 : 6; }
  // the paid side: a white room beyond
  float room = p.z + 5.0;
  if (room < d) { d = room; id = 7; }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 1) {
    Mat m = M(vec3(0.13, 0.13, 0.14) * (0.7 + 0.5 * fbm(p * 2.5, 4)), 0.6, 0.0);
    if (p.z < 0.0) { m.alb = vec3(0.8); m.emit = vec3(1.6, 1.7, 1.9) * 0.8; return m; }
    m = dirty(m, p, 0.8);
    // spill from the nearest tubes on the walls and ceiling
    float k = clamp(floor(p.z / 1.4 + 0.5), 1.0, 6.0);
    float dz = p.z - k * 1.4, dx = 1.74 - abs(p.x);
    float sp = exp(-(dz * dz) / 0.25) * exp(-max(dx, 0.0) * 1.2) * smoothstep(3.2, 1.5, p.y);
    vec3 tc = mod(k + step(0.0, p.x), 2.0) < 0.5 ? vec3(1.6, 0.35, 2.6) : vec3(0.45, 2.6, 0.6);
    m.emit = m.alb * tc * sp * 1.6;
    return m;
  }
  if (id == 2) { Mat m = M(vec3(0.02, 0.02, 0.025), 0.25, 0.0); m.clear = 1.0; return dirty(m, p, 0.5); }
  if (id == 3) { Mat m = CHROME(); m.rough = 0.08 + 0.1 * vnoise(p * 40.0); return m; }
  if (id == 4) {
    Mat m = M(vec3(0.015, 0.015, 0.02), 0.03, 0.0); m.clear = 1.0;
    // the panels' edges glow: green while for sale, magenta once locked
    float lx = abs(p.x) - (HW * 0.5 + uOpen * (HW + 0.05));
    float e = smoothstep(0.02, 0.0, abs(abs(lx) - HW * 0.5 + 0.03)) + smoothstep(0.02, 0.0, abs(abs(p.y - HH * 0.5) - HH * 0.5 + 0.04));
    vec3 c = mix(vec3(0.3, 2.2, 0.4), vec3(3.0, 0.2, 1.4), uLock);
    m.emit = c * e * 1.2;
    // a status slit across the middle: a biometric reader line
    m.emit += c * 0.6 * smoothstep(0.006, 0.0, abs(p.y - 1.35)) * step(abs(lx), HW * 0.4);
    return m;
  }
  if (id == 5) { Mat m = M(vec3(0.9), 0.3, 0.0); m.emit = vec3(1.6, 0.35, 2.6) * 2.2; return m; }
  if (id == 6) { Mat m = M(vec3(0.9), 0.3, 0.0); m.emit = vec3(0.45, 2.6, 0.6) * 1.8; return m; }
  Mat m = M(vec3(0.9), 0.5, 0.0); m.emit = vec3(2.2, 2.3, 2.5) * 1.2; return m;
}
// light drawn in the opening's plane: the scan line, then the laser lattice
vec3 portalLight(vec3 ro, vec3 rd, float depth) {
  if (abs(rd.z) < 1e-4) return vec3(0);
  float tz = (0.3 - ro.z) / rd.z;
  if (tz < 0.0 || tz > depth) return vec3(0);
  vec3 q = ro + rd * tz;
  if (abs(q.x) > HW || q.y < 0.02 || q.y > HH) return vec3(0);
  float w = 0.0018 * tz;
  vec3 c = vec3(0);
  float sy = q.y - uScanY;
  c += vec3(0.3, 2.0, 0.4) * (exp(-sy * sy / (w * w)) * 1.4 + exp(-abs(sy) / 0.12) * 0.12 * step(0.0, sy)) * uScan;
  // the lattice: two families of diagonals and a few horizontals
  vec2 g = vec2(q.x + q.y, q.x - q.y) * 0.7071;
  float s = 0.26;
  float ga = abs(fract(g.x / s) - 0.5) * s, gb = abs(fract(g.y / s) - 0.5) * s;
  float gh = abs(fract(q.y / 0.46) - 0.5) * 0.46;
  float line = exp(-ga * ga / (w * w)) + exp(-gb * gb / (w * w)) + 0.6 * exp(-gh * gh / (w * w));
  float halo = (exp(-ga / (w * 6.0)) + exp(-gb / (w * 6.0))) * 0.08;
  c += mix(vec3(1.0, 0.04, 0.12), vec3(1.0, 0.25, 0.3), uHeat) * (line + halo * (1.0 + 2.0 * uHeat)) * uLaser;
  return c;
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  vec3 c = studio(ro, rd, depth);
  return c + portalLight(ro, rd, depth) * uExpo;
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('40, 26, 60', 1.0), uCycB: rgb('14, 10, 22', 1.0),
      uFloorCol: rgb('60, 60, 66', 0.8), uFloorRough: 0.06, uFloorGrain: 1.6, uGrime: 0.55, uFogFar: 60,
      uKeyDir: [0.1, 0.9, 0.5], uKeyCol: [1.2, 1.2, 1.4], uKeySize: 0.4,
      uRimA: [1.6, 0.4, 2.4], uRimB: [0.4, 2.0, 0.6],
      uP1: [0, 1.6, -1.2], uP1c: [0, 0, 0],
      uP2: [0, 1.2, 0.8], uP2c: [0, 0, 0],
      uHaze: 0.06, uHazeCol: rgb('50, 36, 80', 0.35),
      uOpen: 0, uScanY: 3, uScan: 0, uLaser: 0, uHeat: 0, uLock: 0,
    },
    camera,
    textPlane() { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      // the scan sweeps down the opening on "sell" and again on "gate"
      const sweep = (ts) => { const x = (t - ts) / 0.6; return x >= 0 && x <= 1 ? x : -1; };
      const s1 = sweep(W12.sell - 0.1), s2 = sweep(W12.then);
      const s = s1 >= 0 ? s1 : s2;
      u.uScanY.value = s >= 0 ? 2.25 - 2.2 * ease.inOut3(s) : 3;
      u.uScan.value = s >= 0 ? 1 : 0;
      // open for premium clearance on "gate", slammed shut on "guard"
      const open = ease.out3((t - W12.gate1) / 0.45);
      const shut = t < W12.guard - 0.12 ? 0 : Math.min(1, ((t - W12.guard + 0.12) / 0.12) ** 2);
      const bounce = t > W12.guard ? 0.05 * Math.exp(-(t - W12.guard) * 12) * Math.abs(Math.sin((t - W12.guard) * 30)) : 0;
      u.uOpen.value = clamp(open * (1 - shut) + bounce, 0, 1);
      u.uLock.value = t > W12.guard ? 1 : 0;
      const flare = t > W12.gate2 ? 0.6 + 1.0 * Math.exp(-(t - W12.gate2) * 4) : 0;
      u.uLaser.value = t > W12.guard ? 0.9 + 0.08 * Math.sin(t * 47) + flare : 0;
      u.uHeat.value = ease.inOut3((t - W12.gate2) / Math.max(0.5, P.to - W12.gate2));
      // light from the paid side while open; the red of the lattice after
      const o = u.uOpen.value;
      u.uP1c.value = [3.0 * o, 3.1 * o, 3.4 * o];
      const L = u.uLaser.value;
      u.uP2c.value = [1.6 * L, 0.05 * L, 0.2 * L];
    },
    post(t) { return grade(t, { exposure: 1.05, vignette: 0.45, bloom: 0.09 }); },
  };
};
