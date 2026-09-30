// 02 · "Long fringes swing / But your hearts stay thin"   (v2)
// A corporate-lit service passage. Five bundles of fibre-optic cable hang like prayer fringes,
// chrome ferrules on black cables, swinging in a travelling wave, every fibre lit green-white at its
// tip; between them braided ID lanyards hang with blank credential badges. Behind, broken LED
// signage on the concrete wall glows empty in magenta and violet, static and failing rows, a
// green slogan strip scrolling above. On "hearts stay thin" the bundles fray into single strands and their tips fail one by one,
// and the signs stutter.
import { keys, ease, grade, rgb, orbit, linesFrom, spring } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { CYBER_GLSL } from '/song/lib/x-cyber.js';
import { XC_GLSL } from '/song/lib/x-c.js';

const [, L2] = linesFrom('Long fringes swing', 'But your hearts stay thin');
export const PIVOT_Y = 2.25, TX = (i) => -1.0 + 0.5 * i;
// the swing angle of tassel i at scene-relative time u (the shader uses the same formula)
export const swingAngle = (i, u) => 0.13 * Math.sin(2.75 * u + 0.62 * i + 0.4) * (1 - 0.25 * Math.min(1, u / 6));
export const tipOf = (i, u) => {
  const a = swingAngle(i, u), L = 1.5;
  return [TX(i) + Math.sin(a) * L, PIVOT_Y - Math.cos(a) * L, 0];
};
export const fringesCamera = (t0) => (t) => {
  const u = t - t0;
  const push = spring(t, L2.words[0].start - 0.05, 0.6, 0.2);
  return orbit(t, { target: [0, 1.12 - 0.08 * push, 0], yaw: 0.22 - 0.018 * u - 0.05 * push, pitch: 0.04 + 0.004 * u, dist: 3.75 - 0.09 * u - 0.45 * push, fov: 34, drift: 0.006 });
};

