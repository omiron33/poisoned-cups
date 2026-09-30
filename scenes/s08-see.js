// 08 · "Brood of vipers / Do you think I can't see still?"
// Outside: the vipers stand up on their necks like surveillance masts, every head a camera: their
// own lenses, black, cracked, pointed every way but the right one. A dim data hall, cold tubes and an
// acid-green strip. Inside: on "I" a warm-white shaft falls from above (no lamp, no housing: plain
// light), moves once, and on "see" it stops dead on one viper. The cameras see nothing; the light
// sees everything. Opens on red coolant pooled under the dead cameras; holds on the lit viper, the
// shaft withdraws, and the last frames snap into a close pattern of the viper's ribs.
import { ease, grade, rgb, orbit, linesAt, clamp01, mix, spring } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { VIPER_GLSL } from '/song/lib/x-viper.js';

// the viper the light finds: base, heading, length, rise (kept in step with the GLSL below)
const V0 = { b: [0.3, 0.08, 0.3], yaw: -2.2, L: 1.3, lift: 0.7 };
export const HEAD0 = [V0.b[0] + Math.cos(V0.yaw) * V0.L, V0.lift + 0.1, V0.b[2] + Math.sin(V0.yaw) * V0.L];

export default (P) => {
  const t0 = P.from;
  const [L1, L2] = linesAt(P.from - 0.6, 'Brood of vipers', 'Do you think');
  const tI = L2.words.find((w) => /^i$/i.test(w.w)).start;
  const tSee = L2.words.find((w) => /^see/i.test(w.w)).start;
  const camera = (t) => {
    const u = t - t0;
    // wide and drifting; a snap closer on "I"; a push onto the found viper on "see"
    const a = spring(t, tI - 0.05, 0.45, 0.15), b = spring(t, tSee - 0.04, 0.5, 0.15);
    const target = mix(mix([0, 0.55, -0.2], [-0.1, 0.6, -0.4], a), [HEAD0[0], HEAD0[1] - 0.1, HEAD0[2]], b);
    // exit: the shaft withdraws and the camera snaps into the viper's ribs (s09 turns them to mesh)
    const c = spring(t, P.to - 0.45, 0.3, 0.1);
    const mid = [V0.b[0] + Math.cos(V0.yaw) * V0.L * 0.55, 0.08 + V0.lift * 0.166 + 0.02, V0.b[2] + Math.sin(V0.yaw) * V0.L * 0.55];
    return orbit(t, { target: mix(target, mid, c), yaw: 0.25 - 0.03 * u - 0.12 * a + 0.1 * b, pitch: 0.2 + 0.05 * a + 0.06 * b - 0.1 * c, dist: mix(4.6 - 0.9 * a - 1.2 * b, 0.42, c), fov: 36, drift: 0.01 });
  };
  const beamAt = (t) => {
    const on = ease.out5((t - tI + 0.02) / 0.08) * (1 - ease.inOut3((t - (P.to - 0.9)) / 0.45));
    const k = ease.inOut3((t - tI) / Math.max(0.2, tSee - tI));
    const x = mix(HEAD0[0] + 1.3, HEAD0[0], k), z = mix(HEAD0[2] + 0.5, HEAD0[2], k);
    const r = 0.42 + 0.12 * spring(t, tSee, 0.4, 0.3);
    return { on, x, z, r };
  };
  return {
    name: 's08-see', from: P.from, to: P.to,
    frag: STUDIO_GLSL + VIPER_GLSL + /* glsl */ `
uniform vec4 uBeam;   // x, z, radius, on
float mapObj(vec3 p, out int id) {
  id = 2;
  float d = sdRacks(p, -3.0, 0.64, 2.3, 0.04, 8.0);
  float b = length(p - vec3(0, 0.5, -0.3)) - 2.3;
  if (b > d) return d;
  if (b > 0.25) return min(d, b);
  float T = uTime;
  float v;
  gVipLens = 1.0;
  v = viperAt(p, vec3(${V0.b.join(', ')}), ${V0.yaw.toFixed(3)}, ${V0.L.toFixed(3)}, 0.075, 0.1, 5.0, T * 0.9, ${V0.lift.toFixed(3)}, 3.0);  if (v < d) { d = v; id = 1; keepViper(); }
  v = viperAt(p, vec3(-1.2, 0.07, 0.4), 2.6, 1.2, 0.07, 0.12, 5.5, T * 1.1 + 1.0, 0.6, 3.0);   if (v < d) { d = v; id = 1; keepViper(); }
  v = viperAt(p, vec3(1.1, 0.07, -0.2), -0.6, 1.3, 0.07, 0.1, 5.0, T * 0.8 + 2.0, 0.95, 3.0);  if (v < d) { d = v; id = 1; keepViper(); }
  v = viperAt(p, vec3(0.9, 0.07, 0.9), 0.4, 1.1, 0.065, 0.12, 6.0, T * 1.2 + 3.0, 0.5, 3.0);   if (v < d) { d = v; id = 1; keepViper(); }
  v = viperAt(p, vec3(-0.6, 0.07, -1.3), -1.9, 1.2, 0.07, 0.1, 5.0, T * 1.0 + 4.0, 1.05, 3.0); if (v < d) { d = v; id = 1; keepViper(); }
  v = viperAt(p, vec3(-1.6, 0.07, -0.6), 3.6, 1.1, 0.065, 0.1, 5.5, T * 0.9 + 5.0, 0.8, 3.0);  if (v < d) { d = v; id = 1; keepViper(); }
  gVipLens = 0.0;
  // red coolant pooled under them, a film on the floor
  vec2 cq = p.xz - vec2(0.1, -0.2);
  float pool = length(cq * vec2(1.0, 1.4)) - 1.25 + 0.35 * vnoise(p.xz * 2.2) + 0.15 * vnoise(p.xz * 6.0);
  float c = max(pool * 0.6, p.y - 0.004);
  if (c < d) { d = c; id = 3; }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 1) return viperMat(0.0);
  if (id == 3) { Mat m = M(vec3(0.16, 0.005, 0.01), 0.02, 0.0); m.clear = 1.0; return m; }
  return dirty(rackMat(p, n, -3.0, uTime), p, 0.8);
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  vec3 col = studio(ro, rd, depth);
  if (uBeam.w > 0.001) {
    float r = uBeam.z;
    // where the shaft lands: surfaces inside it are lit warm white
    vec3 p = ro + rd * min(depth, 60.0);
    float m = smoothstep(r, r * 0.55, length(p.xz - uBeam.xy)) * step(depth, 100.0) * step(p.y, 5.0);
    col *= 1.0 + uBeam.w * m * vec3(9.0, 8.2, 7.0);
    col += uBeam.w * m * vec3(0.05, 0.045, 0.04);
    // the shaft itself in the haze
    vec2 o = ro.xz - uBeam.xy, dv = rd.xz;
    float A = dot(dv, dv), B = dot(o, dv), C = dot(o, o) - r * r;
    float disc = B * B - A * C;
    if (disc > 0.0 && A > 1e-6) {
      float sq = sqrt(disc);
      float ta = max((-B - sq) / A, 0.0), tb = min((-B + sq) / A, min(depth, 40.0));
      float tc = -B / A;
      float dmin = length(o + dv * tc);
      float len = max(tb - ta, 0.0) * (1.0 - dmin * dmin / (r * r));
      col += uBeam.w * vec3(1.0, 0.93, 0.82) * len * 0.12;
    }
  }
  return col;
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('56, 74, 70', 1.3), uCycB: rgb('20, 28, 30', 1.2),
      uFloorCol: rgb('84, 90, 86', 0.9), uFloorRough: 0.12, uGrime: 0.9,
      uKeyDir: [-0.3, 1.0, 0.2], uKeyCol: [1.6, 1.85, 2.0], uKeySize: 0.5, uExpo: 1.2,
      uRimA: [1.3, 1.45, 1.6], uRimB: [0.3, 1.5, 0.4],
      uHaze: 0.03, uHazeCol: [0.03, 0.045, 0.04],
      uBeam: [0, 0, 0.4, 0],
    },
    camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      const b = beamAt(t);
      u.uBeam.value = [b.x, b.z, b.r, b.on];
      // the light also reaches the hall a little: a warm point high in the shaft
      u.uP2.value = [0.2, 2.5, -1.9]; u.uP2c.value = [2.6, 3.0, 3.2];
      u.uP1.value = [b.x, 3.2, b.z]; u.uP1c.value = [6 * b.on, 5.5 * b.on, 4.6 * b.on];
    },
    post(t) { return grade(t, { exposure: 1.0 }); },
  };
};
