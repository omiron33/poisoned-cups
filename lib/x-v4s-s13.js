// s13 helper (v4): snakeWrap from lib/x-v4-snake.js (include SNAKE_GLSL first) with a strike. The
// helix is the same; the neck rears off the top and, as `strike` goes 0..1, lunges outward along the
// radial direction (the head reaching toward the camera) instead of rearing straight up.
//   float snakeWrapStrike(p, base, Rp, R, H, y0, y1, a0, neck, gape, strike)
export const S13_GLSL = /* glsl */ `
float snakeWrapStrike(vec3 p, vec3 base, float Rp, float R, float H, float y0, float y1, float a0, float neck, float gape, float strike) {
  vec3 q = p - base;
  float Rc = Rp + R * 0.92;
  float reach = neck * (0.55 + 1.3 * strike);
  float hb = max(length(q.xz) - Rc - R * 3.0 - reach, max(y0 - R * 2.0 - q.y, q.y - y1 - neck - R * 4.0));
  if (hb > max(R * 2.0, 0.3)) return hb;
  float thMax = (y1 - y0) / H * SK_TAU;
  float arcH = thMax * sqrt(Rc * Rc + pow(H / SK_TAU, 2.0));
  float nl = neck * (1.7 + 1.1 * strike), Lt = arcH + nl, sC = arcH / Lt;
  float ta = thMax + a0;
  vec3 rv = vec3(cos(ta), 0.0, sin(ta));
  vec3 Th = normalize(vec3(-Rc * sin(ta), H / SK_TAU, Rc * cos(ta)));
  vec3 e0 = vec3(Rc * cos(ta), y1, Rc * sin(ta));
  float up = neck * (1.0 - 0.35 * strike);
  vec3 eh = e0 + vec3(0.0, up, 0.0) + rv * reach;
  skCubic(e0, e0 + Th * neck * 0.3, e0 + vec3(0.0, up, 0.0) + rv * neck * (0.05 + 0.6 * strike), eh, 7, normalize(cross(vec3(0, 1, 0), rv)), 0);
  float nk = skChain(q, 7, sC, 1.0, arcH, Lt, R, gape, 0.0, 0.55, a0 + Rp);
  vec4 nt = gSkT;
  float a = atan(q.z, q.x) - a0;
  float kk = floor(((q.y - y0) / H * SK_TAU - a) / SK_TAU + 0.5);
  float d = 1e9, bs = 0.0;
  for (int j = -1; j <= 1; j++) {
    float th = clamp(a + SK_TAU * (kk + float(j)), 0.0, thMax);
    float s = th / thMax * sC;
    float dd = length(q - vec3(Rc * cos(th + a0), y0 + th / SK_TAU * H, Rc * sin(th + a0))) - R * skRad(s);
    if (dd < d) { d = dd; bs = th; }
  }
  float s = bs / thMax * sC;
  vec3 c = vec3(Rc * cos(bs + a0), y0 + bs / SK_TAU * H, Rc * sin(bs + a0));
  vec3 T = normalize(vec3(-Rc * sin(bs + a0), H / SK_TAU, Rc * cos(bs + a0)));
  vec3 U = normalize(vec3(c.x, 0.0, c.z));
  U = normalize(U - T * dot(U, T));
  vec3 r = q - c;
  float ang = atan(dot(r, cross(T, U)), dot(r, U));
  float x = s / sC * arcH;
  if (d < R * 0.3) d += R * 0.025 * (1.0 - skScaleGroove(x / R, ang, skRad(s))) * step(-0.3, cos(ang));
  if (d < nk) gSkT = vec4(s, ang, 0.0, x); else gSkT = nt;
  gSkTR = R;
  return smin(d, nk, R * 0.4) * 0.85;
}
`;
