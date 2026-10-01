// v4 data hall (docs/V4-DIRECTION.md 4.5): a copy of lib/x-a.js with the pixel faces retired. The
// LED wall (42) is now black glass with one big, dim contour-scan face (faceScan from x-v4-head.js:
// fine lines, no LED grid), and the two angled screens (43) show smaller live faceScan faces turned
// toward the cup. Same exports, uniforms and ids as x-a.js, so s00 / s01 / s16 / s26 only change the
// import:  import { HALL_GLSL, HALL_UNIFORMS } from '/song/lib/x-v4-hall.js';
// Include order is unchanged: STUDIO_GLSL + [CYBER_GLSL] + CUP_GLSL + HALL_GLSL. HALL_GLSL carries
// HEAD_GLSL itself (include-guarded, so a scene may also add HEAD_GLSL for a 3D head). The hall no
// longer needs CYBER_GLSL (keep it if the scene uses glitchTear).
//
//   float hallSDF(vec3 p, out int id)   racks (40) either side of a central LED face wall (42), with
//                                       vertical purple / green tubes (41) and two angled face
//                                       screens (43) looking at the cup. The cup stands at the origin.
//   Mat hallMat(int id, vec3 p, vec3 n)
//   Mat cupBlack(vec3 q, vec3 n)        black titanium, thin gold lip and band (q in the cup's frame)
//   float cupScan(vec3 q, float y0, float amt)  microscopic forensic scanlines crawling over the cup,
//                                       with a bright read head at height y0 (returns emission weight)
//   float poisonSwirl(vec2 xz); vec3 poisonEmit(vec2 xz, float glow)   the toxic liquid's glow
// Uniforms (HALL_UNIFORMS): uFaces 0..1 how lit the face screens are; uFreeze 0 live .. 1 caught
// (the scan faces freeze and turn magenta); uHallGlow scales tubes and rack LEDs.
import { rgb } from '/song/lib/look.js';
import { HEAD_GLSL } from '/song/lib/x-v4-head.js';

export const HALL_UNIFORMS = {
  uCycA: rgb('84, 56, 120', 1.2), uCycB: rgb('26, 18, 40', 1.0),
  uFloorCol: rgb('74, 72, 82', 0.9), uFloorRough: 0.1, uFloorGrain: 2.0, uGrime: 0.85,
  uHaze: 0.07, uHazeCol: rgb('80, 60, 120', 0.7),
  uKeyDir: [-0.25, 0.9, 0.3], uKeyCol: [3.6, 3.8, 4.1], uKeySize: 0.26,
  uRimA: [1.5, 0.45, 2.6], uRimB: [0.45, 2.2, 0.5],
  uFaces: 1, uFreeze: 0, uHallGlow: 1,
};

