// v2 picture helpers for s02, s03, s04 and s07 (screens, tribute graphics, decay). Include XC_GLSL
// after STUDIO_GLSL and CYBER_GLSL. All deterministic in uTime.
//   float conciergeFace(vec2 uv, float smile, float seed)   a faceless synthetic concierge: head
//        outline and a smile, no eyes, no brows (uv -1..1). Returns a 0..1 line mask.
//   float laurelRing(vec2 uv, float r, float leaves)         a UI laurel: two arcs of leaf dashes
//        round a face, open at the top and bottom. Returns a 0..1 mask.
//   float checker(vec2 uv, float n)                          a deleted-pixel transparency checker
//   float crackMask(vec2 uv, float scale, float w)           hairline cracks in an image layer
//   float deadRows(float y, float rows, float rate, float k) 1 for LED rows that are working, 0 for
//        rows that have failed (k = fraction failing), flickering at `rate`
//   float decay(vec3 p, float t)                             a pulsing corruption bloom (0..1)
export const XC_GLSL = /* glsl */ `
float conciergeFace(vec2 uv, float smile, float seed) {
  float w = 0.04;
  vec2 hs = vec2(0.6 + 0.05 * hash11(seed), 0.8 + 0.05 * hash11(seed + 3.1));
  float head = abs(length(uv / hs) - 1.0) * min(hs.x, hs.y);
  float m = stroke(head, w);
  // shoulders: a wide shallow arc under the chin
  m = max(m, stroke(sdArc2(uv, vec2(0.0, -2.05), 1.25, PI * 0.28, PI * 0.72), w));
  // the smile, wide and even: the only feature
  float r = 0.36;
  float mouth = sdArc2(uv, vec2(0.0, -0.08 + 0.1 * smile), r, -PI * 0.5 - 0.95 * smile, -PI * 0.5 + 0.95 * smile);
  m = max(m, stroke(mouth, w * 1.15));
  return m;
}
float laurelRing(vec2 uv, float r, float leaves) {
  float a = atan(uv.x, uv.y);          // 0 at the top, +-PI at the bottom
  float aa = abs(a);
  if (aa < 0.35 || aa > PI - 0.5) return 0.0;
  float rr = length(uv);
  float seg = (PI - 0.85) / leaves;
  float k = floor((aa - 0.35) / seg);
  float f = fract((aa - 0.35) / seg) - 0.5;
  // each leaf: a small tilted ellipse just outside the ring, alternating in and out
  float side = mod(k, 2.0) < 0.5 ? 1.0 : -1.0;
  vec2 q = vec2(f * seg * r * 2.2, rr - r - side * 0.035 * r);
  q = rot(0.6 * side) * q;
  float leaf = smoothstep(1.0, 0.7, length(q / vec2(0.07 * r, 0.03 * r)));
  float stem = smoothstep(0.008 * r, 0.003 * r, abs(rr - r));
  return max(leaf, stem);
}
float checker(vec2 uv, float n) { vec2 g = floor(uv * n); return mod(g.x + g.y, 2.0); }
float crackMask(vec2 uv, float scale, float w) { return smoothstep(w, w * 0.2, voronoiEdge(uv * scale).x); }
float deadRows(float y, float rows, float rate, float k) {
  float r = floor(y * rows);
  float h = hash12(vec2(r, floor(uTime * rate)));
  return step(k, hash11(r * 7.13 + 0.5)) * (h > 0.93 ? 0.3 : 1.0);
}
float decay(vec3 p, float t) {
  // veins of corruption: thin bright lines along the edges of a noisy cell pattern
  float n = fbm(p * 5.0 + vec3(0.0, t * 0.12, 0.0), 3);
  float v = voronoiEdge(p.xy * 9.0 + p.z * 4.0 + n * 2.0).x;
  float pulse = 0.55 + 0.45 * sin(t * 5.0 - p.y * 9.0);
  return smoothstep(0.06, 0.0, v) * smoothstep(0.45, 0.65, n) * pulse;
}
`;
