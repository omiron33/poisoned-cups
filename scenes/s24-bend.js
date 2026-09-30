// 24 · "But brood of vipers / If you won't bend"  (v2, hook rung 5: the refusal)
// After the reed's mercy, the refusal, cold and still. Three steel control pylons stand in a wet
// concrete hall: a control pylon with a status band, a payout column ringed with coin slots, an
// access pylon, joined by a steel access rail. Round each one a cable-viper is wound tight and gone
// rigid as steel, its head reared off the top with the tongue frozen mid-flick. Behind them a wall
// of LED spokesperson faces, frozen in defiance (the feed has stopped: no flicker, no scan). A cold
// glint runs down the steel on "vipers" and again on "bend". The pylons stay whole (s25 cracks
// light through them). Slow push that settles, and holds.
import { ease, grade, rgb, orbit, linesAt, clamp01, spring } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { CYBER_GLSL } from '/song/lib/x-cyber.js';
import { VIPER_GLSL } from '/song/lib/x-viper.js';
import { XB_GLSL } from '/song/lib/x-b.js';

export default (P) => {
  const t0 = P.from;
  const [L1, L2] = linesAt(P.from - 0.6, 'But brood of vipers', 'If you won');
  const tV = L1.words[L1.words.length - 1].start, tB = L2.words[L2.words.length - 1].start;
  const camera = (t) => {
    const u = t - t0;
    const k = ease.inOut3(u / 3.4);
    const hit = spring(t, tB - 0.02, 0.3, 0.35);
    return orbit(t, { target: [0.0, 1.15, -0.2], yaw: -0.22 + 0.12 * k, pitch: 0.08 + 0.03 * k, dist: 5.1 - 0.5 * k - 0.12 * hit, fov: 38, drift: 0.004 });
  };
  const glintAt = (t) => Math.max(ease.inOut3((t - tV) / 0.7) * (t < tV + 0.7 ? 1 : 0), ease.inOut3((t - tB) / 0.7) * (t < tB + 0.7 ? 1 : 0));
  return {
    name: 's24-bend', from: P.from, to: P.to,
    frag: STUDIO_GLSL + CYBER_GLSL + VIPER_GLSL + XB_GLSL + /* glsl */ `
const float PR = 0.17, PHT = 2.0;
vec3 pyl(int k) { return k == 0 ? vec3(-1.15, 0.0, 0.1) : (k == 1 ? vec3(0.0, 0.0, -0.25) : vec3(1.15, 0.0, 0.1)); }
float mapObj(vec3 p, out int id) {
  id = 5;
  // the wall of face screens behind
  float d = sdBox(p - vec3(0.0, 1.5, -2.6), vec3(3.4, 1.5, 0.06));
  // three pylons, a base plinth each, and the steel access rail joining them
  for (int k = 0; k < 3; k++) {
    vec3 q = p - pyl(k);
    float v = sdCyl(q - vec3(0.0, PHT * 0.5, 0.0), PR, PHT * 0.5);
    v = min(v, sdRoundBox(q - vec3(0.0, 0.06, 0.0), vec3(0.27, 0.06, 0.27), 0.01));
    v = min(v, sdCyl(q - vec3(0.0, PHT + 0.04, 0.0), PR + 0.04, 0.04));
    if (v < d) { d = v; id = 2 + k; }
  }
  float r = sdCapsule(p, vec3(-1.15, 1.05, 0.1), vec3(1.15, 1.05, 0.1), 0.028);
  r = min(r, sdCapsule(p, vec3(-1.15, 0.55, 0.1), vec3(1.15, 0.55, 0.1), 0.022));
  if (r < d) { d = r; id = 6; }
  // the vipers: no time in any of them, frozen
  gVipFlick = 0.8;
  for (int k = 0; k < 3; k++) {
    vec3 q = p - pyl(k);
    if (k == 1) q.x = -q.x;
    float fk = float(k);
    float v = helixViper(q, PR + 0.075, 0.075, 0.48 + 0.05 * fk, 0.14, 1.55 + 0.12 * fk, 0.7 + 2.1 * fk, 0.42, 0.3);
    if (v < d) { d = v; id = 1; keepViper(); }
  }
  gVipFlick = -1.0;
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 1) {
    Mat m = viperMat(1.0);
    m.alb *= 0.85;
    return dirty(m, p, 0.2);
  }
  if (id == 5) {
    Mat m = M(vec3(0.02, 0.02, 0.025), 0.3, 0.0);
    if (n.z > 0.7) {
      // three screens, each a spokesperson face frozen mid-defiance (fixed seeds, no time)
      float cx = p.x / 1.25;
      float i = clamp(floor(cx + 0.5), -1.0, 1.0);
      vec2 uv = vec2((p.x - i * 1.25) / 0.52, (p.y - 2.05) / 0.64);
      if (abs(uv.x) < 1.0 && abs(uv.y) < 1.0) {
        vec3 ink = i == 0.0 ? vec3(0.9, 0.95, 1.1) : (i < 0.0 ? vec3(0.9, 0.3, 1.4) : vec3(0.35, 1.3, 0.5));
        m.emit = faceScreen(uv, -0.45, 0.0, 5.0 + i * 7.0, ink, 30.0);
        // the freeze: one frozen tear line across each face
        m.emit *= 1.0 + 1.5 * smoothstep(0.03, 0.0, abs(uv.y - 0.1 - 0.2 * i));
      } else m.emit = vec3(0.02, 0.018, 0.03);
    }
    return m;
  }
  if (id == 6) { Mat m = M(vec3(0.7, 0.71, 0.74), 0.18, 1.0); return dirty(m, p, 0.3); }
  // pylon steel, brushed vertically, with each one's own marking
  vec3 q = p - pyl(id - 2);
  float a = atan(q.z, q.x);
  Mat m = M(vec3(0.6, 0.61, 0.64), 0.2 + 0.12 * vnoise(vec2(a * 40.0, q.y * 2.0)), 1.0);
  float front = smoothstep(0.0, 0.5, cos(a - 1.4));
  if (id == 2) m.emit = vec3(0.3, 1.5, 0.45) * smoothstep(0.02, 0.0, abs(q.y - 1.75) - 0.03) * front;                 // control: status band
  if (id == 3) { float sl = smoothstep(0.012, 0.0, abs(fract(q.y * 4.0) - 0.5) - 0.02) * front * step(0.25, q.y); m.alb *= 1.0 - 0.7 * sl; m.emit = vec3(1.3, 0.2, 0.8) * sl * 0.35; }  // payout: coin slots
  if (id == 4) m.emit = vec3(1.2, 1.25, 1.4) * smoothstep(0.015, 0.0, abs(q.y - 1.3) - 0.01) * front;                  // access: a white ring
  return dirty(m, p, 0.35);
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('44, 36, 64', 1.3), uCycB: rgb('12, 10, 20', 1.2),
      uFloorCol: rgb('92, 94, 100', 0.85), uFloorRough: 0.1, uGrime: 0.9,
      uKeyDir: [-0.5, 0.8, 0.5], uKeyCol: [2.6, 2.8, 3.2], uKeySize: 0.3, uExpo: 1.15,
      uRimA: [1.8, 1.0, 2.6], uRimB: [1.6, 1.9, 2.2],
      uHaze: 0.03, uHazeCol: [0.04, 0.035, 0.06],
    },
    camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      // the glint: a hard cold point light that runs down past the steel
      const g = glintAt(t);
      const on = g > 0 && g < 1 ? Math.sin(g * Math.PI) : 0;
      u.uP1.value = [-1.6 + 3.2 * g, 2.4 - 1.6 * g, 1.1]; u.uP1c.value = [9 * on, 10 * on, 12 * on];
      u.uP2.value = [0.0, 2.6, 1.5]; u.uP2c.value = [1.2, 1.1, 1.8];
    },
    post(t) { return grade(t, { exposure: 1.0 }); },
  };
};
