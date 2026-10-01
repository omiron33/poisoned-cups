// 22 · "Turn your hearts / Let the proud dreams fall and tire"
// The control room of s06 (lib/x-empire.js skinned by lib/x-d.js): the same towers of dashboard
// screens wrapped in graph lines and map skins, the LED wall of dashboards behind, and a central
// core column that has only ever glowed cold. Outside: close on the stacked screens, all charts
// rising; on "Turn" the core behind them starts to warm for the first time. Inside: a snap back to
// the wide on "proud", and the towers of UI windows topple one after another; each one's screens
// tear into static and die as it tips, glowing shards skitter across the wet floor on impact, the
// skins and the wall's panels go dark, the tallest (with the twisted fibre) falls on "fall", and
// the warm core is left standing as the only light.
import { ease, grade, rgb, orbit, spring, linesFrom, clamp01 } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { EMPIRE_GLSL, empireUniforms, towerState, TOWERS, SH } from '/song/lib/x-empire.js';
import { CYBER_GLSL } from '/song/lib/x-cyber.js';
import { DASH_GLSL, DASH_UNIFORMS } from '/song/lib/x-d.js';

const [LT, LP] = linesFrom('Turn your hearts', 'Let the proud dreams fall and tire');
const setV = (u, k, a) => { const v = u[k].value; if (v && v.set) v.set(...a); else u[k].value = a; };
const hsh = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

export function fallTimes() {
  const w = (re, L) => L.words.find((x) => re.test(x.w)).start;
  return { tTurn: LT.words[0].start, tHearts: w(/hearts/i, LT), tProud: w(/proud/i, LP), tFall: w(/fall/i, LP), tTire: w(/tire/i, LP) };
}
export function fallCamera(P) {
  const { tProud } = fallTimes();
  return (t) => {
    const u = t - P.from;
    // close on the screens of the tallest stacks, the core's glow rising behind, a slow push
    const close = { target: [0.05, 0.62 + 0.03 * u, 0.2], yaw: 0.22 + 0.03 * u, pitch: 0.12, dist: 1.5 - 0.08 * u, fov: 36, drift: 0.006 };
    const t1 = tProud - 0.08;
    if (t < t1) return orbit(t, close);
    // the wide: a snap back that lands on a spring, then a slow push while they fall
    const v = t - tProud;
    const wide = { target: [-0.85, 0.7, 0.0], yaw: 0.16 + 0.02 * v, pitch: 0.2, dist: 4.5 - 0.18 * v, fov: 36, drift: 0.01 };
    const s = spring(t, t1, 0.4, 0.12);
    const m = (a, b) => (Array.isArray(a) ? a.map((x, i) => x + (b[i] - x) * s) : a + (b - a) * s);
    return orbit(t, { target: m(close.target, wide.target), yaw: m(close.yaw, wide.yaw), pitch: m(close.pitch, wide.pitch), dist: m(close.dist, wide.dist), fov: 36, drift: m(close.drift, wide.drift) });
  };
}

