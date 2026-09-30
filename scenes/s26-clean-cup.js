// 26 · outro (v2). The black titanium chalice again on its plinth in the data hall, still full of
// s01's green poison, the face screens and rack lights still live around it.
//   0–4 s   the white light of s25 streams in from the edges of frame and gathers into one small
//           warm-gold point above the cup, which then sinks slowly into it.
//   4–10 s  from the bottom of the bowl up, the poison burns off: a warm front climbs the bowl
//           (seen glowing through the metal), green above it, warm light below; the liquid clears
//           to bright metal. At the same time the faces, the LED wall, the rack lights and the
//           tubes in the reflections go dark.
//   10–14 s the empty cup lit from inside; the camera settles and holds still. The intro's hairline
//           scanlines try to crawl over the metal, find nothing to grip, slip off and fade.
//   14 s–   hold, still; the picture fades to black over the last 1.5 s.
import { grade, rgb, ease, clamp, orbit, mix } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { CYBER_GLSL } from '/song/lib/x-cyber.js';
import { CUP_GLSL } from '/song/lib/x-cup.js';
import { HALL_GLSL, HALL_UNIFORMS } from '/song/lib/x-a.js';

export const PH = 0.42;
const LEVEL = 0.9;
// scene-relative beats (seconds after P.from)
export const T26 = { gather0: 0.2, gather1: 2.2, sink1: 4.0, burn0: 4.0, burn1: 10.0, still: 10.0, scan0: 10.3, scan1: 13.2, caption: 10.5, ref: 13.0 };

