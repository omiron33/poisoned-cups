// 23 · "A cracked reed bruised / I will never crush or kill" (v4 REBUILD)
// After the collapse, quiet. The film's one soft transition: the frame fades up from black into a dim
// pocket among the fallen post towers: toppled glass slabs (dead cards), shards on wet concrete, the
// warm core far behind. In the middle kneels the hi-vis worker from s10, one knee down, one hand flat
// on the floor, head bowed; their crate lies fallen and split beside them; the reflective stripes of
// their vest are cracked into broken segments. Above, out of the dark, hangs the disposal arm, clamp
// open, a red status ring at its wrist.
//   "reed"     a thin red scan line from the arm finds the worker; the clamp turns toward them
//   "bruised"  the clamp starts down toward their back, slow and mechanical
//   "I"        warm gold-white light falls from above onto the worker (no lamp): the red scan dies in
//              it, the arm stops dead mid-descent, its ring goes out, a small powered-down sag
//   "never"    the arm withdraws slowly up into the dark, clamp closing, harmless
//   crush..or  in the light the cracks in the stripes fill with warm light
//   "kill"     the worker lifts their head into the light and holds
import { grade, rgb, linesAt, clamp01, ease, mix, spring } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { FIGURE_GLSL, POSES, mixPose } from '/song/lib/x-v4-figure.js';

export const lines23 = (P) => linesAt(P.from - 0.6, 'A cracked reed', 'I will never crush');

const YAW = 0.95;                       // the worker turns a little toward the camera
const T = [0.12, 0.9, -0.05];          // the top of the worker's back (world), where the clamp aims
const SH = [1.55, 3.9, -1.1];           // the arm's shoulder, in the dark above (out of frame)
const HOVER = [0.72, 1.95, -0.3];      // the clamp waiting, high right
const UP = [1.25, 3.6, -0.9];           // withdrawn
// two-bone arm: the elbow bends up and back
function elbow(S, W, a, b) {
  const d = W.map((v, i) => v - S[i]);
  const len = Math.hypot(...d);
  const L = Math.min(a + b - 1e-3, len);
  const f = d.map((v) => v / len);
  const x = (a * a - b * b + L * L) / (2 * L);
  const h = Math.sqrt(Math.max(0, a * a - x * x));
  let up = [0.6, 0.3, -0.75];
  const dp = up[0] * f[0] + up[1] * f[1] + up[2] * f[2];
  up = up.map((v, i) => v - dp * f[i]);
  const ul = Math.hypot(...up) || 1;
  return S.map((v, i) => v + f[i] * x + (up[i] / ul) * h);
}

// kneeling, one hand flat on the floor, head bowed; then the head lifts into the light
const KNEEL = { A: [1.12, 0.14, 0.55, 0.3], B: [0.15, 0.0, 0.55, 1.2], C: [0, 0, 1, 0] };
const KNEEL_UP = { A: [0.9, 0.08, -0.75, 0.05], B: [0.25, 0.0, 0.55, 1.2], C: [0, 0, 1, 0] };
export function rig(P) {
  const [L1, L2] = lines23(P);
  const w = (re) => L1.words.concat(L2.words).find((x) => re.test(x.w));
  const tReed = w(/^reed/i).start, tBruised = w(/^bruised/i).start;
  const tI = L2.words[0].start, tNever = w(/^never/i).start, tCrush = w(/^crush/i).start, tKill = w(/^kill/i).start;
  const camera = (t) => {
    const u = t - P.from;
    const push = ease.inOut3(clamp01(u / (P.to - P.from)));
    const rise = ease.inOut3(clamp01((t - tI + 0.1) / 1.4));
    const d = 0.006 * Math.sin(t * 0.5);
    return {
      pos: [1.65 - 0.2 * push + d, 0.72 + 0.45 * rise, 3.55 - 0.4 * push],
      target: [0.0, 0.98 + 0.08 * rise, 0.0], fov: 40, roll: 0.004 * Math.sin(t * 0.3),
    };
  };
  // the clamp: hover, aim on "reed", descend from "bruised", stop dead on "I" (with a sag), withdraw on "never"
  const wrist = (t) => {
    const aimed = T.map((v, i) => v + [0.12, 0.62, 0.02][i]);
    const desc = ease.inOut3(clamp01((Math.min(t, tI) - tBruised) / 1.5));   // slow; cut off by "I"
    let p = HOVER.map((v, i) => v + (aimed[i] - v) * desc);
    if (t > tI) p[1] -= 0.06 * (spring(t, tI, 0.5, 0.45));            // powered-down sag, settles
    const wd = ease.inOut3(clamp01((t - tNever) / 1.5));
    return p.map((v, i) => v + (UP[i] - v) * wd);
  };
  const shaft = (t) => ease.out3(clamp01((t - tI + 0.04) / 0.35));
  return { camera, wrist, shaft, tReed, tBruised, tI, tNever, tCrush, tKill };
}

