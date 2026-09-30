// 21 · "Brood of vipers / Who warned you from the fire?"  (v2, hook rung 4: the system in judgment)
// The film's one smash cut into fire: the frame opens white-hot and settles on the whole city-
// system burning. Behind a deep wall of flame the server-tower empire (s06) is lit from below;
// either side, giant LED face screens (synthetic spokesperson faces) stare out over the fire and
// glitch on the kicks; a lattice of conduits runs overhead. In front, three massive cable-vipers
// rear in S-curves, black silhouettes cut against the glow. On "fire?" the fire leaps, the faces
// go blind and the empire starts to sway (s22 topples it). Low camera, a slow push, hard punches.
import { ease, grade, rgb, orbit, linesAt, clamp01, spring } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { FLAME_GLSL } from '/song/lib/flame.js';
import { CYBER_GLSL } from '/song/lib/x-cyber.js';
import { VIPER_GLSL } from '/song/lib/x-viper.js';
import { XB_GLSL } from '/song/lib/x-b.js';
import { EMPIRE_GLSL, empireUniforms, towerState } from '/song/lib/x-empire.js';

const EZ = -3.6;   // the empire stands behind the fire

export default (P) => {
  const t0 = P.from;
  const [L1, L2] = linesAt(P.from - 0.6, 'Brood of vipers', 'Who warned you');
  const tB = L1.words[0].start, tV = L1.words[2].start, tF = L2.words[L2.words.length - 1].start;
  const tearAt = (t) => [tB, tV, tF].reduce((a, h) => Math.max(a, t >= h && t < h + 0.12 ? 1 - (t - h) / 0.12 : 0), 0);
  const camera = (t) => {
    const u = t - t0;
    const k = spring(t, tF, 0.45, 0.25);
    const pB = spring(t, tB - 0.02, 0.3, 0.3), pV = spring(t, tV - 0.02, 0.3, 0.3);
    return orbit(t, { target: [0, 1.25, -1.2], yaw: -0.06 + 0.02 * u, pitch: -0.03 + 0.02 * k, dist: 6.2 - 0.16 * u - 0.25 * pB - 0.25 * pV - 0.45 * k, fov: 44, roll: 0.02 * pV - 0.02 * k, drift: 0.015 });
  };
  return {
    name: 's21-vipers3', from: P.from, to: P.to,
    frag: '#define FIRE\n' + STUDIO_GLSL + FLAME_GLSL + CYBER_GLSL + EMPIRE_GLSL + VIPER_GLSL + XB_GLSL + /* glsl */ `
uniform float uFireH, uTear, uFlash, uBlind;
const vec3 SCR = vec3(2.35, 1.9, -2.2);   // face screens at (±x, y, z)
float mapObj(vec3 p, out int id) {
  float d = empireSDF((p - vec3(0.0, 0.0, ${EZ.toFixed(2)})) / 1.5, id) * 1.5;
  // two giant LED face screens on posts, angled in toward the fire
  vec3 q = vec3(abs(p.x), p.y, p.z) - SCR;
  q.xz = rot(-0.35) * q.xz;
  float v = sdRoundBox(q, vec3(0.62, 0.78, 0.05), 0.02); if (v < d) { d = v; id = 40; }
  v = sdBox(q - vec3(0.0, -1.2, -0.12), vec3(0.05, 0.9, 0.05)); if (v < d) { d = v; id = 41; }
  // overhead conduits, a braided lattice
  vec3 c = p - vec3(0.0, 3.2, -1.6);
  c.z = mod(c.z + 0.6, 1.2) - 0.6;
  v = sdCapsule(c, vec3(-4.0, 0.0, 0.0), vec3(4.0, 0.0, 0.0), 0.05); if (v < d) { d = v; id = 41; }
  float b = length(p - vec3(0.0, 1.0, 0.5)) - 2.2;
  if (b > 0.3) return min(d, b);
  float T = uTime;
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    vec3 base = vec3(-1.25 + 1.25 * fk, 0.0, 0.45 + 0.35 * abs(fk - 1.0));
    vec3 q2 = p - base;
    float side = fk < 1.5 ? 1.0 : -1.0;
    vec3 lq = vec3(q2.y, q2.x * side, q2.z);
    float H = 1.5 + 0.35 * sin(fk * 2.1 + 0.5);
    float vv = sdViper(lq, H, 0.14, 0.26, 2.2, T * 1.5 + fk * 2.0, 0.55, 2.5, vec3(1, 0, 0));
    if (vv < d) { d = vv; id = 1; keepViper(); }
  }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 1) return viperMat(0.0);
  if (id == 41) { Mat m = M(vec3(0.08, 0.08, 0.09), 0.35, 0.8); return dirty(m, p, 0.6); }
  if (id == 40) {
    Mat m = M(vec3(0.02), 0.2, 0.0);
    vec3 q = vec3(abs(p.x), p.y, p.z) - SCR;
    q.xz = rot(-0.35) * q.xz;
    if (q.z > 0.03) {
      float s = p.x > 0.0 ? 1.0 : -1.0;
      vec2 uv = q.xy / vec2(0.6, 0.76);
      // the faces smile out over the fire; on kicks they tear sideways, on "fire?" they go blind
      uv.x += (hash12(vec2(floor(uv.y * 12.0), floor(uTime * 30.0))) - 0.5) * 0.3 * uTear;
      vec3 ink = s > 0.0 ? vec3(1.6, 0.25, 1.0) : vec3(0.4, 1.6, 0.5);
      m.emit = faceScreen(uv, 0.7 - 1.2 * uBlind, uBlind, s > 0.0 ? 3.0 : 11.0, ink, 34.0) * 1.3;
    }
    return m;
  }
  Mat m = empireMat(id, (p - vec3(0.0, 0.0, ${EZ.toFixed(2)})) / 1.5, n);
  return dirty(m, p, 0.5);
}
float fireDen(vec3 p) {
  if (p.z > -0.4 || p.z < -2.6 || p.y > uFireH * 1.6) return 0.0;
  float wall = fireSheet(vec3(p.x * 1.1, p.y * 1.1, p.z * 1.4), uFireH, uTime) * smoothstep(-0.4, -0.9, p.z) * smoothstep(-2.6, -2.0, p.z);
  return wall * 0.55;
}
vec3 shade(vec2 fc) {
  fc = glitchTear(fc, uTear);
  fc = heatWarp(fc, 0.8, uRes.y * 0.35, uRes.y * 0.25);
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  vec3 col = studio(ro, rd, depth);
  // the smash cut: the frame opens white-hot and burns down to the picture
  col = mix(col, vec3(6.0, 3.2, 1.4), uFlash);
  return col;
}`,
    uniforms: {
      ...STUDIO_UNIFORMS, ...empireUniforms(),
      uCycA: rgb('96, 30, 40', 1.3), uCycB: rgb('26, 8, 30', 1.2),
      uFloorCol: rgb('80, 76, 80', 0.8), uFloorRough: 0.08, uGrime: 0.85,
      uKeyDir: [0.2, 0.7, -0.8], uKeyCol: [2.4, 1.1, 0.6], uKeySize: 0.6, uExpo: 1.0,
      uRimA: [2.6, 0.7, 1.4], uRimB: [2.6, 0.9, 0.3],
      uHaze: 0.05, uHazeCol: [0.1, 0.035, 0.04],
      uFireH: 1.6, uGlow: 0.6, uTear: 0, uFlash: 0, uBlind: 0,
    },
    camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      const leap = ease.out5((t - tF + 0.03) / 0.3);
      u.uFireH.value = 1.6 + 0.9 * leap + 0.1 * Math.sin(t * 3.1);
      u.uTear.value = tearAt(t);
      u.uFlash.value = 0.85 * (1 - ease.out3((t - t0) / 0.3));
      u.uBlind.value = ease.out3((t - tF) / 0.25);
      const v = towerState(t, {});
      const sw = leap * 0.05 * Math.sin((t - tF) * 5.0) * clamp01((t - tF) / 0.5);
      for (let k = 0; k < 8; k++) v[k * 4 + 2] = sw * (k % 2 ? 1 : -0.8);
      u.uLv.value = v;
      const fl = 0.85 + 0.15 * Math.sin(t * 19.0) * Math.sin(t * 5.3);
      u.uP1.value = [0, 0.15, EZ + 1.0]; u.uP1c.value = [30 * fl, 10 * fl, 2 * fl];
      u.uP2.value = [0, 1.4, -1.6]; u.uP2c.value = [9 * fl, 3 * fl, 0.6 * fl];
    },
    post(t) { return grade(t, { exposure: 1.0, bloom: 0.09 }); },
  };
};
