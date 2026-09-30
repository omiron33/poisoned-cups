// Shared by the chorus scenes (s05, s08, s13, s16, s21, s24): the cable-viper (a black ribbed cable
// body with a chrome head), a simple chalice, server racks for the data hall, and a ring of flames. Picture modules only. Include VIPER_GLSL after STUDIO_GLSL (and
// FLAME_GLSL when a scene uses fireRing).
//
//   float sdViper(vec3 q, float L, float R, float amp, float k, float ph, float lift, float lp, vec3 hup)
//     q in the viper's own frame: the body runs along +x from the tail (x = 0) to the head (x = L).
//     R body radius; the body waves sideways (z) with amplitude amp, wavenumber k, phase ph; it
//     rises (y) toward the head by lift * (x/L)^lp (lp >= 1). hup is the head's up in this frame.
//     Cheap: one sine per call, no loops. Call keepViper() when it wins the min so material() can
//     use gV (s along the body, angle round it, head weight) for scales.
//   float viperAt(p, base, yaw, L, R, amp, k, ph, lift, lp)  a viper lying on the floor: tail at base,
//     heading along +x turned by yaw (radians, round y), head rising by lift
//   Mat viperMat(float iron)        black ribbed cable, chrome head; iron = 1 turns it to rigid steel
//   float sdRacks / Mat rackMat     a row of server racks with blinking status LEDs
//   float sdChalice(vec3 p)         a small chalice standing on its foot at the origin, 0.95 tall
//   float fireRing(vec3 p, float R, float h, float r, float n)   n flames in a ring of radius R
export const VIPER_GLSL = /* glsl */ `
vec4 gVt;   // last sdViper call: s, angle, groove, head
vec4 gV;    // the winning viper
vec2 gVl, gVlK;  // lens-face coordinates (last call, winner)
float gVipLens = 0.0;
float gVipFlick = -1.0;  // >= 0 freezes the tongue at that flick (0..1); < 0 flicks with time   // set to 1 before sdViper/viperAt to give the head a camera lens
void keepViper() { gV = gVt; gVlK = gVl; }

float gVipTail = 0.16;   // the tail's thickness (as a fraction of R)
float vipRad(float s) { return mix(gVipTail, 1.0, smoothstep(0.0, 0.5, s)) * (1.0 - 0.36 * smoothstep(0.74, 0.96, s)); }

float sdViper(vec3 q, float L, float R, float amp, float k, float ph, float lift, float lp, vec3 hup) {
  float x = clamp(q.x, 0.0, L);
  float s = x / L;
  float env = amp * (0.45 + 0.55 * s) * (1.0 - 0.75 * smoothstep(0.78, 1.0, s));
  float sn = sin(k * x - ph), cs = cos(k * x - ph);
  float zo = env * sn, dz = env * k * cs;
  float ps = pow(s, lp - 1.0);
  float yo = lift * ps * s, dy = lift * lp * ps / L;
  vec2 r = vec2((q.y - yo) / sqrt(1.0 + dy * dy), (q.z - zo) / sqrt(1.0 + dz * dz));
  float rad = R * vipRad(s);
  // ribs: the cable's corrugated sheath, rings along the body with a fine lengthwise seam
  float ang = atan(r.x, r.y);
  float gr = smoothstep(0.3, 0.5, abs(fract(x / (R * 0.2)) - 0.5));
  float body = length(vec3(q.x - x, r)) - rad + R * 0.035 * gr * step(0.0, q.x) * step(q.x, L);
  // the head: a flat wedge, wide behind the jaw, narrowing to the snout, along the body's tangent
  vec3 T = normalize(vec3(1.0, dy, dz));
  vec3 c = vec3(L, yo, zo) + T * R * 0.95;
  vec3 S = normalize(cross(T, hup)), U = cross(S, T);
  vec3 hq = q - c; hq = vec3(dot(hq, T), dot(hq, U), dot(hq, S));
  // a flat arrow head: wide at the jaw, narrow at the neck and the snout
  float hx = hq.x / (R * 1.9);
  float taper = mix(1.55, 0.35, sat(hx * 0.5 + 0.5)) * mix(0.55, 1.0, smoothstep(-1.0, -0.55, hx));
  float head = sdEllipsoid(vec3(hq.x, hq.y - 0.1 * R * sat(hq.x / R), hq.z / max(taper, 0.3)), vec3(R * 1.9, R * 0.55, R * 1.15)) * min(1.0, taper);
  // brow ridges over the eyes, and the eyes as dark slits cut under them
  head = smin(head, sdEllipsoid(vec3(hq.x + R * 0.2, hq.y - R * 0.3, abs(hq.z) - R * 0.85), vec3(R * 0.75, R * 0.22, R * 0.3)), R * 0.2);
  head = max(head, -sdEllipsoid(vec3(hq.x + R * 0.1, hq.y - R * 0.12, abs(hq.z) - R * 1.2), vec3(R * 0.35, R * 0.07, R * 0.3)));
  // the mouth line
  head = max(head, -sdEllipsoid(vec3(hq.x - R * 0.2, hq.y + R * 0.18, hq.z / max(taper, 0.3)), vec3(R * 1.8, R * 0.04, R * 1.3)));
  float d = smin(body, head, R * 0.6);
  gVt = vec4(s, ang, gr, smoothstep(R * 0.4, -R * 0.2, head - body));
  // the forked tongue flicks out in quick pairs
  float fl = gVipFlick >= 0.0 ? gVipFlick : pow(max(0.0, sin(uTime * 7.0 + L * 13.0)), 6.0) * step(0.2, fract(uTime * 0.6 + L));
  if (fl > 0.02 && gVipLens < 0.5) {
    float tl = R * (0.4 + 1.6 * fl);
    vec3 a = vec3(R * 1.75, -R * 0.15, 0.0), m = a + vec3(tl, 0.0, 0.0);
    float tg = sdCapsule(hq, a, m, R * 0.06);
    tg = min(tg, sdCapsule(vec3(hq.xy, abs(hq.z)), m, m + vec3(R * 0.5 * fl, R * 0.05, R * 0.28 * fl), R * 0.04));
    if (tg < min(body, head)) gVt.w = 3.0;
    d = min(d, tg);
  }
  if (gVipLens > 0.0) {
    // a surveillance lens in the snout: a short barrel along the head's axis, a glass face
    vec3 lq = vec3(hq.y, hq.x - R * 1.1, hq.z);
    float barrel = sdCyl(lq, R * 0.5, R * 0.95) - R * 0.04;
    if (barrel < d) { d = barrel; gVt.w = lq.y > R * 0.88 && length(lq.xz) < R * 0.42 ? 2.0 : 1.0; gVl = lq.xz / R; }
  }
  return d * 0.8;
}

// black ribbed cable (glossy rubber sheath, grime in the grooves) with a chrome head; iron = 1 turns
// the whole viper to cold, rigid steel (viperMat below)
float viperAt(vec3 p, vec3 base, float yaw, float L, float R, float amp, float k, float ph, float lift, float lp) {
  vec3 q = p - base;
  // cheap bound: skip the body when far from its bounding capsule
  vec2 dir = vec2(cos(yaw), sin(yaw));
  vec3 b = vec3(dir.x, 0.0, dir.y);
  float hb = sdCapsule(q, vec3(0), b * L, amp + R * 2.4 + lift);
  if (hb > R * 2.0) return hb;
  q.xz = vec2(dot(q.xz, dir), dot(q.xz, vec2(-dir.y, dir.x)));
  return sdViper(q, L, R, amp, k, ph, lift, lp, vec3(0, 1, 0));
}
// a viper lying coiled on the floor: a flat spiral (tail at the centre, turns outward) round base,
// turned by rot; the neck leaves the outer end and the head rests (lift) on the floor or the coils
float viperCoil(vec3 p, vec3 base, float a0, float R, float turns, float lift, float ph) {
  vec3 q = p - base;
  float bound = length(q.xz) - (R * 2.2 * turns + R * 6.0);
  bound = max(bound, q.y - R * 5.0 - lift);
  if (bound > R * 2.0) return bound;
  q.xz = rot(a0) * q.xz;
  float b = R * 2.15 / 6.2831853, r0 = R * 0.9;
  float th = atan(q.z, q.x); if (th < 0.0) th += 6.2831853;
  float rho = length(q.xz);
  float k0 = floor((rho - r0 - b * th) / (6.2831853 * b) + 0.5);
  float phiMax = 6.2831853 * turns;
  float d = 1e9; float bs = 0.0;
  for (int j = -1; j <= 1; j++) {
    float phi = clamp(th + 6.2831853 * (k0 + float(j)), 0.0, phiMax);
    float rs = r0 + b * phi;
    vec3 c = vec3(rs * cos(phi), 0.0, rs * sin(phi));
    float s = phi / phiMax;
    float rad = R * mix(0.3, 1.0, smoothstep(0.0, 0.6, s));
    float dd = length(vec3(q.x - c.x, q.y - rad, q.z - c.z)) - rad;
    if (dd < d) { d = dd; bs = phi; }
  }
  float rad = R * mix(0.3, 1.0, smoothstep(0.0, 0.6, bs / phiMax));
  float ang = 0.0;
  float gr = smoothstep(0.25, 0.5, abs(fract(bs * (r0 + b * bs) / (R * 0.34)) - 0.5));
  d += R * 0.07 * gr;
  vec4 coilV = vec4(bs / phiMax * 0.8, ang, gr, 0.0);
  // the neck and head leave the outer end along its tangent
  float rs = r0 + b * phiMax;
  vec3 e = vec3(rs * cos(phiMax), 0.0, rs * sin(phiMax));
  vec2 tg = normalize(vec2(-sin(phiMax) * rs + b * cos(phiMax), cos(phiMax) * rs + b * sin(phiMax)));
  vec3 hq = q - e - vec3(0.0, R, 0.0);
  hq.xz = vec2(dot(hq.xz, tg), dot(hq.xz, vec2(-tg.y, tg.x)));
  gVipTail = 1.0;
  float nk = sdViper(hq + vec3(R * 0.3, 0.0, 0.0), R * 4.5, R, R * 0.7, 1.6 / R, ph, lift, 2.0, vec3(0, 1, 0)) / 0.8;
  gVipTail = 0.16;
  if (nk < d) { d = smin(d, nk, R * 0.5); gVt = vec4(0.8 + 0.2 * gVt.x, gVt.yzw); } else { d = smin(d, nk, R * 0.5); gVt = coilV; }
  return d * 0.8;
}

// just the flat coil of a viper (no neck or head): tail at the centre, outer end at angle 2*pi*turns
// (radius R * (0.9 + 2.15 * turns)); use it as the base of a rising neck built with sdViper
float coilBody(vec3 q, float R, float turns) {
  float b = R * 2.15 / 6.2831853, r0 = R * 0.9;
  float bound = max(length(q.xz) - (r0 + b * 6.2831853 * turns + R * 2.0), q.y - R * 3.0);
  if (bound > R * 2.0) return bound;
  float th = atan(q.z, q.x); if (th < 0.0) th += 6.2831853;
  float rho = length(q.xz);
  float k0 = floor((rho - r0 - b * th) / (6.2831853 * b) + 0.5);
  float phiMax = 6.2831853 * turns;
  float d = 1e9, bs = 0.0;
  for (int j = -1; j <= 1; j++) {
    float phi = clamp(th + 6.2831853 * (k0 + float(j)), 0.0, phiMax);
    float rs = r0 + b * phi;
    float rad = R * mix(0.3, 1.0, smoothstep(0.0, 0.6, phi / phiMax));
    float dd = length(vec3(q.x - rs * cos(phi), q.y - rad, q.z - rs * sin(phi))) - rad;
    if (dd < d) { d = dd; bs = phi; }
  }
  float gr = smoothstep(0.3, 0.5, abs(fract(bs * (r0 + b * bs) / (R * 0.2)) - 0.5));
  gVt = vec4(bs / phiMax * 0.5, 0.0, gr, 0.0);
  return (d + R * 0.035 * gr) * 0.8;
}

Mat viperMat(float iron) {
  Mat m = M(vec3(0.035, 0.036, 0.04) * (1.0 - 0.6 * gV.z), 0.22 + 0.4 * gV.z, 0.0);
  m.clear = 1.0 - gV.z;
  Mat c = CHROME(); c.alb = vec3(0.86, 0.88, 0.9); c.rough = 0.06;
  if (gV.w > 1.5) {
    // blind: black glass, cracked
    Mat g = M(vec3(0.02), 0.04, 0.0); g.clear = 1.0;
    float cr = voronoiEdge(gVlK * 3.0 + 1.7).x;
    g.rough = mix(0.5, 0.03, smoothstep(0.0, 0.05, cr));
    g.alb += vec3(0.25) * smoothstep(0.04, 0.0, cr);
    return g;
  }
  if (gV.w > 2.5) return M(vec3(0.35, 0.02, 0.04), 0.3, 0.0);   // the tongue, blood red
  float h = min(gV.w, 1.0);
  m.alb = mix(m.alb, c.alb, h); m.rough = mix(m.rough, c.rough, h); m.metal = h; m.clear *= 1.0 - h;
  if (iron > 0.0) {
    Mat w = M(vec3(0.52, 0.53, 0.55) * (1.0 - 0.35 * gV.z), 0.3 + 0.2 * gV.z, 1.0);
    m.alb = mix(m.alb, w.alb, iron); m.rough = mix(m.rough, w.rough, iron); m.metal = mix(m.metal, 1.0, iron);
  }
  return m;
}

// a row of server racks along x at z = z0 (fronts facing +z), each w wide, h tall, gap between
float sdRacks(vec3 p, float z0, float w, float h, float gap, float n) {
  float pitch = w + gap;
  float i = clamp(floor(p.x / pitch + 0.5), -n, n);
  vec3 q = p - vec3(i * pitch, h * 0.5, z0);
  return sdBox(q, vec3(w * 0.5, h * 0.5, 0.45)) - 0.01;
}
// rack fronts: perforated steel doors with a sparse column of status lights (white, amber, a rare red)
Mat rackMat(vec3 p, vec3 n, float z0, float t) {
  // (assumes racks 0.64 wide on a 0.68 pitch)
  Mat m = M(vec3(0.3, 0.31, 0.33), 0.4, 0.6);
  if (n.z > 0.7) {
    float lx = fract((p.x + 0.34) / 0.68) * 0.68;
    // perforated steel door
    vec2 g = vec2(lx * 90.0, p.y * 90.0);
    float hole = smoothstep(0.28, 0.2, length(fract(g) - 0.5));
    m.alb *= 1.0 - 0.6 * hole * step(0.16, lx) * step(lx, 0.6);
    // a strip of status LEDs down the left of each rack, one per unit
    vec2 lg = vec2(lx * 55.0, p.y / 0.0445);
    vec2 id = floor(lg), f = fract(lg) - 0.5;
    float h = hash12(id + floor((p.x + 0.34) / 0.68) * 17.0);
    float inCol = step(3.0, id.x) * step(id.x, 3.0) * step(0.2, p.y);
    float blink = step(0.35, fract(h * 13.0 + t * (0.3 + 1.5 * h)));
    float led = smoothstep(0.3, 0.15, max(abs(f.x) * 0.8, abs(f.y) * 1.6)) * inCol * step(0.82, h) * blink;
    vec3 lc = h > 0.97 ? vec3(3.0, 0.25, 0.1) : (h > 0.9 ? vec3(3.0, 1.5, 0.35) : vec3(2.4, 2.4, 2.3));
    m.emit = lc * led;
  }
  return m;
}

float sdChalice(vec3 p) {
  float r = length(p.xz);
  float foot = sdCyl(p - vec3(0, 0.025, 0), 0.3, 0.02) - 0.008;
  float flare = sdRoundCone(p, vec3(0, 0.04, 0), vec3(0, 0.3, 0), 0.2, 0.035);
  float stem = sdCapsule(p, vec3(0, 0.2, 0), vec3(0, 0.6, 0), 0.034);
  float knop = sdEllipsoid(p - vec3(0, 0.4, 0), vec3(0.075, 0.045, 0.075));
  vec3 bc = p - vec3(0, 0.86, 0);
  float bowl = max(abs(length(bc) - 0.3) - 0.012, bc.y - 0.08);
  bowl = min(bowl, sdTorus(bc - vec3(0, 0.08, 0), vec2(sqrt(0.09 - 0.0064), 0.016)));
  float d = min(foot, smin(flare, stem, 0.06));
  d = smin(d, knop, 0.03);
  d = smin(d, bowl, 0.05);
  return d;
}

#ifdef FIRE
float fireRing(vec3 p, float R, float h, float r, float n) {
  float rho = length(p.xz);
  if (abs(rho - R) > r * 2.5 || p.y > h * 1.8 || p.y < -0.05) return 0.0;
  float sec = 6.2831853 / n;
  float a = atan(p.z, p.x);
  float i0 = floor(a / sec + 0.5);
  float side = (a / sec - i0) > 0.0 ? 1.0 : -1.0;
  float d = 0.0;
  for (int k = 0; k < 2; k++) {
    float i = i0 + (k == 0 ? 0.0 : side);
    float ai = i * sec;
    float hh = h * (0.7 + 0.6 * hash11(mod(i, n) * 7.13 + 1.0));
    d = max(d, candleFlame(p, vec3(R * cos(ai), 0.0, R * sin(ai)), hh, r, mod(i, n) * 13.7));
  }
  // a rolling wall of fire joining the tongues
  float wall = fireSheet(vec3(a * R, p.y, (rho - R) * 1.5), h * 0.75, uTime) * smoothstep(r * 1.6, r * 0.3, abs(rho - R));
  return max(d * 0.8, wall * 0.75);
}
#endif
`;
