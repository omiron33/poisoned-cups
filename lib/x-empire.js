// The little empire, shared by s06-empire (it is built) and s22-fall (it topples).
// A skyline of server towers: eight stacks of white GPU slabs trimmed in gold (fins on the sides, a status LED
// strip on the front of each slab), the tallest in the middle crowned by a glowing optical fibre
// twisted into a helix ("you twist the truth") as its antenna.
//
// EMPIRE_GLSL gives `float empireSDF(vec3 p, out int id)` and `Mat empireMat(int id, vec3 p, vec3 n)`
// (ids 20..27 the towers' slabs, 30 the fibre). Uniforms:
//   uLv[8]   per tower: x offset, y offset, tilt (radians, + tips toward +x about that base edge),
//            slab count (fractional: the top slab is still falling onto the stack).
//   uTwist   0 straight fibre .. 1 a full helix;  uFibLo/uFibHi its ends;  uFibFollow 1 = rides tower 0.
//   uGlow    brightness of the LEDs and the fibre.
// JS: TOWERS, empireUniforms(), towerState().

export const TOWERS = [
  // x, z, half width, half depth, slabs
  [0.0, 0.0, 0.2, 0.17, 16],
  [-0.52, 0.12, 0.17, 0.15, 11],
  [0.5, -0.04, 0.19, 0.15, 12],
  [-0.3, -0.5, 0.16, 0.14, 9],
  [0.3, 0.46, 0.15, 0.13, 6],
  [-0.9, -0.12, 0.15, 0.14, 7],
  [0.9, 0.2, 0.14, 0.12, 5],
  [0.12, -0.72, 0.2, 0.15, 10],
];
export const SH = 0.06;   // slab pitch (m)

const glslArr = (i) => `float[8](${TOWERS.map((r) => r[i].toFixed(3)).join(', ')})`;

