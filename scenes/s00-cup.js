// 00 · intro. A brushed-titanium chalice with a gold lip turns on a black product-launch plinth in a
// wet concrete hall. A laser scan line sweeps up and down it, "polishing" it like a launch render.
// On a downbeat past the middle the laser snaps to the rim and a white flash runs round the gold lip:
// the product is perfect. (Nothing is shown inside yet.)
import { grade, rgb, orbit, nextBeat, ease, clamp } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { CUP_GLSL } from '/song/lib/x-cup.js';

export const PLINTH_H = 0.42;
export const cupCamera = (t0) => (t) => {
  const u = t - t0;
  const k = ease.inOut3(clamp(u / 8.6, 0, 1));
  return orbit(t, { target: [0, PLINTH_H + 0.45 + 0.2 * k, 0], yaw: 0.5 - 0.42 * k, pitch: 0.1 + 0.16 * k, dist: 4.6 - 1.1 * k, fov: 30, drift: 0.008 });
};
export const leakTime = (P) => nextBeat(P.from + (P.to - P.from) * 0.62);

export default (P) => {
  const t0 = P.from;
  const tLeak = leakTime(P);
  return {
    name: 's00-cup', from: P.from, to: P.to,
    frag: STUDIO_GLSL + CUP_GLSL + /* glsl */ `
uniform float uSpin, uScan, uScanOn, uLeak;
const float PH = ${PLINTH_H.toFixed(3)};
vec3 cupFrame(vec3 p) { vec3 q = p - vec3(0, PH, 0); q.xz = rot(uSpin) * q.xz; return q; }
float mapObj(vec3 p, out int id) {
  id = 2;
  float d = sdCyl(p - vec3(0, PH * 0.5, 0), 0.52, PH * 0.5) - 0.01;
  vec3 q = cupFrame(p);
  float c = chalice(q);
  if (c < d) { d = c; id = 1; }
  // fluorescent tubes standing against the far wall
  vec3 tp = p - vec3(0, 0, -4.2);
  tp.x = abs(tp.x);
  float tube = min(sdCapsule(tp - vec3(1.3, 0, 0), vec3(0, 0.2, 0), vec3(0, 3.2, 0), 0.03),
                   sdCapsule(tp - vec3(3.4, 0, 0), vec3(0, 0.2, 0), vec3(0, 3.2, 0), 0.03));
  if (tube < d) { d = tube; id = 4; }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 2) {
    Mat m = LACQUER(vec3(0.012, 0.013, 0.014));
    m.rough = 0.25 + 0.2 * fbm(p.xz * 9.0, 3);
    // a hairline LED ring on the plinth's top edge
    float edge = smoothstep(0.006, 0.0, abs(length(p.xz) - 0.505)) * smoothstep(0.02, 0.0, abs(p.y - PH + 0.012));
    m.emit = vec3(0.9, 0.95, 1.0) * 3.0 * edge;
    return m;
  }
  if (id == 4) { Mat m = M(vec3(0.9), 0.3, 0.0); m.emit = vec3(2.6, 3.0, 3.2) * 2.5; return m; }
  vec3 q = cupFrame(p);
  if (id == 3) {
    Mat m = M(vec3(0.02, 0.06, 0.01), 0.05, 0.0); m.clear = 1.0;
    float sw = fbm(vec2(atan(q.z, q.x) * 2.0 + uTime * 0.4, length(q.xz) * 14.0), 3);
    m.alb = vec3(0.6, 0.62, 0.65) * (0.8 + 0.2 * sw); m.metal = 1.0; m.rough = 0.2;   // hidden: the cup reads empty
    return m;
  }
  Mat m = cupTi(q, n);
  // the laser line, projected onto the cup where it passes
  float line = smoothstep(0.009, 0.0, abs(q.y - uScan)) * uScanOn;
  m.emit += vec3(0.6, 1.0, 0.95) * 9.0 * line;
  // the flash round the lip: a bright arc running once round the rim
  float lip = smoothstep(CUP_RIM_Y - 0.04, CUP_RIM_Y - 0.02, q.y);
  float ang = fract(atan(p.z, p.x) / 6.2831 - uLeak * 1.2);
  m.emit += vec3(1.0, 0.95, 0.85) * 5.0 * lip * smoothstep(0.12, 0.0, ang) * step(uLeak, 0.99) * step(0.001, uLeak);
  return m;
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  vec3 col = studio(ro, rd, depth);
  return col;
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('120, 130, 124', 1.6), uCycB: rgb('60, 68, 66', 1.2),
      uFloorCol: rgb('90, 96, 90', 0.9), uFloorRough: 0.1, uFloorGrain: 2.2, uGrime: 0.85,
      uHaze: 0.06, uHazeCol: rgb('110, 130, 125', 0.6),
      uKeyDir: [-0.3, 0.9, 0.35], uKeyCol: [3.4, 3.6, 3.9], uKeySize: 0.28,
      uRimA: [2.6, 1.0, 0.22], uRimB: [1.7, 2.0, 2.2],
      uP1: [0, -100, 0], uP1c: [0, 0, 0],
      uSpin: 0, uScan: 0.5, uScanOn: 1, uLeak: 0,
    },
    camera: cupCamera(t0),
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      const x = t - t0;
      u.uSpin.value = 0.35 * x + 0.4;
      // the scan: a fast triangle wave up and down the cup, fading out as the leak starts
      const ph = (x * 0.75) % 2;
      u.uScan.value = 0.02 + 1.0 * (ph < 1 ? ease.inOut3(ph) : ease.inOut3(2 - ph));
      u.uScanOn.value = 1;
      u.uLeak.value = clamp((t - tLeak) / 0.5, 0, 1);
    },
    post(t) { return grade(t, { exposure: 1.0 }); },
  };
};
