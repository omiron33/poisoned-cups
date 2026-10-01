// 10 · "Heavy loads / That you never lift too"
// Outside: an automated conveyor runs endless crates (device cases, debt ledgers, legal packets,
// biometric dossiers, compliance modules) past a line of anonymous user silhouettes, bowed and
// backlit in the haze. An industrial robot arm swings a crate off the belt and drops it onto the
// load already on one silhouette's shoulders on "loads": the figure sags, the frame jolts.
// Inside: on "That" the camera tilts up and reveals what is above: three glossy executive control
// pods hovering in cold white light, untouched, drifting a little higher on "lift".
import { ease, grade, rgb, orbit, spring, linesFrom, clamp01 } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { S0910_GLSL } from '/song/lib/x-s09-s10.js';

const [LH, LN] = linesFrom('Heavy loads', 'That you never lift too');
const setV = (u, k, a) => { const v = u[k].value; if (v && v.set) v.set(...a); else u[k].value = a; };
const FIG_Z = -1.15;
const TARGET_X = 0.6;                     // the silhouette who takes this load

export function loadsTimes() {
  const tLoads = LH.words[1].start;
  const tThat = LN.words[0].start;
  const tLift = LN.words.find((w) => /lift/i.test(w.w)).start;
  return { tLoads, tThat, tLift };
}
export function loadsCamera(P) {
  const { tLoads, tThat, tLift } = loadsTimes();
  return (t) => {
    const u = t - P.from;
    // the impact: a damped dip that eases in over 6 frames and rings out at ~5 Hz (no one-frame jolt)
    const x = t - tLoads;
    const jolt = x > 0 ? -0.02 * ease.inOut3(x / 0.1) * Math.exp(-x * 6) * Math.cos(x * 28) : 0;
    const k = ease.inOut3((t - (tThat - 0.2)) / 1.1);
    const m = (a, b) => a + (b - a) * k;
    return orbit(t, {
      target: [m(0.2, 0.25), m(0.95, 2.35) + jolt, m(-0.5, -0.7)],
      yaw: 0.42 - 0.025 * u,
      pitch: m(0.12, -0.2),
      dist: m(4.3 - 0.12 * u, 4.1 - 0.05 * (t - tThat)),
      fov: 38, drift: 0.006,
    });
  };
}
// two-bone arm: shoulder S, wrist W, lengths a, b; the elbow bends up and back
function elbow(S, W, a, b) {
  const d = W.map((v, i) => v - S[i]);
  const L = Math.min(a + b - 1e-3, Math.hypot(...d));
  const f = d.map((v) => v / Math.hypot(...d));
  const x = (a * a - b * b + L * L) / (2 * L);
  const h = Math.sqrt(Math.max(0, a * a - x * x));
  // bend direction: up, made perpendicular to the reach
  let up = [0, 1, 0];
  const dp = up[0] * f[0] + up[1] * f[1] + up[2] * f[2];
  up = up.map((v, i) => v - dp * f[i]);
  const ul = Math.hypot(...up) || 1;
  return S.map((v, i) => v + f[i] * x + (up[i] / ul) * h);
}

