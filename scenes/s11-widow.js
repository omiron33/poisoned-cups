// 11 · "Blind guides smile / While the widow pays"  (v4 REBUILD, docs/V4-DIRECTION.md s11)
// Shot A (68.13 to 69.61): close on an AI giving kiosk's screen. The guide is a glass contour face
// (faceScan from lib/x-v4-head.js) on deep black glass, calm, a scan band sweeping. On "Blind" a
// black glass band slides across its eyes like a blindfold; on "smile" the contour field at the
// mouth corners lifts into a small practised smile (deformation, never a drawn stroke).
// Shot B (from "While"): one pull-back and down to a low wide street shot. The kiosk stands on a
// cold wet street; an old widow (lib/x-v4-figure.js kind 3, bent on a cane) stands at its side slot,
// warm in its spill. From the kiosk's top a clear ribbed tube rises straight up into a glass vault
// floating high over the street: stacks of silver bars, a heap of silver tokens and three rich men
// in sharp suits (kind 4), one holding a glass. On "widow" she lets two copper coins go into the
// slot (two warm glints); on "pays" they shoot up the tube as two warm sparks, drop onto the silver,
// the vault flashes cold and the man with the glass raises it.
// Glass (the vault panes and the tube) is drawn analytically over the marched picture, so what is
// inside them shows through.
import { ease, grade, rgb, linesFrom, spring, clamp, mix } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { HEAD_GLSL } from '/song/lib/x-v4-head.js';
import { FIGURE_GLSL, POSES, mixPose } from '/song/lib/x-v4-figure.js';

const [L1, L2] = linesFrom('Blind guides smile', 'While the widow pays');
export const W11 = {
  blind: L1.words[0].start, smile: L1.words[2].start, while: L2.words[0].start,
  the: L2.words[1].start, widow: L2.words[2].start, pays: L2.words[3].start,
};
// timings derived from the words
const PAYS_UP = 0.3;                // coins travel up the tube
const LAND = W11.pays + PAYS_UP + 0.16;

// world layout (metres). Kiosk at the origin, screen facing +z; the widow at its left side (-x).
export const KIOSK = { screenC: [0, 1.82, 0.075], screenHalf: [0.45, 0.28] };
export const VAULT = { c: [-0.55, 3.9, -1.75], h: [1.75, 0.8, 1.95] };   // floor at y 3.10

const SHOT_A = (u) => ({ pos: [0.0, 1.82, 0.075 + 0.88 - 0.05 * u], target: [0.0, 1.82, 0], fov: 38 });
const SHOT_B = (u) => ({ pos: [-0.2 - 0.03 * u, 0.9 + 0.01 * u, 3.1 - 0.04 * u], target: [-0.12, 2.15, -1.2], fov: 58 });
export function camera11(P) {
  return (t) => {
    const ua = t - P.from, ub = Math.max(0, t - W11.while);
    const a = SHOT_A(ua), b = SHOT_B(ub);
    // pull back and down: 0.12 s ease in, a sprung settle by about +0.8 s
    const x = (t - W11.while) / 0.62;
    let k = x <= 0 ? 0 : x >= 1 ? 1 : ease.inOut3(x);
    if (x > 0.7) k += 0.035 * Math.sin(Math.min(1, (x - 0.7) / 0.9) * Math.PI) * Math.exp(-Math.max(0, x - 1) * 2);
    // pos follows the eased k; the target leads a little so the move reads as a tilt-and-pull
    const kt = clamp(k * 1.08, 0, 1.04);
    const cam = { pos: mix(a.pos, b.pos, k), target: mix(a.target, b.target, kt), fov: mix(a.fov, b.fov, clamp(k, 0, 1)), roll: 0 };
    // a tiny push on "pays"
    const push = 0.18 * spring(t, W11.pays, 0.5, 0.25);
    const d = cam.target.map((v, i) => v - cam.pos[i]);
    const l = Math.hypot(...d);
    cam.pos = cam.pos.map((v, i) => v + (d[i] / l) * push);
    // handheld drift
    const dr = 0.006 * (Math.sin(t * 0.7) + 0.5 * Math.sin(t * 1.9 + 1.3));
    cam.pos = [cam.pos[0] + dr, cam.pos[1] + dr * 0.5, cam.pos[2]];
    return cam;
  };
}

