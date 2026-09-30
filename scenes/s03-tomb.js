// 03 · "White stone walls / Over rotting bones"   (v2)
// A seamless white server monolith stands spotless in a clean, cold-lit corridor, one status seam
// breathing along its brow. A hairline crack in its face opens and leaks acid-green light; on the
// beat before "Over" the camera drives through it into the corrupted cavity inside: black server
// blades stacked like ribs down both walls with failing status lights, fibre trunks arching
// overhead with green pulses running along them, a cable tray, violet coolant lines, and a green
// decay blooming and pulsing over everything.
import { keys, ease, grade, rgb, linesFrom } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { CYBER_GLSL } from '/song/lib/x-cyber.js';
import { XC_GLSL } from '/song/lib/x-c.js';

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
    frag: STUDIO_GLSL + CYBER_GLSL + XC_GLSL + /* glsl */ `
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
    // black server blades stacked down both walls, pulled out by different amounts
    vec3 r = vec3(abs(q.x) - 0.5, q.y, q.z + 0.05);
    float yk = clamp(floor(r.y / 0.075 + 0.5), -15.0, 15.0);
    float pull = 0.06 * hash11(yk * 3.1 + sign(q.x));
    vec3 rb = vec3(r.x, r.y - yk * 0.075, r.z - pull);
    float blade = sdBox(rb, vec3(0.13, 0.026, 0.6));
    blade = max(blade, abs(q.y) - 1.15);
    if (blade < d) { d = blade; id = 3; }
    // fibre trunks arched overhead, one every 0.24 m along the depth
    float zk = clamp(floor(q.z / 0.24 + 0.5), -3.0, -1.0) * 0.24;
    vec3 c = q - vec3(0, 0.3, zk);
    float a = atan(c.y, c.x);
    float rr = 0.5 + 0.03 * sin(a * 5.0 + zk * 23.0);
    float rib = length(vec2(length(c.xy) - rr, c.z + 0.02 * sin(a * 7.0 + zk * 11.0))) - 0.028;
    rib = max(rib, -c.y + 0.05);
    if (rib < d) { d = rib; id = 4; }
    // a cable tray under the roof, and two coolant lines along the floor of the cavity
    vec3 tq = q - vec3(0, 1.08, 0);
    float tray = max(sdBox(tq, vec3(0.2, 0.05, 0.74)), -sdBox(tq - vec3(0, 0.03, 0), vec3(0.18, 0.05, 0.75)));
    if (tray < d) { d = tray; id = 5; }
    // fibre trunks hanging down the back of the cavity, swaying a little, sagging together
    for (int k = 0; k < 3; k++) {
      float fk = float(k);
      float tx = -0.14 + 0.14 * fk + 0.03 * sin(q.y * 2.3 + fk * 2.0 + uTime * 0.6);
      float tr = length(vec2(q.x - tx, q.z + 0.55 + 0.05 * fk)) - (0.03 + 0.012 * fk);
      if (tr < d) { d = tr; id = 7; }
    }
    float pipe = length(vec2(abs(q.x) - 0.2, q.y + 1.05)) - 0.035;
    if (pipe < d) { d = pipe; id = 6; }
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
    if (inside > 0.5) { m = M(vec3(0.04, 0.04, 0.045), 0.7, 0.2); m = dirty(m, p * 2.0, 1.0); m.emit = vec3(0.25, 1.1, 0.12) * decay(p, uTime) * uIn; }
    return m;
  }
  if (id == 3) {
    // black blades: satin black steel, a column of status lights at the front edge, most failing
    Mat m = M(vec3(0.03, 0.03, 0.035), 0.35, 0.7);
    float yk = floor((p.y - MC.y) / 0.075 + 0.5);
    float edge = smoothstep(0.012, 0.0, abs(q.x) - 0.37);   // the faces toward the aisle
    vec2 cell = vec2(floor((p.z + 0.8) / 0.045), yk);
    float h = hash12(cell + sign(q.x) * 9.0);
    vec2 lf = vec2(fract((p.z + 0.8) / 0.045) - 0.5, (p.y - MC.y) / 0.075 - yk);
    float led = smoothstep(0.22, 0.1, length(lf * vec2(1.0, 2.2))) * edge * step(0.72, h);
    float blink = step(0.5, fract(h * 17.0 + uTime * (0.5 + 3.0 * h)));
    vec3 lc = h > 0.95 ? vec3(3.0, 0.2, 1.4) : vec3(0.5, 3.0, 0.4);
    m.emit = lc * led * blink;
    float dk = decay(p, uTime);
    m.emit += vec3(0.25, 1.1, 0.12) * dk * 0.6 * uIn;
    return m;
  }
  if (id == 4) {
    // fibre trunks: black jacket, a green pulse running round the arch
    Mat m = M(vec3(0.02, 0.02, 0.022), 0.3, 0.0); m.clear = 0.7;
    vec3 c = q - vec3(0, 0.3, 0);
    float a = atan(c.y, c.x);
    float pulse = pow(0.5 + 0.5 * sin(a * 4.0 - uTime * 7.0 + q.z * 9.0), 12.0);
    m.emit = vec3(0.3, 1.4, 0.2) * pulse * (0.2 + 0.6 * uIn);
    return m;
  }
  if (id == 5) { Mat m = M(vec3(0.3, 0.31, 0.33), 0.5, 1.0); return dirty(m, p * 5.0, 0.8); }
  if (id == 7) {
    // hanging trunk: black braided jacket, green packets falling down it, a violet sheen
    Mat m = M(vec3(0.02, 0.018, 0.028), 0.25, 0.0); m.clear = 0.8;
    float ph = fract(q.y * 1.6 + uTime * 1.8 + hash11(floor(q.x * 7.0 + 3.0)));
    m.emit = vec3(0.35, 1.8, 0.25) * smoothstep(0.9, 1.0, ph) * (0.3 + uIn);
    return m;
  }
  // coolant lines: violet glass, a slow pulse
  Mat m = GLASS(vec3(0.5, 0.2, 0.8));
  m.emit = vec3(0.6, 0.12, 1.2) * (0.35 + 0.65 * pow(0.5 + 0.5 * sin(q.z * 14.0 + uTime * 4.0), 6.0)) * (0.3 + uIn);
  return m;
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('176, 182, 192', 1.0), uCycB: rgb('120, 124, 138', 1.0),
      uFloorCol: rgb('120, 122, 130', 1.0), uFloorRough: 0.06, uGrime: 0.35,
      uKeyDir: [-0.3, 0.88, 0.45], uKeyCol: [3.6, 3.8, 4.1], uKeySize: 0.25,
      uRimA: [2.2, 2.3, 2.5], uRimB: [1.3, 0.6, 2.0],
      uP1: [0.45, 0.6, -0.2], uP1c: [0, 0, 0],
      uP2: [-0.2, 1.9, 0.1], uP2c: [0, 0, 0],
      uHaze: 0.05, uHazeCol: [0.1, 0.1, 0.12],
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
      u.uP2c.value = [1.2, 0.4, 2.2].map((c) => c * (0.1 + 0.9 * k));
      u.uExpo.value = 1.0 + 1.2 * k;
    },
    post(t) { return grade(t, { exposure: 1.05 }); },
  };
};
