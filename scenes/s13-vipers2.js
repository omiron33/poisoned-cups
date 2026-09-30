// 13 · "Brood of vipers / Who warned you from the fire?"
// Chorus 2, the second rung: the fire has taken a whole row of racks. It opens on the gate's red
// heat (the row glows dull red) and on "Brood" the heat catches into a wall of flame along the row.
// One cable-viper rises out of the wet floor, its back to us, to face it; on "fire?" the wall
// leaps and the viper rears to its full height. Low camera from its side. Exit: a push-in on its head as the tongue flicks.
import { ease, grade, rgb, orbit, linesAt, clamp01, spring } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { FLAME_GLSL } from '/song/lib/flame.js';
import { VIPER_GLSL } from '/song/lib/x-viper.js';

export default (P) => {
  const t0 = P.from;
  const [L1, L2] = linesAt(P.from - 0.6, 'Brood of vipers', 'Who warned you');
  const tB = L1.words[0].start, tF = L2.words[L2.words.length - 1].start;
  const fireAt = (t) => 0.15 + 0.55 * ease.out3((t - tB + 0.05) / 0.6) + 0.5 * ease.out5((t - tF + 0.03) / 0.3);
  const riseAt = (t) => 0.35 + 0.55 * spring(t, tB, 0.8, 0.2) + 0.35 * spring(t, tF, 0.5, 0.3);
  const camera = (t) => {
    const u = t - t0;
    // exit: a push-in on the viper's head and its flicking tongue (its gleam meets s14's wax seal)
    const pin = ease.inOut3((t - (P.to - 0.55)) / 0.5);
    const r = riseAt(t), head = [0.0, r + 0.12, 0.2 - 0.75 * r - 0.15];
    const tg = [0.1 * (1 - pin) + head[0] * pin, 0.75 * (1 - pin) + head[1] * pin, -0.5 * (1 - pin) + head[2] * pin];
    return orbit(t, { target: tg, yaw: 0.95 - 0.04 * u, pitch: 0.08 + 0.012 * u, dist: 3.4 - 0.12 * u - 2.45 * pin, fov: 38, drift: 0.012 });
  };
  return {
    name: 's13-vipers2', from: P.from, to: P.to,
    frag: '#define FIRE\n' + STUDIO_GLSL + FLAME_GLSL + VIPER_GLSL + /* glsl */ `
uniform float uFireH, uRise, uHeat;
const float ROWZ = -2.6;
float mapObj(vec3 p, out int id) {
  id = 2;
  float d = sdRacks(p, ROWZ, 0.64, 2.3, 0.04, 9.0);
  float b = length(p - vec3(0.0, 0.8, 0.0)) - 1.6;
  if (b > 0.25) return min(d, b);
  float T = uTime;
  // the risen viper: its own x is the world's up, it bends toward the fire (-z), sways in x
  vec3 q = p - vec3(0.0, 0.0, 0.2);
  vec3 lq = vec3(q.y, -q.z, q.x);
  float v = sdViper(lq, uRise, 0.09, 0.16, 3.4, T * 1.6, 0.75 * uRise, 2.5, vec3(1, 0, 0));
  if (v < d) { d = v; id = 1; keepViper(); }
  // its tail trails back along the floor toward us
  v = viperAt(p, vec3(0.5, 0.075, 1.4), -1.9, 1.35, 0.08, 0.12, 4.5, T * 1.4, 0.0, 1.0);
  if (v < d) { d = v; id = 1; keepViper(); }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 1) return viperMat(0.0);
  Mat m = dirty(rackMat(p, n, ROWZ, uTime), p, 1.0);
  // the row is burning: the doors glow from inside
  float g = smoothstep(0.45, 0.9, fbm(vec3(p.x * 2.0, p.y * 3.0 - uTime * 1.5, 1.0), 3)) * step(0.7, n.z);
  m.emit += vec3(1.6, 0.35, 0.05) * g * g * uHeat;
  return m;
}
float fireDen(vec3 p) {
  float dz = abs(p.z - ROWZ - 0.75);
  if (dz > 0.7 || p.y > uFireH * 1.7) return 0.0;
  return fireSheet(vec3(p.x, p.y, (p.z - ROWZ) * 1.2), uFireH, uTime) * smoothstep(0.7, 0.2, dz) * 0.4;
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('90, 40, 24', 1.1), uCycB: rgb('26, 16, 14', 1.0),
      uFloorCol: rgb('92, 90, 86', 0.8), uFloorRough: 0.1, uGrime: 0.9,
      uKeyDir: [0.4, 0.9, -0.6], uKeyCol: [1.4, 1.5, 1.6], uKeySize: 0.5, uExpo: 1.1,
      uRimA: [2.4, 0.9, 0.3], uRimB: [1.4, 1.55, 1.7],
      uHaze: 0.06, uHazeCol: [0.08, 0.035, 0.02],
      uFireH: 0.2, uRise: 0.4, uHeat: 0.3,
    },
    camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      const f = fireAt(t);
      u.uFireH.value = f; u.uRise.value = riseAt(t); u.uHeat.value = 0.3 + 0.9 * clamp01(f);
      const fl = (0.85 + 0.15 * Math.sin(t * 21.0) * Math.sin(t * 6.1)) * clamp01(f);
      u.uP1.value = [0, 0.9, -1.7]; u.uP1c.value = [16 * fl, 5.5 * fl, 1.2 * fl];
      u.uP2.value = [-2.0, 0.9, -1.8]; u.uP2c.value = [8 * fl, 2.6 * fl, 0.5 * fl];
    },
    post(t) { return grade(t, { exposure: 1.0 }); },
  };
};
