// 05 · "Brood of vipers / Who warned you from the fire?"
// Outside: a nest of cable-vipers (black ribbed cable, chrome heads) coiled asleep on the wet
// concrete of a data hall under cold fluorescent light, server racks blinking behind. Inside: one
// spark in a single rack catches on "Who warned you" and flares on "fire?"; the vipers never look
// up. The first rung of the chorus ladder. Exit: a whip-pan to the burning rack.
import { ease, grade, rgb, orbit, linesAt, clamp01 } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { FLAME_GLSL } from '/song/lib/flame.js';
import { VIPER_GLSL } from '/song/lib/x-viper.js';

export default (P) => {
  const t0 = P.from;
  const [L1, L2] = linesAt(P.from - 0.6, 'Brood of vipers', 'Who warned you');
  const tFire = L2.words[0].start, tHot = L2.words[L2.words.length - 1].start;
  // one spark in one rack: a small tongue that catches on "Who warned you" and flares on "fire?"
  const sparkAt = (t) => 0.15 + 0.35 * ease.out3((t - tFire + 0.05) / 0.4) + 0.5 * ease.out5((t - tHot + 0.03) / 0.3);
  const camera = (t) => {
    const u = t - t0;
    const push = ease.inOut3(u / 4.5);
    // exit: a whip-pan to the burning rack over the last 0.3 s
    const whip = ease.in2((t - (P.to - 0.3)) / 0.3);
    return orbit(t, { target: [-0.45 + 1.6 * whip, 0.3 + 0.6 * whip, -0.3 - 1.2 * whip], yaw: 0.3 - 0.1 * push - 0.5 * whip, pitch: 0.62 - 0.1 * push - 0.3 * whip, dist: 4.3 - 0.8 * push, fov: 36, drift: 0.012 });
  };
  return {
    name: 's05-vipers', from: P.from, to: P.to,
    frag: '#define FIRE\n' + STUDIO_GLSL + FLAME_GLSL + VIPER_GLSL + /* glsl */ `
uniform float uFireH, uSpark;
const vec3 SPARK = vec3(0.68, 0.72, -1.93);
float mapObj(vec3 p, out int id) {
  id = 2;
  float d = sdRacks(p, -2.4, 0.64, 2.3, 0.04, 7.0);
  float b = length(p - vec3(0, 0.2, 0)) - 1.5;
  if (b > d) return d;
  if (b > 0.25) return min(d, b);
  float T = uTime;
  float v;
  v = viperCoil(p, vec3(0.15, 0.0, 0.15), T * 0.12, 0.085, 2.4, 0.06, T * 0.6);          if (v < d) { d = v; id = 1; keepViper(); }
  v = viperCoil(p, vec3(-0.62, 0.0, -0.32), 2.0 - T * 0.1, 0.075, 2.1, 0.12, T * 0.7 + 1.0); if (v < d) { d = v; id = 1; keepViper(); }
  v = viperCoil(p, vec3(0.78, 0.0, -0.55), 4.0 + T * 0.08, 0.07, 1.9, 0.02, T * 0.5 + 2.0); if (v < d) { d = v; id = 1; keepViper(); }
  v = viperAt(p, vec3(-1.3, 0.08, 0.75), -0.45, 1.8, 0.08, 0.15, 5.0, T * 1.6, 0.0, 1.0);    if (v < d) { d = v; id = 1; keepViper(); }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 1) return viperMat(0.0);
  Mat m = rackMat(p, n, -2.4, uTime);
  // the one rack that has caught: its grille glows from inside, hottest round the spark
  float r = step(abs(p.x - SPARK.x), 0.32) * step(0.7, n.z);
  float g = r * exp(-length(p.xy - SPARK.xy) * 3.0) * (0.6 + 0.4 * vnoise(vec2(p.y * 30.0, uTime * 8.0)));
  m.emit += vec3(4.0, 1.2, 0.25) * g * uSpark;
  return dirty(m, p, 0.7);
}
float fireDen(vec3 p) {
  if (length(p - SPARK - vec3(0, 0.35, 0.1)) > 0.8) return 0.0;
  float d = candleFlame(p, SPARK, uFireH, 0.07 + 0.08 * uSpark, 3.0) * 0.7;
  d = max(d, candleFlame(p, SPARK + vec3(-0.14, -0.3, 0.0), uFireH * 0.6, 0.05 + 0.05 * uSpark, 7.0) * 0.6 * step(0.3, uSpark));
  return d;
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('78, 104, 96', 1.3), uCycB: rgb('30, 40, 40', 1.2),
      uFloorCol: rgb('100, 106, 98', 0.85), uFloorRough: 0.12, uGrime: 0.85,
      uKeyDir: [0.15, 1.0, 0.35], uKeyCol: [3.3, 3.7, 3.8], uKeySize: 0.45, uExpo: 1.15,
      uRimA: [1.6, 1.8, 1.9], uRimB: [0.35, 1.7, 0.5],
      uHaze: 0.035, uHazeCol: [0.05, 0.06, 0.055],
      uFireH: 0.1, uSpark: 0,
    },
    camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      const k = sparkAt(t);
      u.uSpark.value = k;
      u.uFireH.value = 0.12 + 0.45 * k;
      const fl = (0.85 + 0.15 * Math.sin(t * 23.0) * Math.sin(t * 7.3)) * k;
      u.uP2.value = [-0.8, 2.5, -1.4]; u.uP2c.value = [2.4, 2.8, 3.0];
      u.uP1.value = [0.68, 1.0, -1.6]; u.uP1c.value = [5 * fl, 1.8 * fl, 0.45 * fl];
      u.uHazeCol.value = [0.05 + 0.03 * k, 0.06, 0.055];
    },
    post(t) { return grade(t, { exposure: 1.0 }); },
  };
};
