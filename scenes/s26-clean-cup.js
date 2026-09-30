// 26 · outro (after the last word). The chalice again on its plinth in the wet concrete hall, still
// full of s01's acid-green poison. A ribbon of warm white light (the stones' carved light from s25)
// rises from off-frame low, arcs over and pours down into the cup. Where it lands the green burns
// off from the centre outward, a hot white edge running to the rim over four seconds, leaving the
// bare inside of the cup lit from within (Matthew 23:26). The intro's laser returns, finds nothing
// to polish and switches off. Then a slow push out to the whole hall: the plinth
// empty but for the clean cup. The picture fades out on the last second.
import { grade, rgb, ease, clamp, orbit } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { CUP_GLSL } from '/song/lib/x-cup.js';

export const PH = 0.42;
const LEVEL = 0.9;
// scene-relative beats of the move (seconds after P.from)
export const T26 = { arc0: 0.5, arc1: 2.6, burn0: 2.4, burn1: 6.4, caption: 6.0, ref: 12.0, push0: 11.0, push1: 15.5 };

export default (P) => {
  const t0 = P.from;
  const camera = (t) => {
    const u = t - t0;
    const k = ease.inOut3(clamp((u - T26.push0) / (T26.push1 - T26.push0), 0, 1));
    const target = [0, PH + 0.95 - 0.35 * k, 0];
    return orbit(t, { target, yaw: 0.6 - 0.035 * u, pitch: 0.72 - 0.5 * k, dist: 2.0 + 5.2 * k + 0.05 * u, fov: 34 + 4 * k, drift: 0.005 });
  };
  return {
    name: 's26-clean-cup', from: P.from, to: P.to,
    frag: STUDIO_GLSL + CUP_GLSL + /* glsl */ `
uniform float uArc, uBurn, uFade, uScan, uScanOn;
const float PH = ${PH.toFixed(3)};
const float LV = ${LEVEL.toFixed(3)};
const vec3 WARM = vec3(1.0, 0.94, 0.86);
float swirl(vec2 xz) {
  float r = length(xz), a = atan(xz.y, xz.x) + uTime * 0.35 + r * 5.0;
  return fbm(vec2(cos(a), sin(a)) * r * 9.0 + vec2(uTime * 0.1, 0.0), 3);
}
float mapObj(vec3 p, out int id) {
  id = 2;
  float d = sdCyl(p - vec3(0, PH * 0.5, 0), 0.52, PH * 0.5) - 0.01;
  vec3 q = p - vec3(0, PH, 0);
  float c = chalice(q);
  if (c < d) { d = c; id = 1; }
  float lq = cupLiquid(q, LV - 0.36 * smoothstep(0.5, 1.0, uBurn) + 0.003 * (swirl(q.xz) - 0.5) * (1.0 - uBurn));
  if (lq < d) { d = lq; id = 3; }
  // fluorescent tubes along the far wall and down the sides
  vec3 tp = p - vec3(0, 0, -4.2);
  tp.x = abs(tp.x);
  float tube = min(sdCapsule(tp - vec3(1.3, 0, 0), vec3(0, 0.2, 0), vec3(0, 3.2, 0), 0.03),
                   sdCapsule(tp - vec3(3.4, 0, 0), vec3(0, 0.2, 0), vec3(0, 3.2, 0), 0.03));
  vec3 sp = p; sp.x = abs(sp.x) - 5.0; sp.z = mod(sp.z + 1.5, 3.0) - 1.5;
  tube = min(tube, sdCapsule(sp, vec3(0, 0.2, 0), vec3(0, 3.0, 0), 0.03));
  if (tube < d) { d = tube; id = 4; }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 2) { Mat m = LACQUER(vec3(0.012, 0.013, 0.014)); m.rough = 0.25 + 0.2 * fbm(p.xz * 9.0, 3); return m; }
  if (id == 4) { Mat m = M(vec3(0.9), 0.3, 0.0); m.emit = vec3(2.6, 3.0, 3.2) * 2.2; return m; }
  vec3 q = p - vec3(0, PH, 0);
  if (id == 3) {
    float r = length(q.xz);
    // the burn front: from the centre to the rim
    float R = uBurn * (CUP_RIM_R + 0.05);
    float clean = smoothstep(R, R - 0.03, r);
    float edge = smoothstep(0.03, 0.0, abs(r - R)) * step(0.001, uBurn) * step(uBurn, 0.999);
    // poison (as in s01)
    float s = swirl(q.xz);
    vec3 green = vec3(0.3, 1.0, 0.08) * (0.1 + 1.1 * smoothstep(0.45, 0.62, s)) * 1.2;
    // where it has burned off: bare metal, lit from within
    vec3 light = WARM * 1.6;
    Mat m = M(mix(vec3(0.01, 0.03, 0.01), vec3(0.9, 0.88, 0.84), clean), mix(0.04, 0.12, clean), clean);
    m.clear = 1.0 - clean;
    m.emit = mix(green, light, clean) + WARM * 4.0 * edge;
    return m;
  }
  Mat m = cupTi(q, n);
  float inside = step(length(q.xz), CUP_RIM_R) * smoothstep(LV - 0.02, LV + 0.1, q.y);
  // the inside of the bowl, once clean, glows: brighter than the outside ever was
  float inBowl = step(length(q.xz), CUP_RIM_R - 0.004) * step(0.6, q.y) * sat(-dot(n, normalize(vec3(q.x, 0.0, q.z) + 1e-4)) + 0.3 * n.y);
  m.emit += mix(vec3(0.2, 0.7, 0.06) * 0.08 * inside, WARM * 1.3 * inBowl, uBurn);
  // the intro's laser returns, sweeps, finds nothing to polish, and switches off
  m.emit += vec3(0.6, 1.0, 0.95) * 9.0 * smoothstep(0.009, 0.0, abs(q.y - uScan)) * uScanOn;
  return m;
}
// the arc of light: a curve from low off-frame, up and over, down into the cup
vec3 arcAt(float s) {
  vec3 a = vec3(-1.9, 0.0, 0.9), b = vec3(-1.6, 2.9, 0.4), c = vec3(0.0, 2.5, 0.0), d = vec3(0.0, PH + LV, 0.0);
  float u = 1.0 - s;
  return u * u * u * a + 3.0 * u * u * s * b + 3.0 * u * s * s * c + s * s * s * d;
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  vec3 col = studio(ro, rd, depth);
  // the ribbon of light: glow by distance from the ray to the drawn part of the curve
  if (uArc > 0.0) {
    float head = min(uArc, 1.0);
    float tail = max(0.0, uArc - 1.0);
    float g = 0.0;
    vec3 prev = arcAt(tail);
    for (int i = 1; i <= 14; i++) {
      float s = mix(tail, head, float(i) / 14.0);
      vec3 cur = arcAt(s);
      // closest approach between the view ray and the segment prev-cur
      vec3 ba = cur - prev, oa = ro - prev;
      float bb = dot(ba, ba), bd = dot(ba, rd), ob = dot(oa, ba), od = dot(oa, rd);
      float den = bb - bd * bd;
      float h = clamp((ob - od * bd) / max(den, 1e-5), 0.0, 1.0);
      vec3 pc = prev + ba * h;
      float tr = max(dot(pc - ro, rd), 0.0);
      float dist = length(ro + rd * tr - pc);
      if (tr < depth + 0.05) g += exp(-dist * dist / 0.00025) * 0.9 + exp(-dist * 30.0) * 0.08;
      prev = cur;
    }
    col += WARM * g * 2.2;
  }
  return col * uFade;
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('120, 130, 124', 1.6), uCycB: rgb('96, 106, 100', 1.5),
      uFloorCol: rgb('90, 96, 90', 0.9), uFloorRough: 0.1, uFloorGrain: 2.2, uGrime: 0.9,
      uHaze: 0.05, uHazeCol: rgb('120, 128, 124', 0.6),
      uKeyDir: [-0.3, 0.9, 0.35], uKeyCol: [3.4, 3.5, 3.6], uKeySize: 0.28,
      uRimA: [2.6, 1.0, 0.22], uRimB: [1.7, 2.0, 2.2],
      uArc: 0, uBurn: 0, uFade: 1, uScan: 0, uScanOn: 0,
    },
    camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      const x = t - t0;
      // the ribbon draws in (head 0..1), then its tail follows it into the cup (1..2)
      u.uArc.value = x < T26.arc0 ? 0 : ease.inOut3(clamp((x - T26.arc0) / (T26.arc1 - T26.arc0), 0, 1)) + ease.in2(clamp((x - T26.arc1) / 1.4, 0, 1)) * 1.0;
      if (u.uArc.value >= 1.999) u.uArc.value = 0;
      u.uBurn.value = ease.inOut3(clamp((x - T26.burn0) / (T26.burn1 - T26.burn0), 0, 1));
      const b = u.uBurn.value;
      u.uP1.value = [0, PH + LEVEL + 0.35, 0];
      u.uP1c.value = [0.15 * (1 - b) + 0.9 * b, 0.8 * (1 - b) + 0.85 * b, 0.06 * (1 - b) + 0.75 * b];
      // the laser: in at 8.6 s, one pass down and up, then off
      const ls = clamp((x - 8.6) / 2.2, 0, 1);
      u.uScan.value = 1.05 - 1.0 * Math.sin(Math.PI * ease.inOut3(ls));
      u.uScanOn.value = x > 8.6 && x < 11.2 ? Math.min(1, (x - 8.6) * 5) * (x > 10.9 ? (x < 11.0 ? 1 : 0.0) : 1) : 0;
      u.uFade.value = 1 - ease.inOut3(clamp((t - (P.to - 1.4)) / 1.35, 0, 1));
    },
    post(t) { return grade(t, { exposure: 1.0 }); },
  };
};