export default (P) => {
  const R = rig(P);
  return {
    name: 's23-reed', from: P.from, to: P.to,
    frag: STUDIO_GLSL + FIGURE_GLSL + /* glsl */ `
uniform vec4 uA, uB, uC;
uniform vec3 uArmS, uArmE, uArmW, uAim;
uniform float uFade, uShaft, uScan, uRing, uClamp, uMend;
const float YAW = ${YAW.toFixed(3)};
const vec3 TGT = vec3(${T.join(', ')});
vec3 wq(vec3 p) { return pfRy(p, -YAW); }
// the disposal arm: rail mount above, upper arm, forearm, a wrist with a red ring, two clamp jaws
float sdArm(vec3 p, out int part) {
  part = 0;
  float bb = min(sdCapsule(p, uArmS, uArmE, 0.35), sdCapsule(p, uArmE, uArmW, 0.55));
  if (bb > 0.2) return bb;
  float d = sdCapsule(p, uArmS, uArmE, 0.085);
  d = min(d, length(p - uArmE) - 0.12);
  d = min(d, sdCapsule(p, uArmE, uArmW, 0.065));
  d = min(d, length(p - uArmW) - 0.09);
  // the clamp frame: axis a toward the aim, jaws open along s
  vec3 a = normalize(uAim - uArmW);
  vec3 s = normalize(cross(a, vec3(0.3, 0.1, 1.0)));
  vec3 c = cross(s, a);
  vec3 q = p - uArmW;
  vec3 l = vec3(dot(q, s), dot(q, a), dot(q, c));
  float hub = sdRoundBox(l - vec3(0, 0.1, 0), vec3(0.16, 0.05, 0.07), 0.02);
  float open = 0.05 + 0.13 * uClamp;
  vec3 j = vec3(abs(l.x) - open, l.y - 0.24, l.z);
  // each jaw: a blade angled in at the tip
  j.xy = mat2(cos(0.25), -sin(0.25), sin(0.25), cos(0.25)) * j.xy;
  float jaw = sdRoundBox(j, vec3(0.022, 0.16, 0.055), 0.01);
  float ring = sdTorus((l - vec3(0, 0.02, 0)), vec2(0.1, 0.018));
  d = min(d, hub);
  if (jaw < d) { d = jaw; part = 1; }
  if (ring < d) { d = ring; part = 2; }
  return d;
}
// toppled post-card slabs and shards
float sdDebris(vec3 p, out float seed) {
  seed = 0.0;
  float d = 1e9;
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    float a = fi * 2.3 + 0.4, r = 1.6 + 1.3 * hash11(fi + 1.3);
    vec3 c = vec3(cos(a) * r, 0.0, sin(a) * r * 0.9 - 1.2);
    if (c.z > 0.6) c.z -= 2.6;
    vec3 q = p - c;
    q.xz *= rot(fi * 1.9);
    vec3 b = vec3(0.9, 0.5, 0.025) * (0.8 + 0.4 * hash11(fi + 3.0));
    // leaning or lying: tip about x
    float tip = -1.1 - 0.4 * hash11(fi + 5.0);
    q.y -= b.x * 0.3 * (0.6 + 0.4 * sin(tip));
    q.yz *= rot(tip);
    float s = sdRoundBox(q, b, 0.01);
    if (s < d) { d = s; seed = fi + 1.0; }
  }
  // shards round the worker
  vec2 g = floor(p.xz * 2.2);
  vec2 f = fract(p.xz * 2.2) - 0.5;
  float h = hash12(g + 7.0);
  if (h > 0.62 && length(p.xz) > 0.75) {
    vec3 q = vec3(f.x / 2.2, p.y - 0.008, f.y / 2.2);
    q.xz *= rot(h * 12.0);
    float s = sdRoundBox(q, vec3(0.07 * h, 0.006, 0.035), 0.002);
    if (s < d) { d = s; seed = -1.0; }
  }
  return d;
}
float mapObj(vec3 p, out int id) {
  id = 1;
  vec3 q = wq(p);
  float d = sdPerson3(q, uA, uB, uC, 2.0);
  // the fallen crate, split: two halves beside the worker
  vec3 c = q - vec3(-0.62, 0.0, 0.22);
  c.xz *= rot(0.5);
  float cr = sdRoundBox(c - vec3(0.0, 0.17, 0.0), vec3(0.24, 0.17, 0.18), 0.012);
  cr = max(cr, -sdBox(c - vec3(0.02, 0.2, 0.0), vec3(0.012, 0.3, 0.3)));
  vec3 c2 = q - vec3(-0.98, 0.0, -0.12);
  c2.xz *= rot(-0.3); c2.xy *= rot(0.35);
  cr = min(cr, sdRoundBox(c2 - vec3(0.0, 0.1, 0.0), vec3(0.2, 0.09, 0.16), 0.012));
  if (cr < d) { d = cr; id = 2; }
  int part;
  float a = sdArm(p, part);
  if (a < d) { d = a; id = 10 + part; }
  float seed;
  float db = sdDebris(p, seed);
  if (db < d) { d = db; id = seed < 0.0 ? 4 : 3; }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  vec3 v = normalize(uCamPos - p);
  if (id == 1) {
    vec3 q = wq(p);
    Mat m = personMat(q, wq(n), wq(v), uA, uB, uC, 2.0, 3.0);
    if (gPart == 0 || gPart == 1) m.alb *= mix(2.6, 1.3, uShaft);   // work clothes, not a black hole
    // the reflective stripes are cracked into broken segments; the cracks fill with warm light
    if (m.alb.b > 0.55 && m.alb.r > 0.5) {
      float e = voronoiEdge(q.xy * 22.0 + q.z * 9.0).x;
      float crack = smoothstep(0.06, 0.0, e);
      m.emit *= mix(1.0, 0.0, crack) * 0.6;
      m.alb *= mix(1.0, 0.15, crack);
      m.emit += vec3(3.4, 2.4, 1.2) * crack * uMend;
      // the vest itself goes dull and grimy away from the light
    }
    return m;
  }
  if (id == 2) { Mat m = M(vec3(0.22, 0.22, 0.24), 0.5, 0.2); return dirty(m, p * 3.0, 0.7); }
  if (id == 3) {
    // a dead post card: black glass, a faint silver hairline border and bars, a spider crack
    Mat m = M(vec3(0.012), 0.06, 0.0); m.clear = 1.0;
    float e = voronoiEdge(p.xz * 5.0 + p.y * 7.0).x;
    m.rough = mix(0.45, 0.05, smoothstep(0.0, 0.03, e));
    m.alb += vec3(0.08) * smoothstep(0.02, 0.0, e);
    return m;
  }
  if (id == 4) { Mat m = M(vec3(0.03), 0.05, 0.0); m.clear = 1.0; return m; }
  if (id == 11) { Mat m = M(vec3(0.6, 0.62, 0.66), 0.2, 1.0); return dirty(m, p * 2.0, 0.6); }
  if (id == 12) { Mat m = M(vec3(0.05), 0.3, 0.0); m.emit = vec3(4.0, 0.12, 0.2) * uRing; return m; }
  Mat m = M(vec3(0.3, 0.31, 0.34), 0.3, 0.9);
  return dirty(m, p * 2.0, 0.5);
}
// the shaft of warm light: a soft vertical column round the worker, read in the haze
vec3 shaftGlow(vec3 ro, vec3 rd, float depth) {
  if (uShaft <= 0.001) return vec3(0);
  vec2 o = ro.xz - TGT.xz, dd = rd.xz;
  float a = dot(dd, dd);
  float tc = a > 1e-6 ? -dot(o, dd) / a : 0.0;
  tc = clamp(tc, 0.0, depth);
  vec3 c = ro + rd * tc;
  float y = c.y;
  float r = 0.38 + 0.1 * y;
  float dist = length(c.xz - TGT.xz);
  float g = exp(-dist * dist / (r * r)) * smoothstep(-0.1, 0.4, y) * (0.6 + 0.4 * smoothstep(4.5, 1.0, y));
  return vec3(1.0, 0.8, 0.52) * g * 0.42 * uShaft;
}
// the red scan line from the wrist to the worker's back
vec3 scanLine(vec3 ro, vec3 rd, float depth) {
  if (uScan <= 0.001) return vec3(0);
  vec3 a = uArmW, b = uAim;
  vec3 ba = b - a, oa = ro - a;
  float bb = dot(ba, ba), rb = dot(rd, ba), ob = dot(oa, ba), ro2 = dot(oa, rd);
  float den = bb - rb * rb;
  float s = clamp((ob - rb * ro2) / max(den, 1e-5), 0.0, 1.0);
  float t = max(dot(a + ba * s - ro, rd), 0.0);
  if (t > depth + 0.05) return vec3(0);
  float dl = length(ro + rd * t - (a + ba * s));
  float w = 0.0025 * t;
  return vec3(1.0, 0.06, 0.12) * (exp(-dl * dl / (w * w)) * 1.4 + exp(-dl / (w * 8.0)) * 0.12) * uScan;
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  vec3 c = studio(ro, rd, depth);
  c += (shaftGlow(ro, rd, depth) + scanLine(ro, rd, depth)) * uExpo;
  return c * uFade;
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('120, 70, 46', 1.3), uCycB: rgb('10, 9, 12', 1.0),
      uFloorCol: rgb('52, 50, 54', 1.0), uFloorRough: 0.12, uFloorGrain: 0.6,
      uGrime: 0.95, uHaze: 0.05, uHazeCol: [0.05, 0.035, 0.03],
      uKeyDir: [0.75, 0.7, 0.6], uKeyCol: [0.85, 1.0, 1.35], uKeySize: 0.5,
      uRimA: [1.4, 0.8, 0.45], uRimB: [1.1, 1.3, 1.8],
      uP1: [2.2, 1.5, 2.4], uP1c: [3.0, 3.6, 5.0],
      uP2: [0.05, 3.0, 0.1], uP2c: [0, 0, 0],
      uA: [0, 0, 0, 0], uB: [0, 0, 0, 0], uC: [0, 0, 0, 0],
      uArmS: SH, uArmE: [0, 0, 0], uArmW: HOVER, uAim: [0, 0, 0],
      uFade: 0, uShaft: 0, uScan: 0, uRing: 1, uClamp: 1, uMend: 0,
    },
    camera: R.camera,
    textPlane() { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      const set = (k, a) => { const v = u[k].value; if (v && v.set) v.set(...a); else u[k].value = a; };
      // the worker: kneeling, head bowed; on "kill" the head lifts into the light
      const lift = ease.inOut3(clamp01((t - R.tKill + 0.05) / 0.7));
      const ps = mixPose(KNEEL, KNEEL_UP, lift);
      // breathing, a slight tremor while the arm comes
      ps.A[0] += 0.015 * Math.sin(t * 2.1);
      set('uA', ps.A); set('uB', ps.B); set('uC', ps.C);
      // the arm
      const W = R.wrist(t);
      set('uArmW', W); set('uArmE', elbow(SH, W, 1.45, 1.35));
      // the clamp aims straight down until "reed", then turns toward the worker's back
      const aimK = ease.inOut3(clamp01((t - R.tReed) / 0.5));
      const down = [W[0], W[1] - 1, W[2]];
      set('uAim', down.map((v, i) => v + (T[i] - v) * aimK));
      u.uClamp.value = 1 - ease.inOut3(clamp01((t - R.tNever - 0.2) / 0.9));
      const sh = R.shaft(t);
      u.uShaft.value = sh;
      u.uRing.value = t < R.tI ? 0.8 + 0.2 * Math.sin(t * 9) : Math.max(0, 1 - (t - R.tI) / 0.06) * 0.6;
      u.uScan.value = clamp01((t - R.tReed + 0.02) / 0.12) * (1 - clamp01((t - R.tI) / 0.18)) * (0.85 + 0.15 * Math.sin(t * 31));
      u.uMend.value = ease.inOut3(clamp01((t - R.tCrush + 0.1) / 0.8));
      // the warm light from above: no lamp, a pool on the worker; the cold dark recedes in it
      u.uP2c.value = [26 * sh, 20.5 * sh, 13 * sh];
      u.uP1c.value = [3.0, 3.6, 5.0].map((c) => c * (1 - 0.7 * sh));
      u.uKeyCol.value = mix([0.85, 1.0, 1.35], [0.5, 0.48, 0.5], sh);
      u.uHazeCol.value = mix([0.05, 0.035, 0.03], [0.09, 0.065, 0.045], sh);
      // the soft transition: fade up from black over ~1.3 s
      u.uFade.value = ease.inOut3(clamp01((t - P.from) / 1.3));
    },
    post(t) { return grade(t, { exposure: 1.0, vignette: 0.5, bloom: 0.1 }); },
  };
};
