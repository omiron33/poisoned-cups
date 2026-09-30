// 03 · "White stone walls / Over rotting bones"
// A seamless white server monolith stands in a wet concrete hall under a fluorescent tube,
// spotless, humming, a single status seam breathing along its brow. A hairline crack in its face
// leaks acid-green light. The camera pushes to the crack and, on the beat before "Over", plunges
// through it: inside are rusted racks, cables arched overhead like ribs, grime, and a bone-white
// fan hub turning at the back like something dead that will not stop.
import { keys, ease, grade, rgb, linesFrom } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';

const [L1, L2] = linesFrom('White stone walls', 'Over rotting bones');
const tri = (x) => Math.abs(x - Math.floor(x) - 0.5) * 4 - 1;
export const crackX = (y) => 0.1 + 0.035 * tri(y * 2.3) + 0.014 * tri(y * 6.1 + 0.3);
const CY = 1.2;
export const tombCamera = (t0) => {
  const tc = L2.words[0].start - 0.45;          // the plunge lands just before "Over"
  const cx = crackX(CY);
  return (t) => {
    const u = t - t0;
    const e = ease.inOut3, o = ease.out3;
    const pos = keys(t, [[t0, [-2.2, 0.8, 5.6]], [t0 + 1.4, [-1.7, 0.95, 4.6], (x) => x], [tc - 0.25, [cx - 0.05, 1.23, 1.55], e], [tc + 0.3, [cx, CY, 0.45], (x) => ease.inOut5(x)], [tc + 3.5, [cx - 0.1, 1.15, 0.2], o]]);
    const tg = keys(t, [[t0, [0.1, 1.3, 0]], [t0 + 1.4, [0.1, 1.28, 0], (x) => x], [tc - 0.25, [cx, 1.2, -1.0], e], [tc + 3.5, [0.0, 1.35, -0.7], o]]);
    const fov = keys(t, [[t0, 36], [tc - 0.25, 30, e], [tc + 0.4, 58, o]]);
    const d = 0.006 * (Math.sin(t * 0.9) + 0.5 * Math.sin(t * 2.1));
    return { pos: [pos[0] + d, pos[1] + d * 0.5, pos[2]], target: tg, fov, roll: d * 0.3 - 0.01 * Math.sin(u * 0.4) };
  };
};

