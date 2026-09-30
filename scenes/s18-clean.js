// 18 · 'You say "we're clean" / But your hands still raise'
// Out of the dark of s17's lenses the camera pulls back into a sterile clean room: white epoxy,
// cold tube light. A wide silver basin of clear water on a white bench, the titanium chalice
// standing in it, and two empty white gloves standing upright either side, raised, palms out.
// On "But" the camera snaps down over the basin and the water clouds black from the cup's foot
// outward; on "raise" the gloves lift and turn palms up (s19 heaps silver in them).
import { grade, rgb, ease, clamp, linesAt, spring } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { CUP_GLSL } from '/song/lib/x-cup.js';
import { GLOVE_GLSL } from '/song/lib/x-gloves.js';

export const lines18 = (P) => linesAt(P.from - 0.6, 'You say', 'But your hands still raise');
export const BENCH = 0.5;

export default (P) => {
  const [, L2] = lines18(P);
  const tBut = L2.words[0].start;
  const tRaise = L2.words.find((w) => /raise/i.test(w.w))?.start ?? L2.end;
  const camera = (t) => {
    const u = t - P.from;
    let pos, target, fov;
    if (t < tBut - 0.02) {
      // pull back out of the dark, level with the bench
      const k = ease.out3(clamp(u / 1.6, 0, 1));
      const dist = 1.1 + 2.9 * k + 0.08 * u;
      const yaw = 0.25 - 0.12 * k;
      target = [0, BENCH + 0.45, 0];
      pos = [Math.sin(yaw) * dist, BENCH + 0.5 + 0.35 * k, Math.cos(yaw) * dist];
      fov = 34;
    } else {
      // the snap: high over the basin, drifting down
      const v = t - tBut;
      const s = spring(t, tBut, 0.35, 0.2);
      target = [0, BENCH + 0.2, 0.05];
      const dist = 3.0 - 0.15 * v - 0.3 * (1 - s);
      const pitch = 0.95 - 0.04 * v;
      const yaw = -0.35 + 0.05 * v;
      pos = [Math.sin(yaw) * Math.cos(pitch) * dist, target[1] + Math.sin(pitch) * dist, Math.cos(yaw) * Math.cos(pitch) * dist];
      fov = 36;
    }
    return { pos, target, fov, roll: 0 };
  };
  return {
    name: 's18-clean', from: P.from, to: P.to,
    frag: STUDIO_GLSL + CUP_GLSL + GLOVE_GLSL + /* glsl */ `
uniform float uCloud, uLift, uTurn;
const float BY = ${BENCH.toFixed(3)};
const float CS = 0.55;        // chalice scale
const vec2 BAS = vec2(0.72, 0.24);
// a glove's frame: cuff on the bench either side of the basin; it lifts and turns palm up
vec3 gloveLocal(vec3 p) {
  vec3 g = p - vec3(0, BY + uLift, 0.1);
  g.x = abs(g.x) - 1.0;
  g.xy = rot(0.12 * (1.0 - uTurn)) * g.xy;
  g.yz = rot(-1.45 * uTurn) * g.yz;
  return g;
}
float basinEll(vec3 p) { vec2 q = vec2(length(p.xz), p.y - (BY + BAS.y)); vec2 d = q / BAS; return (length(d) - 1.0) * BAS.y * (0.8 + 0.2 * length(d)); }
float WL() { return BY + BAS.y - 0.04; }
float mapObj(vec3 p, out int id) {
  id = 1;
  // the bench: a white slab
  float d = sdRoundBox(p - vec3(0, BY * 0.5, 0), vec3(1.7, BY * 0.5, 0.75), 0.02);
  // basin shell
  float e = basinEll(p);
  float bs = max(abs(e + 0.01) - 0.01, p.y - (BY + BAS.y));
  bs = min(bs, sdTorus(p - vec3(0, BY + BAS.y, 0), vec2(BAS.x - 0.005, 0.016)));
  if (bs < d) { d = bs; id = 2; }
  // water
  float w = max(e + 0.02, p.y - WL());
  if (w < d) { d = w; id = 3; }
  // the chalice standing in the basin
  vec3 cq = (p - vec3(0, BY + 0.02, 0)) / CS;
  float c = chalice(cq) * CS;
  if (c < d) { d = c; id = 4; }
  // two gloves, raised, palms out toward the camera
  vec3 g = gloveLocal(p);
  float gl = glove(g / 1.35, GLOVE_RAISED, 1.0) * 1.35;
  if (gl < d) { d = gl; id = 5; }
  // ceiling tubes above the room
  vec3 tp = p - vec3(0, 3.0, 0);
  tp.z = abs(tp.z + 0.5) - 1.3;
  float tube = sdCapsule(tp, vec3(-3.0, 0, 0), vec3(3.0, 0, 0), 0.035);
  if (tube < d) { d = tube; id = 6; }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 1) { Mat m = M(vec3(0.86, 0.87, 0.88), 0.35, 0.0); m.clear = 0.6; return m; }
  if (id == 2) { Mat m = SILVER(); m.rough = 0.1 + 0.08 * vnoise(p * 60.0); return m; }
  if (id == 4) return cupTi((p - vec3(0, BY + 0.02, 0)) / CS, n);
  if (id == 6) { Mat m = M(vec3(0.9), 0.3, 0.0); m.emit = vec3(3.0, 3.1, 3.3) * 2.2; return m; }
  if (id == 5) {
    // (gloves) white cotton
    vec3 g = gloveLocal(p);
    return gloveMat(g / 1.35);
  }
  // water: clear, the silver floor of the basin seen through it, clouding to black ink
  float r = length(p.xz);
  float fb = fbm(p.xz * 5.0 + uTime * 0.3, 4);
  float ink = uCloud * smoothstep(0.0, -0.18, r - uCloud * 0.6 + 0.3 * (fb - 0.5));
  // murky tendrils: lighter veins through the black so it reads as clouding water
  vec3 murk = mix(vec3(0.012, 0.016, 0.012), vec3(0.09, 0.1, 0.08), smoothstep(0.45, 0.7, fbm(p.xz * 11.0 - uTime * 0.2, 3)));
  Mat m = M(mix(vec3(0.55, 0.6, 0.62), murk, ink), mix(0.02, 0.05, ink), 0.0);
  m.clear = 1.0;
  m.trans = 0.55 * (1.0 - ink);
  return m;
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('222, 228, 230', 1.0), uCycB: rgb('200, 208, 212', 0.85),
      uFloorCol: rgb('214, 218, 220', 0.8), uFloorRough: 0.14, uFloorGrain: 0.6, uGrime: 0.1,
      uHaze: 0.015, uHazeCol: rgb('220, 230, 235', 0.4),
      uKeyDir: [0.1, 1.0, 0.25], uKeyCol: [3.0, 3.1, 3.3], uKeySize: 0.5,
      uRimA: [1.6, 1.7, 1.8], uRimB: [1.6, 1.7, 1.8],
      uCloud: 0, uLift: 0, uTurn: 0, uExpo: 1,
    },
    camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      u.uCloud.value = ease.inOut3(clamp((t - tBut) / 1.4, 0, 1));
      u.uLift.value = 0.2 * spring(t, tRaise - 0.05, 0.5, 0.3);
      u.uTurn.value = ease.inOut3(clamp((t - (tRaise - 0.15)) / 0.45, 0, 1));
      // out of the dark of the lenses
      u.uExpo.value = 0.02 + 0.98 * ease.out3(clamp((t - P.from) / 0.3, 0, 1));
    },
    post(t) { return grade(t, { exposure: 1.0, vignette: 0.3 }); },
  };
};
