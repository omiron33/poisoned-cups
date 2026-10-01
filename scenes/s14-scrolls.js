// 14 · "You kiss the scrolls / But your tongues call God a liar"   (v4 REBUILD: the pious machine)
// Outside: a dark keynote stage, one cold-white spot, haze, black gloss floor. A tall, slender
// chrome-and-glass robot with the v4 obsidian glass head stands at a lectern, its front pair of arms
// folded in prayer. On the lectern lies an open book of light (warm white pages, fine text lines).
// In the dark foreground the audience holds up rows of phones. On "kiss" it bows and touches its
// brow to the page: light ripples across the pages and the phones flare.
// Inside: on "But" the camera swings 120 degrees round behind it. A second pair of arms, black,
// industrial, three-jointed with red status rings, works a hidden console (keys, a stamp, a red
// screen); the back half of its head is clear glass with a dark red stream of hidden reasoning
// scrolling inside. On "tongues" it turns to the microphone and a long black forked tongue with
// magenta tips flicks out. On "call" the stamp arm slams down on the same page of light shown on the
// console, and the page flags red. On "liar" the picture tears for three frames (macroblock slips).
import { grade, rgb, linesFrom, clamp01, ease, mix, spring } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { HEAD_GLSL } from '/song/lib/x-v4-head.js';

const [L1, L2] = linesFrom('You kiss the scrolls', 'But your tongues');
const W = (L, k) => L.words.find((w) => w.w.toLowerCase().replace(/[^a-z]/g, '').startsWith(k));

// world layout (metres; robot faces +z, floor y = 0)
export const HEAD = [0, 1.72, 0.0];          // head centre when upright
export const PAGE = { c: [0.24, 0.948, -0.7], hw: 0.13, hh: 0.17 };   // the page on the console (flat, +y up)
const FRONT_YAW = -0.32, BACK_YAW = 2.05;    // the orbit: about 135 degrees, 3/4 front to 3/4 back

const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const bump = (x) => (x <= 0 || x >= 1 ? 0 : Math.sin(Math.PI * x) ** 2);

export function rig(P) {
  const tYou = L1.words[0].start, tKiss = W(L1, 'kiss').start, tBut = L2.words[0].start;
  const tT = W(L2, 'tongues').start, tCall = W(L2, 'call').start, tGod = W(L2, 'god').start, tLiar = W(L2, 'liar').start;
  const orbitK = (t) => ease.inOut3((t - tBut + 0.02) / 0.5);
  const yawOf = (t) => FRONT_YAW + (BACK_YAW - FRONT_YAW) * orbitK(t) + 0.08 * bump((t - tBut - 0.3) / 0.6);
  const camera = (t) => {
    const u = t - P.from;
    const k = orbitK(t);
    const push = ease.inOut3((t - tKiss + 0.5) / 1.1);
    const settle = 1 - ease.inOut3(u / 0.6);
    const d = 0.006 * Math.sin(t * 0.9) + 0.004 * Math.sin(t * 2.1);
    const dist = mix(2.1 - 0.2 * push + 0.1 * settle, 2.95, k) - 0.08 * ease.inOut3((t - tT) / 1.2);
    const tgt = [mix(-0.12, 0.12, k), mix(1.42 - 0.08 * push, 1.08, k), mix(0.15, -0.25, k)];
    const y = yawOf(t) + d;
    const h = mix(0.3 + 0.04 * push, 0.24, k);
    const pos = [tgt[0] + dist * Math.sin(y), tgt[1] + dist * Math.sin(h) + 0.02, tgt[2] + dist * Math.cos(y)];
    const punch = 0.08 * spring(t, tLiar, 0.35, 0.3) * (1 - smooth((t - tLiar - 0.25) / 0.2));
    return { pos, target: tgt, fov: 38 * (1 - punch), roll: 0.004 * Math.sin(t * 0.7) };
  };
  return { camera, tYou, tKiss, tBut, tT, tCall, tGod, tLiar };
}

