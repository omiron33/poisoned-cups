// 10 · "Heavy loads / That you never lift too"
// Outside: the brass camel lands on the conveyor and rides off; two crates bound in black straps
// come down on their lifting straps under a sodium lamp and land on "loads" with a thud that stops
// the belt. Inside: a snap cut to the top strap: an empty white glove hovers a finger's width above
// it, pointing, never touching; on "lift" it pulls back and away, toward the titanium chalice on
// its plinth, where the camera ends.
import { ease, grade, rgb, orbit, keys, spring, linesFrom, clamp01 } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { S0910_GLSL } from '/song/lib/x-s09-s10.js';
import { GLOVE_GLSL } from '/song/lib/x-gloves.js';
import { CUP_GLSL } from '/song/lib/x-cup.js';

const [LH, LN] = linesFrom('Heavy loads', 'That you never lift too');
const setV = (u, k, a) => { const v = u[k].value; if (v && v.set) v.set(...a); else u[k].value = a; };

export const CRATE_TOP = 0.25 + 0.84;         // top strap of the stack
export const GLOVE_S = 0.62;                  // glove scale
export const CUP_AT = [1.55, 0.0, -0.55];     // chalice plinth

export function loadsTimes(P) {
  const tLoads = LH.words[1].start;
  const tLift = LN.words.find((w) => /lift/i.test(w.w)).start;
  const tCut = LN.words[0].start - 0.2;
  return { tLoads, tLift, tCut };
}
// glove: position of its cuff (glove frame origin) over time
export function glovePos(P, t) {
  const { tLift } = loadsTimes(P);
  const hover = [0.12, CRATE_TOP + 0.022 + 0.42 * GLOVE_S, 0.13];
  const k = ease.inOut3((t - tLift) / 1.0);
  const bob = 0.004 * Math.sin(t * 3.1);
  const away = [CUP_AT[0] - 0.4, CUP_AT[1] + 1.05, CUP_AT[2] + 0.3];
  return [hover[0] + (away[0] - hover[0]) * k, hover[1] + bob + (away[1] - hover[1]) * k + 0.1 * Math.sin(Math.PI * k), hover[2] + (away[2] - hover[2]) * k];
}
export function loadsCamera(P) {
  const { tLoads, tLift, tCut } = loadsTimes(P);
  return (t) => {
    const u = t - P.from;
    if (t < tCut) {
      // wide and low on the belt, the crates coming down; a small jolt on the landing
      const jolt = t > tLoads ? 0.02 * Math.exp(-(t - tLoads) * 10) * Math.sin((t - tLoads) * 50) : 0;
      return orbit(t, { target: [0.25, 0.75 + jolt, 0], yaw: 0.62 - 0.03 * u, pitch: 0.16, dist: 3.6 - 0.12 * u, fov: 34, drift: 0.006 });
    }
    // snap in on the gap between the glove's finger and the strap; after "lift" follow it to the cup
    const g = glovePos(P, t);
    const k = ease.inOut3((t - tLift + 0.05) / 0.7);
    // after "lift": a medium shot holding the crate stack, the withdrawing glove and the chalice
    const tx = [0.1 + 0.62 * k, CRATE_TOP + 0.08 + (0.9 - CRATE_TOP - 0.08) * k, -0.22 * k];
    return orbit(t, { target: tx, yaw: 0.45 + 0.04 * (t - tCut) - 0.1 * k, pitch: 0.08 + 0.14 * k, dist: 0.95 - 0.04 * (t - tCut) + 2.35 * k, fov: 30 + 4 * k, drift: 0.005 });
  };
}