export default (P) => {
  const t0 = P.from;
  const camera = fringesCamera(t0);
  const hearts = L2.words.find((w) => /hearts/i.test(w.w)), thin = L2.words.find((w) => /thin/i.test(w.w));
  return {
    name: 's02-fringes', from: P.from, to: P.to,
    frag: STUDIO_GLSL + CYBER_GLSL + XC_GLSL + /* glsl */ `
uniform float uPh, uThin;
const float PY = ${PIVOT_Y.toFixed(3)};
float swingA(float i) { return 0.13 * sin(2.75 * uPh + 0.62 * i + 0.4) * (1.0 - 0.25 * min(1.0, uPh / 6.0)); }
// one tassel in its own frame: pivot at origin, hanging down -y
float tassel(vec3 q, float seed, out int id) {
  id = 1;
  // gold cord and knob
  float d = sdCapsule(q, vec3(0), vec3(0, -0.62, 0), 0.007);
  float fer = sdCyl(q - vec3(0, -0.69, 0), 0.04, 0.06) - 0.004;
  fer = max(fer, -sdTorus(q - vec3(0, -0.69, 0), vec2(0.044, 0.006)));
  float cone = sdRoundCone(q, vec3(0, -0.6, 0), vec3(0, -0.63, 0), 0.012, 0.03);
  if (fer < d) { d = fer; id = 3; }
  d = min(d, cone);
  // the skirt of silk threads: angular repetition round the axis, flaring toward the tips
  float y0 = -0.75, y1 = -1.5;
  float s = clamp((y0 - q.y) / (y0 - y1), 0.0, 1.0);
  float thin = uThin;
  float N = 30.0;
  float r = mix(0.034, 0.075, pow(s, 0.8)) * mix(1.0, 1.35, thin);
  float a = atan(q.z, q.x);
  float seg = 6.2831853 / N;
  float k = floor(a / seg + 0.5);
  float ak = k * seg;
  // thinning: most threads fall away, a few single strands remain
  float tr = mix(0.0066, 0.0026, thin);
  float yEnd = y1 - 0.035 * hash11(k * 3.7 + seed * 2.0);
  // fraying: each fibre splays outward toward its tip by its own amount
  float spl = thin * s * s * (0.05 + 0.16 * hash11(k * 5.1 + seed));
  vec2 c = (r + spl) * vec2(cos(ak), sin(ak));
  float dt = length(q.xz - c) - tr;
  float dy = max(q.y - y0, yEnd - q.y);
  float th = max(dt, dy);
  // the full body inside the threads (gone when thin)
  float core = max(length(q.xz) - (r - 0.004) * (1.0 - thin), dy);
  float sk = min(th, core + thin * 0.2);
  if (sk < d) { d = sk; id = 2; }
  return d;
}
float mapObj(vec3 p, out int id) {
  id = 1;
  float d = 1e9;
  // the fluorescent tube overhead, behind the fringes
  float tube = sdCapsule(p, vec3(-2.2, 2.02, -0.9), vec3(2.2, 2.02, -0.9), 0.03);
  float tubeBox = sdRoundBox(p - vec3(0, 2.08, -0.9), vec3(2.3, 0.03, 0.06), 0.01);
  if (tube < d) { d = tube; id = 4; }
  if (tubeBox < d) { d = tubeBox; id = 5; }
  // the passage wall behind, with its LED signs
  float wall = p.z + 1.95;
  if (wall < d) { d = wall; id = 8; }
  // braided lanyards between the bundles, hanging from above, each with a credential badge
  if (abs(p.x) < 1.0 && p.y > 0.7 && abs(p.z + 0.35) < 0.2) {
    float fi = clamp(floor((p.x + 0.75) / 0.5 + 0.5), 0.0, 3.0);
    vec3 q = p - vec3(-0.75 + 0.5 * fi, 3.4, -0.35);
    float an = 0.6 * swingA(fi + 0.5);
    float c = cos(an), s = sin(an);
    q.xy = mat2(c, s, -s, c) * q.xy;
    float rib = sdBox(q - vec3(0, -1.2, 0), vec3(0.011, 1.2, 0.0025));
    float clip = sdRoundBox(q - vec3(0, -2.42, 0), vec3(0.018, 0.025, 0.006), 0.004);
    float badge = sdRoundBox(q - vec3(0, -2.56, 0), vec3(0.07, 0.1, 0.0035), 0.008);
    if (rib < d) { d = rib; id = 6; }
    if (clip < d) { d = clip; id = 3; }
    if (badge < d) { d = badge; id = 7; }
  }
  if (abs(p.x) > 1.5 || p.y < 0.55 || abs(p.z) > 0.45) return min(d, max(abs(p.x) - 1.4, max(0.6 - p.y, abs(p.z) - 0.35)) + 0.05);
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    vec3 q = p - vec3(-1.0 + 0.5 * fi, PY, 0);
    if (abs(q.x) > 0.45) continue;
    float an = swingA(fi);
    float c = cos(an), s = sin(an);
    q.xy = mat2(c, s, -s, c) * q.xy;
    float bnd = sdCapsule(q, vec3(0, -0.2, 0), vec3(0, -1.5, 0), 0.3);
    if (bnd > 0.05) { d = min(d, bnd); continue; }
    int tid;
    float dd = tassel(q, fi * 13.1 + 5.3, tid);
    if (dd < d) { d = dd; id = tid; }
  }
  return d;
}
// the tassel frame of a world point (for the material): index, local point
vec3 localOf(vec3 p, out float fi) {
  fi = clamp(floor((p.x + 1.0) / 0.5 + 0.5), 0.0, 4.0);
  vec3 q = p - vec3(-1.0 + 0.5 * fi, PY, 0);
  float an = swingA(fi); float c = cos(an), s = sin(an);
  q.xy = mat2(c, s, -s, c) * q.xy;
  return q;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 4) { Mat m = M(vec3(0.9), 0.3, 0.0); m.emit = vec3(5.5, 6.2, 6.0) * (0.96 + 0.04 * sin(uTime * 377.0)); return m; }
  if (id == 5) { Mat m = M(vec3(0.5, 0.52, 0.5), 0.4, 0.8); return dirty(m, p * 4.0, 0.8); }
  if (id == 1) { Mat m = M(vec3(0.02, 0.022, 0.024), 0.3, 0.0); m.clear = 0.6; return m; }
  if (id == 6) {
    // braided lanyard: a woven diagonal in deep purple and black
    float br = step(0.5, fract((p.y + p.x * 3.0) * 60.0)) * step(0.5, fract((p.y - p.x * 3.0) * 60.0 + 0.25));
    Mat m = SILK(mix(vec3(0.05, 0.012, 0.09), vec3(0.16, 0.03, 0.26), br)); return m;
  }
  if (id == 7) {
    // a blank credential: white polycarbonate, a green chip, a dead photo square
    float fi = clamp(floor((p.x + 0.75) / 0.5 + 0.5), 0.0, 3.0);
    vec2 b = vec2(p.x - (-0.75 + 0.5 * fi), p.y - 0.84);
    Mat m = LACQUER(vec3(0.8, 0.82, 0.84)); m.rough = 0.12;
    if (abs(b.x + 0.025) < 0.022 && abs(b.y - 0.03) < 0.028) m.alb = vec3(0.02);
    if (abs(b.x - 0.035) < 0.012 && abs(b.y - 0.03) < 0.009) { m = M(vec3(0.6, 0.55, 0.3), 0.3, 1.0); }
    if (abs(b.y + 0.05) < 0.006 && abs(b.x) < 0.05) { m.emit = vec3(0.3, 1.2, 0.15) * (1.0 - uThin); }
    return m;
  }
  if (id == 8) {
    // concrete wall; two LED signs of smiling ad-faces, low-res, rows failing
    Mat m = dirty(M(vec3(0.16, 0.15, 0.17), 0.8, 0.0), p * 1.3, 0.9);
    for (int k = 0; k < 3; k++) {
      vec2 sc = k == 0 ? vec2(-1.55, 1.55) : (k == 1 ? vec2(1.35, 1.75) : vec2(0.05, 2.35));
      vec2 hs = k == 2 ? vec2(0.55, 0.22) : vec2(0.5, 0.62);
      vec2 uv = (p.xy - sc) / hs;
      if (abs(uv.x) > 1.0 || abs(uv.y) > 1.0) continue;
      vec2 cen;
      float led = ledMask(uv * vec2(hs.x / hs.y, 1.0), 26.0, cen);
      cen.x /= hs.x / hs.y;
      // the big signs are empty: a lit border, a dead field of static, a cracked quadrant dark
      vec2 ac = abs(cen);
      float face = step(0.9, max(ac.x, ac.y)) * 0.9 + 0.22 * hash12(floor(cen * 26.0) + floor(uTime * 12.0)) * step(max(ac.x, ac.y), 0.9);
      if (k == 0 && cen.x > 0.1 && cen.y < -0.2) face *= 0.0;
      if (k == 1 && cen.y > 0.35) face *= 0.1;
      // the strip sign: a slogan bar of blocks scrolling
      if (k == 2) face = step(0.45, hash12(floor(vec2(cen.x * 13.0 + floor(uTime * 3.0), cen.y * 3.0)))) * step(abs(cen.y), 0.55);
      float rows = deadRows(uv.y * 0.5 + 0.5, 26.0, 7.0 + 9.0 * uThin, 0.12 + 0.45 * uThin);
      vec3 tint = k == 1 ? vec3(0.55, 0.15, 1.3) : vec3(1.5, 0.18, 0.7);
      if (k == 2) tint = vec3(0.35, 1.2, 0.25);
      float glow = 0.08 + face;
      m = M(vec3(0.02), 0.3, 0.0); m.clear = 0.8;
      m.emit = tint * glow * led * rows * scanlines(uv.y, 90.0) * 1.6;
    }
    return m;
  }
  if (id == 3) { Mat m = CHROME(); m.rough = 0.12 + 0.12 * vnoise(vec2(atan(p.z, p.x) * 3.0, p.y * 300.0)); return dirty(m, p * 3.0, 0.35); }
  float fi; vec3 q = localOf(p, fi);
  float a = atan(q.z, q.x);
  float k = floor(a / (6.2831853 / 30.0) + 0.5);
  float seed = fi * 13.1 + 5.3;
  // black jacketed fibre; light leaks a little along its length and blazes at the cut tip
  Mat m = M(vec3(0.03, 0.035, 0.04), 0.25, 0.0); m.clear = 0.8;
  float yEnd = -1.5 - 0.035 * hash11(k * 3.7 + seed * 2.0);
  float tipK = smoothstep(yEnd + 0.045, yEnd + 0.004, q.y);
  // fibres go dark one by one as the bundle frays
  float order = hash11(k * 9.7 + seed * 1.3);
  float lit = 1.0 - smoothstep(order - 0.08, order, uThin * 1.08);
  vec3 cy = mix(vec3(0.85, 1.0, 0.9), vec3(0.4, 1.0, 0.2), hash11(k + seed));
  m.emit = cy * (tipK * 9.0 + 0.18 * smoothstep(-0.9, -1.45, q.y)) * lit;
  return m;
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('70, 56, 90', 1.0), uCycB: rgb('20, 16, 30', 1.0),
      uFloorCol: rgb('92, 90, 100', 1.0), uFloorRough: 0.1, uGrime: 0.85,
      uKeyDir: [0.25, 0.9, 0.3], uKeyCol: [3.4, 3.7, 3.9], uKeySize: 0.22,
      uRimA: [0.6, 1.9, 0.6], uRimB: [1.6, 0.4, 1.9],
      uP1: [0, 0.35, 0.6], uP1c: [0.3, 1.0, 0.25],
      uP2: [0, 1.95, -0.7], uP2c: [2.5, 2.8, 2.7],
      uHaze: 0.06, uHazeCol: [0.07, 0.06, 0.1],
      uFogFar: 22,
      uPh: 0, uThin: 0,
    },
    camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      u.uPh.value = t - t0;
      u.uThin.value = ease.inOut3((t - hearts.start) / Math.max(0.4, thin.end - hearts.start + 0.2));
      u.uP1c.value = [0.3, 1.0, 0.25].map((c) => c * (1 - 0.85 * u.uThin.value));
    },
    post(t) { return grade(t, { exposure: 1.05 }); },
  };
};