export default (P) => {
  const R = rig(P);
  return {
    name: 's14-scrolls', from: P.from, to: P.to,
    frag: STUDIO_GLSL + HEAD_GLSL + /* glsl */ `
uniform float uFront, uBow, uHeadTilt, uHeadYaw, uJaw, uTongue, uRipple, uFlare, uReveal, uStamp, uFlag, uTap, uTear;
const vec3 HIP = vec3(0.0, 1.0, 0.0);
const float HS = 0.25;                      // head scale (crown at 1.6 + 0.25)
const vec3 LT = vec3(0.0, 1.27, 0.64);      // lectern top centre
const float LTILT = 0.12;                   // lectern top slope toward the reader
const vec3 PG = vec3(${PAGE.c.join(', ')});
const vec2 PGH = vec2(${PAGE.hw}, ${PAGE.hh});
// hidden arms: anchor, two joints, hand (world, the robot upright); the near arm (+x) holds the stamp
vec3 armPt(int side, int j) {
  float sx = side == 0 ? 1.0 : -1.0;
  float lift = side == 0 ? 0.2 * (1.0 - uStamp) : 0.05 * uTap;
  if (j == 0) return vec3(0.1 * sx, 1.15, -0.08);
  if (j == 1) return vec3(0.3 * sx, 1.24 + 0.05 * lift, -0.28);
  if (j == 2) return vec3(0.33 * sx, 1.1 + 0.6 * lift, -0.52);
  return side == 0 ? vec3(PG.x + 0.01, PG.y + 0.12 + lift, PG.z + 0.02) : vec3(-0.24, 1.03 + lift, -0.68);
}
int gPart = 0;
vec3 bodyQ(vec3 p) { vec3 q = p - HIP; q.yz = rot(uBow) * q.yz; return q + HIP; }
vec3 headQ(vec3 q) {
  vec3 h = (q - vec3(0.0, 1.6, 0.0)) / HS;
  h.xz = rot(-uHeadYaw) * h.xz;
  return h;
}
vec3 lectQ(vec3 p) { vec3 q = p - LT; q.yz = rot(-LTILT) * q.yz; return q; }
float sdTongue(vec3 h) {
  if (uTongue < 0.02) return 1e9;
  vec3 a = vec3(0.0, 0.25, 0.25), m = a + vec3(0.0, -0.08 * uTongue, 1.5 * uTongue);
  float d = sdCapsule(h, a, m, 0.06);
  vec3 hs = vec3(abs(h.x), h.yz);
  d = min(d, sdCapsule(hs, m, m + vec3(0.17, 0.04, 0.36) * uTongue, 0.04));
  return d;
}
float mapObj(vec3 p, out int id) {
  id = 1;
  float d = 1e9;
  // the robot (bounded)
  float bb = sdCapsule(p, vec3(0.0, 0.0, 0.0), vec3(0.0, 1.95, 0.3), 0.75);
  if (bb < 0.1) {
    vec3 q = bodyQ(p);
    vec3 qs = vec3(abs(q.x), q.yz);
    // glass torso
    float t = sdEllipsoid(q - vec3(0.0, 1.37, 0.0), vec3(0.19, 0.16, 0.115));
    t = smin(t, sdRoundCone(q, vec3(0.0, 1.02, 0.0), vec3(0.0, 1.3, 0.0), 0.08, 0.11), 0.06);
    t = smin(t, sdEllipsoid(q - vec3(0.0, 1.0, 0.0), vec3(0.15, 0.09, 0.1)), 0.05);
    if (t < d) { d = t; id = 2; }
    // chrome shoulders and the praying arms: hands pressed together at the chest
    float a = sdEllipsoid(qs - vec3(0.2, 1.47, 0.0), vec3(0.06, 0.04, 0.05));
    a = min(a, sdRoundCone(qs, vec3(0.22, 1.46, 0.0), vec3(0.2, 1.2, 0.08), 0.042, 0.034));
    a = min(a, sdRoundCone(qs, vec3(0.2, 1.2, 0.08), vec3(0.045, 1.36, 0.2), 0.032, 0.026));
    a = min(a, sdEllipsoid(qs - vec3(0.02, 1.43, 0.215), vec3(0.02, 0.075, 0.042)));
    // legs (not bowed)
    vec3 ps = vec3(abs(p.x), p.yz);
    a = min(a, sdRoundCone(ps, vec3(0.09, 0.97, 0.0), vec3(0.1, 0.52, 0.03), 0.07, 0.05));
    a = min(a, sdRoundCone(ps, vec3(0.1, 0.52, 0.03), vec3(0.1, 0.08, 0.0), 0.045, 0.035));
    a = min(a, sdRoundBox(ps - vec3(0.1, 0.03, 0.05), vec3(0.04, 0.025, 0.1), 0.02));
    if (a < d) { d = a; id = 1; }
    // the glass head
    vec3 h = headQ(q);
    float hd = sdHead(h, uJaw, uHeadTilt) * HS;
    if (hd < d) { d = hd; id = 3; }
    float tg = sdTongue(h) * HS;
    if (tg < d) { d = tg; id = 4; }
  } else d = bb;
  // hidden arms: black, three-jointed, red rings at the joints
  float ab = sdCapsule(p, vec3(0.0, 1.1, -0.4), vec3(0.0, 1.1, -0.4), 0.62);
  if (ab < 0.1) {
    for (int s = 0; s < 2; s++) {
      vec3 a0 = armPt(s, 0), a1 = armPt(s, 1), a2 = armPt(s, 2), a3 = armPt(s, 3);
      float g = sdRoundCone(p, a0, a1, 0.035, 0.03);
      g = min(g, sdRoundCone(p, a1, a2, 0.03, 0.026));
      g = min(g, sdRoundCone(p, a2, a3, 0.026, 0.022));
      if (g < d) { d = g; id = 9; }
      float j = min(length(p - a1) - 0.045, length(p - a2) - 0.04);
      j = min(j, length(p - a0) - 0.045);
      if (j < d) { d = j; id = 10; }
    }
    // the stamp in the near hand
    vec3 sp = armPt(0, 3) - vec3(0.0, 0.07, 0.0);
    float st = sdRoundBox(p - sp + vec3(0.0, 0.035, 0.0), vec3(0.075, 0.018, 0.05), 0.006);
    st = min(st, sdCapsule(p, sp, sp + vec3(0.0, 0.06, 0.0), 0.018));
    if (st < d) { d = st; id = 12; }
  } else d = min(d, ab);
  // the console: a black desk whose top is a screen, and a monitor facing back
  float cb = sdBox(p - vec3(0.0, 0.6, -0.82), vec3(0.62, 0.62, 0.42));
  if (cb < 0.1) {
    float c = sdRoundBox(p - vec3(0.0, 0.9, -0.72), vec3(0.5, 0.04, 0.22), 0.01);
    c = min(c, sdBox(p - vec3(0.0, 0.45, -0.75), vec3(0.42, 0.45, 0.16)));
    if (c < d) { d = c; id = 7; }
    vec3 mq = p - vec3(-0.12, 1.12, -0.52);
    mq.xz = rot(-0.45) * mq.xz;
    mq.yz = rot(0.18) * mq.yz;
    float mo = sdRoundBox(mq, vec3(0.28, 0.16, 0.012), 0.006);
    if (mo < d) { d = mo; id = 13; }
  } else d = min(d, cb);
  // the lectern: a slim black glass column and a sloped top, the book of light on it
  float lb = sdBox(p - vec3(0.0, 0.66, 0.66), vec3(0.4, 0.68, 0.32));
  if (lb < 0.1) {
    vec3 lq = lectQ(p);
    float l = sdRoundBox(lq, vec3(0.32, 0.022, 0.21), 0.006);
    l = min(l, sdBox(p - vec3(0.0, 0.62, 0.72), vec3(0.15, 0.62, 0.09)));
    l = min(l, sdRoundBox(p - vec3(0.0, 0.015, 0.72), vec3(0.3, 0.015, 0.22), 0.01));
    if (l < d) { d = l; id = 5; }
    vec3 bq = lq - vec3(0.0, 0.028, 0.0);
    float bk = sdRoundBox(vec3(abs(bq.x) - 0.142, bq.y - 0.11 * abs(bq.x), bq.z), vec3(0.138, 0.005, 0.19), 0.003);
    if (bk < d) { d = bk; id = 6; }
  } else d = min(d, lb);
  // the microphone on a gooseneck at its left
  vec3 mb = vec3(0.42, 0.0, 0.42), mt = vec3(0.42, 1.48, 0.42), mh = vec3(0.3, 1.66, 0.3);
  float mic = min(sdCapsule(p, mb, mt, 0.012), sdCapsule(p, mt, mh, 0.009));
  mic = min(mic, sdCapsule(p, mh, mh + normalize(mh - mt) * 0.07, 0.022));
  mic = min(mic, sdCyl(p - vec3(0.42, 0.01, 0.42), 0.14, 0.01));
  if (mic < d) { d = mic; id = 11; }
  return d;
}
// the book's page text: warm white with fine dark lines; a ripple runs out from the kiss
vec3 pageLight(vec2 f, vec2 hw, float ripple, float seed) {
  vec2 a = abs(f);
  if (a.x > hw.x || a.y > hw.y) return vec3(0.0);
  float edge = smoothstep(0.0, 0.012, hw.x - a.x) * smoothstep(0.0, 0.012, hw.y - a.y);
  float row = f.y / 0.0125;
  float ri = floor(row), rf = fract(row);
  float inT = step(a.x, hw.x - 0.022) * step(a.y, hw.y - 0.03);
  float glyph = step(0.25, hash12(vec2(floor(f.x * 140.0), ri + seed))) * step(0.12, fract(f.x * 140.0));
  float ln = smoothstep(0.3, 0.42, rf) * smoothstep(0.75, 0.62, rf) * glyph * inT * step(hash12(vec2(ri, seed)) * 0.4, (hw.x - a.x) / hw.x);
  vec3 c = vec3(1.55, 1.32, 0.95) * (1.0 - 0.75 * ln) * edge;
  float r = length(f - vec2(0.0, 0.02));
  float wave = exp(-pow((r - ripple * 0.45) / 0.02, 2.0)) * step(0.01, ripple) * (1.0 - ripple);
  return c * (1.0 + 2.5 * wave);
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 1) { Mat m = SILVER(); m.rough = 0.22; return m; }
  if (id == 2) {
    // smoked glass torso: clearcoat over faint cold rib lines
    vec3 q = bodyQ(p);
    Mat m = M(vec3(0.07, 0.075, 0.09), 0.12, 0.3); m.clear = 1.0;
    float rib = smoothstep(0.004, 0.0, abs(fract(q.y * 28.0) - 0.5) / 28.0 - 0.0) * step(1.12, q.y);
    m.emit = vec3(0.5, 0.6, 0.8) * rib * 0.5;
    return m;
  }
  if (id == 3) {
    vec3 q = bodyQ(p);
    vec3 h = headQ(q);
    Mat m = headMatT(h, n, 1.0, uJaw, uHeadTilt);
    // the back half of the skull is clear glass with a dark red stream of reasoning scrolling inside
    vec3 ht = headTilt(h, uHeadTilt);
    float back = smoothstep(0.02, -0.12, ht.z) * step(0.42, ht.y);
    if (back > 0.0) {
      vec3 v = normalize(uCamPos - p);
      vec3 vb = v; vb.yz = rot(uBow) * vb.yz; vb.xz = rot(-uHeadYaw) * vb.xz;
      vec3 ip = ht - vb * 0.22;                     // look a little way inside the glass
      float ang = atan(ip.x, -ip.z);
      float y = ip.y + uTime * 0.16;
      float row = y / 0.034, ri = floor(row), rf = fract(row);
      float gl = step(0.35, hash12(vec2(floor(ang * 26.0), ri))) * step(0.15, fract(ang * 26.0));
      float ln = smoothstep(0.25, 0.4, rf) * smoothstep(0.75, 0.6, rf) * gl * step(abs(ang), 1.25);
      float hot = step(0.93, hash12(vec2(ri, 7.0))) * (0.6 + 0.4 * sin(uTime * 9.0 + ri));
      float fr = pow(1.0 - abs(dot(n, v)), 3.0);
      m.alb = mix(m.alb, vec3(0.03, 0.01, 0.012), back);
      m.emit = mix(m.emit, vec3(1.25, 0.06, 0.08) * ln * (0.8 + 1.5 * hot) + vec3(0.28, 0.02, 0.03) * (0.4 + 0.6 * smoothstep(0.85, 0.5, ip.y)) + vec3(0.5, 0.55, 0.65) * fr * 0.4, back * uReveal);
    }
    return m;
  }
  if (id == 4) {
    vec3 h = headQ(bodyQ(p));
    Mat m = M(vec3(0.012, 0.01, 0.014), 0.25, 0.0); m.clear = 1.0;
    float tip = smoothstep(0.25 + 1.5 * uTongue - 0.1, 0.25 + 1.5 * uTongue + 0.06, h.z);
    m.emit = vec3(3.0, 0.2, 1.4) * tip;
    return m;
  }
  if (id == 5) { Mat m = LACQUER(vec3(0.012, 0.012, 0.016)); m.rough = 0.08; return m; }
  if (id == 6) {
    vec3 lq = lectQ(p);
    Mat m = M(vec3(0.6, 0.55, 0.5), 0.2, 0.0); m.clear = 1.0;
    vec2 f = vec2(abs(lq.x) - 0.142, lq.z);
    m.emit = pageLight(f, vec2(0.13, 0.18), uRipple, step(0.0, lq.x)) * (0.9 + 0.1 * sin(uTime * 3.0));
    m.emit += vec3(1.6, 1.2, 0.7) * smoothstep(0.012, 0.0, abs(lq.x)) * 0.6;   // the glowing spine
    return m;
  }
  if (id == 7) {
    Mat m = M(vec3(0.015, 0.015, 0.018), 0.15, 0.3); m.clear = 1.0;
    if (n.y > 0.7 && p.y > 0.93) {
      // the desk is a screen: red rows of hidden work, flashing; the page of light under the stamp
      vec2 f = p.xz - PG.xz;
      vec3 pg = pageLight(vec2(f.x, -f.y), PGH, 0.0, 3.0);
      float row = (p.z + 0.9) / 0.022, ri = floor(row);
      float bar = step(0.3, hash12(vec2(floor(p.x * 30.0), ri))) * smoothstep(0.2, 0.35, fract(row)) * smoothstep(0.8, 0.65, fract(row));
      float flash = 0.55 + 0.45 * step(0.5, fract(uTime * 3.1 + ri * 0.13));
      float inS = step(abs(p.x), 0.47) * step(abs(p.z + 0.72), 0.19) * (1.0 - step(abs(f.x), PGH.x + 0.01) * step(abs(f.y), PGH.y + 0.01));
      m.emit = vec3(1.4, 0.07, 0.1) * bar * flash * inS * 0.55 * uReveal;
      // flagged: the page burns magenta-red at its border and a band across it
      vec2 af = abs(f) - PGH;
      float bord = smoothstep(0.012, 0.0, abs(max(af.x, af.y)) - 0.004) * uFlag;
      float band = step(abs(f.y - 0.0), 0.035) * step(abs(f.x), PGH.x) * uFlag;
      m.emit += pg * (1.0 - 0.6 * uFlag) * uReveal + vec3(3.2, 0.15, 0.8) * (bord + band * 0.35);
    }
    return m;
  }
  if (id == 9) { Mat m = M(vec3(0.02, 0.02, 0.022), 0.45, 0.5); return m; }
  if (id == 10) {
    Mat m = M(vec3(0.03), 0.3, 0.6);
    float ring = smoothstep(0.012, 0.004, abs(n.y * 0.6 + n.x * 0.3 + n.z * 0.2));
    m.emit = vec3(2.6, 0.12, 0.12) * (0.25 + ring * 1.4) * (0.7 + 0.3 * sin(uTime * 6.0 + p.x * 20.0)) * uReveal;
    return m;
  }
  if (id == 11) { Mat m = M(vec3(0.03), 0.3, 0.9); return m; }
  if (id == 12) { Mat m = M(vec3(0.04, 0.035, 0.04), 0.3, 0.6); m.emit = vec3(1.5, 0.06, 0.4) * step(p.y, armPt(0, 3).y - 0.095) * 0.6 * uReveal; return m; }
  if (id == 13) {
    Mat m = M(vec3(0.01), 0.08, 0.0); m.clear = 1.0;
    vec3 mq = p - vec3(-0.12, 1.12, -0.52);
    mq.xz = rot(-0.45) * mq.xz; mq.yz = rot(0.18) * mq.yz;
    if (mq.z < 0.0 && abs(mq.x) < 0.26 && abs(mq.y) < 0.14) {
      float row = mq.y / 0.02, ri = floor(row);
      float bar = step(0.4, hash12(vec2(floor(mq.x * 40.0), ri + floor(uTime * 4.0)))) * smoothstep(0.2, 0.4, fract(row)) * smoothstep(0.8, 0.6, fract(row));
      float flash = step(0.45, fract(uTime * 2.3));
      m.emit = (vec3(1.6, 0.08, 0.1) * bar * 0.7 + vec3(0.5, 0.02, 0.04) * flash) * uReveal;
    }
    return m;
  }
  return M(vec3(0.05), 0.5, 0.0);
}
vec3 shade(vec2 fc) {
  // liar: macroblock slips (3 frames)
  float slip = 0.0;
  if (uTear > 0.5) {
    float bs = 40.0 * uRes.y / 1080.0;
    vec2 b = floor(fc / bs);
    float hh = hash12(b * vec2(0.13, 1.0) + floor(uTime * 60.0));
    if (hh > 0.62) { slip = 1.0; fc.x += (hash12(b + 3.1) - 0.5) * 6.0 * bs; fc.y += (hash12(b + 7.7) - 0.5) * 0.8 * bs; }
  }
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  vec3 col = studio(ro, rd, depth);
  // the audience's raised phones: a dark foreground band seen from the front (camera-relative rows,
  // parallax with the camera's drift); gone as the camera swings round
  if (uFront > 0.01) {
    vec2 sp = (2.0 * fc - uRes) / uRes.y;
    for (int ri = 0; ri < 3; ri++) {
      int r = 2 - ri;
      float fr = float(r);
      float sc = 1.0 - 0.25 * fr;                       // row 0 is nearest and biggest
      vec2 q = sp / sc * 1.0;
      q.x += uCamPos.x * (0.25 + 0.2 * fr) + 0.37 * fr;
      float cw = 0.34;
      float ci = floor(q.x / cw + 0.5);
      vec2 jt = hash22(vec2(ci, fr * 3.7 + 1.0));
      if (jt.y < 0.2) continue;
      vec2 c = vec2(ci * cw + (jt.x - 0.5) * 0.12, (-(0.84 - 0.1 * fr) + 0.05 * jt.y) / sc);
      vec2 l = rot(0.18 * (jt.y - 0.5)) * (q - c);
      float head = length((q - vec2(c.x + 0.08 * (jt.x - 0.5), c.y - 0.3)) / vec2(0.1, 0.12)) - 1.0;
      float arm = sdSeg(q, c - vec2(0.0, 0.04), vec2(c.x + 0.12, c.y - 0.5)) - 0.03;
      float sil = min(head, arm / 0.1);
      float k = uFront;
      if (sil < 0.0) col = mix(col, vec3(0.004, 0.004, 0.006) + vec3(0.03, 0.03, 0.05) * smoothstep(-0.12, 0.0, sil), k);
      vec2 bx = abs(l) - vec2(0.035, 0.064);
      float box = max(bx.x, bx.y);
      if (box < 0.006) {
        float scr = smoothstep(0.0, -0.005, box + 0.005);
        vec3 scc = vec3(0.16, 0.21, 0.36) * (0.5 + 0.5 * smoothstep(0.06, -0.06, l.y)) * (0.6 + 0.4 * fr) * (1.0 + 6.0 * uFlare);
        col = mix(col, mix(vec3(0.01), scc, scr), k);
      }
    }
  }
  // light ripple spill on the haze over the lectern when it kisses
  col += vec3(0.5, 0.4, 0.28) * uFlare * 0.04;
  if (slip > 0.5) col *= vec3(1.25, 0.55, 1.15);
  return col;
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('70, 44, 104', 1.1), uCycB: rgb('14, 10, 24', 1.0),
      uFloorCol: rgb('14, 14, 18', 1.0), uFloorRough: 0.06, uFloorGrain: 0.8,
      uGrime: 0.15, uHaze: 0.018, uHazeCol: [0.06, 0.045, 0.1],
      uKeyDir: [-0.25, 0.8, 0.55], uKeyCol: [3.4, 3.6, 4.2], uKeySize: 0.25,
      uRimA: [0.9, 0.15, 0.75], uRimB: [0.5, 0.75, 1.6],
      uP1: [0, 1.6, -1.0], uP1c: [0, 0, 0],
      uP2: [1.4, 2.3, -1.4], uP2c: [1.6, 1.7, 2.1],
      uFront: 1, uBow: 0, uHeadTilt: 0, uHeadYaw: 0, uJaw: 0, uTongue: 0, uRipple: 0, uFlare: 0, uReveal: 0,
      uStamp: 0, uFlag: 0, uTap: 0, uTear: 0,
    },
    camera: R.camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      // the bow: down on "kiss" (brow to the page), held, then back up before "But"
      const down = ease.inOut3((t - (R.tKiss - 0.32)) / 0.36), up = ease.inOut3((t - (R.tKiss + 0.5)) / 0.55);
      const bow = down * (1 - up);
      u.uBow.value = 0.97 * bow + 0.04 * Math.sin(t * 1.3) * (1 - bow);
      u.uHeadTilt.value = -0.38 * bow;
      // speaking: turns to the mic on "tongues", the forked tongue flicks out twice
      const turn = ease.inOut3((t - (R.tT - 0.28)) / 0.26);
      u.uHeadYaw.value = 0.95 * turn;
      const f1 = bump((t - R.tT + 0.02) / 0.42), f2 = bump((t - R.tCall + 0.05) / 0.3) * 0.75, f3 = bump((t - R.tLiar + 0.06) / 0.3) * 0.9;
      u.uTongue.value = Math.max(f1, f2, f3);
      u.uJaw.value = 0.22 * Math.max(f1, f2, f3, turn * 0.4 * (0.5 + 0.5 * Math.sin(t * 15)));
      u.uRipple.value = clamp01((t - R.tKiss) / 0.9);
      u.uFlare.value = Math.exp(-Math.max(0, t - R.tKiss) * 3.5) * (t >= R.tKiss ? 1 : 0);
      u.uReveal.value = ease.inOut3((t - R.tBut + 0.05) / 0.4);
      // the stamp: raised, then slammed onto the page on "call"; the page flags
      const tS = R.tCall + 0.02;
      const raise = ease.inOut3((t - (tS - 0.45)) / 0.3);
      u.uStamp.value = t < tS - 0.06 ? 1 - raise : t < tS ? 1 - raise + raise * ease.in2((t - (tS - 0.06)) / 0.06) : 1 - 0.08 * Math.exp(-(t - tS) * 9) * Math.cos((t - tS) * 40);
      u.uFlag.value = t >= tS ? 1 : 0;
      u.uTap.value = Math.max(0, Math.sin(t * 19)) ** 3;
      const tl = t - R.tLiar;
      u.uTear.value = tl >= 0 && tl < 3 / 60 ? 1 : 0;
      const ok = ease.inOut3((t - R.tBut) / 0.5);
      u.uFront.value = 1 - ease.inOut3((t - R.tBut) / 0.25);
      u.uP2.value = mix([0.2, 2.5, 1.9], [1.4, 2.3, -1.4], ok);
      u.uP2c.value = mix([2.6, 2.8, 3.4], [1.6, 1.7, 2.1], ok);
      u.uP1c.value = [1.2, 0.05, 0.08].map((c) => c * u.uReveal.value * (0.7 + 0.3 * Math.sin(t * 13)));
    },
    post(t) { return grade(t, { exposure: 1.05, vignette: 0.45, bloom: 0.1 }); },
  };
};
