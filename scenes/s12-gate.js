// 12 · "You sell the gate / Then you guard the gate"
// Opens as the widow's two copper coins roll in and topple flat under the gate's threshold.
// A gilt paywall gate between two steel posts in a wet concrete hall, the paid side behind it lit
// sodium orange. Its leaves stand open like a product shot, a price tag hanging from a rail (its price: the widow's two copper coins), a red
// laser grid strung across the opening. Turn: on "guard" the leaves slam shut and the lock
// bolts shoot across, on the last "gate" the laser grid flares and the gilt heats red (s13 takes that heat as fire).
import { keys, ease, grade, rgb, orbit, linesFrom, spring } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';

const [L1, L2] = linesFrom('You sell the gate', 'Then you guard the gate');
const tGuard = L2.words.find((w) => /guard/i.test(w.w)).start;
const tThen = tGuard;   // the slam lands on "guard"
const tGate2 = L2.words[L2.words.length - 1].start;

export default (P) => {
  const t0 = P.from;
  // the slam: leaves swing from open to shut, arriving on "Then"
  const swing = (t) => {
    const a0 = 1.25, dur = 0.32;
    const x = (t - (tThen - dur)) / dur;
    if (x <= 0) return a0 + 0.03 * Math.sin((t - t0) * 1.3);
    if (x < 1) return a0 * (1 - x * x);
    // a hard rebound off the stop, damped
    const u = t - tThen;
    return 0.06 * Math.exp(-u * 9) * Math.abs(Math.sin(u * 22));
  };
  const camera = (t) => {
    const u = t - t0;
    const k = ease.inOut3((t - (tThen - 0.15)) / 0.9);
    const kick = Math.exp(-Math.max(0, t - tThen) * 12) * (t > tThen ? 1 : 0);
    const c = orbit(t, {
      target: [0.0, 1.05 + 0.05 * k, 0],
      yaw: -0.22 + 0.025 * u + 0.12 * k,
      pitch: 0.06 + 0.05 * k,
      dist: 5.0 - 0.1 * u - 1.4 * k,
      fov: 36, drift: 0.006,
    });
    c.pos[1] += 0.02 * kick * Math.sin(t * 90);   // the slam shakes the camera
    return c;
  };
  return {
    name: 's12-gate', from: P.from, to: P.to,
    frag: STUDIO_GLSL + /* glsl */ `
uniform float uSwing, uBolt, uTag, uLaser, uHeat;
uniform vec4 uR1, uR2;   // rolling coins: x, z, roll angle, topple angle
float rollCoin(vec3 p, vec4 c, float seed) {
  vec3 q = p - vec3(c.x, 0.0, c.y);
  if (dot(q.xz, q.xz) > 0.04 || p.y > 0.15) return max(length(q.xz) - 0.08, p.y - 0.12);
  // topple: the coin falls onto its side about the contact line (along z)
  float r = 0.05;
  q.y -= r * cos(c.w) + 0.0055 * sin(c.w);
  q.xy = rot(-c.w) * q.xy;
  q.yz = rot(c.z) * q.yz;
  return sdCoin(q.yxz, r, 0.0055, seed);
}
// a point in a leaf's own frame: x from 0 at the hinge to 0.9 at the meeting stile, swung by uSwing
vec3 leafLocal(vec3 p, float side) {
  vec3 q = p - vec3(side * 0.92, 0, 0);
  q.x *= -side;
  q.xz = rot(-uSwing) * q.xz;
  return q;
}
float leafD(vec3 q, out int id) {
  id = 1;
  if (q.x < -0.1 || q.x > 1.02 || q.y > 2.25 || abs(q.z) > 0.15) return max(max(-0.1 - q.x, q.x - 1.02), max(q.y - 2.25, abs(q.z) - 0.15)) + 0.02;
  // bars with spear finials
  float bx = clamp(floor(q.x / 0.11 + 0.5), 1.0, 7.0) * 0.11;
  float d = max(length(q.xz - vec2(bx, 0.0)) - 0.012, abs(q.y - 1.06) - 0.94);
  d = min(d, sdRoundCone(q - vec3(bx, 2.0, 0), vec3(0), vec3(0, 0.13, 0), 0.028, 0.003));
  // stiles and rails
  d = min(d, sdBox(q - vec3(0.02, 1.06, 0), vec3(0.02, 1.0, 0.022)));
  d = min(d, sdBox(q - vec3(0.88, 1.06, 0), vec3(0.02, 1.0, 0.022)));
  d = min(d, sdBox(q - vec3(0.45, 0.12, 0), vec3(0.45, 0.02, 0.022)));
  d = min(d, sdBox(q - vec3(0.45, 0.55, 0), vec3(0.45, 0.016, 0.02)));
  d = min(d, sdBox(q - vec3(0.45, 1.62, 0), vec3(0.45, 0.016, 0.02)));
  d = min(d, sdBox(q - vec3(0.45, 2.0, 0), vec3(0.45, 0.02, 0.022)));
  // a ring in each top bay
  float cx = clamp(floor(q.x / 0.11) + 0.5, 0.5, 7.5) * 0.11;
  d = min(d, sdTorus((q - vec3(cx, 1.81, 0)).xzy, vec2(0.043, 0.007)));
  return d;
}
float mapObj(vec3 p, out int id) {
  id = 1;
  if (abs(p.x) > 1.5 || p.y > 2.6 || abs(p.z) > 1.3) return max(max(abs(p.x) - 1.45, p.y - 2.55), abs(p.z) - 1.25);
  int li;
  vec3 qa = leafLocal(p, -1.0), qb = leafLocal(p, 1.0);
  float d = min(leafD(qa, li), leafD(qb, li));
  // posts: dark steel with gilt caps
  vec3 pp = vec3(abs(p.x) - 1.04, p.y, p.z);
  float post = sdRoundBox(pp - vec3(0, 1.15, 0), vec3(0.09, 1.15, 0.09), 0.01);
  if (post < d) { d = post; id = 2; }
  float cap = min(sdRoundBox(pp - vec3(0, 2.33, 0), vec3(0.12, 0.03, 0.12), 0.01), sdSphere(pp - vec3(0, 2.44, 0), 0.075));
  if (cap < d) { d = cap; id = 1; }
  // the lock box on the right leaf's meeting stile, and its two bolts
  float lk = sdRoundBox(qb - vec3(0.84, 1.12, 0.055), vec3(0.07, 0.12, 0.035), 0.008);
  if (lk < d) { d = lk; id = 3; }
  float bolt = min(sdCapsule(qb, vec3(0.84, 1.06, 0.055), vec3(0.86 + uBolt, 1.06, 0.055), 0.017),
                   sdCapsule(qb, vec3(0.84, 1.18, 0.055), vec3(0.86 + uBolt, 1.18, 0.055), 0.017));
  if (bolt < d) { d = bolt; id = 4; }
  float rc = min(rollCoin(p, uR1, 1.0), rollCoin(p, uR2, 2.0));
  if (rc < d) { d = rc; id = 6; }
  // the price tag, hanging on a thread from the left leaf's middle rail, swinging
  vec3 tq = qa - vec3(0.62, 0.55, 0.035);
  tq.xy = rot(uTag) * tq.xy;
  float thread = sdCapsule(tq, vec3(0), vec3(0, -0.12, 0), 0.0015);
  float tag = sdRoundBox(tq - vec3(0, -0.2, 0), vec3(0.07, 0.085, 0.002), 0.004);
  tag = max(tag, -sdCyl((tq - vec3(0, -0.135, 0)).xzy, 0.008, 0.01));
  if (min(tag, thread) < d) { d = min(tag, thread); id = 5; }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 1) {
    Mat m = GOLD(); m.rough = 0.14 + 0.12 * vnoise(p * 60.0); m = dirty(m, p, 0.35);
    // the gilt heats red from the lasers, worst low down where the grid is thickest
    float hn = 0.6 + 0.4 * vnoise(p * 9.0 + uTime * 0.5);
    m.emit = vec3(1.0, 0.13, 0.02) * uHeat * uHeat * hn * 0.65 * smoothstep(0.2, 1.4, p.y) * smoothstep(2.3, 1.7, p.y);
    return m;
  }
  if (id == 2) { Mat m = M(vec3(0.6, 0.6, 0.62), 0.42, 1.0); return dirty(m, p, 0.6); }
  if (id == 3) { Mat m = BRASS(); return dirty(m, p, 0.3); }
  if (id == 4) return CHROME();
  if (id == 6) {
    float v = smoothstep(0.55, 0.8, fbm(p * 160.0, 3));
    return M(mix(vec3(0.86, 0.46, 0.3), vec3(0.3, 0.5, 0.38), v * 0.7), 0.3 + 0.3 * v, 1.0 - 0.8 * v);
  }
  // the tag: a bone card with a red price rule, and on it the price: the widow's two copper coins
  vec3 q = leafLocal(p, -1.0) - vec3(0.62, 0.55, 0.035);
  q.xy = rot(uTag) * q.xy;
  float red = step(abs(q.y + 0.165), 0.008) * step(abs(q.x), 0.05);
  vec2 c1 = q.xy - vec2(-0.027, -0.225), c2 = q.xy - vec2(0.027, -0.225);
  float coin = max(step(length(c1), 0.024), step(length(c2), 0.024));
  Mat m = M(vec3(0.85, 0.8, 0.7), 0.6, 0.0);
  m.alb = mix(m.alb, vec3(0.5, 0.02, 0.03), red);
  if (coin > 0.5 && id == 5 && abs(q.z) > 0.001) {
    float v = smoothstep(0.55, 0.8, fbm(p * 160.0, 3));
    m = M(mix(vec3(0.86, 0.46, 0.3), vec3(0.3, 0.5, 0.38), v * 0.7), 0.3 + 0.3 * v, 1.0 - 0.8 * v);
  }
  return m;
}
// the laser grid: a plane of red beams just in front of the opening
vec3 lasers(vec3 ro, vec3 rd, float depth) {
  if (abs(rd.z) < 1e-4) return vec3(0);
  float tz = (0.24 - ro.z) / rd.z;
  if (tz < 0.0 || tz > depth) return vec3(0);
  vec3 q = ro + rd * tz;
  if (abs(q.x) > 0.95 || q.y < 0.08 || q.y > 2.05) return vec3(0);
  float gy = abs(fract(q.y / 0.19) - 0.5) * 0.19;
  float gx = abs(fract((q.x + 0.95) / 0.38) - 0.5) * 0.38;
  float w = 0.0022 * tz;
  float line = exp(-gy * gy / (w * w)) + exp(-gx * gx / (w * w)) * 0.7;
  float halo = exp(-gy / (w * 6.0)) * 0.15;
  return mix(vec3(1.0, 0.05, 0.03), vec3(1.0, 0.28, 0.05), uHeat) * (line * (0.9 - 0.35 * uHeat) + halo * (1.0 + 1.2 * uHeat)) * uLaser;
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  vec3 c = studio(ro, rd, depth);
  return c + lasers(ro, rd, depth) * uExpo;
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('170, 104, 48', 1.3), uCycB: rgb('56, 46, 42', 1.0),
      uFloorCol: rgb('70, 70, 66', 0.9), uFloorRough: 0.06, uFloorGrain: 1.6,
      uKeyDir: [0.25, 0.85, 0.45], uKeyCol: [3.4, 3.8, 4.0], uKeySize: 0.25,
      uRimA: [2.8, 1.1, 0.25], uRimB: [1.6, 1.8, 2.0],
      uP1: [0, 1.6, -1.4], uP1c: [3.2, 1.4, 0.4],
      uP2: [0, 1.0, 0.6], uP2c: [1.4, 0.05, 0.03],
      uGrime: 0.9, uHaze: 0.06, uHazeCol: [0.12, 0.07, 0.035],
      uSwing: 1.25, uBolt: 0, uTag: 0, uLaser: 1, uHeat: 0, uR1: [0, 5, 0, 0], uR2: [0, 5, 0, 0],
    },
    camera,
    textPlane() { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      u.uSwing.value = swing(t);
      // two coins roll in from the camera side, slow to a stop under the threshold and topple flat
      const roll = (x0, z1, delay, dir) => {
        const x = Math.max(0, t - t0 - delay), T = 1.1;
        const k = Math.min(1, x / T), z = z1 + 1.6 * (1 - k) * (1 - k);
        const dist = 1.6 * (1 - (1 - k) * (1 - k));
        const top = x < T ? 0 : Math.min(Math.PI / 2, ((x - T) / 0.28) ** 2 * (Math.PI / 2));
        const wob = x > T + 0.28 ? 0.06 * Math.exp(-(x - T - 0.28) * 10) * Math.sin((x - T) * 40) : 0;
        return [x0, z, -dist / 0.05, dir * (top - wob)];
      };
      u.uR1.value = roll(-0.1, 0.32, 0.0, 1);
      u.uR2.value = roll(0.13, 0.38, 0.15, -1);
      u.uBolt.value = 0.2 * spring(t, tGuard + 0.16, 0.18, 0.15);
      // the tag swings gently, then kicks when the gate slams
      const kick = t > tThen ? 0.35 * Math.exp(-(t - tThen) * 2.5) * Math.sin((t - tThen) * 9) : 0;
      u.uTag.value = 0.08 * Math.sin((t - t0) * 2.2) + kick;
      // the grid hums; flares hard on the last "gate" and holds hot
      const flare = t > tGate2 ? 0.5 + 0.9 * Math.exp(-(t - tGate2) * 4) : 0;
      u.uLaser.value = 0.85 + 0.1 * Math.sin(t * 47) + flare;
      u.uHeat.value = ease.inOut3((t - tGate2) / Math.max(0.5, P.to - tGate2));
      u.uP2c.value = [1.4 * u.uLaser.value, 0.05, 0.03];
    },
    post(t) { return grade(t, { exposure: 1.05, vignette: 0.5 }); },
  };
};
