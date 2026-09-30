// 20 · "You stand in the door / Won't walk in / Or let the poor" (v2)
// Out of s19's doorway: a tall door of warm light in a black, wet concrete wall, the protected
// chamber beyond. In the doorway stands a chrome scan gate, its ring lights green; in front of it a
// row of speed-gate cabinets with glass flaps and LED tops, the tiered barriers. On "Won't" the
// system hard-locks: gate and cabinet lights snap to red, the flaps slam shut and a red barrier
// line strings across every lane; the camera stops on a spring. On "Or" a low cut from behind the
// ones kept out: anonymous silhouettes against the door light, a tin cup, a phone at 3 % glowing
// red, waiting. On "poor" the barrier lines flare. The door's light swells at the end (s21 turns it
// to fire).
import { ease, grade, rgb, orbit, linesAt, spring, clamp } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { E_GLSL } from '/song/lib/x-e.js';

export const lines20 = (P) => linesAt(P.from - 0.5, 'You stand in the door', 'Won', 'Or let the poor');

export const camera20 = (P) => {
  const [, L2, L3] = lines20(P);
  const tWont = L2.words[0].start, tOr = L3.words[0].start;
  return (t) => {
    if (t < tOr) {
      // square on to the door from the barrier line, pushing in; on "Won't" the push is caught by a
      // spring and held (a hard stop that still settles)
      const u = Math.min(t, tWont) - P.from;
      const s = t > tWont ? spring(t, tWont, 0.35, 0.25) : 0;
      return orbit(t, { target: [0, 1.2, 0], yaw: 0.0, pitch: 0.1, dist: 3.4 - 0.2 * u - 0.12 * s, fov: 40, drift: t > tWont ? 0.001 : 0.003 });
    }
    // low, behind the silhouettes, looking up at the door; a slow creep
    const u = t - tOr;
    return orbit(t, { target: [0.05, 1.05, 0], yaw: -0.06 + 0.008 * u, pitch: 0.01 + 0.004 * u, dist: 9.2 - 0.16 * u, fov: 34, drift: 0.003 });
  };
};