// poses (JS so they can blend): the widow reaches to the slot; the rich man raises his glass
const HOLD = { A: [0.08, 0.0, -0.1, 0], B: [0.15, 0.2, 0.62, 1.95], C: [0.1, 0, 0, 0.1] };     // glass at the chest
const RAISE = { A: [-0.1, -0.06, -0.3, 0], B: [0.15, 0.2, 2.45, 0.6], C: [0.1, 0, 0, 0.1] };    // glass raised high
const WREST = { A: [0.5, 0.05, -0.15, 0.25], B: [0.95, 1.3, 0.42, 0.05], C: [0.2, 0.22, 0, 0] }; // coins held at her chest

export default (P) => {
  const t0 = P.from;
  return {
    name: 's11-widow', from: P.from, to: P.to,
    frag: STUDIO_GLSL + HEAD_GLSL + FIGURE_GLSL + /* glsl */ `
uniform float uBlind, uSmile, uScreen, uFlash, uLand;
uniform vec4 uWA, uWB, uWC, uTA, uTB, uTC;
uniform vec4 uCoin;      // (phase coin 0, phase coin 1, glint 0, glint 1)
const vec3 VC = vec3(${VAULT.c.map((v) => v.toFixed(3)).join(', ')});
const vec3 VH = vec3(${VAULT.h.map((v) => v.toFixed(3)).join(', ')});
const float FLOORY = ${(VAULT.c[1] - VAULT.h[1]).toFixed(3)};
const float TUBE_R = 0.075, TUBE_Y0 = 2.12, TUBE_Y1 = ${(VAULT.c[1] - VAULT.h[1] + 0.42).toFixed(3)};
const float WYAW = 1.05;
const vec3 R1P = vec3(-0.3, 0.0, -0.45), R2P = vec3(-1.05, 0.0, -0.75), R3P = vec3(0.45, 0.0, -0.95);
const float R1Y = -0.2, R2Y = -0.5, R3Y = 0.25;
const vec3 HEAP = vec3(0.2, 0.0, 1.1);   // the token heap beside the tube's mouth (vault frame)          // the widow faces +x (the kiosk's side)
// per-pixel globals set once in shade()
vec3 gWP;      // widow feet
vec3 gSlot;    // slot mouth (world)
vec3 gHand;    // her coin hand (world)
vec3 gC0, gC1; // the two coins
vec3 gTop;     // landing spot on the token heap (world)
vec4 sA, sB, sC, fA, fB, fC;   // presets: plain standing, folded arms

vec3 wq(vec3 p) { return pfRy(p - gWP, -WYAW); }
vec3 vq(vec3 p) { return p - vec3(VC.x, FLOORY, VC.z); }

// ---- the kiosk: a slim black glass totem with a landscape screen head and a side slot ----
float kiosk(vec3 p, out int id) {
  id = 1;
  float bb = length(p - vec3(0, 1.1, 0)) - 1.35;
  if (bb > 0.2) return bb;
  float d = sdRoundBox(p - vec3(0.0, 0.66, 0.0), vec3(0.2, 0.66, 0.14), 0.03);
  d = smin(d, sdRoundBox(p - vec3(0.0, 0.035, 0.0), vec3(0.3, 0.035, 0.22), 0.015), 0.02);
  float hd = sdRoundBox(p - vec3(0.0, 1.82, 0.0), vec3(0.49, 0.32, 0.075), 0.03);
  // a neck between pedestal and head
  hd = smin(hd, sdRoundBox(p - vec3(0.0, 1.4, -0.02), vec3(0.12, 0.12, 0.08), 0.02), 0.05);
  if (hd < d) { d = hd; id = 2; }
  // the slot plate on the left side, at her hand's height
  float sp = sdRoundBox(p - vec3(-0.215, gSlot.y, 0.0), vec3(0.025, 0.07, 0.1), 0.012);
  sp = max(sp, -sdRoundBox(p - vec3(-0.24, gSlot.y, 0.0), vec3(0.03, 0.006, 0.055), 0.002));
  if (sp < d) { d = sp; id = 3; }
  // the tube's collar on the head's top
  float col = sdCyl(p - vec3(0.0, 2.17, 0.0), 0.11, 0.035) - 0.01;
  if (col < d) { d = col; id = 4; }
  return d;
}
// ---- a stack of silver bars (one bar evaluated per cell), pyramid stepped ----
float bars(vec3 q, vec3 n) {
  const vec3 cell = vec3(0.27, 0.085, 0.13);
  if (q.y > n.y * cell.y + 0.05) return q.y - n.y * cell.y;
  float ly = clamp(floor(q.y / cell.y), 0.0, n.y - 1.0);
  float nx = max(n.x - ly, 1.0), nz = max(n.z - floor(ly * 0.5), 1.0);
  float ix = clamp(floor(q.x / cell.x + 0.5 * (nx - 1.0) + 0.5), 0.0, nx - 1.0);
  float iz = clamp(floor(q.z / cell.z + 0.5 * (nz - 1.0) + 0.5), 0.0, nz - 1.0);
  vec3 o = vec3((ix - 0.5 * (nx - 1.0)) * cell.x, (ly + 0.5) * cell.y, (iz - 0.5 * (nz - 1.0)) * cell.z);
  return sdRoundBox(q - o, vec3(0.12, 0.036, 0.055), 0.01);
}
float vaultStuff(vec3 p, out int id) {
  id = 8;
  vec3 v = vq(p);
  float bx = max(max(-0.1 - v.y, v.y - 2.4), max(abs(v.x) - VH.x - 0.3, abs(v.z) - VH.z - 0.3));
  if (bx > 0.05) return bx;
  float d = bars(v - vec3(-1.05, 0.0, 0.7), vec3(4.0, 4.0, 3.0));
  d = min(d, bars(v - vec3(1.15, 0.0, 0.25), vec3(3.0, 3.0, 4.0)));
  d = min(d, bars(v - vec3(1.2, 0.0, -1.25), vec3(4.0, 5.0, 3.0)));
  d = min(d, bars(v - vec3(-1.35, 0.0, -1.3), vec3(3.0, 3.0, 2.0)));
  // a heap of silver tokens beside the tube's mouth
  float hp = bars(v - HEAP, vec3(3.0, 2.0, 3.0));
  if (hp < d) { d = hp; id = 9; }
  // three rich men
  vec3 r1 = pfRy(v - R1P, R1Y);
  float f1 = sdPerson3(r1, uTA, uTB, uTC, 4.0);
  if (f1 < d) { d = f1; id = 10; }
  float g1 = sdGlass(r1, personHand(uTA, uTB, uTC, 4.0, -1.0));
  if (g1 < d) { d = g1; id = 13; }
  vec3 r2 = pfRy(v - R2P, R2Y);
  float f2 = sdPerson3(r2, fA, fB, fC, 4.0);
  if (f2 < d) { d = f2; id = 11; }
  vec3 r3 = pfRy(v - R3P, R3Y);
  float f3 = sdPerson3(r3, sA, sB, sC, 4.0);
  if (f3 < d) { d = f3; id = 12; }
  return d;
}
float coinD(vec3 p, vec3 c, float seed) {
  vec3 q = p - c;
  if (dot(q, q) > 0.01) return length(q) - 0.05;
  q.xy = vec2(q.x * 0.8 - q.y * 0.6, q.x * 0.6 + q.y * 0.8);
  return sdCoin(q, 0.034, 0.004, seed);
}
// the city: a far row of dark towers with cold window strips
float city(vec3 p) {
  vec3 q = p - vec3(0.0, 0.0, -30.0);
  if (q.z > 3.0) return q.z - 2.0;
  float i = clamp(floor(q.x / 7.0 + 0.5), -6.0, 6.0);
  float h = 14.0 + 16.0 * hash11(i * 7.3 + 1.0);
  return sdBox(q - vec3(i * 7.0, h * 0.5, 4.0 * hash11(i * 3.1) - 2.0), vec3(2.6, h * 0.5, 2.6));
}
float mapObj(vec3 p, out int id) {
  int kid;
  float d = kiosk(p, kid); id = kid;
  int vid;
  float v = vaultStuff(p, vid);
  if (v < d) { d = v; id = vid; }
  // the widow and her cane
  vec3 q = wq(p);
  float w = sdPerson3(q, uWA, uWB, uWC, 3.0);
  if (w < d) { d = w; id = 6; }
  float cn = sdCane(q, personHand(uWA, uWB, uWC, 3.0, -1.0));
  if (cn < d) { d = cn; id = 7; }
  float c = min(coinD(p, gC0, 1.0), coinD(p, gC1, 2.0));
  if (c < d) { d = c; id = 5; }
  float ct = city(p);
  if (ct < d) { d = ct; id = 14; }
  return d;
}

// ---- the kiosk screen: the glass contour face, the blindfold, a dark right column ----
vec3 screenUI(vec2 f) {
  vec3 c = vec3(0.004, 0.005, 0.008);
  // a faint cold vignette lift behind the face
  vec2 fc = f - vec2(-0.2, -0.005);
  c += vec3(0.012, 0.016, 0.026) * smoothstep(0.32, 0.0, length(fc));
  vec2 uv = fc / 0.255;
  float yaw = 0.16 + 0.05 * sin(uTime * 0.9);
  vec3 face = faceScan(uv, yaw, 0.0, uSmile, 1.0, vec3(0.72, 0.86, 1.0));
  // the blindfold: a band of black glass slides in from the left across the eyes
  float by = uv.y - 0.12 - 0.04 * uv.x;
  float bandIn = step(uv.x, -1.1 + 2.3 * uBlind) * step(abs(by), 0.15) * step(abs(uv.x), 0.98);
  face *= 1.0 - 0.97 * bandIn;
  c += face * 1.2;
  // the band's glassy edges and a slow reflection sliding along it
  float edge = exp(-pow((abs(by) - 0.15) / 0.006, 2.0)) * step(abs(uv.x), 0.98) * step(uv.x, -1.1 + 2.3 * uBlind);
  c += vec3(0.5, 0.58, 0.7) * edge * 0.6;
  c += vec3(0.08, 0.1, 0.13) * bandIn * smoothstep(0.15, -0.15, by) * (0.5 + 0.5 * sin(uv.x * 2.0 - uTime * 1.5));
  // UI: a hairline down the right column, a header rule, a dim progress rule
  c += vec3(0.05, 0.06, 0.08) * step(abs(f.x - 0.085), 0.0012) * step(abs(f.y), 0.22);
  c += vec3(0.04, 0.05, 0.06) * step(abs(f.y - 0.235), 0.0012) * step(-0.43, f.x) * step(f.x, 0.43);
  return c * uScreen;
}

Mat material(int id, vec3 p, vec3 n) {
  vec3 v = normalize(uCamPos - p);
  if (id == 1) { Mat m = M(vec3(0.02, 0.021, 0.025), 0.18, 0.0); m.clear = 1.0;
    // a thin cold light seam down the pedestal's front edges
    m.emit = vec3(0.5, 0.6, 0.75) * 0.6 * smoothstep(0.006, 0.0, abs(abs(p.x) - 0.17)) * step(n.z, -0.5 + 1.5) * step(0.9, n.z) * step(0.1, p.y) * step(p.y, 1.3);
    return dirty(m, p, 0.35); }
  if (id == 2) {
    Mat m = M(vec3(0.015, 0.016, 0.02), 0.08, 0.0); m.clear = 1.0;
    vec2 f = p.xy - vec2(0.0, 1.82);
    if (n.z > 0.9 && abs(f.x) < 0.45 && abs(f.y) < 0.28) { m.emit = screenUI(f) * 1.6; m.rough = 0.03; m.alb = vec3(0.004); }
    return m;
  }
  if (id == 3) {
    Mat m = CHROME(); m.alb = vec3(0.75, 0.77, 0.8); m.rough = 0.12;
    // the slot's mouth glows cold; it flares when a coin goes in
    float s = smoothstep(0.012, 0.0, abs(p.y - gSlot.y)) * step(p.x, -0.235) * step(abs(p.z), 0.06);
    m.emit = vec3(0.6, 0.75, 1.0) * s * (0.8 + 2.5 * max(uCoin.z, uCoin.w));
    return m;
  }
  if (id == 4) { Mat m = CHROME(); m.alb = vec3(0.8, 0.82, 0.86); m.rough = 0.08; return m; }
  if (id == 5) {
    // worn copper; hot when moving
    float g = fbm(p * 220.0, 2);
    Mat m = M(mix(vec3(0.95, 0.5, 0.3), vec3(0.55, 0.32, 0.2), g * 0.6), 0.25, 1.0);
    float hot = length(p - gC0) < length(p - gC1) ? uCoin.z : uCoin.w;
    m.emit = vec3(1.0, 0.45, 0.15) * hot * 6.0;
    return m;
  }
  if (id == 6) {
    vec3 q = wq(p);
    Mat m = personMat(q, pfRy(n, -WYAW), pfRy(v, -WYAW), uWA, uWB, uWC, 3.0, 2.0);
    // the kiosk's warm spill from her front, and a cold street rim from behind, so she never goes
    // to a black cut-out
    vec3 Lf = normalize(vec3(0.75, 0.25, 0.6));
    m.emit += m.alb * vec3(1.0, 0.64, 0.4) * 1.0 * sat(dot(n, Lf) * 0.8 + 0.2);
    m.emit += vec3(0.32, 0.4, 0.6) * pow(1.0 - sat(dot(n, v)), 3.0) * 0.35;
    return m;
  }
  if (id == 7) { Mat m = M(vec3(0.55, 0.56, 0.6), 0.3, 1.0); return m; }
  if (id == 8) {
    Mat m = SILVER(); m.alb *= 0.8; m.rough = 0.22 + 0.12 * vnoise(p * 30.0);
    m.emit = vec3(0.5, 0.6, 0.8) * uFlash * 0.25;
    return m;
  }
  if (id == 9) {
    Mat m = SILVER(); m.rough = 0.12 + 0.12 * vnoise(p * 30.0);
    m.emit = vec3(0.5, 0.6, 0.8) * uFlash * 0.3;
    // the two coins landed: a warm glint spreading over the top bars
    m.emit += vec3(1.0, 0.45, 0.15) * uLand * 2.5 * exp(-dot(p - gTop, p - gTop) / 0.02);
    return m;
  }
  if (id >= 10 && id <= 12) {
    vec3 vv = vq(p);
    vec3 r; vec4 A, B, C; float yw;
    if (id == 10) { yw = R1Y; r = pfRy(vv - R1P, yw); A = uTA; B = uTB; C = uTC; }
    else if (id == 11) { yw = R2Y; r = pfRy(vv - R2P, yw); A = fA; B = fB; C = fC; }
    else { yw = R3Y; r = pfRy(vv - R3P, yw); A = sA; B = sB; C = sC; }
    return personMat(r, pfRy(n, yw), pfRy(v, yw), A, B, C, 4.0, float(id) * 3.0);
  }
  if (id == 13) { Mat m = GLASS(vec3(0.9, 0.95, 1.0)); m.emit = vec3(0.4, 0.5, 0.6) * (0.3 + uFlash); return m; }
  // the far towers: dark, with cold window strips
  Mat m = M(vec3(0.01, 0.01, 0.014), 0.5, 0.0);
  float wy = step(0.55, fract(p.y * 1.4)) * step(0.3, fract(p.x * 1.1 + p.z * 1.1));
  float lit = step(0.8, hash12(floor(vec2(p.x * 1.1 + p.z * 1.1, p.y * 1.4))));
  m.emit = vec3(0.35, 0.42, 0.6) * wy * lit * 0.22;
  return m;
}

// ---- analytic glass over the marched picture ----
vec2 boxHit(vec3 ro, vec3 rd, vec3 c, vec3 h) {
  vec3 m = 1.0 / rd, o = ro - c;
  vec3 k = abs(m) * h, a = -m * o - k, b = -m * o + k;
  float tn = max(max(a.x, a.y), a.z), tf = min(min(b.x, b.y), b.z);
  return tn > tf || tf < 0.0 ? vec2(-1.0) : vec2(tn, tf);
}
// edge glow of the box at a point on its surface
float boxEdge(vec3 p, vec3 c, vec3 h, float w) {
  vec3 d = h - abs(p - c);
  // on a face one component is ~0; the edge distance is the smaller of the other two
  float s = d.x < d.y && d.x < d.z ? min(d.y, d.z) : d.y < d.z ? min(d.x, d.z) : min(d.x, d.y);
  return exp(-s / w);
}
vec3 glass(vec3 ro, vec3 rd, float depth, vec3 col) {
  // the vault
  vec2 h = boxHit(ro, rd, VC, VH);
  if (h.x > 0.0 && h.x < depth) {
    vec3 p = ro + rd * h.x;
    vec3 q = (p - VC) / VH;
    vec3 an = abs(q);
    vec3 n = an.x > an.y && an.x > an.z ? vec3(sign(q.x), 0, 0) : an.y > an.z ? vec3(0, sign(q.y), 0) : vec3(0, 0, sign(q.z));
    float fr = 0.04 + 0.96 * pow(1.0 - abs(dot(rd, n)), 5.0);
    col = col * mix(vec3(1.0), vec3(0.78, 0.86, 0.95), 0.35) + env(reflect(rd, n)) * fr * 0.5;
    float e = boxEdge(p, VC, VH, 0.018);
    col += vec3(0.75, 0.85, 1.0) * e * (1.4 + 2.0 * uFlash);
    // the floor pane: a faint grid so it reads as a floor
    if (n.y < -0.5) {
      vec2 g = abs(fract((p.xz - VC.xz) * 1.4) - 0.5);
      col += vec3(0.35, 0.42, 0.55) * smoothstep(0.012, 0.0, 0.5 - max(g.x, g.y)) * 0.15;
      col += vec3(0.05, 0.06, 0.08) * (0.4 + uFlash);
    }
    if (h.y < depth) col += vec3(0.75, 0.85, 1.0) * boxEdge(ro + rd * h.y, VC, VH, 0.014) * 0.6;
  }
  // the tube: a vertical glass cylinder from the kiosk top into the vault
  vec2 o = ro.xz, dd = rd.xz;
  float a = dot(dd, dd), b = dot(o, dd), cc = dot(o, o) - TUBE_R * TUBE_R;
  float disc = b * b - a * cc;
  if (disc > 0.0) {
    float sq = sqrt(disc);
    float t1 = (-b - sq) / a, t2 = (-b + sq) / a;
    for (int i = 0; i < 2; i++) {
      float tt = i == 0 ? t1 : t2;
      vec3 p = ro + rd * tt;
      if (tt > 0.0 && tt < depth && p.y > TUBE_Y0 && p.y < TUBE_Y1) {
        vec3 n = normalize(vec3(p.x, 0.0, p.z)) * (i == 0 ? 1.0 : -1.0);
        float graz = 1.0 - abs(dot(rd, n));
        float rib = smoothstep(0.1, 0.0, abs(fract(p.y / 0.09) - 0.5) - 0.38);
        col = col * (i == 0 ? 0.9 : 0.97) + vec3(0.7, 0.82, 1.0) * (pow(graz, 3.0) * 0.9 + rib * 0.08 * (0.3 + graz)) * (i == 0 ? 1.0 : 0.5);
        // a faint cold flow inside, brighter while the coins rise
        col += vec3(0.3, 0.4, 0.6) * 0.02 * (i == 0 ? 1.0 : 0.0);
      }
    }
  }
  return col;
}

vec3 coinPos(float ph, float side) {
  // ph < 0 hidden; 0..1 in her hand to the slot; 1..2 hidden inside; 2..3 up the tube; 3..4 out
  // and onto the heap; >= 4 resting on the heap
  if (ph < 0.0 || (ph > 1.0 && ph < 2.0)) return vec3(0, -9, 0);
  vec3 hand = gHand + vec3(0.03, -0.01, 0.012 * side);
  if (ph <= 1.0) return mix(hand, gSlot + vec3(-0.01, 0, 0.012 * side), smoothstep(0.0, 1.0, ph));
  vec3 mouth = vec3(0.0, TUBE_Y1 + 0.06, 0.0);
  if (ph <= 3.0) { float k = ph - 2.0; return vec3(0.012 * side, mix(TUBE_Y0 - 0.02, mouth.y, k * k * (3.0 - 2.0 * k)), 0.0); }
  vec3 top = gTop + vec3(0.05 * side, 0.0, 0.03 * side);
  if (ph <= 4.0) { float k = ph - 3.0; return mix(mouth, top, k) + vec3(0, 0.25 * k * (1.0 - k), 0); }
  return top;
}

vec3 shade(vec2 fc) {
  personPose(P_STAND, sA, sB, sC);
  personPose(P_FOLD, fA, fB, fC);
  // put her so the coin hand of the slot pose lands at the slot
  vec4 a, b, c;
  personPose(P_WIDOW, a, b, c);
  vec3 h = personHand(a, b, c, 3.0, 1.0);
  gSlot = vec3(-0.245, h.y, 0.0);
  gWP = gSlot - pfRy(vec3(h.x, 0.0, h.z), WYAW) - vec3(0.02, gSlot.y, 0.0);
  gHand = gWP + pfRy(personHand(uWA, uWB, uWC, 3.0, 1.0), WYAW);
  gTop = vec3(VC.x, FLOORY, VC.z) + HEAP + vec3(0.0, 0.2, 0.0);
  gC0 = coinPos(uCoin.x, 1.0);
  gC1 = coinPos(uCoin.y, -1.0);
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  vec3 col = studio(ro, rd, depth);
  col = glass(ro, rd, depth, col);
  // a warm halo round each moving coin, so the two sparks read even at thumbnail size
  for (int i = 0; i < 2; i++) {
    vec3 c = i == 0 ? gC0 : gC1;
    float g = i == 0 ? uCoin.z : uCoin.w;
    if (c.y < -1.0 || g < 0.15) continue;
    float tc = dot(c - ro, rd);
    if (tc < 0.0 || tc > depth + 0.1) continue;
    float dd = length(ro + rd * tc - c) / tc;
    col += vec3(1.0, 0.5, 0.18) * g * (0.9 * exp(-pow(dd / 0.006, 2.0)) + 0.25 * exp(-dd / 0.02));
  }
  return col;
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('44, 48, 80', 1.0), uCycB: rgb('22, 24, 42', 1.0),
      uFloorCol: rgb('44, 46, 52', 0.8), uFloorRough: 0.1, uFloorGrain: 1.4, uGrime: 0.9, uFogFar: 40,
      uKeyDir: [-0.3, 0.55, 0.78], uKeyCol: [2.4, 1.9, 1.4], uKeySize: 0.35,
      uRimA: [0.9, 1.1, 1.5], uRimB: [0.8, 1.0, 1.4],
      uP1: [-0.15, 1.45, 0.4], uP1c: [2.6, 1.5, 0.6],
      uP2: [VAULT.c[0], VAULT.c[1] + 0.4, VAULT.c[2] + 0.2], uP2c: [2.6, 2.9, 3.5],
      uHaze: 0.03, uHazeCol: rgb('50, 58, 90', 0.5),
      uBlind: 0, uSmile: 0, uScreen: 1, uFlash: 0, uLand: 0,
      uWA: WREST.A, uWB: WREST.B, uWC: WREST.C, uTA: HOLD.A, uTB: HOLD.B, uTC: HOLD.C,
      uCoin: [-1, -1, 0, 0],
    },
    camera: camera11(P),
    textPlane() { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      // the blindfold slides in on "Blind"; the practised smile lifts on "smile"
      u.uBlind.value = t < W11.blind - 0.04 ? 0 : ease.out3((t - (W11.blind - 0.04)) / 0.2);
      u.uSmile.value = 0.75 * spring(t, W11.smile - 0.02, 0.35, 0.2);
      // the widow's hand reaches to the slot over the long "While", lets go on "widow"
      const reach = ease.inOut3((t - (W11.while + 0.5)) / 0.9) * (1 - 0.6 * ease.inOut3((t - (W11.pays + 0.1)) / 0.6));
      const wp = mixPose(WREST, POSES.widow, reach);
      u.uWA.value = wp.A; u.uWB.value = wp.B; u.uWC.value = wp.C;
      // coins: in the hand, into the slot on "widow" (0.12 s apart), up the tube on "pays"
      const ph = (td, tp) => {
        if (t < td) return 0;
        if (t < td + 0.14) return (t - td) / 0.14;
        if (t < tp) return 1.5;
        if (t < tp + PAYS_UP) return 2 + (t - tp) / PAYS_UP;
        if (t < tp + PAYS_UP + 0.16) return 3 + (t - tp - PAYS_UP) / 0.16;
        return 4.5;
      };
      const g = (td, tp) => {
        const a = t >= td - 0.05 && t < td + 0.35 ? Math.exp(-Math.max(0, t - td - 0.1) * 8) : 0;
        const b = t >= tp && t < tp + PAYS_UP + 0.16 ? 1 : 0;
        return Math.max(a * 0.6, b) + 0.08;
      };
      u.uCoin.value = [ph(W11.widow, W11.pays), ph(W11.widow + 0.12, W11.pays + 0.07), g(W11.widow, W11.pays), g(W11.widow + 0.12, W11.pays + 0.07)];
      // landing: a cold flash in the vault; the glass goes up
      u.uFlash.value = t < LAND ? 0 : Math.exp(-(t - LAND) * 4.0);
      u.uLand.value = t < LAND ? 0 : Math.exp(-(t - LAND) * 1.5);
      // the warm spill on the widow only exists in the wide shot (no warm glints on the close screen)
      const kb = ease.inOut3((t - W11.while) / 0.5);
      u.uP1c.value = [2.6 * kb, 1.5 * kb, 0.6 * kb];
      u.uP2c.value = [2.6, 2.9, 3.5].map((v) => v * (1 + 1.6 * u.uFlash.value));
      const tp = mixPose(HOLD, RAISE, spring(t, LAND - 0.05, 0.45, 0.2));
      u.uTA.value = tp.A; u.uTB.value = tp.B; u.uTC.value = tp.C;
    },
    post(t) { return grade(t, { exposure: 1.1, vignette: 0.4, bloom: 0.1 }); },
  };
};
