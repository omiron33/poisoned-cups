// 10 · "Heavy loads / That you never lift too"  (v4 REWORK)
// Outside: an automated conveyor runs crates (label queues, RLHF batches, moderation, debt,
// compliance) past five workers in hi-vis vests and hard hats, each bowed under a stack of crates
// strapped to the back, lit warm from the front by the work lights along the belt, rimmed cold
// from behind, separated by haze. An industrial robot arm swings a crate off the belt and drops it
// on the nearest worker's stack on "loads": the worker buckles (knees drop, a hand to the belt
// edge) and the frame jolts.
// Inside: on "That" the camera tilts up into the haze above the line. Three giant obsidian glass
// heads (lib/x-v4-head.js) loom out of the fog, necks dissolving into it, looking down at the
// workers. On "never" they start to laugh (jaw chatter ~5 Hz, heads tipping back); on "lift" the
// centre head throws its head back furthest; on "too" they look back down, still laughing.
import { ease, grade, rgb, spring, linesFrom, clamp01 } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { S0910_GLSL } from '/song/lib/x-s09-s10.js';
import { FIGURE_GLSL, POSES, mixPose } from '/song/lib/x-v4-figure.js';
import { HEAD_GLSL, laughPose } from '/song/lib/x-v4-head.js';

const [LH, LN] = linesFrom('Heavy loads', 'That you never lift too');
const setV = (u, k, a) => { const v = u[k].value; if (v && v.set) v.set(...a); else u[k].value = a; };
const FZ = 0.95;                          // the workers' line, on the near side of the belt
const TX = 0.75;                          // the nearest worker, who takes this load
const WSP = 1.05;                         // worker spacing along x
const WYAW = -0.2;                         // the workers face 3/4 toward the camera
const HS = 4.0;                           // giant head scale (chin to crown, metres)

// bowed under the stack, knees bent, hands on the straps: less folded than the library's preset
// so faces stay toward the work lights
export const LOAD = { A: [0.5, 0.08, -0.4, 0.4], B: [0.5, 2.3, 0.5, 2.3], C: [0.25, 0.35, 0, 0.35] };
export function loadsTimes() {
  const tLoads = LH.words[1].start;
  const tThat = LN.words[0].start;
  const find = (re) => LN.words.find((w) => re.test(w.w)).start;
  return { tLoads, tThat, tNever: find(/never/i), tLift: find(/lift/i), tToo: find(/too/i) };
}

// camera: shot A low and close on the workers; shot B tilted up into the haze at the heads,
// hard hats along the bottom edge
const SHOT_A = { pos: [2.3, 0.85, 4.7], target: [-0.85, 1.05, 0.5] };
const SHOT_B = { pos: [2.5, 1.45, 5.9], target: [-1.0, 4.3, -4.5] };
export { SHOT_A, SHOT_B };
export function loadsCamera(P) {
  const { tLoads, tThat } = loadsTimes();
  return (t) => {
    const u = t - P.from;
    const x = t - tLoads;
    // the impact: a damped dip that eases in over 6 frames and rings out (no one-frame jolt)
    const jolt = x > 0 ? -0.025 * ease.inOut3(x / 0.1) * Math.exp(-x * 6) * Math.cos(x * 28) : 0;
    const k = ease.inOut3((t - (tThat - 0.15)) / 1.0);
    const m = (a, b) => a.map((v, i) => v + (b[i] - v) * k);
    const pos = m(SHOT_A.pos, SHOT_B.pos), target = m(SHOT_A.target, SHOT_B.target);
    // a slow lateral dolly and a little handheld drift
    pos[0] -= 0.06 * u; target[0] -= 0.05 * u;
    const d = 0.006 * (Math.sin(t * 0.7) + 0.5 * Math.sin(t * 1.9 + 1.3));
    pos[1] += jolt + d; target[1] += jolt + d * 2;
    return { pos, target, fov: 40, roll: d * 0.2 };
  };
}
// the three heads, standing in the fog behind the line and turned toward the final camera
export const HEADS = [[-5.7, 3.0, -2.9], [-2.1, 3.3, -4.3], [1.4, 3.0, -5.3]].map((h) => ({
  p: h, yaw: Math.atan2(SHOT_B.pos[0] - h[0], SHOT_B.pos[2] - h[2]),
}));

