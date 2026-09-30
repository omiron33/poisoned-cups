// Shared by s09-gnat and s10-loads (picture modules only; include after STUDIO_GLSL).
//   float sdCamelAt(vec3 q)   the brass camel, feet at y = 0, facing +x, about a metre tall (q in its frame)
//   float sdBelt(vec3 p)      a conveyor along x: belt top at BELT_TOP, half width 0.36, steel rails
//   Mat beltMat(vec3 p, float run)  black rubber belt with cleats moving by `run` metres, steel rails
export const S0910_GLSL = /* glsl */ `
const float BELT_TOP = 0.25;
float sdCamelAt(vec3 q) {
  float bb = sdBox(q - vec3(0.08, 0.5, 0.0), vec3(0.58, 0.55, 0.25));
  if (bb > 0.05) return bb;
  float d = sdEllipsoid(q - vec3(0.0, 0.62, 0.0), vec3(0.33, 0.17, 0.15));
  d = smin(d, sdEllipsoid(q - vec3(-0.03, 0.79, 0.0), vec3(0.17, 0.15, 0.11)), 0.07);
  d = smin(d, sdCapsule(q, vec3(0.27, 0.66, 0.0), vec3(0.44, 0.9, 0.0), 0.055), 0.05);
  d = smin(d, sdEllipsoid(q - vec3(0.52, 0.93, 0.0), vec3(0.1, 0.05, 0.048)), 0.03);
  vec3 r = vec3(q.x, q.y, abs(q.z));
  float legs = min(sdCapsule(r, vec3(0.2, 0.56, 0.08), vec3(0.23, 0.03, 0.08), 0.032),
                   sdCapsule(r, vec3(-0.21, 0.56, 0.08), vec3(-0.24, 0.03, 0.08), 0.032));
  d = smin(d, legs, 0.05);
  d = min(d, sdCapsule(q, vec3(-0.32, 0.64, 0.0), vec3(-0.38, 0.42, 0.0), 0.015));
  return d;
}
Mat camelMat(vec3 p) {
  Mat m = BRASS();
  m.rough = 0.2 + 0.12 * vnoise(p * 30.0);
  return dirty(m, p * 1.5, 0.3);
}
float sdBelt(vec3 p) {
  float bb = sdBox(p - vec3(0.0, 0.14, 0.0), vec3(8.0, 0.16, 0.46));
  if (bb > 0.05) return bb;
  float belt = sdRoundBox(p - vec3(0.0, BELT_TOP - 0.06, 0.0), vec3(8.0, 0.06, 0.36), 0.02);
  vec3 q = vec3(p.x, p.y, abs(p.z));
  float rail = sdBox(q - vec3(0.0, BELT_TOP - 0.05, 0.4), vec3(8.0, 0.075, 0.03));
  // legs every 1.2 m
  float lx = (fract(p.x / 1.2 + 0.5) - 0.5) * 1.2;
  float leg = sdBox(vec3(lx, p.y - 0.1, q.z - 0.4), vec3(0.03, 0.1, 0.03));
  return min(belt, min(rail, leg));
}
Mat beltMat(vec3 p, float run) {
  if (abs(p.z) > 0.37) { Mat m = M(vec3(0.5, 0.5, 0.52), 0.35, 1.0); return dirty(m, p * 2.0, 0.6); }
  Mat m = M(vec3(0.03, 0.03, 0.03), 0.6, 0.0);
  float cleat = smoothstep(0.02, 0.0, abs(fract((p.x - run) * 3.0) - 0.5) - 0.44);
  m.alb += cleat * 0.03;
  m.rough -= cleat * 0.25;
  return dirty(m, p * 3.0, 0.5);
}
`;
