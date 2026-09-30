// v2 helpers for the "Brood of vipers" hook scenes (s05, s08, s13, s21, s24). Picture modules only.
// Include XB_GLSL after STUDIO_GLSL, CYBER_GLSL and VIPER_GLSL (it uses gVt / sdViper / neonFace).
//
//   float helixViper(vec3 q, float Rc, float r, float H, float y0, float y1, float ph, float neck, float lean)
//     a cable-viper wound round a vertical pillar whose axis is the local y axis: the body is a helix
//     of radius Rc (pillar radius + r), pitch H per turn, climbing from y0 (thin tail) to y1, starting
//     at angle ph. At the top a neck of length `neck` rears straight up and leans outward by `lean`
//     with the chrome arrow head (sdViper). Sets gVt like sdViper (call keepViper() when it wins);
//     gVt.x runs 0..0.8 along the coil, then 0.8..1 along the neck.
//   float pulseAlong(float s, float speed, float n)   0..1 travelling current pulses along a body (s = gV.x)
//   vec3 faceScreen(vec2 uv, float smile, float blind, float seed, vec3 ink, float cell)
//     a stylised synthetic LED face on a screen panel (uv -1..1): pixel grid, scanlines, faint panel
//   float cableTraces(vec2 xz, vec2 o, float reach, float seed)   0..1 thin hidden cable paths on a
//     floor radiating from o out to `reach` metres (the paths the light reveals)
//   vec2 heatWarp(vec2 fc, float amt, float yc, float h)   heat-haze shimmer of fragCoord in a band round yc (px)
export const XB_GLSL = /* glsl */ `
float helixViper(vec3 q, float Rc, float r, float H, float y0, float y1, float ph, float neck, float lean) {
  float bound = max(length(q.xz) - Rc - r * 3.0 - lean - r * 3.0, max(y0 - r * 2.0 - q.y, q.y - y1 - neck - r * 4.0));
  if (bound > r * 3.0) return bound;
  float TAU = 6.2831853;
  float thMax = (y1 - y0) / H * TAU;
  float a = atan(q.z, q.x) - ph;
  float kk = floor(((q.y - y0) / H * TAU - a) / TAU + 0.5);
  float d = 1e9, bs = 0.0;
  for (int j = -1; j <= 1; j++) {
    float th = clamp(a + TAU * (kk + float(j)), 0.0, thMax);
    vec3 c = vec3(Rc * cos(th + ph), y0 + th / TAU * H, Rc * sin(th + ph));
    float s = th / max(thMax, 1e-3);
    float rad = r * mix(0.25, 1.0, smoothstep(0.0, 0.35, s));
    float dd = length(q - c) - rad;
    if (dd < d) { d = dd; bs = th; }
  }
  float gr = smoothstep(0.3, 0.5, abs(fract(bs * Rc / (r * 0.2)) - 0.5));
  d += r * 0.035 * gr;
  vec4 coil = vec4(bs / max(thMax, 1e-3) * 0.8, 0.0, gr, 0.0);
  // the neck: from the helix's top end straight up, leaning out along the radial direction
  float ta = thMax + ph;
  vec3 e = vec3(Rc * cos(ta), y1, Rc * sin(ta));
  vec3 nq = q - e;
  vec2 rad2 = vec2(cos(ta), sin(ta));
  // local frame: x = world up, y = radial out (the lift), z = tangent
  vec3 lq = vec3(nq.y + r * 0.4, dot(nq.xz, rad2), dot(nq.xz, vec2(-rad2.y, rad2.x)));
  float gt = gVipTail; gVipTail = 1.0;
  float nk = sdViper(lq, neck, r, r * 0.3, 2.0 / max(neck, 0.05), 0.0, lean, 2.2, vec3(1, 0, 0)) / 0.8;
  gVipTail = gt;
  vec4 nv = vec4(0.8 + 0.2 * gVt.x, gVt.yzw);
  float res = smin(d, nk, r * 0.6);
  gVt = nk < d ? nv : coil;
  return res * 0.8;
}
float pulseAlong(float s, float speed, float n) {
  float f = fract(s * n - uTime * speed);
  return smoothstep(0.0, 0.08, f) * smoothstep(0.3, 0.08, f);
}
vec3 faceScreen(vec2 uv, float smile, float blind, float seed, vec3 ink, float cell) {
  if (abs(uv.x) > 1.0 || abs(uv.y) > 1.0) return vec3(0);
  vec2 c; float px = ledMask(uv * 0.5 + 0.5, cell, c);
  vec2 cu = c * 2.0 - 1.0;
  float f = neonFace(cu * 1.12, smile, blind, seed);
  float lit = max(f, 0.07 + 0.05 * hash12(floor(c * cell) + seed));
  return ink * lit * px * scanlines(uv.y * cell, 3.14159);
}
float cableTraces(vec2 xz, vec2 o, float reach, float seed) {
  vec2 q = xz - o;
  float r = length(q);
  if (r > reach + 0.1 || r < 0.02) return 0.0;
  float a = atan(q.y, q.x);
  float m = 0.0;
  for (int i = 0; i < 9; i++) {
    float fi = float(i);
    float ai = fi * 0.698 + seed + 0.35 * sin(r * 1.7 + fi * 2.3) + 0.12 * sin(r * 5.3 + fi);
    float da = abs(mod(a - ai + PI, 2.0 * PI) - PI) * r;
    // each path branches once
    float db = abs(mod(a - ai - 0.35 * smoothstep(0.6 + 0.2 * fi * 0.1, 1.4, r) + PI, 2.0 * PI) - PI) * r;
    m = max(m, smoothstep(0.018, 0.006, min(da, db + step(r, 0.6) * 9.0)));
  }
  return m * smoothstep(reach + 0.1, reach - 0.2, r);
}
vec2 heatWarp(vec2 fc, float amt, float yc, float h) {
  float k = amt * exp(-pow((fc.y - yc) / max(h, 1.0), 2.0));
  if (k <= 0.001) return fc;
  return fc + vec2(sin(fc.y * 0.045 + uTime * 23.0) + 0.5 * sin(fc.y * 0.11 - uTime * 31.0), 0.0) * uRes.x * 0.0022 * k;
}
`;