export const HALL_GLSL = HEAD_GLSL + /* glsl */ `
uniform float uFaces, uFreeze, uHallGlow;
const vec3 HPURPLE = vec3(0.55, 0.16, 1.0);
const vec3 HGREEN = vec3(0.3, 1.0, 0.12);
const vec3 HMAGENTA = vec3(1.0, 0.1, 0.45);
// the two face screens: centre, yaw (they turn toward the cup)
const vec3 SC1 = vec3(-2.3, 1.55, -1.7);
const vec3 SC2 = vec3(2.4, 1.35, -1.9);
vec3 screenLocal(vec3 p, vec3 c, float yaw) { vec3 q = p - c; q.xz = rot(yaw) * q.xz; return q; }
float hallSDF(vec3 p, out int id) {
  id = 40;
  // racks: a row either side of the centre, fronts facing +z
  float ax = abs(p.x);
  float i = clamp(floor((ax - 1.45) / 0.72), 0.0, 3.0);
  float d = sdBox(vec3(ax - (1.45 + 0.36 + i * 0.72), p.y - 1.1, p.z + 3.0), vec3(0.33, 1.1, 0.45)) - 0.008;
  // the LED face wall behind the cup
  float w = sdBox(p - vec3(0.0, 1.55, -4.2), vec3(1.25, 1.25, 0.05));
  if (w < d) { d = w; id = 42; }
  // vertical tubes: inner pair in front of the rack ends, outer pair at the far ends
  vec3 tp = vec3(ax, p.y, p.z + 2.45);
  float tube = min(sdCapsule(tp - vec3(1.2, 0.0, 0.0), vec3(0, 0.1, 0), vec3(0, 3.1, 0), 0.028),
                   sdCapsule(tp - vec3(4.55, 0.0, 0.0), vec3(0, 0.1, 0), vec3(0, 3.1, 0), 0.028));
  if (tube < d) { d = tube; id = 41; }
  // two face screens on thin poles, angled at the cup
  vec3 s1 = screenLocal(p, SC1, -0.75), s2 = screenLocal(p, SC2, 0.8);
  float sc = min(sdBox(s1, vec3(0.42, 0.52, 0.025)), sdBox(s2, vec3(0.42, 0.52, 0.025))) - 0.006;
  if (sc < d) { d = sc; id = 43; }
  float pole = min(sdCapsule(p, vec3(SC1.x, 0.0, SC1.z - 0.05), vec3(SC1.x, SC1.y - 0.5, SC1.z - 0.05), 0.02),
                   sdCapsule(p, vec3(SC2.x, 0.0, SC2.z - 0.05), vec3(SC2.x, SC2.y - 0.5, SC2.z - 0.05), 0.02));
  if (pole < d) { d = pole; id = 44; }
  return d;
}
// a face for the screens: a live contour-scan face watching the cup; caught faces freeze magenta
vec3 faceCol(vec2 uv, float yaw, float seed) {
  float live = 1.0 - uFreeze;
  float tt = mix(uTime, 0.0, uFreeze);
  float sway = live * (0.06 * sin(tt * 0.7 + seed) + 0.03 * sin(tt * 1.9 + seed * 2.0));
  float smile = live * (0.22 + 0.12 * sin(tt * 0.9 + seed));
  vec3 ink = mix(HGREEN, vec3(0.8, 0.9, 1.0), 0.45);
  return faceScan(uv, yaw + sway, 0.0, smile, live, ink);
}
float hallScan(float y, float density) { return 0.85 + 0.15 * sin(y * density); }
Mat hallMat(int id, vec3 p, vec3 n) {
  if (id == 41) {
    Mat m = M(vec3(0.9), 0.3, 0.0);
    float k = floor((abs(p.x) + 1.0) / 3.0) + step(0.0, p.x);   // alternate colours across the room
    vec3 c = mod(k, 2.0) < 0.5 ? HPURPLE : HGREEN;
    m.emit = c * 4.5 * uHallGlow;
    return m;
  }
  if (id == 42) {
    // the wall: black glass with one big, dim contour-scan face looking down the hall
    Mat m = M(vec3(0.012, 0.011, 0.016), 0.08, 0.0); m.clear = 1.0;
    if (n.z > 0.7) {
      vec2 uv = (p.xy - vec2(0.0, 1.55)) / 1.2;
      float live = 1.0 - uFreeze;
      float tt = mix(uTime, 0.0, uFreeze);
      vec3 ink = mix(HGREEN, vec3(0.75, 0.85, 1.0), 0.5);
      vec3 f = faceScan(uv * vec2(1.02, 1.0), live * 0.08 * sin(tt * 0.35), 0.0, live * 0.15, live, ink);
      vec3 glow = HPURPLE * 0.012 * (1.0 - 0.5 * length(uv));
      m.emit = (f * 0.75 + glow) * uFaces * uHallGlow;
    }
    return m;
  }
  if (id == 43) {
    Mat m = M(vec3(0.02), 0.08, 0.0); m.clear = 1.0;
    vec3 s1 = screenLocal(p, SC1, -0.75), s2 = screenLocal(p, SC2, 0.8);
    bool one = length(s1) < length(s2);
    vec3 s = one ? s1 : s2;
    if (s.z > 0.02) {
      vec2 uv = s.xy / vec2(0.42, 0.52) * vec2(1.0, 1.08);
      // each face turns toward the cup (screen 1 is left of it, screen 2 right)
      vec3 fc = faceCol(uv * 1.12, one ? 0.35 : -0.35, one ? 11.0 : 23.0);
      m.emit = (fc * 1.6 + vec3(0.006, 0.008, 0.012)) * hallScan(s.y, 900.0) * uFaces * uHallGlow;
    }
    return m;
  }
  if (id == 44) return M(vec3(0.3, 0.31, 0.33), 0.35, 1.0);
  // racks: black anodised doors, perforated, with columns of status LEDs (green, cold white, rare magenta)
  Mat m = M(vec3(0.13, 0.13, 0.15), 0.35, 0.7);
  if (n.z > 0.7) {
    float lx = fract((abs(p.x) - 1.45) / 0.72) * 0.72;
    vec2 g = vec2(lx * 110.0, p.y * 110.0);
    m.alb *= 1.0 - 0.7 * smoothstep(0.3, 0.2, length(fract(g) - 0.5)) * step(0.14, lx) * step(lx, 0.58);
    vec2 lg = vec2(lx * 60.0, p.y / 0.0445);
    vec2 cid = floor(lg), f = fract(lg) - 0.5;
    float h = hash12(cid + floor((abs(p.x) - 1.45) / 0.72) * 17.0 + step(0.0, p.x) * 5.0);
    float inCol = (step(2.0, cid.x) * step(cid.x, 3.0)) * step(0.2, p.y) * step(p.y, 2.1);
    float blink = step(0.3, fract(h * 13.0 + uTime * (0.4 + 1.8 * h)));
    float led = smoothstep(0.32, 0.15, max(abs(f.x) * 0.8, abs(f.y) * 1.8)) * inCol * step(0.55, h) * blink;
    vec3 lc = h > 0.96 ? HMAGENTA * 3.0 : (h > 0.8 ? vec3(2.2, 2.4, 2.6) : HGREEN * 3.0);
    m.emit = lc * led * uHallGlow;
  }
  return dirty(m, p, 0.35);
}
// black titanium: near-black brushed metal that shows the hall in its reflections, gold at the lip,
// the engraved band and the knop (the one trace of the gold kept from v1)
Mat cupBlack(vec3 q, vec3 n) {
  vec2 r = revo(q);
  float a = atan(q.z, q.x);
  float lip = smoothstep(CUP_RIM_Y - 0.022, CUP_RIM_Y - 0.018, r.y);
  float band = smoothstep(0.004, 0.0, abs(abs(r.y - 0.86) - 0.05)) * step(0.25, r.x);
  if (lip + band > 0.5) { Mat g = GOLD(); g.rough = 0.12; return g; }
  Mat m = M(vec3(0.2, 0.2, 0.22), 0.2, 1.0);
  float br = vnoise(vec2(r.y * 900.0, a * 2.0)) * 0.6 + vnoise(vec2(r.y * 2400.0, 0.5)) * 0.4;
  m.rough = 0.12 + 0.12 * br;
  m.alb *= 0.85 + 0.2 * br;
  return m;
}
// the forensic scan: hair-fine scanlines crawling up the metal, and one bright read head at y0
float cupScan(vec3 q, float y0, float amt) {
  float lines = smoothstep(0.35, 0.0, abs(fract(q.y * 260.0 - uTime * 1.5) - 0.5) - 0.3);
  float win = exp(-pow((q.y - y0) / 0.12, 2.0));
  float head = smoothstep(0.006, 0.0, abs(q.y - y0));
  return amt * (lines * (0.05 + 0.5 * win) + head * 3.0);
}
float poisonSwirl(vec2 xz) {
  float r = length(xz), a = atan(xz.y, xz.x) + uTime * 0.35 + r * 5.0;
  return fbm(vec2(cos(a), sin(a)) * r * 9.0 + vec2(uTime * 0.1, 0.0), 3);
}
vec3 poisonEmit(vec2 xz, float glow) {
  float s = poisonSwirl(xz);
  float vein = smoothstep(0.5, 0.64, s);
  return HGREEN * (0.04 + 1.0 * vein) * glow;
}
`;