export default (P) => {
  const [, L2, L3] = lines20(P);
  const tWont = L2.words[0].start, tPoor = L3.words[L3.words.length - 1].start;
  return {
    name: 's20-door', from: P.from, to: P.to,
    frag: STUDIO_GLSL + E_GLSL + /* glsl */ `
uniform float uLock, uFlap, uBar, uSwell;
const float DW = 0.55, DH = 2.3;
float mapObj(vec3 p, out int id) {
  id = 1;
  // the wall and its doorway
  float wall = max(max(p.z, -p.z - 0.3), -sdBox(p - vec3(0, DH * 0.5, -0.15), vec3(DW, DH * 0.5, 0.5)));
  wall = max(wall, abs(p.x) - 6.0);
  float d = wall;
  // the chamber's light beyond
  float lb = sdBox(p - vec3(0, 1.4, -1.6), vec3(1.6, 1.8, 0.05));
  if (lb < d) { d = lb; id = 2; }
  // the scan gate standing in the doorway: two chrome posts and a lintel, with ring lights
  vec3 g = p - vec3(0, 0, 0.12);
  float gate = min(sdBox(vec3(abs(g.x) - 0.46, g.y - 1.0, g.z), vec3(0.04, 1.0, 0.06)), sdBox(g - vec3(0, 2.02, 0), vec3(0.5, 0.04, 0.06)));
  if (gate < d) { d = gate; id = 3; }
  // speed-gate cabinets in a row in front of the door, with glass flaps in the lanes
  if (p.z > 0.6 && p.z < 2.2 && p.y < 1.3) {
    float cx = clamp(floor(p.x / 0.8), -3.0, 2.0) + 0.5;
    vec3 c = p - vec3(cx * 0.8, 0.5, 1.4);
    float cab = sdRoundBox(c, vec3(0.1, 0.5, 0.6), 0.03);
    if (cab < d) { d = cab; id = 4; }
    // flaps: from each cabinet into the lane on its right, sliding out on the lock
    float fx = clamp(floor(p.x / 0.8 + 0.5), -2.0, 2.0) * 0.8;
    vec3 f = p - vec3(fx, 0.75, 1.4);
    float w = 0.05 + 0.25 * uFlap;
    float flap = sdRoundBox(vec3(abs(f.x) - (0.35 - w * 0.5 - 0.02), f.y, f.z), vec3(w * 0.5, 0.2, 0.008), 0.006);
    flap = max(flap, abs(fx) - 2.8);
    if (flap < d) { d = flap; id = 5; }
  } else d = min(d, max(max(p.z - 2.2, 0.6 - p.z), p.y - 1.3) + 0.01);
  // the ones kept out: silhouettes waiting on the near side
  if (p.z > 3.5 && p.z < 4.9) {
    for (int i = 0; i < 5; i++) {
      float fi = float(i);
      vec3 fp = vec3(-1.3 + fi * 0.65 + 0.15 * (hash11(fi) - 0.5), 0, 3.95 + 0.6 * hash11(fi + 3.0));
      vec3 q = p - fp;
      q.xz = rot(0.3 * (hash11(fi + 7.0) - 0.5)) * q.xz;
      float fg = figure(q, 1.55 + 0.25 * hash11(fi + 1.0), fi);
      if (fg < d) { d = fg; id = 6; }
      // a tin cup held out, or a phone
      vec3 hq = q - vec3(0.2 + 0.05 * hash11(fi), 0.72 * (1.55 + 0.25 * hash11(fi + 1.0)) / 1.75, 0.22);
      float obj = mod(fi, 2.0) < 0.5 ? sdCyl(hq, 0.035, 0.045) : sdRoundBox(hq, vec3(0.035, 0.07, 0.006), 0.004);
      if (obj < d) { d = obj; id = mod(fi, 2.0) < 0.5 ? 7 : 8; }
    }
  } else d = min(d, max(p.z - 4.9, 3.5 - p.z) + 0.02);
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 1) {
    Mat m = M(vec3(0.12, 0.12, 0.13) * (0.7 + 0.5 * fbm(p * 2.8, 4)), 0.55, 0.0);
    return dirty(m, p, 1.0);
  }
  if (id == 2) { Mat m = M(vec3(0), 1.0, 0.0); m.emit = vec3(4.2, 3.0, 1.9) * uSwell; return m; }
  vec3 lockC = mix(vec3(0.3, 2.4, 0.5), vec3(3.2, 0.12, 0.3), uLock);
  if (id == 3) {
    Mat m = CHROME(); m.rough = 0.1;
    // ring lights down the inner faces of the posts
    float ring = smoothstep(0.2, 0.0, abs(fract(p.y * 5.0 - uTime * 1.5 * (1.0 - uLock)) - 0.5) - 0.3);
    m.emit = lockC * ring * step(abs(p.x), 0.43) * 1.2;
    return m;
  }
  if (id == 4) {
    Mat m = M(vec3(0.05, 0.05, 0.06), 0.25, 0.3); m.clear = 1.0;
    // an LED strip along the top of each cabinet
    m.emit = lockC * 1.4 * smoothstep(0.02, 0.0, abs(p.y - 0.98)) * step(0.9, n.y + 0.5);
    return m;
  }
  if (id == 5) { Mat m = M(vec3(0.05, 0.05, 0.06), 0.05, 0.0); m.clear = 1.0; m.emit = lockC * 0.05; return m; }
  if (id == 6) { Mat m = M(vec3(0.02, 0.02, 0.022), 0.8, 0.0); m.sheen = 0.5; m.emit = vec3(1.0, 0.6, 0.3) * pow(1.0 - abs(n.z), 5.0) * 0.35 * uSwell; return m; }
  if (id == 7) { Mat m = M(vec3(0.45, 0.45, 0.43), 0.45, 1.0); return dirty(m, p * 4.0, 0.6); }
  // a phone at 3 %: a dim red screen
  Mat m = M(vec3(0.02), 0.2, 0.0); m.emit = vec3(1.4, 0.05, 0.05) * 0.35; return m;
}
// the barrier lines strung across every lane on the lock, drawn in the cabinets' plane
vec3 barrier(vec3 ro, vec3 rd, float depth) {
  if (uBar <= 0.0 || abs(rd.z) < 1e-4) return vec3(0);
  float tz = (1.4 - ro.z) / rd.z;
  if (tz < 0.0 || tz > depth) return vec3(0);
  vec3 q = ro + rd * tz;
  if (abs(q.x) > 2.8) return vec3(0);
  float w = 0.0022 * tz;
  float l = 0.0;
  for (int i = 0; i < 3; i++) { float y = 0.45 + 0.22 * float(i); float dy = q.y - y; l += exp(-dy * dy / (w * w)) + 0.08 * exp(-abs(dy) / (w * 5.0)); }
  return vec3(1.0, 0.05, 0.15) * l * uBar;
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  vec3 c = studio(ro, rd, depth);
  return c + barrier(ro, rd, depth) * uExpo;
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('36, 30, 44', 1.0), uCycB: rgb('12, 10, 16', 1.0),
      uFloorCol: rgb('60, 60, 64', 0.8), uFloorRough: 0.06, uFloorGrain: 1.6, uGrime: 0.95,
      uKeyDir: [-0.3, 0.9, 0.4], uKeyCol: [0.9, 0.95, 1.1], uKeySize: 0.4,
      uRimA: [1.2, 0.35, 1.8], uRimB: [0.4, 1.4, 0.6],
      uP1: [0, 1.4, -0.4], uP1c: [6.0, 4.0, 2.2],
      uP2: [0, 1.0, 1.4], uP2c: [0, 0, 0],
      uHaze: 0.07, uHazeCol: rgb('110, 84, 70', 0.45),
      uLock: 0, uFlap: 0, uBar: 0, uSwell: 1,
    },
    camera: camera20(P),
    textPlane() { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      u.uLock.value = t >= tWont - 0.02 ? 1 : 0;
      u.uFlap.value = t < tWont - 0.1 ? 0 : spring(t, tWont - 0.1, 0.22, 0.2);
      const flare = t > tPoor ? 1.2 * Math.exp(-(t - tPoor) * 3) : 0;
      u.uBar.value = t < tWont ? 0 : 0.9 + 0.08 * Math.sin(t * 43) + flare;
      const sw = 1 + 0.03 * Math.sin(t * 5.3) + 0.6 * ease.in2((t - (P.to - 1.0)) / 1.0);
      u.uSwell.value = sw;
      u.uP1c.value = [6.0 * sw, 4.0 * sw, 2.2 * sw];
      u.uP2c.value = [1.4 * u.uBar.value, 0.05, 0.15 * u.uBar.value];
    },
    post(t) { return grade(t, { exposure: 1.0, vignette: 0.45, bloom: 0.09 }); },
  };
};