export const EMPIRE_GLSL = /* glsl */ `
uniform vec4 uLv[8];
uniform float uTwist, uFibLo, uFibHi, uFibFollow, uGlow, uBoundX;
const float SH = ${SH.toFixed(3)};
const float TX[8] = ${glslArr(0)};
const float TZ[8] = ${glslArr(1)};
const float TW[8] = ${glslArr(2)};
const float TD[8] = ${glslArr(3)};

// world point -> tower k's frame (origin at the tower's foot centre)
vec3 towerP(vec3 p, int k) {
  vec4 v = uLv[k];
  vec3 q = p - vec3(TX[k] + v.x, v.y, TZ[k]);
  if (abs(v.z) > 1e-4) {
    vec2 pv = vec2(sign(v.z) * TW[k], 0.0);
    vec2 r = q.xy - pv;
    float c = cos(v.z), s = sin(v.z);
    q.xy = vec2(r.x * c - r.y * s, r.x * s + r.y * c) + pv;
  }
  return q;
}
// one slab centred on its middle: a black metal box, heat-sink fins cut into its sides
float sdSlab(vec3 q, float w, float d) {
  float b = sdRoundBox(q, vec3(w, SH * 0.43, d), 0.006);
  float fin = abs(fract(q.z * 55.0) - 0.5) * 0.004 * step(w - 0.012, abs(q.x));
  return b + fin;
}
float sdTower(vec3 q, int k, float n) {
  float w = TW[k], d = TD[k];
  float full = floor(n);
  float bb = sdBox(q - vec3(0.0, full * SH * 0.5, 0.0), vec3(w, full * SH * 0.5, d) + 0.02);
  float res = 1e9;
  if (bb > 0.04) res = bb;
  else if (full > 0.5) {
    float i = clamp(floor(q.y / SH), 0.0, full - 1.0);
    res = sdSlab(q - vec3(0.0, (i + 0.5) * SH, 0.0), w, d);
    float j = clamp(i + (fract(q.y / SH) > 0.5 ? 1.0 : -1.0), 0.0, full - 1.0);
    res = min(res, sdSlab(q - vec3(0.0, (j + 0.5) * SH, 0.0), w, d));
  }
  // the next slab, still dropping onto the stack
  float f = n - full;
  if (f > 0.001) {
    float y = (full + 0.5) * SH + (1.0 - f) * (1.0 - f) * 3.0;
    res = min(res, sdSlab(q - vec3(0.0, y, 0.0), w, d));
  }
  return res;
}
// the fibre: a glowing strand, straight when uTwist = 0, a coiled helix at 1
float sdFibre(vec3 p) {
  float lo = uFibLo, hi = uFibHi;
  float b = sdBox(p - vec3(0.0, 0.5 * (lo + hi), 0.0), vec3(0.2, 0.5 * (hi - lo) + 0.05, 0.2));
  if (b > 0.05) return b;
  float R = 0.075 * uTwist, pitch = 0.11;
  float a = atan(p.z, p.x);
  // nearest turn of the helix at this angle
  float ph = (p.y / pitch) - a / 6.2831853;
  float k = floor(ph + 0.5);
  float hy = clamp((k + a / 6.2831853) * pitch, lo, hi);
  vec2 dq = vec2(length(p.xz) - R, (p.y - hy));
  float dh = length(dq) - 0.012;
  float d = R < 0.01 ? length(vec3(p.x, max(max(lo - p.y, p.y - hi), 0.0), p.z)) - 0.012 : dh * 0.8;
  d = min(d, sdSphere(p - vec3(0.0, hi + 0.02, 0.0), 0.022));
  return d;
}
float empireSDF(vec3 p, out int id) {
  id = 20;
  float bnd = sdBox(p - vec3(0.0, 0.8, -0.1), vec3(uBoundX, 0.85, 1.0));
  if (bnd > 0.15) return bnd;
  float d = 1e9;
  for (int k = 0; k < 8; k++) {
    float n = uLv[k].w;
    if (n <= 0.001) continue;
    vec3 q = towerP(p, k);
    float t = sdTower(q, k, n);
    if (t < d) { d = t; id = 20 + k; }
  }
  vec3 q = uFibFollow > 0.5 ? towerP(p, 0) : p;
  float f = sdFibre(q);
  if (f < d) { d = f; id = 30; }
  return d;
}
Mat empireMat(int id, vec3 p, vec3 n) {
  if (id == 30) {
    Mat m = GLASS(vec3(0.6, 1.0, 0.8));
    m.emit = vec3(0.25, 1.0, 0.55) * 2.6 * uGlow;
    return m;
  }
  int k = id - 20;
  vec3 q = towerP(p, k);
  float i = floor(q.y / SH);
  float ly = q.y - (i + 0.5) * SH;
    // white enamel, faintly brushed, trimmed in gold where the slab faces meet
  Mat m = M(vec3(0.86, 0.86, 0.84), 0.28 + 0.1 * vnoise(q * vec3(400.0, 30.0, 30.0)), 0.0);
  m.clear = 0.6;
  float edge = step(abs(ly), SH * 0.43) * smoothstep(SH * 0.34, SH * 0.42, abs(ly));
  if (edge > 0.5) m = GOLD();
  // the front status strip: a row of LEDs, each blinking on its own clock
  float front = step(TD[k] - 0.004, q.z);
  float row = step(abs(ly - 0.004), 0.0045);
  float cell = floor((q.x + 1.0) * 60.0);
  float on = step(0.45, hash12(vec2(cell + float(k) * 31.0, i + floor(uTime * 7.0 + hash12(vec2(cell, i)) * 3.0))));
  float led = front * row * step(0.25, fract((q.x + 1.0) * 60.0)) * step(abs(q.x), TW[k] - 0.03);
  vec3 lc = mix(vec3(0.2, 1.0, 0.45), vec3(1.0, 0.25, 0.1), step(0.9, hash12(vec2(cell, i + float(k)))));
  m.emit = led * (0.3 + 0.7 * on) * lc * 3.0 * uGlow;
  return dirty(m, p * 1.3, 0.35);
}
`;

export function empireUniforms() {
  return { uLv: new Array(32).fill(0), uTwist: 0, uFibLo: 0.96, uFibHi: 1.4, uFibFollow: 1, uGlow: 1, uBoundX: 1.2 };
}

// Tower state for time t.
//   build: [[k, t0, t1], ...] tower k stacks its slabs from t0 to t1 (each slab lands in turn)
//   fall:  [[k, ts, dir], ...] tower k starts to topple at ts toward dir (+1 / -1)
export function towerState(t, { build, fall } = {}) {
  const v = new Array(32).fill(0);
  TOWERS.forEach((tw, k) => { v[k * 4 + 3] = tw[4]; });
  if (build) for (const [k, t0, t1] of build) {
    const N = TOWERS[k][4];
    const x = (t - t0) / Math.max(1e-3, t1 - t0);
    v[k * 4 + 3] = x <= 0 ? 0 : Math.min(N, x * N);
  }
  if (fall) for (const [k, ts, dir] of fall) {
    const tau = t - ts;
    if (tau <= 0) continue;
    // a falling tree: the tilt accelerates; once past ~70 degrees it slams down and settles
    const a = Math.min(Math.PI / 2, 0.5 * 4.2 * tau * tau);
    let bounce = 0;
    const tl = Math.sqrt(Math.PI / 4.2);
    if (tau > tl) bounce = 0.05 * Math.exp(-(tau - tl) * 9) * Math.sin((tau - tl) * 26);
    v[k * 4] = dir * 0.02 * tau;
    v[k * 4 + 2] = dir * Math.max(0, a - Math.abs(bounce));
  }
  return v;
}
