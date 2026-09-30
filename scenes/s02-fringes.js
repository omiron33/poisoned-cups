// 02 · "Long fringes swing / But your hearts stay thin"
// Five bundles of fibre-optic cable hang from the dark like prayer fringes, chrome ferrules on black
// cables, swinging like pendulums in a travelling wave, every fibre lit at its tip, in a wet
// concrete hall under a cold fluorescent tube. On "hearts stay thin" the bundles fray apart into
// single strands and their lights go dark one by one.
import { keys, ease, grade, rgb, orbit, linesFrom, spring } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';

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
  return orbit(t, { target: [0, 1.12, 0], yaw: 0.22 - 0.018 * u, pitch: 0.04 + 0.004 * u, dist: 3.75 - 0.09 * u, fov: 34, drift: 0.006 });
};

export default (P) => {
  const t0 = P.from;
  const camera = fringesCamera(t0);
  const hearts = L2.words.find((w) => /hearts/i.test(w.w)), thin = L2.words.find((w) => /thin/i.test(w.w));
  return {
    name: 's02-fringes', from: P.from, to: P.to,
    frag: STUDIO_GLSL + /* glsl */ `
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
  vec3 cy = mix(vec3(0.35, 0.95, 1.0), vec3(0.75, 1.0, 0.45), hash11(k + seed));
  m.emit = cy * (tipK * 9.0 + 0.6 * smoothstep(-0.8, -1.45, q.y)) * lit;
  return m;
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('84, 104, 98', 1.0), uCycB: rgb('30, 40, 40', 1.0),
      uFloorCol: rgb('110, 116, 108', 1.0), uFloorRough: 0.1, uGrime: 0.8,
      uKeyDir: [0.25, 0.9, 0.3], uKeyCol: [3.4, 3.8, 3.9], uKeySize: 0.22,
      uRimA: [0.5, 1.9, 1.1], uRimB: [2.3, 1.0, 0.3],
      uP1: [0, 0.35, 0.6], uP1c: [0.2, 0.9, 1.0],
      uP2: [0, 1.95, -0.7], uP2c: [2.5, 2.8, 2.7],
      uHaze: 0.06, uHazeCol: [0.06, 0.1, 0.1],
      uFogFar: 22,
      uPh: 0, uThin: 0,
    },
    camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      u.uPh.value = t - t0;
      u.uThin.value = ease.inOut3((t - hearts.start) / Math.max(0.4, thin.end - hearts.start + 0.2));
      u.uP1c.value = [0.2, 0.9, 1.0].map((c) => c * (1 - 0.85 * u.uThin.value));
    },
    post(t) { return grade(t, { exposure: 1.05 }); },
  };
};
