// The hypocrites: a pair of empty white gloves (no body inside), built once for any scene.
// Picture modules only; include GLOVE_GLSL after STUDIO_GLSL.
//
//   float glove(vec3 p, vec3 pose, float side)
//     p     point in the glove's frame: cuff opening at the origin, fingers up +y, palm faces +z.
//           Height about 0.42 (cuff 0.12, palm 0.14, fingers 0.16). Scale with glove(p / s, ...) * s.
//     pose  x = curl of middle, ring and little fingers (0 open .. 1 clenched)
//           y = curl of the index finger, z = curl of the thumb
//           Presets: GLOVE_OPEN (0,0,0), GLOVE_POINT (1,0,1), GLOVE_FIST (1,1,1), GLOVE_RAISED (0,0,0)
//           (raised is the open glove stood upright, palm out: rotate it yourself for other angles)
//     side  +1 right glove, -1 left glove (mirrors the thumb)
//   float gloveBound(vec3 p)   cheap bounding distance (use to skip the glove when far away)
//   Mat gloveMat(vec3 p)       white cotton with fine knit, stitched seams on the back, a sheen
export const GLOVE_GLSL = /* glsl */ `
const vec3 GLOVE_OPEN = vec3(0.0), GLOVE_POINT = vec3(1.0, 0.0, 1.0), GLOVE_FIST = vec3(1.0), GLOVE_RAISED = vec3(0.0);
float gloveBound(vec3 p) { return length(p - vec3(0, 0.22, 0)) - 0.3; }
// one finger from knuckle k, length L, radius r, curled by c (bends toward the palm, +z)
float gFinger(vec3 p, vec3 k, float L, float r, float c, float splay) {
  vec3 d0 = normalize(vec3(splay, 1.0, 0.0));
  float a1 = c * 1.5, a2 = c * 1.7;
  vec3 d1 = normalize(vec3(d0.x * cos(a1), d0.y * cos(a1), sin(a1)));
  vec3 j1 = k + d1 * L * 0.55;
  vec3 d2 = normalize(vec3(d0.x * cos(a1 + a2), d0.y * cos(a1 + a2), sin(a1 + a2)));
  vec3 tip = j1 + d2 * L * 0.45;
  return min(sdCapsule(p, k, j1, r), sdCapsule(p, j1, tip, r * 0.92));
}
float glove(vec3 p, vec3 pose, float side) {
  float b = gloveBound(p);
  if (b > 0.05) return b;
  p.x *= side;
  // the cuff: a flared, slightly open tube
  float cuffR = 0.052 + 0.018 * sat(1.0 - p.y / 0.12);
  float cuff = max(abs(length(p.xz * vec2(1.0, 1.45)) - cuffR) - 0.005, abs(p.y - 0.06) - 0.06);
  // wrist and palm: a flattened rounded box
  float palm = sdRoundBox(p - vec3(0, 0.19, 0), vec3(0.045, 0.07, 0.012), 0.02);
  palm = smin(palm, sdEllipsoid(p - vec3(0, 0.12, 0), vec3(0.05, 0.04, 0.033)), 0.03);
  float d = smin(cuff, palm, 0.02);
  // fingers: index, middle, ring, little
  float fi = gFinger(p, vec3(-0.042, 0.255, 0.0), 0.15, 0.0125, pose.y, -0.08);
  float fm = gFinger(p, vec3(-0.014, 0.262, 0.0), 0.165, 0.013, pose.x, -0.02);
  float fr = gFinger(p, vec3(0.014, 0.258, 0.0), 0.155, 0.0125, pose.x, 0.04);
  float fl = gFinger(p, vec3(0.041, 0.248, 0.0), 0.12, 0.011, pose.x, 0.12);
  float f = min(min(fi, fm), min(fr, fl));
  d = smin(d, f, 0.012);
  // thumb: from the base of the palm, out and up, folding across the palm when curled
  vec3 t0 = vec3(-0.05, 0.15, 0.01);
  vec3 t1 = t0 + mix(vec3(-0.045, 0.05, 0.02), vec3(0.0, 0.04, 0.035), pose.z);
  vec3 t2 = t1 + mix(vec3(-0.02, 0.05, 0.005), vec3(0.04, 0.0, 0.01), pose.z);
  float th = min(sdCapsule(p, t0, t1, 0.016), sdCapsule(p, t1, t2, 0.0135));
  d = smin(d, th, 0.015);
  return d;
}
Mat gloveMat(vec3 p) {
  Mat m = M(vec3(0.97, 0.97, 0.95), 0.7, 0.0);
  m.sheen = 0.6;
  float knit = vnoise(p * vec3(900.0, 300.0, 900.0));
  m.alb *= 0.93 + 0.07 * knit;
  // three stitched seams on the back of the hand
  float seam = 0.0;
  for (int i = -1; i <= 1; i++) seam = max(seam, smoothstep(0.0025, 0.0, abs(p.x - float(i) * 0.02)) * step(0.13, p.y) * step(p.y, 0.24));
  m.alb *= 1.0 - 0.18 * seam * step(p.z, -0.005);
  return m;
}
`;
