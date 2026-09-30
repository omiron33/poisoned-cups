// 22 · "Turn your hearts / Let the proud dreams fall and tire"
// The empire from s06 (lib/x-empire.js), the same white server towers trimmed in gold with the
// twisted fibre on top. Outside: low at the foot of the towers an empty white glove lies palm-up
// holding a few silver coins; on "Turn your hearts" it tips over, the coins slide off into the
// rubble, and it stays palm-down and empty under a warm light that comes on above it. Inside: a snap
// back to the wide on "proud", and the towers topple one after another like felled trees, the
// tallest (with the fibre) on "fall"; gold trim skitters out across the wet floor on each impact.
import { ease, grade, rgb, orbit, spring, linesFrom, clamp01 } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { EMPIRE_GLSL, empireUniforms, towerState, TOWERS, SH } from '/song/lib/x-empire.js';
import { GLOVE_GLSL } from '/song/lib/x-gloves.js';

const [LT, LP] = linesFrom('Turn your hearts', 'Let the proud dreams fall and tire');
const setV = (u, k, a) => { const v = u[k].value; if (v && v.set) v.set(...a); else u[k].value = a; };
const hsh = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const GLOVE_AT = [0.15, 0.05, 0.95];

export function fallTimes() {
  const w = (re, L) => L.words.find((x) => re.test(x.w)).start;
  return { tTurn: LT.words[0].start, tHearts: w(/hearts/i, LT), tProud: w(/proud/i, LP), tFall: w(/fall/i, LP), tTire: w(/tire/i, LP) };
}
export function fallCamera(P) {
  const { tProud } = fallTimes();
  return (t) => {
    const u = t - P.from;
    // low at the glove, towers looming behind, easing in
    const close = { target: [0.1, 0.22 + 0.04 * u, 0.85], yaw: 0.3 + 0.03 * u, pitch: 0.3 - 0.03 * u, dist: 1.1 - 0.06 * u, fov: 36, drift: 0.006 };
    const t1 = tProud - 0.08;
    if (t < t1) return orbit(t, close);
    // the wide: a snap back that lands on a spring (a fast whip, then ~0.3 s of settling, never a
    // dead stop), then a slow push while they fall
    const v = t - tProud;
    const wide = { target: [0.0, 0.55, 0.0], yaw: 0.18 + 0.02 * v, pitch: 0.2, dist: 4.4 - 0.18 * v, fov: 36, drift: 0.01 };
    const s = spring(t, t1, 0.4, 0.12);
    const m = (a, b) => (Array.isArray(a) ? a.map((x, i) => x + (b[i] - x) * s) : a + (b - a) * s);
    return orbit(t, { target: m(close.target, wide.target), yaw: m(close.yaw, wide.yaw), pitch: m(close.pitch, wide.pitch), dist: m(close.dist, wide.dist), fov: 36, drift: m(close.drift, wide.drift) });
  };
}