export default (P) => {
  const t0 = P.from;
  const { tLoads } = loadsTimes(P);
  const crateY = (t) => {
    if (t < tLoads) return Math.max(0, (tLoads - t) * 0.9);
    const v = t - tLoads;
    return 0.012 * Math.exp(-v * 12) * Math.abs(Math.sin(v * 30));
  };
  const camelLand = t0 + 0.15;
  const camelY = (t) => (t < camelLand ? 0.25 + 0.5 * 9.8 * (camelLand - t) ** 2 : 0.25 + 0.04 * Math.exp(-(t - camelLand) * 9) * Math.abs(Math.sin((t - camelLand) * 18)));
  const run = (t) => (t < tLoads ? 0.9 * (t - t0) : 0.9 * (tLoads - t0) + 0.9 * (1 - Math.exp(-(t - tLoads) * 8)) / 8);
  return {
    name: 's10-loads', from: P.from, to: P.to,
    frag: STUDIO_GLSL + S0910_GLSL + GLOVE_GLSL + CUP_GLSL + /* glsl */ `
uniform float uCrateY, uRun, uCamelX, uCamelY, uStrapUp;
uniform vec3 uGlove;
const float CS = 0.3;   // crate half size x
const vec3 CUPAT = vec3(${CUP_AT.join(', ')});
float sdCrates(vec3 p) {
  vec3 q = p - vec3(0.0, BELT_TOP + uCrateY, 0.0);
  float bb = sdBox(q - vec3(0.0, 0.42, 0.0), vec3(0.34, 0.45, 0.3));
  // the lifting straps run up out of frame
  vec3 s = vec3(abs(q.x) - 0.12, q.y, q.z);
  float lift = sdBox(s - vec3(0.0, 4.0 + uStrapUp, 0.0), vec3(0.03, 3.2, 0.007));
  if (bb > 0.05) return min(bb, lift);
  // two crates, the top one a touch smaller and turned
  float c1 = sdRoundBox(q - vec3(0.0, 0.22, 0.0), vec3(0.3, 0.2, 0.24), 0.012);
  vec3 q2 = q - vec3(0.02, 0.63, 0.0);
  float a = 0.08; q2.xz = vec2(q2.x * cos(a) - q2.z * sin(a), q2.x * sin(a) + q2.z * cos(a));
  float c2 = sdRoundBox(q2, vec3(0.27, 0.19, 0.22), 0.012);
  float d = min(c1, c2);
  // straps round them: bands where a slightly bigger box meets two vertical planes
  float st1 = max(sdRoundBox(q - vec3(0.0, 0.22, 0.0), vec3(0.3, 0.2, 0.24) + 0.008, 0.015), abs(abs(q.x) - 0.12) - 0.03);
  float st2 = max(sdRoundBox(q2, vec3(0.27, 0.19, 0.22) + 0.008, 0.015), abs(abs(q2.x) - 0.12) - 0.03);
  float st = min(st1, st2);
  return min(min(d, st), lift) ;
}
float mapObj(vec3 p, out int id) {
  id = 6;
  float d = sdBelt(p);
  float c = sdCrates(p);
  if (c < d) {
    d = c;
    // strap or wood?
    vec3 q = p - vec3(0.0, BELT_TOP + uCrateY, 0.0);
    id = abs(abs(q.x) - 0.12) < 0.031 ? 8 : 7;
    if (q.y > 0.84) id = 8;
  }
  float cm = sdCamelAt(p - vec3(uCamelX, uCamelY, 0.0));
  if (cm < d) { d = cm; id = 5; }
  // the glove, fingers down, index pointing at the strap
  vec3 gq = p - uGlove;
  gq = vec3(-gq.x, -gq.y, gq.z);
  float ta = 0.0; gq.yz = vec2(gq.y * cos(ta) - gq.z * sin(ta), gq.y * sin(ta) + gq.z * cos(ta));
  float gb = gloveBound(gq / ${GLOVE_S.toFixed(3)}) * ${GLOVE_S.toFixed(3)};
  if (gb < d) {
    float g = glove(gq / ${GLOVE_S.toFixed(3)}, GLOVE_POINT, 1.0) * ${GLOVE_S.toFixed(3)};
    if (g < d) { d = g; id = 9; }
  }
  // the chalice on its plinth, back right
  vec3 cq = p - CUPAT;
  float pl = sdRoundBox(cq - vec3(0.0, 0.3, 0.0), vec3(0.25, 0.3, 0.25), 0.01);
  if (pl < d) { d = pl; id = 10; }
  float ch = chalice((cq - vec3(0.0, 0.6, 0.0)) / 0.45) * 0.45;
  if (ch < d) { d = ch; id = 11; }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 6) return beltMat(p, -uRun);
  if (id == 5) return camelMat(p);
  if (id == 7) {
    // weathered crate boards
    vec3 q = p - vec3(0.0, BELT_TOP + uCrateY, 0.0);
    float board = smoothstep(0.0, 0.01, abs(fract(q.y * 10.0) - 0.5) - 0.46);
    Mat m = M(vec3(0.42, 0.3, 0.19) * (0.75 + 0.35 * vnoise(vec2(q.x * 3.0, q.y * 60.0))), 0.7, 0.0);
    m.alb *= 1.0 - 0.6 * board;
    return dirty(m, p * 2.0, 0.6);
  }
  if (id == 8) { Mat m = M(vec3(0.03, 0.03, 0.035), 0.45, 0.0); m.sheen = 0.5; return dirty(m, p * 3.0, 0.3); }
  if (id == 9) return gloveMat(p);
  if (id == 10) { Mat m = M(vec3(0.62, 0.62, 0.6), 0.35, 0.0); return dirty(m, p * 2.0, 0.5); }
  return cupTi(p - CUPAT - vec3(0.0, 0.6, 0.0), n);
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('120, 88, 60', 1.3), uCycB: rgb('40, 32, 28', 1.0),
      uFloorCol: rgb('80, 74, 66', 0.7), uFloorRough: 0.1, uGrime: 0.9,
      uKeyDir: [-0.35, 1.0, 0.4], uKeyCol: [3.4, 2.0, 0.8], uKeySize: 0.3,
      uRimA: [3.0, 1.6, 0.5], uRimB: [2.2, 2.4, 2.6],
      uHaze: 0.06, uHazeCol: [0.11, 0.075, 0.045],
      uCrateY: 0, uRun: 0, uStrapUp: 0, uCamelX: 0, uCamelY: 0.25, uGlove: [0, 5, 0],
    },
    camera: loadsCamera(P),
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      u.uCrateY.value = crateY(t);
      u.uRun.value = run(t);
      u.uCamelY.value = camelY(t);
      u.uCamelX.value = -0.9 - 1.8 * Math.max(0, t - camelLand);
      u.uStrapUp.value = Math.max(0, t - tLoads - 0.35) ** 2 * 6;
      setV(u, 'uGlove', glovePos(P, t));
      // the sodium lamp above the belt
      setV(u, 'uP1', [0.2, 2.4, 0.9]);
      setV(u, 'uP1c', [14, 7.5, 2.2]);
      setV(u, 'uP2', [CUP_AT[0] - 0.4, 1.6, CUP_AT[2] + 0.8]);
      setV(u, 'uP2c', [2.5, 2.7, 3.0]);
    },
    post(t) { return grade(t, { exposure: 1.05, bloom: 0.06 }); },
  };
};