// JS port of the figure rig's back point (lib/x-v4-figure.js personRig/personBack) so the arm can
// set the crate exactly on top of the target's stack
const rx = (v, a) => { const c = Math.cos(a), s = Math.sin(a); return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c]; };
const add = (a, b) => a.map((v, i) => v + b[i]);
function legAngles(side, C) {
  const st = C[0] * side;
  const t = st * 0.42 + C[1] * 0.95, k = C[1] * 1.75 + 0.35 * Math.max(-st, 0) + 0.08;
  const kn = side < 0 ? [0.05, 1.62] : [1.42, 1.52];
  return [t + (kn[0] - t) * C[2], k + (kn[1] - k) * C[2]];
}
export function loadCrate({ A, C }, n = 2) {
  const lt = 0.45, ls = 0.44;
  const [tl, tr] = [legAngles(1, C), legAngles(-1, C)];
  const kL = [0, -Math.cos(tl[0]) * lt, Math.sin(tl[0]) * lt], kR = [0, -Math.cos(tr[0]) * lt, Math.sin(tr[0]) * lt];
  const aL = add(kL, [0, -Math.cos(tl[0] - tl[1]) * ls, Math.sin(tl[0] - tl[1]) * ls]);
  const aR = add(kR, [0, -Math.cos(tr[0] - tr[1]) * ls, Math.sin(tr[0] - tr[1]) * ls]);
  const low = Math.max(-Math.min(aL[1], kL[1] + 0.02), -Math.min(aR[1], aR[1] + (kR[1] + 0.02 - aR[1]) * C[2]));
  const pel = [0, low + 0.075, -0.25 * (aL[2] + aR[2]) * (1 - C[2]) - 0.1 * C[2]];
  const b = A[0];
  const wai = add(pel, rx([0, 0.2, 0], b * 0.45));
  const che = add(wai, rx([0, 0.27, 0], b * 0.9));
  const back = rx(add(che, rx([0, 0.12, -0.14], b)), A[1]);
  // crate n of sdLoad, in the person frame
  return add(back, rx([0, -0.22 + n * 0.235, -0.16], A[0] * 0.9 + A[1]));
}
const ry = (v, a) => { const c = Math.cos(a), s = Math.sin(a); return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c]; };
export const workerAt = (i) => [TX - i * WSP, 0, FZ - i * 0.14];
export const toWorld = (v, i = 0) => add(ry(v, WYAW), workerAt(i));

// two-bone arm: shoulder S, wrist W, lengths a, b; the elbow bends up and back
function elbow(S, W, a, b) {
  const d = W.map((v, i) => v - S[i]);
  const L = Math.min(a + b - 1e-3, Math.hypot(...d));
  const f = d.map((v) => v / Math.hypot(...d));
  const x = (a * a - b * b + L * L) / (2 * L);
  const h = Math.sqrt(Math.max(0, a * a - x * x));
  let up = [0, 1, 0];
  const dp = up[0] * f[0] + up[1] * f[1] + up[2] * f[2];
  up = up.map((v, i) => v - dp * f[i]);
  const ul = Math.hypot(...up) || 1;
  return S.map((v, i) => v + f[i] * x + (up[i] / ul) * h);
}