export default (P) => {
  const t0 = P.from;
  const camera = tombCamera(t0);
  const tIn = L2.words[0].start - 0.45;
  return {
    name: 's03-tomb', from: P.from, to: P.to,
    frag: STUDIO_GLSL + /* glsl */ `
uniform float uHum, uFan, uIn, uOpen;
const vec3 MC = vec3(0.0, 1.3, 0.0);
const vec3 MO = vec3(0.7, 1.3, 0.8);     // outer half size
const vec3 MI = vec3(0.64, 1.24, 0.74);  // inner half size
float tri(float x) { return abs(fract(x) - 0.5) * 4.0 - 1.0; }
float crackX(float y) { return 0.1 + 0.035 * tri(y * 2.3) + 0.014 * tri(y * 6.1 + 0.3); }
// the seam splits open: a hairline everywhere, a jagged gap round the camera's height as it opens
float crackW(float y) { return 0.0025 + uOpen * (0.07 * smoothstep(0.3, 1.05, y) * smoothstep(2.4, 1.4, y) * (0.75 + 0.25 * tri(y * 13.0))); }
float mapObj(vec3 p, out int id) {
  id = 1;
  vec3 q = p - MC;
  float outer = sdRoundBox(q, MO, 0.035);
  if (outer > 0.25) return outer;
  float inner = sdBox(q, MI);
  float slot = (abs(p.x - crackX(p.y)) - crackW(p.y)) * 0.7;
  slot = max(slot, -(p.z - 0.55));
  float shell = max(max(outer, -inner), -slot);
  float d = shell;
  if (inner < 0.02) {
    // rusted racks on both sides
    vec3 r = vec3(abs(q.x) - 0.47, q.y + 0.1, q.z + 0.05);
    float rack = sdBox(r, vec3(0.15, 1.02, 0.55));
    if (rack < d) { d = rack; id = 3; }
    // cables arched overhead like ribs, one every 0.2 m along the depth
    float zk = clamp(floor(q.z / 0.2 + 0.5), -3.0, 2.0) * 0.2;
    vec3 c = q - vec3(0, 0.25, zk);
    float a = atan(c.y, c.x);
    float rr = 0.52 + 0.035 * sin(a * 5.0 + zk * 23.0);
    float rib = length(vec2(length(c.xy) - rr, c.z + 0.025 * sin(a * 7.0 + zk * 11.0))) - 0.016;
    rib = max(rib, -c.y - 0.55);
    if (rib < d) { d = rib; id = 4; }
    // the fan at the back wall: a bone-white hub and five blades turning
    vec3 f = q - vec3(0, 0.05, -0.7);
    float ring = sdTorus(f.xzy, vec2(0.3, 0.02));
    float hub = sdCyl(f.xzy, 0.08, 0.035) - 0.01;
    float fa = atan(f.y, f.x) + uFan;
    float seg = 6.2831853 / 5.0;
    float fk = floor(fa / seg + 0.5) * seg;
    float fr = length(f.xy);
    vec2 bl = vec2(fr, (fa - fk) * fr);
    float blade = sdBox(vec3(bl.x - 0.19, bl.y, f.z + (bl.y) * 0.4), vec3(0.1, 0.045, 0.006)) - 0.004;
    float fan = min(min(ring, hub), blade);
    if (fan < d) { d = fan; id = 5; }
  }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  vec3 q = p - MC;
  if (id == 1) {
    float inside = step(sdBox(q, MI), 0.006);
    // outside: seamless white lacquer, a breathing status seam along the brow
    Mat m = LACQUER(vec3(0.86, 0.87, 0.86));
    m.rough = 0.12 + 0.05 * vnoise(p * 30.0);
    // the crack's walls glow acid green from inside
    float cr = abs(p.x - crackX(p.y)) - crackW(p.y);
    if (cr > -0.01 && cr < 0.006 && q.z > 0.6) { m = M(vec3(0.2), 0.6, 0.0); m.emit = vec3(0.35, 1.0, 0.25) * (1.8 + 1.2 * uHum) * smoothstep(0.006, 0.0, cr); }
    if (inside > 0.5) { m = M(vec3(0.34, 0.2, 0.12), 0.7, 0.4); m = dirty(m, p * 2.0, 1.0); }
    return m;
  }
  if (id == 3) {
    // rack faces: rows of slots, rust blooms, a few green status LEDs still lit
    float row = fract(p.y / 0.09);
    Mat m = M(mix(vec3(0.42, 0.24, 0.12), vec3(0.08, 0.07, 0.06), smoothstep(0.75, 0.8, row)), 0.55, 0.6);
    float rust = smoothstep(0.45, 0.75, fbm(p * 9.0, 4));
    m.alb = mix(m.alb, vec3(0.36, 0.13, 0.04), rust); m.metal *= 1.0 - rust; m.rough = mix(m.rough, 0.9, rust);
    vec2 cell = floor(vec2(p.z / 0.06, p.y / 0.09));
    float led = step(0.82, hash12(cell)) * smoothstep(0.012, 0.004, length(vec2(fract(p.z / 0.06) - 0.5, row - 0.4) * vec2(0.06, 0.09)));
    m.emit = vec3(0.3, 1.0, 0.3) * led * 6.0;
    return dirty(m, p * 3.0, 0.8);
  }
  if (id == 4) { Mat m = M(vec3(0.03, 0.03, 0.028), 0.4, 0.0); m.clear = 0.5; return dirty(m, p * 5.0, 0.6); }
  Mat m = M(vec3(0.9, 0.87, 0.8), 0.45, 0.0);
  return dirty(m, p * 4.0, 0.55);
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('70, 84, 82', 1.0), uCycB: rgb('22, 28, 30', 1.0),
      uFloorCol: rgb('96, 100, 94', 1.0), uFloorRough: 0.1, uGrime: 0.9,
      uKeyDir: [-0.3, 0.88, 0.45], uKeyCol: [3.6, 3.9, 4.0], uKeySize: 0.25,
      uRimA: [0.5, 1.8, 0.9], uRimB: [2.4, 1.1, 0.35],
      uP1: [0.45, 0.6, -0.2], uP1c: [0, 0, 0],
      uP2: [-0.2, 1.9, 0.1], uP2c: [0, 0, 0],
      uHaze: 0.05, uHazeCol: [0.05, 0.08, 0.08],
      uFogFar: 24,
      uHum: 0, uFan: 0, uIn: 0, uOpen: 0,
    },
    camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      const k = ease.inOut3((t - (tIn - 0.2)) / 0.6);
      u.uIn.value = k;
      u.uOpen.value = ease.out3((t - L1.words[2].start) / 0.9);
      u.uHum.value = 0.5 + 0.5 * Math.sin((t - t0) * 9.4);
      u.uFan.value = (t - t0) * 1.1;
      u.uP1c.value = [0.25, 0.9, 0.22].map((c) => c * (0.15 + 0.85 * k));
      u.uP2c.value = [2.2, 1.6, 1.0].map((c) => c * (0.1 + 0.9 * k));
      u.uExpo.value = 1.0 + 0.6 * k;
    },
    post(t) { return grade(t, { exposure: 1.05 }); },
  };
};
