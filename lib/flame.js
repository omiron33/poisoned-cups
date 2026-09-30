// The running motif: one flame. A candle flame, a field of flames, a fire. Densities for the
// studio's FIRE volume (#define FIRE and return one of these, or a max of several, from fireDen).
// Everything flickers as a pure function of uTime.
export const FLAME_GLSL = /* glsl */ `
// a candle flame standing at base, height h, width r; seed varies its flicker
float candleFlame(vec3 p, vec3 base, float h, float r, float seed) {
  vec3 q = p - base;
  float y = q.y / h;
  if (y < -0.05 || y > 1.25) return 0.0;
  // sway: the tip moves more than the root
  float sw = y * y;
  q.x -= sw * r * 0.9 * (vnoise(vec2(uTime * 2.3 + seed, 0.0)) - 0.5);
  q.z -= sw * r * 0.9 * (vnoise(vec2(uTime * 1.9 + seed, 5.0)) - 0.5);
  float yy = clamp(y, 0.0, 1.0);
  float rad = r * pow(yy, 0.45) * pow(1.0 - yy, 0.9) * 2.2 + 0.0005;
  float d = length(q.xz) / rad;
  float n = fbm(vec3(q.x / r * 1.5, q.y / h * 3.0 - uTime * 3.5, q.z / r * 1.5 + seed), 3);
  float body = smoothstep(1.0, 0.25, d + (n - 0.5) * 0.7 * yy);
  return body * smoothstep(1.2, 0.7, y) * (0.55 + 0.6 * (1.0 - yy));
}
// a field of flames on the floor, one per cell of size cell, each with its own height and phase
float flameField(vec3 p, float cell, float h, float r, float amp) {
  vec2 id = floor(p.xz / cell + 0.5);
  float d = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 c = id + vec2(i, j);
    vec2 o = (hash22(c) - 0.5) * cell * 0.6;
    float hh = h * (0.55 + 0.9 * hash12(c + 7.0)) * (1.0 + amp * (vnoise(vec2(uTime * 1.3, hash12(c) * 40.0)) - 0.5));
    d = max(d, candleFlame(p, vec3(c.x * cell + o.x, 0.0, c.y * cell + o.y), hh, r, hash12(c) * 50.0));
  }
  return d;
}
// a rolling wall of fire (a burning city, a fire under glass)
float fireSheet(vec3 p, float h, float t) {
  if (p.y < 0.0 || p.y > h * 1.6) return 0.0;
  float n = fbm(vec3(p.x * 1.6, p.y * 1.4 - t * 2.6, p.z * 1.6), 5);
  float k = n * 1.6 - p.y / h;
  return smoothstep(0.15, 0.55, k);
}
`;