export default (P) => {
  const { tTurn, tHearts, tProud, tFall } = fallTimes();
  const order = [6, 4, 2, 5, 1, 3, 7];
  const dirs = { 0: 1, 1: -1, 2: 1, 3: -1, 4: 1, 5: -1, 6: 1, 7: -1 };
  const fall = order.map((k, i) => [k, tProud + i * ((tFall - tProud - 0.25) / order.length), dirs[k]]);
  fall.push([0, tFall - 0.25, 1]);
  const tl = Math.sqrt(Math.PI / 4.2);        // time from tip to impact (see towerState)
  // gold trim: one piece per tower, thrown from its top on impact
  const trim = (t) => {
    const v = new Array(32).fill(0);
    fall.forEach(([k, ts, d], i) => {
      const [x, z, w, , n] = TOWERS[k];
      const hgt = n * SH;
      const ti = ts + tl;
      const land = [x + d * (w + hgt * (0.7 + 0.5 * hsh(k))), 0.012, z + (hsh(k + 9) - 0.5) * 0.9];
      const from = [x + d * (w + hgt * 0.9), 0.1, z];
      let p;
      if (t < ti) p = [0, -5, 0];
      else {
        const s = clamp01((t - ti) / 0.4);
        p = [from[0] + (land[0] - from[0]) * s, from[1] + (land[1] - from[1]) * s + 0.25 * Math.sin(Math.PI * s), from[2] + (land[2] - from[2]) * s];
      }
      v[i * 4] = p[0]; v[i * 4 + 1] = p[1]; v[i * 4 + 2] = p[2]; v[i * 4 + 3] = hsh(k + 3) * 6.28 + (t > ti ? Math.min(t - ti, 0.4) * 12 : 0);
    });
    return v;
  };
  return {
    name: 's22-fall', from: P.from, to: P.to,
    frag: STUDIO_GLSL + EMPIRE_GLSL + GLOVE_GLSL + /* glsl */ `
uniform vec4 uTrim[8];
uniform float uRoll;
uniform vec4 uCoin[4];
const vec3 GAT = vec3(${GLOVE_AT.join(', ')});
float mapObj(vec3 p, out int id) {
  float d = empireSDF(p, id);
  // the glove lying at the foot of the towers, fingers toward +x, rolling palm-up
  vec3 dq = p - GAT;
  if (length(dq) < 0.5) {
    vec3 fy = vec3(0.0, 0.0, 1.0) * 0.0 + normalize(vec3(1.0, 0.0, -0.35));
    vec3 fz = normalize(vec3(0.0, -cos(uRoll), 0.0) + cross(fy, vec3(0.0, 1.0, 0.0)) * sin(uRoll));
    vec3 fx = cross(fy, fz);
    vec3 q = vec3(dot(dq, fx), dot(dq, fy) + 0.2, dot(dq, fz)) / 0.55;
    float g = glove(q, GLOVE_OPEN, 1.0) * 0.55;
    if (g < d) { d = g; id = 40; }
  } else d = min(d, length(dq) - 0.45);
  // the silver coins that slide off the glove
  for (int i = 0; i < 4; i++) {
    vec3 q = p - uCoin[i].xyz;
    if (length(q) > 0.08) { d = min(d, length(q) - 0.06); continue; }
    float a = uCoin[i].w;
    q.xy = vec2(q.x * cos(a) - q.y * sin(a), q.x * sin(a) + q.y * cos(a));
    float c = sdCoin(q, 0.028, 0.0035, float(i));
    if (c < d) { d = c; id = 42; }
  }
  // scattered gold trim
  for (int i = 0; i < 8; i++) {
    vec3 c = uTrim[i].xyz;
    if (c.y < -1.0) continue;
    vec3 q = p - c;
    float a = uTrim[i].w;
    q.xz = vec2(q.x * cos(a) - q.z * sin(a), q.x * sin(a) + q.z * cos(a));
    float b = sdRoundBox(q, vec3(0.09, 0.008, 0.012), 0.004);
    if (b < d) { d = b; id = 41; }
  }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 40) return gloveMat(p);
  if (id == 41) { Mat m = GOLD(); m.rough = 0.15; return m; }
  if (id == 42) { Mat m = SILVER(); m.rough = 0.12 + 0.1 * vnoise(p * 300.0); return m; }
  return empireMat(id, p, n);
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('110, 70, 48', 1.3), uCycB: rgb('34, 24, 22', 1.0),
      uFloorCol: rgb('78, 70, 64', 0.7), uFloorRough: 0.1, uGrime: 0.9,
      uKeyDir: [0.35, 0.9, 0.5], uKeyCol: [2.7, 2.55, 2.35], uKeySize: 0.35,
      uRimA: [2.8, 1.4, 0.5], uRimB: [2.3, 2.5, 2.7],
      uHaze: 0.05, uHazeCol: [0.1, 0.065, 0.045],
      ...empireUniforms(),
      uBoundX: 1.9,
      uTrim: new Array(32).fill(0).map((x, i) => (i % 4 === 1 ? -5 : 0)),
      uRoll: Math.PI,
      uCoin: new Array(16).fill(0),
    },
    camera: fallCamera(P),
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      const v = towerState(t, { fall });
      const a = u.uLv.value; for (let i = 0; i < 32; i++) a[i] = v[i];
      const tr = trim(t), b = u.uTrim.value; for (let i = 0; i < 32; i++) b[i] = tr[i];
      // the glove, palm-up and holding silver, tips over on "Turn" and lies palm-down, empty
      const tip = spring(t, tTurn, 0.45, 0.15);
      u.uRoll.value = Math.PI * (1 - tip);
      const cs = u.uCoin.value;
      for (let i = 0; i < 4; i++) {
        const home = [GLOVE_AT[0] - 0.1 + 0.03 * (i % 2) + 0.008 * i, 0.068 + 0.006 * i, GLOVE_AT[2] + 0.018 * (i - 1.5) * 0.6];
        const land = [home[0] + 0.3 * (hsh(i + 5) - 0.5), 0.004, GLOVE_AT[2] + 0.06 + 0.07 * hsh(i + 11)];
        const s0 = clamp01((t - tTurn - 0.08 - 0.03 * i) / 0.35);
        const e = s0 * s0;
        cs[i * 4] = home[0] + (land[0] - home[0]) * s0;
        cs[i * 4 + 1] = home[1] + (land[1] - home[1]) * e + 0.05 * Math.sin(Math.PI * s0);
        cs[i * 4 + 2] = home[2] + (land[2] - home[2]) * s0;
        cs[i * 4 + 3] = (0.6 + 0.8 * hsh(i)) * Math.sin(Math.PI * s0) + (s0 >= 1 ? 0 : 0);
      }
      // a warm light comes on over the glove, and stays
      const w = clamp01((t - tTurn) / 0.5);
      setV(u, 'uP1', [GLOVE_AT[0] + 0.1, 0.9, GLOVE_AT[2] + 0.35]);
      setV(u, 'uP1c', [5 * w, 3.4 * w, 1.6 * w]);
      u.uGlow.value = 1 - 0.7 * clamp01((t - tFall) / 0.6);
    },
    post(t) { return grade(t, { exposure: 1.05, bloom: 0.07 }); },
  };
};
