// 15 · "You paint the graves / With your incense and your skill"
// A damaged server block (a white housing split by cracks where green corruption pulses) and a
// cracked transit pillar stand against a polluted concrete wall. A swarm of three cleanup drones
// works them over, spraying a glossy white coat that climbs down from the top and seals the cracks.
// On "incense" (a punch-in) perfumed branded fog, lavender and magenta, rolls in. By "skill" the block
// is flawless gloss, but the green still pulses faintly beneath. In the last 20 frames the camera
// snaps up to the black chalice standing on the freshly lacquered top (s16 opens on it).
import { grade, rgb, linesFrom, clamp01, ease, mix } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { CUP_GLSL } from '/song/lib/x-cup.js';
import { XF_GLSL } from '/song/lib/x-f.js';

const [L1, L2] = linesFrom('You paint the graves', 'With your incense');
const W = (L, k) => L.words.find((w) => w.w.toLowerCase().replace(/[^a-z]/g, '').startsWith(k));
const BC = [-0.3, 1.0, 0.0];          // block centre (half size 0.45, 1.0, 0.35)
const CUPS = 0.42;                    // chalice scale on the block's top

export function rig(P) {
  const t0 = P.from;
  const tPaint = W(L1, 'paint').start, tIn = W(L2, 'incense').start, tSk = W(L2, 'skill').start;
  const tEnd = P.to - 20 / 60;
  const camera = (t) => {
    const u = t - t0;
    const punch = ease.out5((t - tIn) / 0.2);
    const up = ease.inOut3((t - tEnd) / (P.to - tEnd));
    const base = { pos: [0.2 - 0.05 * u, 1.35 + 0.02 * u, 4.4 - 0.08 * u - 0.55 * punch], tg: [-0.4 + 0.02 * u, 1.12, 0.0] };
    const cup = { pos: [0.55, 2.6, 1.4], tg: [BC[0] + 0.42, 2.2, 0.05] };
    return { pos: mix(base.pos, cup.pos, up), target: mix(base.tg, cup.tg, up), fov: mix(40, 34, up), roll: 0 };
  };
  // the coat front climbs down the block from the top: 0 none .. 1 sealed
  const coat = (t) => clamp01(0.08 + 0.92 * ease.inOut3((t - tPaint) / (tSk + 0.2 - tPaint)));
  return { camera, coat, tIn, tSk, tPaint };
}

