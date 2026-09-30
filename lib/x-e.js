// v2 shared picture helpers for s11-widow, s12-gate, s19-silver and s20-door (the money and access
// scenes). Include E_GLSL after STUDIO_GLSL (and CYBER_GLSL when using the face screens).
//   float sdHexPrism(vec3 p, vec2 h)       a hex token lying in its xz plane
//   float credit(vec3 q, float i)           i even: a silver coin; i odd: a hex token; lying flat
//   mat3 tumble(float a, float b)           a rotation for tumbling pieces
//   float figure(vec3 p, float h, float seed) an anonymous standing silhouette (capsules), feet at p = 0
//   float tubeLight(vec3 p, vec3 a, vec3 b)  a fluorescent tube (thin capsule) from a to b
//   vec3 corridorGlow(vec3 rd)              a cheap purple/green tube-lit corridor environment term
export const E_GLSL = /* glsl */ `
float sdHexPrism(vec3 p, vec2 h) {
  const vec3 k = vec3(-0.8660254, 0.5, 0.57735);
  p = abs(p);
  p.xz -= 2.0 * min(dot(k.xy, p.xz), 0.0) * k.xy;
  vec2 d = vec2(length(p.xz - vec2(clamp(p.x, -k.z * h.x, k.z * h.x), h.x)) * sign(p.z - h.x), p.y - h.y);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}
float credit(vec3 q, float i) {
  if (mod(i, 2.0) < 0.5) {
    float rr = length(q.xz);
    return sdCyl(q, 0.1, 0.008 + 0.003 * smoothstep(0.083, 0.092, rr)) - 0.003;
  }
  return sdHexPrism(q, vec2(0.085, 0.009)) - 0.003;
}
mat3 tumble(float a, float b) {
  float ca = cos(a), sa = sin(a), cb = cos(b), sb = sin(b);
  return mat3(cb, 0, -sb, 0, 1, 0, sb, 0, cb) * mat3(1, 0, 0, 0, ca, sa, 0, -sa, ca);
}
// silver credit material: machined face rings, a fine hex microtexture on tokens
Mat creditMat(vec3 p) {
  Mat m = SILVER();
  m.alb = vec3(0.82, 0.83, 0.86);
  m.rough = 0.05 + 0.1 * vnoise(p * 140.0);
  return m;
}
// an anonymous silhouette: head, neck, shoulders, a coat to the knees, legs; h = height
float figure(vec3 p, float h, float seed) {
  float s = h / 1.75;
  vec3 q = p / s;
  float b = length(q - vec3(0, 0.95, 0)) - 0.95;
  if (b > 0.3) return b * s;
  q.x += 0.02 * sin(seed * 7.0) * q.y;
  float head = sdEllipsoid(q - vec3(0, 1.63, 0), vec3(0.095, 0.12, 0.105));
  float neck = sdCapsule(q, vec3(0, 1.45, 0), vec3(0, 1.55, 0), 0.05);
  float torso = sdRoundCone(q, vec3(0, 0.62, 0), vec3(0, 1.32, 0), 0.19, 0.2);
  torso = smin(torso, sdCapsule(q, vec3(-0.17, 1.36, 0), vec3(0.17, 1.36, 0), 0.07), 0.08);
  float arms = min(sdCapsule(vec3(abs(q.x), q.yz), vec3(0.22, 1.33, 0), vec3(0.25, 0.85, 0.06), 0.055),
                   sdCapsule(vec3(abs(q.x), q.yz), vec3(0.25, 0.85, 0.06), vec3(0.14, 0.72, 0.16), 0.045));
  float legs = sdCapsule(vec3(abs(q.x), q.yz), vec3(0.1, 0.05, 0), vec3(0.1, 0.62, 0), 0.07);
  float d = smin(min(head, neck), torso, 0.06);
  d = smin(d, arms, 0.04);
  d = smin(d, legs, 0.05);
  return d * s;
}
float tubeLight(vec3 p, vec3 a, vec3 b) { return sdCapsule(p, a, b, 0.022); }
`;

// The pale robotic hand of s18 (the same shape, so s19 continues it): wrist at the origin in its
// local frame, fingers up (+y), palm facing +z. Ceramic white plates, dark joints (handMat).
export const HAND_GLSL = /* glsl */ `
float robotHand(vec3 q) {
  float arm = sdCapsule(q, vec3(0, -1.2, 0), vec3(0, -0.02, 0), 0.034);
  float b = length(q - vec3(0, 0.1, 0)) - 0.2;
  if (b > 0.05) return min(arm, b);
  float d = min(arm, sdTorus(q + vec3(0, 0.02, 0), vec2(0.036, 0.011)));
  d = min(d, sdRoundBox(q - vec3(0, 0.075, 0), vec3(0.05, 0.055, 0.014), 0.012));
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float a = (fi - 1.5) * 0.12;
    float L = (fi == 1.0 || fi == 2.0) ? 0.034 : 0.029;
    vec3 p0 = vec3(-0.039 + 0.026 * fi, 0.135, 0.0);
    vec3 dir = vec3(sin(a), cos(a), 0.0);
    vec3 p1 = p0 + dir * L;
    vec3 p2 = p1 + normalize(dir + vec3(0, 0, 0.25)) * L * 0.9;
    vec3 p3 = p2 + normalize(dir + vec3(0, 0, 0.55)) * L * 0.75;
    float f = min(min(sdCapsule(q, p0, p1 - dir * 0.004, 0.0105), sdCapsule(q, p1, p2 - dir * 0.004, 0.0095)), sdCapsule(q, p2, p3, 0.0085));
    d = min(d, f);
  }
  vec3 t0 = vec3(0.045, 0.05, 0.008), t1 = vec3(0.085, 0.09, 0.02), t2 = vec3(0.105, 0.125, 0.03);
  d = min(d, min(sdCapsule(q, t0, t1, 0.012), sdCapsule(q, t1 + vec3(0.003, 0.003, 0), t2, 0.0105)));
  return d;
}
Mat handMat(vec3 q, vec3 green) {
  Mat m = M(vec3(0.84, 0.85, 0.87), 0.28, 0.0); m.clear = 0.5;
  float knuck = smoothstep(0.004, 0.0, abs(fract((q.y - 0.135) / 0.031 + 0.1) - 0.1) - 0.08) * step(0.135, q.y);
  float wrist = smoothstep(0.03, 0.0, abs(q.y + 0.02) - 0.012);
  m.alb = mix(m.alb, vec3(0.12, 0.12, 0.13), max(knuck * 0.8, wrist));
  m.rough = mix(m.rough, 0.5, wrist);
  m.emit = green * 2.0 * smoothstep(0.012, 0.0, length(q - vec3(0.0, -0.06, 0.035)));
  return m;
}
`;