export default (P) => {
  const t0 = P.from;
  const camera = (t) => {
    const u = t - t0;
    // one long eased move that lands at 10 s and then holds (no drift: stillness)
    const k = ease.inOut3(clamp(u / T26.still, 0, 1));
    return orbit(t, { target: [0, PH + 0.78 + 0.05 * k, 0], yaw: 0.62 - 0.2 * k, pitch: 0.3 + 0.28 * k, dist: 2.7 - 0.45 * k, fov: 34, drift: 0 });
  };
  const GP = [0, PH + 1.45, 0];
  return {
    name: 's26-clean-cup', from: P.from, to: P.to,
    frag: STUDIO_GLSL + CYBER_GLSL + CUP_GLSL + HALL_GLSL + /* glsl */ `
uniform float uGather, uBurn, uFade, uScanAmt, uScanY, uPtOn;
uniform vec3 uPt;
const float PH = ${PH.toFixed(3)};
const float LV = ${LEVEL.toFixed(3)};
const vec3 WARM = vec3(1.0, 0.8, 0.52);
float mapObj(vec3 p, out int id) {
  id = 2;
  float d = sdCyl(p - vec3(0, PH * 0.5, 0), 0.5, PH * 0.5) - 0.01;
  vec3 q = p - vec3(0, PH, 0);
  float c = chalice(q);
  if (c < d) { d = c; id = 1; }
  float lq = cupLiquid(q, LV - 0.34 * smoothstep(0.45, 0.95, uBurn) + 0.003 * (poisonSwirl(q.xz) - 0.5) * (1.0 - uBurn));
  if (lq < d) { d = lq; id = 3; }
  int hid; float h = hallSDF(p, hid); if (h < d) { d = h; id = hid; }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id >= 40) return hallMat(id, p, n);
  if (id == 2) { Mat m = LACQUER(vec3(0.01, 0.01, 0.012)); m.rough = 0.2 + 0.15 * fbm(p.xz * 9.0, 3); return m; }
  vec3 q = p - vec3(0, PH, 0);
  vec2 r = revo(q);
  // the burn front: a height in the bowl climbing from its floor to the rim
  float yF = mix(0.6, 1.04, uBurn);
  if (id == 3) {
    float clean = smoothstep(0.55, 0.9, uBurn);
    Mat m = M(mix(vec3(0.008, 0.02, 0.008), vec3(0.9, 0.86, 0.8), clean), mix(0.04, 0.1, clean), clean);
    m.clear = 1.0 - clean;
    float sw = poisonSwirl(q.xz);
    m.emit = poisonEmit(q.xz, 0.95 * (1.0 - smoothstep(0.0, 0.6, uBurn))) + WARM * 1.1 * smoothstep(0.1, 0.7, uBurn) * (0.45 + 0.55 * sw) * (1.0 - clean);
    return m;
  }
  Mat m = cupBlack(q, n);
  float bowl = smoothstep(0.6, 0.66, r.y) * step(r.y, CUP_RIM_Y - 0.03);
  float face = pow(sat(dot(n, normalize(uCamPos - p))), 1.3);
  float outer = step(0.0, dot(n, vec3(q.x, 0.0, q.z)));
  // seen through the wall while it burns: warm below the front, green above, a hot seam at it
  float burning = step(0.001, uBurn) * step(uBurn, 0.999);
  float dy = r.y - yF;
  float warmBand = exp(-dy * dy / 0.0036) * (1.0 - step(0.0, dy));
  float seam = exp(-dy * dy / 0.000144);
  m.emit += outer * bowl * face * burning * (WARM * 0.8 * warmBand + HGREEN * 0.25 * step(0.0, dy) + WARM * 2.5 * seam);
  // once clean, the inside of the bowl is lit from within
  float inBowl = (1.0 - outer) * step(0.6, r.y);
  m.emit += WARM * 1.3 * inBowl * smoothstep(0.0, 1.0, uBurn) * smoothstep(yF + 0.02, yF - 0.03, r.y);
  // the scanlines try to take hold and slip off
  m.emit += vec3(0.55, 0.9, 1.0) * cupScan(q, uScanY, uScanAmt);
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
  // the white light of s25 streaming in and gathering into one warm point
  if (uGather < 1.0) {
    for (int i = 0; i < 7; i++) {
      float fi = float(i);
      float a = fi * 0.8976 + 0.3;
      vec3 dir = normalize(vec3(cos(a), sin(a) * 0.8, 0.35 * sin(a * 2.0)));
      float R = 3.0 * (1.0 - uGather);
      vec3 A = uPt + dir * R, B = uPt + dir * R * 0.45;
      col += mix(vec3(1.0), WARM, uGather) * 2.0 * segGlow(ro, rd, A, B, depth, 0.006 + 0.012 * (1.0 - uGather)) * (1.0 - uGather);
    }
  }
  if (uPtOn > 0.001) {
    col += WARM * uPtOn * (segGlow(ro, rd, uPt, uPt + vec3(0, 1e-4, 0), depth, 0.012) * 4.0 + segGlow(ro, rd, uPt, uPt + vec3(0, 1e-4, 0), depth, 0.06) * 0.35);
  }
  return col * uFade;
}`,
    uniforms: {
      ...STUDIO_UNIFORMS, ...HALL_UNIFORMS,
      uGather: 0, uBurn: 0, uFade: 1, uScanAmt: 0, uScanY: 0.3, uPtOn: 0, uPt: GP,
    },
    camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      const x = t - t0;
      u.uGather.value = ease.inOut3(clamp((x - T26.gather0) / (T26.gather1 - T26.gather0), 0, 1));
      // the point: born as the streams arrive, then sinks into the cup and goes in under the surface
      const s = ease.inOut3(clamp((x - T26.gather1) / (T26.sink1 - T26.gather1), 0, 1));
      u.uPt.value = [0, mix(GP[1], PH + LEVEL - 0.02, s), 0];
      u.uPtOn.value = clamp((x - T26.gather0 - 1.2) / 0.8, 0, 1) * (1 - clamp((x - T26.sink1 + 0.15) / 0.3, 0, 1));
      u.uBurn.value = ease.inOut3(clamp((x - T26.burn0) / (T26.burn1 - T26.burn0), 0, 1));
      const b = u.uBurn.value;
      // the hall goes dark as the poison burns off; the cup's own light takes over
      u.uFaces.value = 1 - clamp(b * 1.6, 0, 1);
      u.uHallGlow.value = 1 - 0.85 * clamp(b * 1.3, 0, 1);
      u.uKeyCol.value = HALL_UNIFORMS.uKeyCol.map((v) => v * (1 - 0.45 * b));
      u.uP1.value = [0, PH + LEVEL + 0.3, 0];
      const pt = u.uPtOn.value;
      u.uP1c.value = [0.1 * (1 - b) + 1.3 * b + 1.2 * pt, 0.6 * (1 - b) + 1.0 * b + 0.95 * pt, 0.05 * (1 - b) + 0.6 * b + 0.6 * pt];
      // the scanlines: in, climbing, slipping off the top of the rim, gone
      const sc = clamp((x - T26.scan0) / (T26.scan1 - T26.scan0), 0, 1);
      u.uScanAmt.value = Math.sin(Math.PI * sc) * 0.7 * (0.75 + 0.25 * Math.sin(x * 23));
      u.uScanY.value = 0.2 + 1.1 * ease.inOut3(sc);
      u.uFade.value = 1 - ease.inOut3(clamp((t - (P.to - 1.5)) / 1.48, 0, 1));
    },
    post(t) { return grade(t, { exposure: 1.0, bloom: 0.09 }); },
  };
};
