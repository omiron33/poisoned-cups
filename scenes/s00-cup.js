// 00 · intro (v2). A black titanium chalice with a thin gold lip turns on a black plinth like a
// luxury product reveal, in a wet data hall: server racks either side, vertical purple and green
// tubes, an LED wall behind showing a big ghost face in pixels and two face screens angled at the
// cup (all of it mirrored in the black metal and the puddles). Hair-fine forensic scanlines crawl
// over the cup with a bright read head sweeping it. Under the rim a tiny green contamination
// pulses, almost invisible; on a downbeat past the middle the camera snaps in a notch, the frame
// tears for three frames and the green pulses once harder. Nothing inside is shown yet.
import { grade, rgb, orbit, nextBeat, ease, clamp, spring } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { CYBER_GLSL } from '/song/lib/x-cyber.js';
import { CUP_GLSL } from '/song/lib/x-cup.js';
import { HALL_GLSL, HALL_UNIFORMS } from '/song/lib/x-v4-hall.js';

export const PLINTH_H = 0.42;
export const leakTime = (P) => nextBeat(P.from + (P.to - P.from) * 0.62);
export const cupCamera = (P) => {
  const tL = leakTime(P);
  return (t) => {
    const u = t - P.from;
    const k = ease.inOut3(clamp(u / 9.0, 0, 1));
    const s = spring(t, tL, 0.5, 0.3);
    return orbit(t, { target: [0, PLINTH_H + 0.62 + 0.12 * k, 0], yaw: 0.42 - 0.3 * k, pitch: 0.08 + 0.1 * k, dist: 4.4 - 0.9 * k - 0.35 * s, fov: 30, drift: 0.008 });
  };
};

export default (P) => {
  const t0 = P.from;
  const tL = leakTime(P);
  return {
    name: 's00-cup', from: P.from, to: P.to,
    frag: STUDIO_GLSL + CYBER_GLSL + CUP_GLSL + HALL_GLSL + /* glsl */ `
uniform float uSpin, uScan, uScanOn, uLeak, uTear, uLift;
const float PH = ${PLINTH_H.toFixed(3)};
vec3 cupFrame(vec3 p) { vec3 q = p - vec3(0, PH, 0); q.xz = rot(uSpin) * q.xz; return q; }
float mapObj(vec3 p, out int id) {
  id = 2;
  float d = sdCyl(p - vec3(0, PH * 0.5, 0), 0.5, PH * 0.5) - 0.01;
  vec3 q = cupFrame(p);
  float c = chalice(q);
  if (c < d) { d = c; id = 1; }
  int hid; float h = hallSDF(p, hid); if (h < d) { d = h; id = hid; }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id >= 40) return hallMat(id, p, n);
  if (id == 2) {
    Mat m = LACQUER(vec3(0.01, 0.01, 0.012));
    m.rough = 0.2 + 0.15 * fbm(p.xz * 9.0, 3);
    float edge = smoothstep(0.006, 0.0, abs(length(p.xz) - 0.505)) * smoothstep(0.02, 0.0, abs(p.y - PH + 0.012));
    m.emit = vec3(0.8, 0.9, 1.0) * 2.5 * edge * uLift;
    return m;
  }
  vec3 q = cupFrame(p);
  Mat m = cupBlack(q, n);
  m.emit += vec3(0.55, 0.9, 1.0) * cupScan(q, uScan, uScanOn);
  // the contamination: a pin-point of green just under the lip on one side, pulsing
  vec2 r = revo(q);
  float a = atan(q.z, q.x);
  float spot = exp(-pow((a - 0.6) / 0.07, 2.0) - pow((r.y - (CUP_RIM_Y - 0.06)) / 0.018, 2.0));
  float pulse = 0.25 + 0.2 * sin(uTime * 5.0) + 2.5 * uLeak;
  m.emit += HGREEN * 1.6 * spot * pulse;
  return m;
}
vec3 shade(vec2 fc) {
  fc = glitchTear(fc, uTear);
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS, ...HALL_UNIFORMS,
      uP1: [0, 1.6, -3.4], uP1c: rgb('90, 255, 60', 0.5),
      uSpin: 0, uScan: 0.5, uScanOn: 1, uLeak: 0, uTear: 0, uLift: 0, uExpo: 1,
    },
    camera: cupCamera(P),
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      const x = t - t0;
      u.uSpin.value = 0.32 * x + 0.4;
      // the read head: a slow triangle wave up and down the cup
      const ph = (x * 0.42) % 2;
      u.uScan.value = 0.05 + 0.98 * (ph < 1 ? ease.inOut3(ph) : ease.inOut3(2 - ph));
      u.uScanOn.value = clamp(x / 0.8, 0, 1);
      u.uLeak.value = Math.exp(-Math.max(0, t - tL) * 3) * (t >= tL ? 1 : 0);
      u.uTear.value = t >= tL && t < tL + 0.05 ? 0.8 : 0;
      u.uLift.value = ease.out3(clamp(x / 1.2, 0, 1));
      // out of darkness: the hall comes up over the first second and a half
      u.uExpo.value = 0.15 + 0.85 * ease.inOut3(clamp(x / 1.6, 0, 1));
    },
    post(t) { return grade(t, { exposure: 1.0, bloom: 0.09 }); },
  };
};
