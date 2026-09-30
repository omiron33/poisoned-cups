// 01 · "You polish cups / Leave the poison in"
// The same chalice on its plinth, now seen close at rim height: brushed titanium, the gold lip
// perfect, nothing inside shown. On the word "poison" the camera tilts up over the rim and looks
// straight down into it: acid-green poison glowing under a rainbow slick of oil, with bits of
// circuit board floating and turning on it. At the end the glow narrows to one green point at
// the top centre of the frame (s02 opens on a green fibre tip there).
import { grade, rgb, ease, clamp, nextBeat, linesFrom } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { CUP_GLSL } from '/song/lib/x-cup.js';

export const PH = 0.42;
export const LEVEL = 0.9;
const [, L2] = linesFrom('You polish cups', 'Leave the poison in');
const POISON = L2.words.find((w) => /poison/i.test(w.w));
export const riseTime = (P) => Math.max(P.from + 1.0, POISON.start - 0.3);
export const poisonCamera = (P) => {
  const tR = riseTime(P);
  return (t) => {
    const u = t - P.from;
    const k = ease.inOut3(clamp((t - tR) / 1.3, 0, 1));
    const yaw = 0.9 - 0.08 * u - 0.5 * k;
    const pitch = 0.0 + 0.004 * u + 1.36 * k;
    const dist = 2.3 - 0.05 * u - 0.35 * k;
    // at the end the poison's centre slides to the top centre of the frame
    const e = ease.inOut3(clamp((t - (P.to - 1.2)) / 1.1, 0, 1));
    const sh = 0.42 * e;
    const tg = [sh * Math.sin(yaw), PH + 0.86 + 0.02 * k, sh * Math.cos(yaw)];
    const d = 0.006 * (Math.sin(t * 0.8) + 0.5 * Math.sin(t * 2.1));
    return {
      pos: [tg[0] + dist * Math.sin(yaw + d) * Math.cos(pitch), tg[1] + dist * Math.sin(pitch), tg[2] + dist * Math.cos(yaw + d) * Math.cos(pitch)],
      target: tg, fov: 34 - 4 * k, roll: 0,
    };
  };
};