export default (P) => {
  const t0 = P.from;
  const { tLoads, tThat, tNever, tLift, tToo } = loadsTimes();
  const SH = [TX + 0.55, 1.25, -0.7];
  const pick = [TX + 0.8, 0.72, 0.0];
  const drop = add(toWorld(loadCrate(LOAD)), [0, 0.04, 0]);
  const wrist = (t) => {
    const a = ease.inOut3((t - (tLoads - 0.75)) / 0.6);
    const back = ease.inOut3((t - (tLoads + 0.25)) / 0.8);
    const p = pick.map((v, i) => v + (drop[i] - v) * a + 0.4 * Math.sin(Math.PI * a) * (i === 1 ? 1 : 0));
    return p.map((v, i) => v + (pick[i] - v) * back);
  };
  const run = (t) => 0.55 * (t - t0);
  const BRAKE = 0.15;
  const beltRun = (t) => {
    if (t < tLoads) return run(t);
    const x = Math.min(1, (t - tLoads) / BRAKE);
    const brake = 0.55 * BRAKE * (1 - Math.pow(1 - x, 3)) / 3;
    const c = Math.max(0, t - tLoads - 0.5), R = 0.3;
    const creep = 0.25 * (c < R ? c * c / (2 * R) : c - R / 2);
    return run(tLoads) + brake + creep;
  };
  // how far back each head is thrown: they lean in to laugh on "never", the centre throws its
  // head back on "lift", all look back down on "too"
  const headBack = (t, i) => {
    const on = ease.out3((t - tNever) / 0.3);
    const lift = i === 1 ? spring(t, tLift, 0.45, 0.3) : 0.35 * spring(t, tLift + 0.05, 0.45, 0.3);
    const down = ease.inOut3((t - tToo) / 0.35);
    return (0.2 * on + 0.38 * lift) * (1 - 0.8 * down);
  };
  return {
    name: 's10-loads', from: P.from, to: P.to,
    frag: STUDIO_GLSL + S0910_GLSL + FIGURE_GLSL + HEAD_GLSL + /* glsl */ `
uniform float uRun, uCrateOn, uHeld;
uniform vec3 uArmS, uArmE, uArmW;
uniform vec4 uTA, uTB, uTC, uWA, uWB, uWC;
uniform vec3 uH0, uH1, uH2, uHYaw, uHJaw, uHTilt, uHShake;
uniform float uHeadOn;
const float FZ = ${FZ.toFixed(3)};
const float TX = ${TX.toFixed(3)};
const float WSP = ${WSP.toFixed(3)};
const float WYAW = ${WYAW.toFixed(3)};
const float HS = ${HS.toFixed(3)};
float gCell;
float sdBeltCrates(vec3 p) {
  float x = p.x + uRun;
  float c = floor(x / 0.9 + 0.5);
  vec3 q = vec3(x - c * 0.9, p.y - BELT_TOP, p.z);
  float h = hash11(c * 1.37 + 4.0);
  gCell = c;
  vec3 hs = h < 0.25 ? vec3(0.22, 0.12, 0.2) : h < 0.5 ? vec3(0.18, 0.2, 0.18) : h < 0.75 ? vec3(0.26, 0.09, 0.19) : vec3(0.2, 0.16, 0.2);
  return sdRoundBox(q - vec3(0.0, hs.y, 0.0), hs, 0.012);
}
// worker i (0 = the nearest, who takes the drop): pose, load count, local frame
void workerPose(float i, out vec4 A, out vec4 B, out vec4 C) {
  if (i < 0.5) { A = uTA; B = uTB; C = uTC; return; }
  A = uWA; B = uWB; C = uWC;
  float h1 = hash11(i * 3.1 + 0.7), h2 = hash11(i * 5.7 + 1.9), h3 = hash11(i * 7.3 + 2.3);
  A += vec4(0.14 * (h1 - 0.5), 0.06 * (h2 - 0.5), 0.3 * (h3 - 0.5), 0.0);
  B += vec4(0.4 * (h2 - 0.5), 0.3 * (h3 - 0.5), 0.4 * (h1 - 0.5), 0.3 * (h2 - 0.5));
  C += vec4(0.4 * (h3 - 0.5), 0.12 * (h1 - 0.5) + 0.03 * sin(uTime * 2.4 + i * 1.7), 0.0, 0.0);
}
vec3 workerAt(float i) { return vec3(TX - i * WSP, 0.0, FZ - i * 0.14); }
float workerIdx(vec3 p) { return clamp(floor((TX - p.x) / WSP + 0.5), 0.0, 4.0); }
float workerLoadN(float i) { return i < 0.5 ? 2.0 + uCrateOn : 2.0 + step(0.5, hash11(i * 9.1 + 0.3)); }
float sdWorker(vec3 p, out float isLoad) {
  isLoad = 0.0;
  // one bound round the whole line, so rays far from it take long steps
  float lb = sdBox(p - vec3(TX - 2.0 * WSP, 1.2, FZ - 0.28), vec3(2.0 * WSP + 0.9, 1.25, 1.0));
  if (lb > 0.1) return lb;
  float i = workerIdx(p);
  vec3 c = workerAt(i);
  vec3 q = pfRy(p - c, -WYAW);
  float bb = sdCapsule(q, vec3(0, 0.45, 0), vec3(0, 1.6, 0), 0.95);
  float d;
  if (bb > 0.3) d = bb - 0.15;
  else {
    vec4 A, B, C; workerPose(i, A, B, C);
    d = sdPerson3(q, A, B, C, 2.0);
    float l = sdLoad(q, personBack(A, B, C, 2.0), A, workerLoadN(i));
    if (l < d) { d = l; isLoad = 1.0; }
  }
  // never step past the cell edge (the neighbour was not evaluated)
  float e = WSP * 0.5 - abs(p.x - c.x);
  return min(d, max(e, 0.0) + 0.05);
}
// the robot arm: base, upper arm, forearm, a two-finger claw
float sdArm(vec3 p) {
  float bb = length(p - (uArmS + uArmW) * 0.5) - (length(uArmW - uArmS) * 0.5 + 0.9);
  if (bb > 0.1) return bb;
  float base = sdCyl(p - vec3(uArmS.x, uArmS.y * 0.5, uArmS.z), 0.14, uArmS.y * 0.5);
  float d = min(base, sdSphere(p - uArmS, 0.12));
  d = min(d, sdCapsule(p, uArmS, uArmE, 0.07));
  d = min(d, sdSphere(p - uArmE, 0.085));
  d = min(d, sdCapsule(p, uArmE, uArmW + vec3(0.0, 0.14, 0.0), 0.055));
  vec3 w = p - uArmW;
  vec3 r = vec3(abs(w.x) - 0.25 * mix(1.0, 1.15, 1.0 - uHeld), w.y - 0.02, w.z);
  d = min(d, sdBox(r, vec3(0.015, 0.1, 0.05)) - 0.005);
  d = min(d, sdBox(w - vec3(0.0, 0.14, 0.0), vec3(0.27, 0.02, 0.06)) - 0.005);
  return d;
}
// giant heads: head-frame point for head k
vec3 headPos(int k) { return k == 0 ? uH0 : k == 1 ? uH1 : uH2; }
float hget(vec3 v, int k) { return k == 0 ? v.x : k == 1 ? v.y : v.z; }
vec3 headQ(vec3 p, int k) {
  vec3 q = p - headPos(k);
  q = pfRy(q, -hget(uHYaw, k));
  q.x += hget(uHShake, k) * HS * 0.6 * q.y / HS;   // the laugh shakes the head side to side
  return q / HS;
}
float sdHeads(vec3 p, out int which) {
  float d = 1e9; which = 0;
  for (int k = 0; k < 3; k++) {
    float bb = length(p - headPos(k) - vec3(0.0, 0.3 * HS, 0.0)) - 1.05 * HS;
    float hd = bb > 0.2 ? bb : sdHead(headQ(p, k), hget(uHJaw, k), hget(uHTilt, k)) * HS * 0.9;
    if (hd < d) { d = hd; which = k; }
  }
  return d;
}
float mapObj(vec3 p, out int id) {
  id = 6;
  float d = sdBelt(p);
  float c = sdBeltCrates(p);
  if (c < d) { d = c; id = 7; }
  float isLoad;
  float f = sdWorker(p, isLoad);
  if (f < d) { d = f; id = isLoad > 0.5 ? 9 : 8; }
  float a = sdArm(p);
  if (a < d) { d = a; id = 10; }
  if (uHeld > 0.5) {
    float cr = sdRoundBox(p - uArmW + vec3(0.0, 0.04, 0.0), vec3(0.24, 0.11, 0.18), 0.015);
    if (cr < d) { d = cr; id = 9; }
  }
  if (p.y > 1.2) {
    int k; float h = sdHeads(p, k);
    if (h < d) { d = h; id = 12 + k; }
  }
  return d;
}
Mat crateMat(vec3 p, float kind) {
  Mat m = M(vec3(0.06, 0.06, 0.07), 0.35, 0.3);
  if (kind < 0.25) { m.emit = vec3(0.3, 2.2, 0.6) * step(0.985, fract(p.y * 20.0 + 0.5)) * 0.5; }
  else if (kind < 0.5) { m = M(vec3(0.5, 0.5, 0.49), 0.5, 0.0); m.alb *= 0.7 + 0.3 * step(0.5, fract(p.y * 90.0)); }
  else if (kind < 0.75) { m = M(vec3(0.1, 0.09, 0.12), 0.45, 0.0); m.emit = vec3(2.2, 0.2, 1.1) * step(abs(fract(p.x * 3.0) - 0.5), 0.03) * 0.6; }
  else { m = SILVER(); m.rough = 0.35; m.alb *= 0.75 + 0.25 * step(0.5, fract(p.x * 40.0)); }
  return dirty(m, p * 2.0, 0.4);
}
Mat material(int id, vec3 p, vec3 n) {
  vec3 v = normalize(uCamPos - p);
  if (id == 6) return beltMat(p, uRun);
  if (id == 7) { sdBeltCrates(p); return crateMat(p, hash11(gCell * 1.37 + 4.0)); }
  if (id == 8) {
    float i = workerIdx(p);
    vec4 A, B, C; workerPose(i, A, B, C);
    return personMat(pfRy(p - workerAt(i), -WYAW), n, v, A, B, C, 2.0, 3.0 + i * 1.3);
  }
  if (id == 9) {
    // strapped crates: dark composite with a tie-down strap
    float i = workerIdx(p);
    return crateMat(p, uHeld > 0.5 && length(p - uArmW) < 0.4 ? 0.6 : fract(i * 0.37 + 0.55));
  }
  if (id == 10) {
    Mat m = M(vec3(0.72, 0.73, 0.76), 0.3, 1.0);
    m.alb *= 0.8 + 0.2 * step(0.5, fract(p.y * 6.0));
    return dirty(m, p * 2.5, 0.45);
  }
  int k = id - 12;
  vec3 q = headQ(p, k);
  Mat m = headMatT(q, n, 1.0, hget(uHJaw, k), hget(uHTilt, k));
  // smoked glass: softer reflections so the work lights don't read as gold patches; the scan a
  // touch brighter; a faint cold spill on the undersides from the line below
  m.rough = 0.5; m.clear = 0.12;
  if (q.y < 0.05) { m.clear = 0.0; m.rough = 0.7; }
  m.emit *= 2.2;
  m.emit += vec3(0.5, 0.6, 0.75) * 0.02 * pow(sat(0.35 - n.y), 1.5);
  // the necks dissolve into the fog; the heads loom out of it from "That"
  m.emit *= smoothstep(-0.4, 0.05, q.y) * uHeadOn;
  return m;
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('44, 58, 54', 1.0), uCycB: rgb('20, 18, 30', 1.0),
      uFloorCol: rgb('46, 46, 50', 0.7), uFloorRough: 0.12, uGrime: 0.95,
      // the warm work lights along the belt: a key from the front, low
      uKeyDir: [0.45, 0.5, 0.8], uKeyCol: [3.3, 2.35, 1.45], uKeySize: 0.35,
      uRimA: [2.6, 2.8, 3.3], uRimB: [1.6, 2.4, 3.2],
      uHaze: 0.06, uHazeCol: [0.06, 0.075, 0.08],
      uRun: 0, uCrateOn: 0, uHeld: 1,
      uArmS: [0, 0.9, 0], uArmE: [0, 1.5, 0], uArmW: [0, 1, 0],
      uTA: LOAD.A, uTB: LOAD.B, uTC: LOAD.C, uWA: LOAD.A, uWB: LOAD.B, uWC: LOAD.C,
      uHeadOn: 0, uH0: HEADS[0].p, uH1: HEADS[1].p, uH2: HEADS[2].p,
      uHYaw: HEADS.map((h) => h.yaw), uHJaw: [0, 0, 0], uHTilt: [0, 0, 0], uHShake: [0, 0, 0],
    },
    camera: loadsCamera(P),
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      u.uRun.value = beltRun(t);
      const W = wrist(t);
      setV(u, 'uArmS', SH);
      setV(u, 'uArmE', elbow(SH, [W[0], W[1] + 0.14, W[2]], 1.05, 1.0));
      setV(u, 'uArmW', W);
      u.uHeld.value = t < tLoads ? 1 : 0;
      u.uCrateOn.value = t < tLoads ? 0 : 1;
      // the nearest worker buckles under the extra crate: a spring into the buckle, settling partway
      const kb = t < tLoads ? 0 : 0.8 * spring(t, tLoads, 0.45, 0.3);
      const ps = mixPose(LOAD, POSES.buckle, kb);
      setV(u, 'uTA', ps.A); setV(u, 'uTB', ps.B); setV(u, 'uTC', ps.C);
      // the heads: loom out of the fog from "That", look down at the line, then laugh
      u.uHeadOn.value = 0.08 + 0.92 * ease.inOut3((t - (tThat - 0.1)) / 0.7);
      const jaw = [], tilt = [], shake = [];
      for (let i = 0; i < 3; i++) {
        const L = laughPose(t + i * 0.07, tNever + i * 0.04, P.to + 1, { rate: 5 - i * 0.35, back: 0.0, open: 0.8 });
        jaw.push(L.jaw);
        tilt.push(-0.3 + headBack(t, i) + L.jaw * 0.06);
        shake.push(L.shake * 1.5);
      }
      setV(u, 'uHJaw', jaw); setV(u, 'uHTilt', tilt); setV(u, 'uHShake', shake);
      // a warm work lamp in front of the nearest worker; a cold top light behind the line
      setV(u, 'uP1', [TX + 0.9, 1.75, 0.55]);
      setV(u, 'uP1c', [5.5, 3.6, 2.0]);
      setV(u, 'uP2', [-0.8, 3.2, -2.6]);
      setV(u, 'uP2c', [3.0, 3.4, 4.2]);
    },
    post(t) { return grade(t, { exposure: 1.08, bloom: 0.07 }); },
  };
};
