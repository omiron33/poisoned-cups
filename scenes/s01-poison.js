// 01 · "You polish cups / Leave the poison in" (v2)
// Extreme close-up of the black titanium chalice in the data hall. A laser-cleaning line runs down
// the bowl from the lip: above it the metal is mirror black, below it still dull with a grey film,
// a cold beam from an emitter above frame and sparks where it bites. When the bowl is spotless the
// laser clicks off and the cup gleams. On "Leave" the camera rises over the rim and looks straight
// down into it: toxic luminous green fluid swirling with floating microchips, cable scrap and ash
// under an oily slick. At the end the glow narrows to one green point at the top centre of the frame
// (s02 opens on a failing green fibre tip there).
import { grade, rgb, ease, clamp, linesFrom, spring } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { CYBER_GLSL } from '/song/lib/x-cyber.js';
import { CUP_GLSL } from '/song/lib/x-cup.js';
import { HALL_GLSL, HALL_UNIFORMS } from '/song/lib/x-a.js';

export const PH = 0.42;
export const LEVEL = 0.9;
const [L1, L2] = linesFrom('You polish cups', 'Leave the poison in');
export const lines01 = [L1, L2];
export const riseTime = () => L2.words[0].start - 0.4;
export const laserSpan = () => [L1.words[0].start - 0.1, L1.words[L1.words.length - 1].end + 0.1];
const norm = (a) => { const l = Math.hypot(...a); return a.map((v) => v / l); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

export const poisonCamera = (P) => {
  const tR = riseTime();
  return (t) => {
    const u = t - P.from;
    const k = ease.inOut3(clamp((t - tR) / 1.0, 0, 1));
    const yaw = 0.9 - 0.05 * u - 0.45 * k;
    const pitch = 0.1 + 0.006 * u + 1.26 * k;
    const dist = 1.95 - 0.03 * u + 0.1 * k;
    // at the end the poison's centre slides to the top centre of the frame
    const e = ease.inOut3(clamp((t - (P.to - 1.2)) / 1.1, 0, 1));
    const sh = 0.42 * e;
    let tg = [sh * Math.sin(yaw), PH + 0.74 + 0.14 * k, sh * Math.cos(yaw)];
    const d = 0.005 * (Math.sin(t * 0.8) + 0.5 * Math.sin(t * 2.1));
    let pos = [tg[0] + dist * Math.sin(yaw + d) * Math.cos(pitch), tg[1] + dist * Math.sin(pitch), tg[2] + dist * Math.cos(yaw + d) * Math.cos(pitch)];
    // once over the rim, slide the cup to the right half so the words have the dark left side
    const off = 0.3 * k * (1 - e);
    const ww = norm(tg.map((v, i) => v - pos[i]));
    const uu = norm(cross(ww, [0, 1, 0]));
    tg = tg.map((v, i) => v - uu[i] * off); pos = pos.map((v, i) => v - uu[i] * off);
    return { pos, target: tg, fov: 32 - 2 * k, roll: 0 };
  };
};
// the bowl's radius at height y (cup frame)
const bowlR = (y) => 0.34 * Math.sqrt(Math.max(0, 1 - ((y - 1.02) / 0.4) ** 2));

export default (P) => {
  const tR = riseTime();
  const [l0, l1] = laserSpan();
  const scanY = (t) => 1.0 - 0.36 * ease.inOut3(clamp((t - l0) / (l1 - l0), 0, 1));
  return {
    name: 's01-poison', from: P.from, to: P.to,
    frag: STUDIO_GLSL + CYBER_GLSL + CUP_GLSL + HALL_GLSL + /* glsl */ `
uniform float uSpin, uGlow, uPoint, uScanY, uLaser, uGleam;
uniform vec3 uHit, uEmit;
const float PH = ${PH.toFixed(3)};
const float LV = ${LEVEL.toFixed(3)};
vec3 cupFrame(vec3 p) { vec3 q = p - vec3(0, PH, 0); q.xz = rot(uSpin) * q.xz; return q; }
// floating debris on the poison: circuit-board chips (0..5) and cut cable scraps (6..8)
float debris(vec3 q, out float which) {
  which = 0.0;
  float d = 1e9;
  if (q.y > LV + 0.05 || q.y < LV - 0.05 || length(q.xz) > 0.33) return 0.05;
  for (int i = 0; i < 9; i++) {
    float fi = float(i);
    float a = fi * 0.698 + uTime * (0.22 + 0.04 * fi) + hash11(fi) * 2.0;
    float r = 0.07 + 0.19 * hash11(fi * 3.1);
    vec3 c = vec3(cos(a) * r, LV + 0.002 + 0.002 * sin(uTime * 2.0 + fi), sin(a) * r);
    vec3 l = q - c;
    l.xz = rot(a * 1.7 + fi) * l.xz;
    l.xy = rot(0.12 * sin(uTime * 1.3 + fi)) * l.xy;
    float b = i < 6 ? sdRoundBox(l, vec3(0.028 + 0.02 * hash11(fi + 9.0), 0.0035, 0.016 + 0.012 * hash11(fi + 4.0)), 0.001)
                    : sdCapsule(l, vec3(-0.05, 0, 0), vec3(0.05, 0.004, 0.01), 0.007);
    if (b < d) { d = b; which = fi; }
  }
  return d;
}
float mapObj(vec3 p, out int id) {
  id = 2;
  float d = sdCyl(p - vec3(0, PH * 0.5, 0), 0.5, PH * 0.5) - 0.01;
  vec3 q = cupFrame(p);
  float c = chalice(q);
  if (c < d) { d = c; id = 1; }
  float lq = cupLiquid(q, LV + 0.003 * (poisonSwirl(q.xz) - 0.5));
  if (lq < d) { d = lq; id = 3; }
  float wh;
  float ch = debris(q, wh);
  if (ch < d) { d = ch; id = wh < 5.5 ? 5 : 6; }
  int hid; float h = hallSDF(p, hid); if (h < d) { d = h; id = hid; }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id >= 40) return hallMat(id, p, n);
  if (id == 2) { Mat m = LACQUER(vec3(0.01, 0.01, 0.012)); m.rough = 0.2 + 0.15 * fbm(p.xz * 9.0, 3); return m; }
  vec3 q = cupFrame(p);
  if (id == 3) {
    Mat m = M(vec3(0.008, 0.02, 0.008), 0.04, 0.0); m.clear = 1.0;
    m.emit = poisonEmit(q.xz, uGlow);
    float r = length(q.xz);
    float sig = mix(1.0, 0.012, uPoint);
    m.emit *= mix(1.0, exp(-r * r / (sig * sig)) * 3.0, uPoint);
    // oil: a thin-film slick in patches; ash: grey flecks riding the swirl
    float s = poisonSwirl(q.xz);
    float oil = smoothstep(0.35, 0.7, fbm(q.xz * 6.0 + vec2(uTime * 0.05, 3.0), 3));
    vec3 iri = 0.5 + 0.5 * cos(6.2831 * (s * 3.0 + vec3(0.0, 0.33, 0.67)));
    m.emit += iri * oil * 0.1 * uGlow * (1.0 - uPoint);
    float ash = step(0.78, vnoise(q.xz * 120.0 + s * 4.0)) * (1.0 - uPoint);
    m.emit *= 1.0 - 0.8 * ash;
    m.alb = mix(m.alb, vec3(0.2), ash);
    return m;
  }
  if (id == 5) {
    Mat m = M(vec3(0.02, 0.09, 0.05), 0.4, 0.0);
    vec2 g = fract(q.xz * 90.0);
    float tr = step(0.82, max(g.x, g.y)) * step(0.4, vnoise(floor(q.xz * 90.0) * 0.7));
    if (tr > 0.5) m = M(vec3(0.9, 0.92, 0.95), 0.25, 1.0);
    return m;
  }
  if (id == 6) { Mat m = M(vec3(0.03), 0.3, 0.0); m.clear = 0.6; return m; }
  Mat m = cupBlack(q, n);
  // the grey film the laser has not reached yet (below the line)
  float film = smoothstep(uScanY - 0.004, uScanY - 0.02, q.y) * step(0.5, q.y);
  float grime = 0.55 + 0.45 * fbm(q * 40.0, 3);
  m.alb = mix(m.alb, vec3(0.22, 0.22, 0.2) * grime, film * 0.85);
  m.rough = mix(m.rough * 0.4, 0.7, film);
  m.metal = mix(1.0, 0.3, film);
  // the laser line itself, round the bowl
  m.emit += vec3(0.8, 1.0, 0.9) * 7.0 * smoothstep(0.004, 0.0, abs(q.y - uScanY)) * step(0.0001, uLaser) * step(q.y, 1.0);
  float inside = step(length(q.xz), CUP_RIM_R) * smoothstep(LV - 0.02, LV + 0.1, q.y);
  m.emit += HGREEN * 0.08 * uGlow * inside;
  // the gleam: once the bowl is clean a glint runs across it, left to right
  vec3 cw = normalize(uCamTarget - uCamPos), cr = normalize(cross(cw, vec3(0, 1, 0)));
  float xs = dot(p - vec3(0, PH, 0), cr);
  m.emit += vec3(0.85, 0.9, 1.0) * 1.3 * exp(-pow((xs - uGleam) / 0.012, 2.0)) * (0.4 + 0.6 * vnoise(vec2(q.y * 30.0, 0.0))) * step(0.62, q.y) * step(q.y, 1.0);
  return m;
}
float segGlow(vec3 ro, vec3 rd, vec3 a, vec3 b, float depth, float w) {
  vec3 ba = b - a, oa = ro - a;
  float bb = dot(ba, ba), bd = dot(ba, rd), ob = dot(oa, ba), od = dot(oa, rd);
  float h = clamp((ob - od * bd) / max(bb - bd * bd, 1e-5), 0.0, 1.0);
  vec3 pc = a + ba * h;
  float tr = max(dot(pc - ro, rd), 0.0);
  if (tr > depth + 0.02) return 0.0;
  float dd = length(ro + rd * tr - pc);
  return exp(-dd * dd / (w * w));
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  vec3 col = studio(ro, rd, depth);
  if (uLaser > 0.001) {
    vec3 lc = vec3(0.75, 1.0, 0.85);
    col += lc * uLaser * (segGlow(ro, rd, uEmit, uHit, depth, 0.0025) * 3.0 + segGlow(ro, rd, uEmit, uHit, depth, 0.012) * 0.25);
    // sparks: short streaks spat off the contact point, re-drawn 30 times a second
    float f = floor(uTime * 30.0);
    for (int i = 0; i < 6; i++) {
      vec3 dir = normalize(hash33(vec3(f, float(i), 3.0)) - vec3(0.5, 0.2, 0.5));
      float len = 0.03 + 0.08 * hash11(f + float(i) * 7.0);
      col += vec3(1.0, 0.95, 0.85) * uLaser * 2.0 * segGlow(ro, rd, uHit + dir * len * 0.3, uHit + dir * len, depth + 0.05, 0.0018);
    }
    col += lc * uLaser * 1.5 * segGlow(ro, rd, uHit, uHit + vec3(0.0, 0.0001, 0.0), depth + 0.05, 0.01);
  }
  return col;
}`,
    uniforms: {
      ...STUDIO_UNIFORMS, ...HALL_UNIFORMS,
      uSpin: 0, uGlow: 0, uGleam: -9, uPoint: 0, uScanY: 1, uLaser: 0, uHit: [0, 1, 0], uEmit: [0, 3, 1],
    },
    camera: poisonCamera(P),
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      const x = t - P.from;
      u.uSpin.value = 0.2 * x + 2.5;
      const k = ease.out3(clamp((t - (tR + 0.4)) / 0.6, 0, 1));
      u.uGlow.value = 0.95 * k;
      u.uGleam.value = t > l1 ? -0.45 + 0.9 * ease.inOut3((t - l1 - 0.05) / 0.7) : -9;
      u.uPoint.value = ease.inOut3(clamp((t - (P.to - 1.3)) / 1.2, 0, 1));
      u.uP1.value = [0, PH + LEVEL + 0.7, 0.3];
      const pk = k * (1 - u.uPoint.value);
      u.uP1c.value = [0.15 * pk, 0.8 * pk, 0.06 * pk];
      // the laser: on through the first line, off with a click once the bowl is clean
      const on = t >= l0 - 0.05 && t < l1 + 0.05 ? 1 : 0;
      u.uLaser.value = on * (0.85 + 0.15 * Math.sin(t * 90));
      const y = scanY(t);
      u.uScanY.value = t < l0 ? 1.0 : y;
      if (t >= l1 + 0.05) u.uScanY.value = 0.0;   // all polished
      const yaw = 0.9 - 0.05 * x;
      const r = bowlR(y) + 0.004;
      u.uHit.value = [r * Math.sin(yaw), PH + y, r * Math.cos(yaw)];
      u.uEmit.value = [0.9 * Math.sin(yaw + 0.9), PH + 2.2, 0.9 * Math.cos(yaw + 0.9)];
    },
    post(t) { return grade(t, { exposure: 1.0, bloom: 0.09 }); },
  };
};