export default (P) => {
  const R = rig(P);
  const drone = (t, i) => {
    const ph = t * (0.9 + 0.2 * i) + i * 2.1;
    const c = R.coat(t);
    const y = 2.0 - 2.0 * c + 0.12 + 0.18 * Math.sin(ph * 1.7);
    return [BC[0] + 0.62 * Math.sin(ph) + (i - 1) * 0.25, Math.max(0.35, y + i * 0.08), 0.78 + 0.12 * Math.cos(ph * 1.3) + 0.1 * i];
  };
  return {
    name: 's15-graves', from: P.from, to: P.to,
    frag: STUDIO_GLSL + CUP_GLSL + XF_GLSL + /* glsl */ `
uniform vec3 uD[3];
uniform float uCoat, uFog, uPulse;
const vec3 BC = vec3(${BC.join(', ')});
const vec3 BH = vec3(0.45, 1.0, 0.35);
const float CS = ${CUPS.toFixed(3)};
vec3 cupP(vec3 p) { return (p - vec3(BC.x, 2.0, 0.05)) / CS; }
float mapObj(vec3 p, out int id) {
  id = 1;
  float d = sdRoundBox(p - BC, BH, 0.015);
  // cracked transit pillar
  float pl = sdCyl(p - vec3(-1.75, 1.3, -0.7), 0.22, 1.3) - 0.01;
  if (pl < d) { d = pl; id = 2; }
  // the polluted wall
  float wl = sdBox(p - vec3(0.0, 2.0, -1.8), vec3(5.0, 2.0, 0.2));
  if (wl < d) { d = wl; id = 3; }
  // the drones
  for (int i = 0; i < 3; i++) {
    vec3 q = p - uD[i];
    q.xz *= rot(float(i) * 1.3 + uTime * 0.4);
    float dr = sdDrone(q, uTime * 40.0 + float(i));
    if (dr < d) { d = dr; id = 4; }
  }
  // the black chalice on the block's top
  vec3 cq = cupP(p);
  float cb = length(cq - vec3(0.0, 0.55, 0.0)) - 0.8;
  if (cb * CS < d) {
    float c = chalice(cq) * CS;
    if (c < d) { d = c; id = 5; }
  }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 4) {
    Mat m = M(vec3(0.08, 0.085, 0.09), 0.3, 0.6);
    m.emit = vec3(0.3, 2.6, 0.5) * step(p.y, 0.0) * 0.0;
    return m;
  }
  if (id == 5) {
    vec3 cq = cupP(p);
    vec2 q = revo(cq);
    if (q.y > CUP_RIM_Y - 0.035) return cupGold(cq, n);
    Mat m = M(vec3(0.05, 0.05, 0.055), 0.14 + 0.08 * vnoise(vec2(q.y * 900.0, 1.0)), 1.0);
    return m;
  }
  if (id == 3) {
    Mat m = M(vec3(0.16, 0.15, 0.16) * (0.6 + 0.6 * fbm(p.xy * 2.0, 4)), 0.8, 0.0);
    m = dirty(m, p, 1.0);
    // green run-off stains
    float st = smoothstep(0.55, 0.8, fbm(vec2(p.x * 6.0, p.y * 0.8), 4)) * smoothstep(2.5, 0.0, p.y);
    m.alb = mix(m.alb, vec3(0.05, 0.14, 0.04), st * 0.8);
    m.emit = vec3(0.02, 0.12, 0.02) * st * uPulse;
    return m;
  }
  // the block (1) and the pillar (2): white housing, cracked, green corruption in the cracks
  vec2 f = id == 1 ? (abs(n.x) > 0.5 ? p.zy : p.xy) : vec2(atan(p.z + 0.7, p.x + 1.75) * 0.22, p.y);
  float top = id == 1 ? 2.0 : 2.6;
  float front = top - top * uCoat;
  float painted = smoothstep(front + 0.02, front - 0.02, top - (top - p.y));
  painted = step(front, p.y);
  float wet = smoothstep(0.12, 0.0, abs(p.y - front)) * step(0.001, uCoat) * step(uCoat, 0.999);
  float cr = fractureLines(f, id == 1 ? 3.0 : 8.0, 3.5);
  Mat m = M(vec3(0.72, 0.72, 0.7), 0.5, 0.0);
  // vents and rack seams on the housing
  if (id == 1) {
    float seam = smoothstep(0.004, 0.0, abs(fract(p.y / 0.18) - 0.5) * 0.18 - 0.086);
    float vent = step(0.7, fract(p.x * 18.0)) * step(abs(fract(p.y / 0.18) - 0.5), 0.2) * step(abs(p.x - BC.x), 0.3);
    m.alb *= 1.0 - 0.35 * seam - 0.4 * vent;
  }
  m = dirty(m, p, 0.9);
  m.alb = mix(m.alb, vec3(0.02, 0.03, 0.02), cr * 0.9);
  vec3 green = vec3(0.35, 2.4, 0.25) * cr * uPulse;
  // the fresh gloss coat: flawless white lacquer; the green still beats faintly under it
  Mat g = LACQUER(vec3(0.92, 0.92, 0.94)); g.rough = 0.06;
  m.alb = mix(m.alb, g.alb, painted); m.rough = mix(m.rough, g.rough, painted);
  m.clear = painted;
  m.emit = green * mix(1.0, 0.1, painted) + vec3(0.25, 0.25, 0.28) * wet;
  return m;
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  vec3 col = studio(ro, rd, depth);
  // the spray: a soft white mist from each drone's nozzle to the block's face
  for (int i = 0; i < 3; i++) {
    vec3 a = uD[i] + vec3(0.0, -0.05, -0.05);
    vec3 b = vec3(clamp(a.x, BC.x - 0.4, BC.x + 0.4), a.y - 0.08, BH.z + 0.01);
    vec3 ba = b - a;
    // closest approach between the view ray and the spray segment
    vec3 w0 = ro - a;
    float bb = dot(ba, ba), bd = dot(ba, rd), wb = dot(w0, ba), wd = dot(w0, rd);
    float den = bb - bd * bd;
    float s = sat((wb - bd * wd) / max(den, 1e-5));
    float tr = max(0.0, s * bd - wd);
    if (tr > depth) continue;
    float dist = length(ro + rd * tr - (a + ba * s));
    float r = 0.012 + 0.07 * s;
    col += vec3(0.9, 0.9, 1.0) * exp(-dist * dist / (r * r)) * (0.35 + 0.4 * s) * step(0.001, uCoat) * (1.0 - step(0.999, uCoat));
  }
  return col;
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('50, 30, 74', 1.1), uCycB: rgb('12, 10, 20', 1.0),
      uFloorCol: rgb('56, 56, 60', 0.9), uFloorRough: 0.1, uFloorGrain: 1.5,
      uGrime: 0.95, uHaze: 0.04, uHazeCol: [0.05, 0.04, 0.07],
      uKeyDir: [0.45, 0.8, 0.6], uKeyCol: [3.0, 3.0, 3.3], uKeySize: 0.35,
      uRimA: [1.8, 0.6, 2.6], uRimB: [0.6, 2.2, 0.8],
      uP1: [0, 1.1, 0.6], uP1c: [0.1, 0.8, 0.15],
      uD: new Array(9).fill(0), uCoat: 0, uFog: 0, uPulse: 1,
    },
    camera: R.camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      u.uD.value = [0, 1, 2].map((i) => drone(t, i)).flat();
      const c = R.coat(t);
      u.uCoat.value = c;
      // corruption pulses on the beat (~0.65 s)
      const pl = 0.55 + 0.45 * Math.pow(Math.abs(Math.sin((t - P.from) * Math.PI / 0.66)), 4);
      u.uPulse.value = pl;
      u.uP1.value = [BC[0], Math.max(0.3, 2.0 - 2.0 * c - 0.3), 0.7];
      u.uP1c.value = [0.1 * pl, 0.9 * pl * (1 - 0.8 * c), 0.15 * pl];
      // perfumed branded fog rolls in on "incense": lavender and magenta
      const f = clamp01((t - R.tIn + 0.2) / 1.6);
      u.uHaze.value = 0.04 + 0.1 * f;
      u.uHazeCol.value = [0.05 + 0.11 * f, 0.04 + 0.04 * f, 0.07 + 0.12 * f];
    },
    post(t) { return grade(t, { exposure: 1.0, vignette: 0.45, bloom: 0.08 }); },
  };
};
