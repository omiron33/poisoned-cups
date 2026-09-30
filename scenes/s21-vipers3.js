// 21 · "Brood of vipers / Who warned you from the fire?"
// Chorus 3, the top rung: the whole hall burns. The fire stands wall to wall and floor to ceiling;
// behind it the little server-tower empire (s06) is lit from below, orange on white enamel; in front
// three cable-vipers rear in S-curves, black silhouettes against the flame. On "fire?" the fire
// leaps and the empire begins to sway (s22 topples it). Low camera, slow push.
import { ease, grade, rgb, orbit, linesAt, clamp01, spring } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { FLAME_GLSL } from '/song/lib/flame.js';
import { VIPER_GLSL } from '/song/lib/x-viper.js';
import { EMPIRE_GLSL, empireUniforms, towerState } from '/song/lib/x-empire.js';

const EZ = -3.6;   // the empire stands behind the fire

export default (P) => {
  const t0 = P.from;
  const [L1, L2] = linesAt(P.from - 0.6, 'Brood of vipers', 'Who warned you');
  const tF = L2.words[L2.words.length - 1].start;
  const camera = (t) => {
    const u = t - t0;
    const k = spring(t, tF, 0.5, 0.25);
    return orbit(t, { target: [0, 0.9, -1.2], yaw: -0.08 + 0.02 * u, pitch: 0.02 + 0.02 * k, dist: 4.6 - 0.18 * u - 0.4 * k, fov: 40, drift: 0.015 });
  };
  return {
    name: 's21-vipers3', from: P.from, to: P.to,
    frag: '#define FIRE\n' + STUDIO_GLSL + FLAME_GLSL + EMPIRE_GLSL + VIPER_GLSL + /* glsl */ `
uniform float uFireH;
float mapObj(vec3 p, out int id) {
  float d = empireSDF((p - vec3(0.0, 0.0, ${EZ.toFixed(2)})) / 1.5, id) * 1.5;
  float b = length(p - vec3(0.0, 0.7, 0.3)) - 1.9;
  if (b > 0.25) return min(d, b);
  float T = uTime;
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    vec3 base = vec3(-1.15 + 1.15 * fk, 0.0, 0.25 + 0.3 * abs(fk - 1.0));
    vec3 q = p - base;
    // own x up the world, the head cocked sideways (toward the middle) so it reads in profile
    float side = fk < 1.0 ? 1.0 : (fk > 1.0 ? -1.0 : 1.0);
    vec3 lq = vec3(q.y, q.x * side, q.z);
    float H = 1.0 + 0.25 * sin(fk * 2.1 + 0.5);
    float v = sdViper(lq, H, 0.09, 0.2, 3.0, T * 1.7 + fk * 2.0, 0.5, 2.5, vec3(1, 0, 0));
    if (v < d) { d = v; id = 1; keepViper(); }
  }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 1) return viperMat(0.0);
  Mat m = empireMat(id, (p - vec3(0.0, 0.0, ${EZ.toFixed(2)})) / 1.5, n);
  return dirty(m, p, 0.5);
}
float fireDen(vec3 p) {
  // the hall on fire: a deep wall of flame between the vipers and the empire, and tongues on the floor
  if (p.z > -0.4 || p.z < -2.6 || p.y > uFireH * 1.6) return 0.0;
  float wall = fireSheet(vec3(p.x * 1.1, p.y * 1.1, p.z * 1.4), uFireH, uTime) * smoothstep(-0.4, -0.9, p.z) * smoothstep(-2.6, -2.0, p.z);
  return wall * 0.55;
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS, ...empireUniforms(),
      uCycA: rgb('120, 44, 18', 1.3), uCycB: rgb('34, 14, 10', 1.2),
      uFloorCol: rgb('80, 76, 72', 0.8), uFloorRough: 0.08, uGrime: 0.8,
      uKeyDir: [0.2, 0.7, -0.8], uKeyCol: [2.4, 1.2, 0.5], uKeySize: 0.6, uExpo: 1.0,
      uRimA: [2.6, 1.0, 0.3], uRimB: [2.4, 0.9, 0.3],
      uHaze: 0.05, uHazeCol: [0.12, 0.045, 0.02],
      uFireH: 1.6, uGlow: 0.6,
    },
    camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      const leap = ease.out5((t - tF + 0.03) / 0.3);
      u.uFireH.value = 1.5 + 0.8 * leap + 0.1 * Math.sin(t * 3.1);
      // the empire sways after "fire?"
      const v = towerState(t, {});
      const sw = leap * 0.05 * Math.sin((t - tF) * 5.0) * clamp01((t - tF) / 0.5);
      for (let k = 0; k < 8; k++) v[k * 4 + 2] = sw * (k % 2 ? 1 : -0.8);
      u.uLv.value = v;
      const fl = 0.85 + 0.15 * Math.sin(t * 19.0) * Math.sin(t * 5.3);
      u.uP1.value = [0, 0.15, EZ + 1.0]; u.uP1c.value = [30 * fl, 10 * fl, 2 * fl];
      u.uP2.value = [0, 1.4, -1.6]; u.uP2c.value = [9 * fl, 3 * fl, 0.6 * fl];
    },
    post(t) { return grade(t, { exposure: 1.0 }); },
  };
};