export default (P) => {
  const { tTurn, tProud, tFall } = fallTimes();
  const order = [6, 4, 2, 5, 1, 3, 7];
  const dirs = { 0: 1, 1: -1, 2: 1, 3: -1, 4: 1, 5: -1, 6: 1, 7: -1 };
  const fall = order.map((k, i) => [k, tProud + i * ((tFall - tProud - 0.25) / order.length), dirs[k]]);
  fall.push([0, tFall - 0.25, 1]);
  const tl = Math.sqrt(Math.PI / 4.2);        // time from tip to impact (see towerState)
  // one glowing screen shard per tower, thrown from its top on impact
  const shards = (t) => {
    const v = new Array(32).fill(0);
    fall.forEach(([k, ts, d], i) => {
      const [x, z, w, , n] = TOWERS[k];
      const hgt = n * SH;
      const ti = ts + tl;
      const land = [x + d * (w + hgt * (0.7 + 0.5 * hsh(k))), 0.006, z + (hsh(k + 9) - 0.5) * 0.9];
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
  const impacts = fall.map(([, ts]) => ts + tl);
  return {
    name: 's22-fall', from: P.from, to: P.to,
    frag: STUDIO_GLSL + CYBER_GLSL + EMPIRE_GLSL + DASH_GLSL + /* glsl */ `
uniform float uTear;
float mapObj(vec3 p, out int id) {
  float d = empireSDF(p, id);
  float w = dashWall(p);
  if (w < d) { d = w; id = 50; }
  float c = coreSDF(p);
  if (c < d) { d = c; id = 51; }
  int si;
  float s = shardSDF(p, si);
  if (s < d) { d = s; id = 60 + si; }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 50) return dashWallMat(p);
  if (id == 51) return coreMat(p);
  if (id >= 60) return shardMat(id - 60);
  return dashSlabMat(id, p, n);
}
vec3 shade(vec2 fc) {
  fc = glitchTear(fc, uTear);
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  vec3 col = studio(ro, rd, depth);
  return col * mix(1.0, scanlines(fc.y, 1.2), 0.5);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('66, 44, 96', 1.1), uCycB: rgb('18, 12, 30', 1.0),
      uFloorCol: rgb('48, 46, 56', 0.7), uFloorRough: 0.1, uGrime: 0.9,
      uKeyDir: [0.35, 0.9, 0.5], uKeyCol: [2.0, 2.1, 2.5], uKeySize: 0.35,
      uRimA: [2.0, 2.1, 2.4], uRimB: [0.45, 2.0, 0.7],
      uHaze: 0.05, uHazeCol: [0.07, 0.05, 0.1],
      ...empireUniforms(),
      ...DASH_UNIFORMS,
      uBoundX: 1.9,
      uTear: 0,
    },
    camera: fallCamera(P),
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      const v = towerState(t, { fall });
      const a = u.uLv.value; for (let i = 0; i < 32; i++) a[i] = v[i];
      const sh = shards(t), b = u.uShard.value; for (let i = 0; i < 32; i++) b[i] = sh[i];
      u.uTwist.value = 1;
      // the core warms from "Turn", fully on "fall"
      const warm = 0.55 * ease.inOut3((t - tTurn) / 1.0) + 0.45 * ease.inOut3((t - tFall) / 0.6);
      u.uCore.value = warm;
      // the skins, the wall and the fibre die with the fall
      const dead = ease.inOut3((t - tProud) / (tFall - tProud + 0.6));
      u.uSkin.value = 1 - dead;
      u.uWallFail.value = dead;
      u.uWallGlow.value = 0.55;
      u.uGlow.value = 1 - 0.75 * clamp01((t - tFall) / 0.6);
      // a 3-frame tear on each impact
      u.uTear.value = impacts.some((ti) => t >= ti && t < ti + 0.05) ? 0.7 : 0;
      // the room itself warms with the core
      // v3: after "fall" the warm core fills the whole room (walls, floor, haze, key) so the last
      // second reads clearly and hands over to s23's quiet warm pocket
      const end = ease.inOut3((t - tFall) / 0.9);
      const cA = rgb('66, 44, 96', 1.1), wA = rgb('132, 92, 64', 1.5), eA = rgb('168, 112, 70', 1.9);
      const wa = cA.map((x, i) => x + (wA[i] - x) * warm);
      setV(u, 'uCycA', wa.map((x, i) => x + (eA[i] - x) * end));
      const cB = rgb('18, 12, 30', 1.0), eB = rgb('70, 44, 30', 1.2);
      setV(u, 'uCycB', cB.map((x, i) => x + (eB[i] - x) * end));
      setV(u, 'uHazeCol', [0.07 + 0.08 * warm + 0.12 * end, 0.05 + 0.05 * warm + 0.07 * end, 0.1 - 0.04 * warm - 0.02 * end]);
      setV(u, 'uKeyCol', [2.0 + 1.0 * end, 2.1 + 0.3 * end, 2.5 - 0.9 * end]);
      setV(u, 'uFloorCol', rgb('48, 46, 56', 0.7).map((x, i) => x + (rgb('96, 72, 54', 0.9)[i] - x) * end));
      setV(u, 'uP1', [0.0, 1.1, -0.9]);
      setV(u, 'uP1c', [11 * warm * (1 + 1.4 * end), 7.6 * warm * (1 + 1.4 * end), 4.4 * warm * (1 + 1.4 * end)]);
      setV(u, 'uP2', [0.0, 1.4, 1.6]);
      setV(u, 'uP2c', [0.4 * (1 - dead), 1.6 * (1 - dead), 0.7 * (1 - dead)]);
    },
    post(t) { return grade(t, { exposure: 1.05 + 0.3 * ease.inOut3((t - tFall) / 0.8), bloom: 0.08 }); },
  };
};
