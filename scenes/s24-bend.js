// 24 · "But brood of vipers / If you won't bend"
// After the reed's mercy, the refusal. The vipers stand frozen in their S-curves, gone rigid and
// dark as steel; not one of them moves. Beside them the white gloves are clenched round their silver.
// At their feet lie the broken concrete stones of the fallen empire (s25 lifts them). A cold glint
// runs down the steel on "vipers" and again on "bend". Slow push, then hold; cut on the downbeat.
import { ease, grade, rgb, orbit, linesAt, clamp01, spring } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { VIPER_GLSL } from '/song/lib/x-viper.js';
import { GLOVE_GLSL } from '/song/lib/x-gloves.js';

export default (P) => {
  const t0 = P.from;
  const [L1, L2] = linesAt(P.from - 0.6, 'But brood of vipers', 'If you won');
  const tV = L1.words[L1.words.length - 1].start, tB = L2.words[L2.words.length - 1].start;
  const camera = (t) => {
    const u = t - t0;
    const k = ease.inOut3(u / 3.2);
    return orbit(t, { target: [0.1, 0.55, 0.1], yaw: -0.35 + 0.14 * k, pitch: 0.16 + 0.04 * k, dist: 2.9 - 0.35 * k, fov: 36, drift: 0.004 });
  };
  const glintAt = (t) => Math.max(ease.inOut3((t - tV) / 0.7) * (t < tV + 0.7 ? 1 : 0), ease.inOut3((t - tB) / 0.7) * (t < tB + 0.7 ? 1 : 0));
  return {
    name: 's24-bend', from: P.from, to: P.to,
    frag: STUDIO_GLSL + VIPER_GLSL + GLOVE_GLSL + /* glsl */ `
uniform float uGlint;
float stones(vec3 p) {
  float d = 1e9;
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    vec3 c = vec3(-0.9 + 0.5 * fi + 0.2 * sin(fi * 3.7), 0.0, 0.75 + 0.35 * sin(fi * 2.3));
    vec3 s = vec3(0.09 + 0.06 * hash11(fi), 0.05 + 0.04 * hash11(fi + 3.0), 0.08 + 0.05 * hash11(fi + 7.0));
    vec3 q = p - c - vec3(0.0, s.y * 0.8, 0.0);
    q.xz = rot(fi * 1.3) * q.xz; q.xy = rot(0.25 * sin(fi * 5.0)) * q.xy;
    d = min(d, sdRoundBox(q, s, 0.012) + 0.012 * (vnoise(p * 30.0) - 0.5));
  }
  return d;
}
float mapObj(vec3 p, out int id) {
  id = 3;
  float d = stones(p);
  float b = length(p - vec3(0.3, 0.8, -0.2)) - 1.7;
  if (b > 0.25) return min(d, b);
  // three rigid vipers: frozen S-curves (no time in them), heads cocked
  // three vipers gone rigid: a flat coil on the floor, a raised S-neck, the arrow head cocked
  // forward toward us with the tongue frozen mid-flick. No time in any of it.
  gVipFlick = 0.8;
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    float R = 0.075;
    vec3 base = vec3(-0.75 + 0.75 * fk, 0.0, -0.25 - 0.3 * abs(fk - 1.0));
    vec3 q = p - base;
    float turns = 1.6;
    float cb = coilBody(q, R, turns);
    if (cb < d) { d = cb; id = 1; keepViper(); }
    // the neck leaves the coil's outer end and rises; own x up, bending forward (+z) toward us
    float phiMax = 6.2831853 * turns, rs = R * (0.9 + 2.15 * turns);
    vec3 e = vec3(rs * cos(phiMax), 0.0, rs * sin(phiMax));
    vec3 nq = q - e;
    vec3 lq = vec3(nq.y + R * 0.3, nq.z, nq.x);
    gVipTail = 1.0;
    float v = sdViper(lq, 0.75 + 0.1 * fk, R, 0.1, 5.5, 0.8 + fk * 1.9, 0.55, 3.0, vec3(1, 0, 0));
    gVipTail = 0.16;
    if (v < d) { d = v; id = 1; keepViper(); }
  }
  gVipFlick = -1.0;
  // the gloves, clenched round their silver
  for (int k = 0; k < 2; k++) {
    vec3 gp = vec3(k == 0 ? -0.15 : 0.62, 0.0, 0.35);
    vec3 q = (p - gp) / 1.15;
    q.xz = rot(k == 0 ? 0.5 : -0.4) * q.xz;
    float gb = gloveBound(q) * 1.15;
    if (gb < d) {
      float g = glove(q, GLOVE_FIST, k == 0 ? -1.0 : 1.0) * 1.15;
      if (g < d) { d = g; id = 4; }
    }
    // a short stack of silver under each fist
    float coins = sdCyl(p - gp - vec3(0.2, 0.03, 0.05), 0.07, 0.03) - 0.004;
    if (coins < d) { d = coins; id = 5; }
  }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 1) {
    Mat m = viperMat(1.0);
    m.alb *= 0.8;
    return dirty(m, p, 0.25);
  }
  if (id == 4) return gloveMat(p);
  if (id == 5) { Mat m = SILVER(); m.rough = 0.2 + 0.2 * vnoise(p * 200.0); return m; }
  // broken concrete: grey, pitted, dirty
  Mat m = M(vec3(0.36, 0.35, 0.33) * (0.75 + 0.4 * fbm(p * 18.0, 3)), 0.85, 0.0);
  return dirty(m, p, 0.6);
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('66, 84, 86', 1.6), uCycB: rgb('18, 24, 28', 1.2),
      uFloorCol: rgb('100, 104, 100', 0.85), uFloorRough: 0.1, uGrime: 0.9,
      uKeyDir: [-0.5, 0.75, 0.45], uKeyCol: [2.6, 2.9, 3.1], uKeySize: 0.3, uExpo: 1.1,
      uRimA: [1.8, 2.0, 2.2], uRimB: [2.2, 1.1, 0.4],
      uHaze: 0.03, uHazeCol: [0.04, 0.05, 0.055],
      uGlint: 0,
    },
    camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      // the glint: a hard cold point light that runs down past the steel
      const g = glintAt(t);
      const on = g > 0 && g < 1 ? Math.sin(g * Math.PI) : 0;
      u.uP1.value = [-1.2 + 3.0 * g, 2.0 - 1.4 * g, 1.2]; u.uP1c.value = [9 * on, 10 * on, 11 * on];
      u.uP2.value = [1.5, 0.3, -1.4]; u.uP2c.value = [2.4, 1.1, 0.3];   // an ember left from the fire
    },
    post(t) { return grade(t, { exposure: 1.0 }); },
  };
};
