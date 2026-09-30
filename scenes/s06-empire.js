// 06 · "You twist the truth / To build your little empire"
// Outside: one glowing optical fibre stands in a dark wet control hall, the LED wall of dashboards
// out of focus behind; on "twist" it coils into a tight helix. Inside: on "To" the camera pulls
// back and up as black dashboard slabs (trading terminals, policy dashboards, maps) rain down and
// stack into server towers round it, a little skyline wrapped in propaganda skins (graph lines,
// map grids); the twisted fibre ends up as the antenna on the tallest tower. A frame tear on "empire".
import { ease, grade, rgb, orbit, spring, linesFrom } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { EMPIRE_GLSL, empireUniforms, towerState } from '/song/lib/x-empire.js';
import { CYBER_GLSL } from '/song/lib/x-cyber.js';
import { DASH_GLSL, DASH_UNIFORMS } from '/song/lib/x-d.js';

const [L1, L2] = linesFrom('You twist the truth', 'To build your little empire');
const setV = (u, k, a) => { const v = u[k].value; if (v && v.set) v.set(...a); else u[k].value = a; };

export function empireTimes() {
  const tw = L1.words.find((w) => /twist/i.test(w.w)).start;
  const b0 = L2.words[0].start;
  const emp = L2.words[L2.words.length - 1].start;
  return { tw, b0, emp };
}

export default (P) => {
  const t0 = P.from;
  const { tw, b0, emp } = empireTimes();
  const order = [5, 3, 1, 7, 2, 6, 4];
  const build = order.map((k, i) => [k, b0 + i * 0.2, b0 + i * 0.2 + 0.55]);
  build.push([0, b0 + 0.25, emp]);
  const camera = (t) => {
    // a snap in on "twist" (a short spring), then the long pull back and up from "To"
    const pull = ease.inOut3((t - (b0 - 0.35)) / 1.1);
    const snap = spring(t, tw - 0.03, 0.35, 0.2);
    const u = t - t0;
    return orbit(t, {
      target: [0.42 * pull, 0.95 - 0.4 * pull, 0],
      yaw: 0.35 - 0.06 * u,
      pitch: 0.06 + 0.26 * pull,
      dist: 1.35 - 0.2 * snap + 2.75 * pull + 0.12 * u,
      fov: 32, drift: 0.008,
    });
  };
  return {
    name: 's06-empire', from: P.from, to: P.to,
    frag: STUDIO_GLSL + CYBER_GLSL + EMPIRE_GLSL + DASH_GLSL + /* glsl */ `
uniform float uTear;
float mapObj(vec3 p, out int id) {
  float d = empireSDF(p, id);
  float w = dashWall(p);
  if (w < d) { d = w; id = 50; }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 50) return dashWallMat(p);
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
      uCycA: rgb('70, 46, 104', 1.1), uCycB: rgb('20, 14, 34', 1.0),
      uFloorCol: rgb('46, 44, 56', 0.7), uFloorRough: 0.1, uGrime: 0.9,
      uKeyDir: [-0.3, 1.0, 0.45], uKeyCol: [1.7, 1.8, 2.2], uKeySize: 0.35,
      uRimA: [2.0, 2.1, 2.4], uRimB: [0.45, 2.0, 0.7],
      uHaze: 0.05, uHazeCol: [0.07, 0.05, 0.11],
      ...empireUniforms(),
      ...DASH_UNIFORMS,
      uBoundX: 1.2,
      uFibLo: 0.0, uFibHi: 1.4, uFibFollow: 0,
      uTear: 0,
    },
    camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      u.uTwist.value = spring(t, tw, 0.8, 0.25);
      const v = towerState(t, { build });
      const arr = u.uLv.value; for (let i = 0; i < 32; i++) arr[i] = v[i];
      const pulse = 1 + 0.35 * Math.exp(-Math.max(0, t - tw) * 6) * (t > tw ? 1 : 0);
      u.uGlow.value = pulse;
      // the skins wrap the towers as they rise
      u.uSkin.value = ease.inOut3((t - (b0 + 0.4)) / 1.2);
      u.uWallGlow.value = 0.45 + 0.25 * ease.inOut3((t - b0) / 1.0);
      // a 3-frame tear on "twist" and on "empire"
      const hit = (h) => (t >= h && t < h + 0.05 ? 1 : 0);
      u.uTear.value = Math.max(hit(tw) * 0.8, hit(emp) * 1.0);
      setV(u, 'uP1', [0.05, 1.0, 0.25]);
      setV(u, 'uP1c', [0.4 * pulse, 2.4 * pulse, 0.9 * pulse]);
      setV(u, 'uP2', [0.0, 1.4, -1.8]);
      setV(u, 'uP2c', [1.4, 0.6, 2.6]);
    },
    post(t) { return grade(t, { exposure: 1.05, bloom: 0.1, threshold: 1.1 }); },
  };
};
