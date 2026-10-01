// s05 helper (v4): a coiled snake whose head can be steered and lifted. Same pile as snakeCoil in
// lib/x-v4-snake.js (include SNAKE_GLSL first), but the resting head's direction and its lift are
// parameters so the scene can raise the nearest head on "vipers" and turn every head toward the fire.
//   float snakeCoilH(p, base, yaw, R, turns, ph, headDirWorld, lift)
//     headDirWorld: the world-space angle (atan(z, x)) the head should look along; lift (m) raises the
//     head and the top of the neck off the pile.
export const S05_GLSL = /* glsl */ `
float snakeCoilH(vec3 p, vec3 base, float yaw, float R, float turns, float ph, float headW, float lift) {
  vec3 q = skLocal(p, base, yaw);
  float b = R * 2.0 / SK_TAU, rin = R * 1.7, Phi = SK_TAU * turns, rout = rin + b * Phi, rise = 0.55 * R;
  float top = rise * turns + R * 2.0 + lift;
  float hb = max(length(q.xz) - rout - R * 3.0, q.y - top - R * 4.0);
  if (hb > max(R * 2.0, 0.3)) return hb;
  float arcC = Phi * (rin + b * Phi * 0.5);
  float pe = Phi;
  vec3 e0 = vec3(rin * cos(pe), R + rise * turns, rin * sin(pe));
  vec3 T0 = normalize(vec3(-rin * sin(pe) - b * cos(pe), 0.0, rin * cos(pe) - b * sin(pe)));
  // head direction in the local frame (yaw turns +x to (cos yaw, sin yaw) in xz)
  float ha = headW - yaw + 0.12 * sin(uTime * 0.7 + ph);
  vec3 hd = vec3(cos(ha), 0.0, sin(ha));
  // the head sits just outside the inner turn on the side it looks toward, raised by lift
  vec3 eh = vec3(0.0, R * 2.6 + rise * turns + lift, 0.0) + hd * (rin + 1.0 * R + 0.9 * lift);
  vec3 cc = e0 + T0 * R * 2.2 + vec3(0.0, R * 2.4 + lift * 0.7, 0.0);
  float nl = length(eh - e0) * 1.25 + R * 2.0;
  float Lt = arcC + nl, sC = arcC / Lt;
  skCubic(e0, cc, eh - hd * R * 1.6 + vec3(0.0, R * 0.2 - lift * 0.25, 0.0), eh, 6, vec3(0), 0);
  float nk = skChain(q, 6, sC, 1.0, arcC, Lt, R, 0.0, 0.0, 0.0, ph);
  vec4 nt = gSkT;
  float th = atan(q.z, q.x); if (th < 0.0) th += SK_TAU;
  float rho = length(q.xz);
  float k0 = floor((rout - rho - b * th) / (SK_TAU * b) + 0.5);
  float d = 1e9, bp = 0.0;
  for (int j = -1; j <= 1; j++) {
    float phi = clamp(th + SK_TAU * (k0 + float(j)), 0.0, Phi);
    float rs = rout - b * phi;
    float s = phi / Phi * sC;
    float rad = R * skRad(s);
    float dd = length(q - vec3(rs * cos(phi), rad + rise * phi / SK_TAU, rs * sin(phi))) - rad;
    if (dd < d) { d = dd; bp = phi; }
  }
  float rs = rout - b * bp, s = bp / Phi * sC;
  vec3 c = vec3(rs * cos(bp), R * skRad(s) + rise * bp / SK_TAU, rs * sin(bp));
  vec3 T = normalize(vec3(-rs * sin(bp) - b * cos(bp), rise / SK_TAU, rs * cos(bp) - b * sin(bp)));
  vec3 U = normalize(vec3(0, 1, 0) - T * T.y);
  vec3 r = q - c;
  float ang = atan(dot(r, cross(T, U)), dot(r, U));
  float x = s / sC * arcC;
  if (d < R * 0.3) d += R * 0.025 * (1.0 - skScaleGroove(x / R, ang, skRad(s))) * step(-0.3, cos(ang));
  if (d < nk) gSkT = vec4(s, ang, 0.0, x); else gSkT = nt;
  gSkTR = R;
  return smin(d, nk, R * 0.4) * 0.85;
}
`;