export default (P) => {
  const t0 = P.from;
  const { tLoads, tThat, tLift } = loadsTimes();
  const SH = [TARGET_X + 0.05, 0.9, -0.55];
  const pick = [TARGET_X + 0.25, 0.75, 0.0];
  const drop = [TARGET_X, 2.09, FIG_Z - 0.2];
  // the wrist: lifts the crate off the belt, swings it over, drops it on "loads", then returns
  const wrist = (t) => {
    const a = ease.inOut3((t - (tLoads - 0.75)) / 0.6);
    const back = ease.inOut3((t - (tLoads + 0.25)) / 0.8);
    const p = pick.map((v, i) => v + (drop[i] - v) * a + 0.35 * Math.sin(Math.PI * a) * (i === 1 ? 1 : 0));
    return p.map((v, i) => v + (pick[i] - v) * back);
  };
  const run = (t) => 0.55 * (t - t0);
  // belt position: full speed until "loads", then speed falls as (1 - x)^2 over BRAKE s; after a
  // beat it eases back up to a slow creep (0.25 m/s over 0.3 s)
  const BRAKE = 0.15;
  const beltRun = (t) => {
    if (t < tLoads) return run(t);
    const x = Math.min(1, (t - tLoads) / BRAKE);
    const brake = 0.55 * BRAKE * (1 - Math.pow(1 - x, 3)) / 3;
    const c = Math.max(0, t - tLoads - 0.5), R = 0.3;
    const creep = 0.25 * (c < R ? c * c / (2 * R) : c - R / 2);
    return run(tLoads) + brake + creep;
  };
  return {
    name: 's10-loads', from: P.from, to: P.to,
    frag: STUDIO_GLSL + S0910_GLSL + /* glsl */ `
uniform float uRun, uSag, uCrateOn, uPodY, uHeld;
uniform vec3 uArmS, uArmE, uArmW;
const float FZ = ${FIG_Z.toFixed(2)};
const float TX = ${TARGET_X.toFixed(2)};
float gCell;
// crates on the belt: one every 0.9 m, each a different kind by its cell
float sdBeltCrates(vec3 p) {
  float x = p.x + uRun;
  float c = floor(x / 0.9 + 0.5);
  vec3 q = vec3(x - c * 0.9, p.y - BELT_TOP, p.z);
  float h = hash11(c * 1.37 + 4.0);
  gCell = c;
  vec3 hs = h < 0.25 ? vec3(0.22, 0.12, 0.2) : h < 0.5 ? vec3(0.18, 0.2, 0.18) : h < 0.75 ? vec3(0.26, 0.07, 0.19) : vec3(0.2, 0.16, 0.2);
  return sdRoundBox(q - vec3(0.0, hs.y, 0.0), hs, 0.012);
}
// the load on a figure's back: a stack of crates, n high
float sdLoad(vec3 q, float n) {
  float d = 1e9;
  for (int i = 0; i < 4; i++) {
    if (float(i) >= n) break;
    vec3 r = q - vec3(0.02 * sin(float(i) * 2.1), 0.13 + float(i) * 0.25, 0.0);
    r.xz = rot(0.12 * sin(float(i) * 3.3)) * r.xz;
    d = min(d, sdRoundBox(r, vec3(0.22, 0.11, 0.17), 0.01));
  }
  return d;
}
// an anonymous user: a bowed, backlit silhouette with a load on its shoulders
float sdFigure(vec3 q, float sag, float n, out float isLoad) {
  isLoad = 0.0;
  float bb = sdBox(q - vec3(0.0, 1.3, 0.0), vec3(0.4, 1.35, 0.35));
  if (bb > 0.1) return bb;
  q.y /= sag;
  vec3 r = vec3(abs(q.x), q.y, q.z);
  float legs = sdCapsule(r, vec3(0.09, 0.05, 0.0), vec3(0.09, 0.86, 0.0), 0.065);
  float torso = sdRoundCone(q, vec3(0.0, 0.9, 0.0), vec3(0.0, 1.33, 0.09), 0.14, 0.17);
  float head = sdSphere(q - vec3(0.0, 1.5, 0.21), 0.095);
  head = smin(head, sdCapsule(q, vec3(0.0, 1.38, 0.1), vec3(0.0, 1.47, 0.18), 0.05), 0.03);
  float arms = sdCapsule(r, vec3(0.19, 1.3, 0.08), vec3(0.23, 0.88, 0.16), 0.045);
  float d = smin(min(legs, torso), head, 0.05);
  d = smin(d, arms, 0.05);
  float ld = sdLoad(q - vec3(0.0, 1.4, -0.2), n);
  if (ld < d) { d = ld; isLoad = 1.0; }
  return d * min(sag, 1.0);
}
// the robot arm: base, upper arm, forearm, a two-finger claw, and a crate while held
float sdArm(vec3 p) {
  float bb = length(p - (uArmS + uArmW) * 0.5) - (length(uArmW - uArmS) * 0.5 + 0.9);
  if (bb > 0.1) return bb;
  float base = sdCyl(p - vec3(uArmS.x, uArmS.y * 0.5, uArmS.z), 0.14, uArmS.y * 0.5);
  float d = min(base, sdSphere(p - uArmS, 0.12));
  d = min(d, sdCapsule(p, uArmS, uArmE, 0.07));
  d = min(d, sdSphere(p - uArmE, 0.085));
  d = min(d, sdCapsule(p, uArmE, uArmW + vec3(0.0, 0.14, 0.0), 0.055));
  vec3 w = p - uArmW;
  vec3 r = vec3(abs(w.x) - 0.2 * mix(1.0, 1.15, 1.0 - uHeld), w.y - 0.02, w.z);
  d = min(d, sdBox(r, vec3(0.015, 0.1, 0.05)) - 0.005);
  d = min(d, sdBox(w - vec3(0.0, 0.14, 0.0), vec3(0.22, 0.02, 0.06)) - 0.005);
  return d;
}
// an executive control pod: glossy black ovoid, smoked canopy, a cold white ring light
float sdPod(vec3 q) {
  float b = length(q) - 0.75;
  if (b > 0.1) return b;
  // a long, low cabin: a flattened capsule with a blunt tail fin
  vec3 s = q * vec3(1.0, 1.35, 1.0);
  float body = sdCapsule(s, vec3(-0.42, 0.0, 0.0), vec3(0.42, 0.0, 0.0), 0.24) / 1.35;
  body = smax(body, -q.y - 0.12, 0.04);
  float fin = sdRoundBox(q - vec3(-0.5, 0.12, 0.0), vec3(0.12, 0.06, 0.012), 0.01);
  return min(body, fin);
}
vec3 podAt(int i) {
  if (i == 0) return vec3(-1.25, uPodY + 0.1 * sin(uTime * 0.9), -0.35);
  if (i == 1) return vec3(0.35, uPodY + 0.35 + 0.1 * sin(uTime * 0.8 + 2.0), -0.9);
  return vec3(1.75, uPodY - 0.05 + 0.1 * sin(uTime * 1.1 + 4.0), -0.45);
}
float mapObj(vec3 p, out int id) {
  id = 6;
  float d = sdBelt(p);
  float c = sdBeltCrates(p);
  if (c < d) { d = c; id = 7; }
  // four silhouettes on 1.2 m spacing; the one at TX takes this load
  float fi = clamp(floor((p.x + 1.8) / 1.2 + 0.5), 0.0, 3.0);
  float fx = -1.8 + fi * 1.2;
  float isTarget = step(abs(fx - TX), 0.01);
  float n = isTarget > 0.5 ? 2.0 + uCrateOn : 1.0 + mod(fi, 2.0) + step(2.5, fi);
  float isLoad;
  float f = sdFigure(p - vec3(fx, 0.0, FZ), isTarget > 0.5 ? uSag : 1.0, n, isLoad);
  if (f < d) { d = f; id = isLoad > 0.5 ? 9 : 8; }
  float a = sdArm(p);
  if (a < d) { d = a; id = 10; }
  if (uHeld > 0.5) {
    float cr = sdRoundBox(p - uArmW + vec3(0.0, 0.04, 0.0), vec3(0.2, 0.1, 0.16), 0.01);
    if (cr < d) { d = cr; id = 9; }
  }
  for (int i = 0; i < 3; i++) {
    float pd = sdPod(p - podAt(i));
    if (pd < d) { d = pd; id = 11; }
  }
  return d;
}
Mat crateMat(vec3 p, float kind) {
  // device cases, ledgers, legal packets, biometric dossiers, compliance modules
  Mat m = M(vec3(0.06, 0.06, 0.07), 0.35, 0.3);
  if (kind < 0.25) { m.emit = vec3(0.3, 2.2, 0.6) * step(0.985, fract(p.y * 20.0 + 0.5)) * 0.5; }
  else if (kind < 0.5) { m = M(vec3(0.62, 0.62, 0.6), 0.5, 0.0); m.alb *= 0.7 + 0.3 * step(0.5, fract(p.y * 90.0)); }
  else if (kind < 0.75) { m = M(vec3(0.1, 0.09, 0.12), 0.45, 0.0); m.emit = vec3(2.2, 0.2, 1.1) * step(abs(fract(p.x * 3.0) - 0.5), 0.03) * 0.6; }
  else { m = SILVER(); m.rough = 0.35; m.alb *= 0.75 + 0.25 * step(0.5, fract(p.x * 40.0)); }
  return dirty(m, p * 2.0, 0.4);
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 6) return beltMat(p, uRun);
  if (id == 7) { sdBeltCrates(p); return crateMat(p, hash11(gCell * 1.37 + 4.0)); }
  if (id == 8) { Mat m = M(vec3(0.018, 0.018, 0.022), 0.7, 0.0); m.sheen = 0.4; return m; }
  if (id == 9) return crateMat(p, hash13(floor(p * 4.0)));
  if (id == 10) {
    Mat m = M(vec3(0.72, 0.73, 0.76), 0.3, 1.0);
    m.alb *= 0.8 + 0.2 * step(0.5, fract(p.y * 6.0));
    return dirty(m, p * 2.5, 0.45);
  }
  // pods: glossy black lacquer, a smoked canopy lit from inside, the ring a cold white strip
  int pi = 0; float best = 1e9;
  for (int i = 0; i < 3; i++) { float dd = length(p - podAt(i)); if (dd < best) { best = dd; pi = i; } }
  vec3 q = p - podAt(pi);
  Mat m = LACQUER(vec3(0.015, 0.015, 0.02)); m.rough = 0.08;
  // a smoked window band lit cold from inside, a hairline white light strip, a magenta keel line
  if (abs(q.y - 0.05) < 0.045 && abs(q.x) < 0.36) { m = M(vec3(0.02), 0.03, 0.0); m.clear = 1.0; m.emit = vec3(0.5, 0.55, 0.7) * (0.6 + 0.4 * step(0.5, fract(q.x * 7.0))); }
  if (abs(q.y + 0.045) < 0.008) m.emit = vec3(3.0, 3.2, 3.6);
  if (q.y < -0.1 && abs(length(q.xz * vec2(0.62, 1.0)) - 0.2) < 0.012) m.emit = vec3(1.6, 0.15, 0.9) * 0.8;
  return m;
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('96, 120, 104', 1.6), uCycB: rgb('34, 28, 48', 1.2),
      uFloorCol: rgb('56, 58, 60', 0.7), uFloorRough: 0.1, uGrime: 0.95,
      uKeyDir: [0.2, 1.0, 0.5], uKeyCol: [2.3, 2.4, 2.7], uKeySize: 0.3,
      uRimA: [2.8, 2.9, 3.2], uRimB: [0.6, 2.6, 0.9],
      uHaze: 0.07, uHazeCol: [0.07, 0.09, 0.08],
      uRun: 0, uSag: 1, uCrateOn: 0, uPodY: 3.0, uHeld: 1,
      uArmS: [0, 0.9, 0], uArmE: [0, 1.5, 0], uArmW: [0, 1, 0],
    },
    camera: loadsCamera(P),
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      // the belt brakes hard on the drop (a 9-frame deceleration, no frame jolt), then creeps on
      u.uRun.value = beltRun(t);
      const W = wrist(t);
      setV(u, 'uArmS', SH);
      setV(u, 'uArmE', elbow(SH, [W[0], W[1] + 0.14, W[2]], 0.85, 0.8));
      setV(u, 'uArmW', W);
      u.uHeld.value = t < tLoads ? 1 : 0;
      u.uCrateOn.value = t < tLoads ? 0 : 1;
      // the figure sags under it, a spring down that settles lower
      u.uSag.value = 1 - 0.07 * (t < tLoads ? 0 : spring(t, tLoads, 0.5, 0.3));
      u.uPodY.value = 3.0 + 0.25 * ease.inOut3((t - tLift) / 1.2);
      setV(u, 'uP1', [0.4, 3.6, -0.5]);
      setV(u, 'uP1c', [6.0, 6.4, 7.2]);
      setV(u, 'uP2', [TARGET_X, 1.2, 0.8]);
      setV(u, 'uP2c', [0.8, 3.2, 1.2]);
    },
    post(t) { return grade(t, { exposure: 1.05, bloom: 0.07 }); },
  };
};