export default (P) => {
  const tR = riseTime(P);
  return {
    name: 's01-poison', from: P.from, to: P.to,
    frag: STUDIO_GLSL + CUP_GLSL + /* glsl */ `
uniform float uSpin, uGlow, uPoint;
const float PH = ${PH.toFixed(3)};
const float LV = ${LEVEL.toFixed(3)};
vec3 cupFrame(vec3 p) { vec3 q = p - vec3(0, PH, 0); q.xz = rot(uSpin) * q.xz; return q; }
float swirl(vec2 xz) {
  float r = length(xz), a = atan(xz.y, xz.x) + uTime * 0.35 + r * 5.0;
  return fbm(vec2(cos(a), sin(a)) * r * 9.0 + vec2(uTime * 0.1, 0.0), 3);
}
// a chip of circuit board floating on the poison
float chips(vec3 q, out float which) {
  which = 0.0;
  float d = 1e9;
  if (q.y > LV + 0.05 || q.y < LV - 0.05 || length(q.xz) > 0.33) return 0.05;
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float a = fi * 1.047 + uTime * (0.25 + 0.05 * fi) + hash11(fi) * 2.0;
    float r = 0.09 + 0.16 * hash11(fi * 3.1);
    vec3 c = vec3(cos(a) * r, LV + 0.002 + 0.002 * sin(uTime * 2.0 + fi), sin(a) * r);
    vec3 l = q - c;
    l.xz = rot(a * 1.7 + fi) * l.xz;
    l.xy = rot(0.12 * sin(uTime * 1.3 + fi)) * l.xy;
    float b = sdRoundBox(l, vec3(0.03 + 0.02 * hash11(fi + 9.0), 0.0035, 0.018 + 0.012 * hash11(fi + 4.0)), 0.001);
    if (b < d) { d = b; which = fi; }
  }
  return d;
}
float mapObj(vec3 p, out int id) {
  id = 2;
  float d = sdCyl(p - vec3(0, PH * 0.5, 0), 0.52, PH * 0.5) - 0.01;
  vec3 q = cupFrame(p);
  float c = chalice(q);
  if (c < d) { d = c; id = 1; }
  float lq = cupLiquid(q, LV + 0.003 * (swirl(q.xz) - 0.5));
  if (lq < d) { d = lq; id = 3; }
  float wh;
  float ch = chips(q, wh);
  if (ch < d) { d = ch; id = 5; }
  vec3 tp = p - vec3(0, 0, -4.2);
  tp.x = abs(tp.x);
  float tube = min(sdCapsule(tp - vec3(1.3, 0, 0), vec3(0, 0.2, 0), vec3(0, 3.2, 0), 0.03),
                   sdCapsule(tp - vec3(3.4, 0, 0), vec3(0, 0.2, 0), vec3(0, 3.2, 0), 0.03));
  if (tube < d) { d = tube; id = 4; }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 2) { Mat m = LACQUER(vec3(0.012, 0.013, 0.014)); m.rough = 0.25 + 0.2 * fbm(p.xz * 9.0, 3); return m; }
  if (id == 4) { Mat m = M(vec3(0.9), 0.3, 0.0); m.emit = vec3(2.6, 3.0, 3.2) * 2.5; return m; }
  vec3 q = cupFrame(p);
  if (id == 3) {
    Mat m = M(vec3(0.01, 0.03, 0.01), 0.04, 0.0); m.clear = 1.0;
    float s = swirl(q.xz);
    // the glow from under the slick, strongest in the veins of the swirl
    float vein = smoothstep(0.45, 0.62, s);
    m.emit = vec3(0.3, 1.0, 0.08) * (0.1 + 1.1 * vein) * uGlow;
    // at the end the glow narrows to one lit point in the centre
    float r = length(q.xz);
    float sig = mix(1.0, 0.012, uPoint);
    m.emit *= mix(1.0, exp(-r * r / (sig * sig)) * 3.0, uPoint);
    // oil: a thin-film rainbow in patches
    float oil = smoothstep(0.35, 0.7, fbm(q.xz * 6.0 + vec2(uTime * 0.05, 3.0), 3));
    vec3 iri = 0.5 + 0.5 * cos(6.2831 * (s * 3.0 + vec3(0.0, 0.33, 0.67)));
    m.emit += iri * oil * 0.18 * uGlow * (1.0 - uPoint);
    return m;
  }
  if (id == 5) {
    Mat m = M(vec3(0.02, 0.09, 0.05), 0.4, 0.0);
    // copper-gold traces on the board
    vec2 g = fract(q.xz * 90.0);
    float tr = step(0.82, max(g.x, g.y)) * step(0.4, vnoise(floor(q.xz * 90.0) * 0.7));
    if (tr > 0.5) m = M(vec3(1.0, 0.7, 0.35), 0.25, 1.0);
    return m;
  }
  Mat m = cupTi(q, n);
  // the green light from inside the bowl on its inner walls
  float inside = step(length(q.xz), CUP_RIM_R) * smoothstep(LV - 0.02, LV + 0.1, q.y);
  m.emit += vec3(0.2, 0.7, 0.06) * 0.08 * uGlow * inside;
  return m;
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('120, 130, 124', 1.6), uCycB: rgb('96, 106, 100', 1.5),
      uFloorCol: rgb('90, 96, 90', 0.9), uFloorRough: 0.1, uFloorGrain: 2.2, uGrime: 0.85,
      uHaze: 0.05, uHazeCol: rgb('110, 130, 125', 0.6),
      uKeyDir: [-0.3, 0.9, 0.35], uKeyCol: [3.4, 3.6, 3.9], uKeySize: 0.28,
      uRimA: [2.6, 1.0, 0.22], uRimB: [1.7, 2.0, 2.2],
      uSpin: 0, uGlow: 0, uPoint: 0,
    },
    camera: poisonCamera(P),
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      const x = t - P.from;
      u.uSpin.value = 0.2 * x + 2.5;
      const k = ease.out3(clamp((t - tR) / 0.6, 0, 1));
      u.uGlow.value = 1.2 * k;
      u.uPoint.value = ease.inOut3(clamp((t - (P.to - 1.3)) / 1.2, 0, 1));
      u.uP1.value = [0, PH + LEVEL + 0.7, 0.3];
      const pk = k * (1 - u.uPoint.value);
      u.uP1c.value = [0.15 * pk, 0.8 * pk, 0.06 * pk];
    },
    post(t) { return grade(t, { exposure: 1.0 }); },
  };
};
