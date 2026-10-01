// v4 vipers (docs/V4-DIRECTION.md 4.1). Real snakes first, cables second: a wedge viper head with
// brow ridges, domed eyes with an emissive slit pupil, heat pits, nostrils, a hinged jaw that gapes
// to ~70 degrees and swings two chrome fangs forward, the forked tongue; a body that tapers from the
// neck (0.55 R) through full girth (30-55% of the length) to a 0.12 R tail tip; dorsal diamond/hex
// scales in black gunmetal over a faint cable braid, a thin emissive spine pinstripe with acid-green
// pulses running head to tail, wide pale-silver belly scutes, black-chrome machined head plates; an
// optional cobra hood (3-3.5x neck width, ribbed) carrying a cold-white camera-iris marking on its back.
// Picture modules only. Include SNAKE_GLSL after STUDIO_GLSL (it uses Mat/M/CHROME). It shares no
// names with x-viper.js / x-b.js, so a scene may include both.
//
// Frames: every snake's local frame has the ground under its belly at y = 0; yaw turns +x round y
// (direction (cos yaw, 0, sin yaw)), like viperAt. R = full body radius, L = length (metres).
//
//   float sdSnake(vec3 q, float L, float R, float amp, float k, float ph, float lift, float lp, float gape, float hood)
//     the analytic slithering snake, sdViper's frame: tail at x = 0, head at x = L facing +x.
//     amp/k/ph: sideways (z) undulation, amplitude growing toward the tail, ph travels (slither).
//     lift: the front rises by lift metres in an S and the head ends level; lp >= 1 sets where the
//     rise starts (s0 = 1 - 0.8 / lp: lp 2 -> front 40%, lp 4 -> front 20%). gape 0..1, hood 0..1.
//   float snakeAt(p, base, yaw, L, R, amp, k, ph, lift, lp, gape, hood)   sdSnake placed in the world
//   float snakeCoil(p, base, yaw, R, turns, ph)            resting pile: tail outside, spiralling in
//                                                          and up, the neck rises and the head rests on top
//   float snakeRear(p, base, yaw, L, R, h, ph, gape, hood) body on the ground, front raised in an S to
//                                                          head height h, head level facing +x; hood 1 = cobra
//   float snakeStrike(p, base, yaw, L, R, k, ph)           k 0 cocked S-neck .. 1 full lunge; gape follows k
//   float snakeWrap(p, base, Rp, R, H, y0, y1, a0, neck, gape, hood)
//                                                          helix round a vertical pillar (radius Rp, axis
//                                                          = base's y), pitch H, tail at y0, top at y1, start
//                                                          angle a0; a neck of height `neck` rears off the
//                                                          top and the head looks outward, level
//   float snakePour(p, edge, yaw, L, R, hEdge, flow, gape) flows along a ledge top (height hEdge, its
//                                                          edge at `edge`, the drop along +x), over the edge,
//                                                          down the face and out onto the floor; flow (m) is
//                                                          how far the head has travelled past the edge
//   void keepSnake()            call when a snake wins the min in mapObj (like keepViper)
//   Mat snakeMat(vec3 p, vec3 n, float iron)   the material; iron = 1 turns it to rigid steel (s24/s25)
//
// Globals scenes may set before the calls / material:
//   gSkFlick (-1)    tongue: < 0 flicks with uTime, 0..1 freezes it (0 = in)
//   gSkEye           slit-pupil colour (default acid green; vec3(3.4, 0.25, 1.6) for hot magenta)
//   gSkPulse (1)     strength of the spine pinstripe pulses (0 = off)
//   gSkIris (1)      strength of the hood's camera-iris marking
// Cost: one bounding test per snake, at most 9 round cones + 3 coil/helix candidates, no other loops.
export const SNAKE_GLSL = /* glsl */ `
float gSkFlick = -1.0;
vec3 gSkEye = vec3(0.55, 3.4, 0.45);
float gSkPulse = 1.0;
float gSkIris = 1.0;
vec4 gSkT, gSk;      // s (0 tail .. 1 head), angle round the body (0 = spine, +-pi = belly), part, x metres
vec3 gSkTe, gSkE;    // head coords (units of R) or eye coords (units of eye radius)
vec3 gSkTh, gSkH;    // hood coords (units of R)
float gSkTR, gSkR;   // the snake's R
float gSkHp;         // part from the last skHead call
void keepSnake() { gSk = gSkT; gSkE = gSkTe; gSkH = gSkTh; gSkR = gSkTR; }
// parts: 0 body, 1 head plate, 2 eye, 3 tongue, 4 fang, 5 mouth, 6 hood

const float SK_TAU = 6.2831853;
vec3 gSkP[10];
vec3 gSkU[10];

// radius along the body as a fraction of R: 0.12 at the tail tip, full from 0.4 to 0.6, 0.55 at the neck
float skRad(float s) { return mix(0.12, 1.0, smoothstep(0.0, 0.4, s)) * mix(1.0, 0.55, smoothstep(0.6, 0.97, s)); }

float skTrap(vec2 p, float r1, float r2, float he) {
  vec2 k1 = vec2(r2, he), k2 = vec2(r2 - r1, 2.0 * he);
  p.x = abs(p.x);
  vec2 ca = vec2(p.x - min(p.x, (p.y < 0.0) ? r1 : r2), abs(p.y) - he);
  vec2 cb = p - k1 + k2 * clamp(dot(k1 - p, k2) / dot(k2, k2), 0.0, 1.0);
  float s = (cb.x < 0.0 && ca.y < 0.0) ? -1.0 : 1.0;
  return s * sqrt(min(dot(ca, ca), dot(cb, cb)));
}
// scale relief (0..1, 1 in the grooves) on the body: a diamond lattice in (x, arc) units of R
float skScaleGroove(float xr, float ang, float rr) {
  vec2 uv = vec2(xr, ang * rr) / 0.3;
  vec2 g = vec2(uv.x + uv.y, uv.x - uv.y) * 0.7071;
  vec2 f = abs(fract(g) - 0.5);
  return smoothstep(0.36, 0.5, max(f.x, f.y));
}

// the head. r = point relative to the neck end, T forward, U dorsal. Units: R.
float skHead(vec3 r, vec3 T, vec3 U, float R, float gape, float seed) {
  vec3 S = cross(T, U);
  vec3 h = vec3(dot(r, T), dot(r, U), dot(r, S)) / R;
  h.x += 0.3;
  float fl = gSkFlick >= 0.0 ? gSkFlick : pow(max(0.0, sin(uTime * 7.0 + seed * 13.0)), 6.0) * step(0.2, fract(uTime * 0.6 + seed));
  float bnd = length(h - vec3(1.1, -0.1, 0.0)) - 1.9 - 0.8 * gape - 2.2 * step(0.02, fl);
  if (bnd * R > max(0.3, 2.5 * R)) { gSkHp = 1.0; gSkTe = h; return bnd * R; }
  gSkHp = 1.0; gSkTe = h;
  // the skull: a wedge in plan (wide at the jaw hinge, blunt round snout), flat crown sloping down
  vec3 a = vec3(h.x, h.y, abs(h.z));
  float plan = skTrap(vec2(h.z, h.x - 1.05), 0.72, 0.18, 1.0) - 0.25;
  float ht = mix(0.46, 0.27, sat(h.x / 2.4));
  vec2 w = vec2(plan + 0.12, abs(h.y - (ht - 0.08) * 0.5) - (ht + 0.08) * 0.5 + 0.12);
  float sk = min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - 0.12;
  // raised brow ridges over the eyes (supraoculars)
  sk = smin(sk, sdEllipsoid(a - vec3(1.05, 0.37, 0.56), vec3(0.48, 0.12, 0.2)), 0.1);
  // heat pit between eye and nostril; nostrils at the snout
  sk = max(sk, -(length(a - vec3(1.78, 0.1, 0.52)) - 0.085));
  sk = max(sk, -(length(a - vec3(2.22, 0.17, 0.17)) - 0.055));
  bool mouthU = h.y < -0.03 && plan < -0.1;
  // the lower jaw, hinged at the back, drops to ~70 degrees with gape
  float ja = gape * 1.22, jc = cos(ja), js = sin(ja);
  vec2 jh = h.xy - vec2(0.0, -0.08);
  vec3 j = vec3(jc * jh.x - js * jh.y, js * jh.x + jc * jh.y - 0.08, h.z);
  float jplan = skTrap(vec2(j.z, j.x - 1.0), 0.6, 0.13, 0.95) - 0.2;
  float yb = mix(-0.36, -0.22, sat(j.x / 2.2));
  vec2 jw = vec2(jplan + 0.08, abs(j.y - (yb - 0.09) * 0.5) - (-0.09 - yb) * 0.5 + 0.08);
  float jaw = min(max(jw.x, jw.y), 0.0) + length(max(jw, 0.0)) - 0.08;
  float d = sk;
  gSkHp = mouthU ? 5.0 : 1.0;
  if (jaw < d) { d = jaw; gSkHp = (j.y > -0.13 && jplan < -0.08 && gape > 0.02) ? 5.0 : 1.0; }
  // the eyes: domed, on the sides under the brows
  vec3 e = a - vec3(1.12, 0.2, 0.66);
  float eye = length(e) - 0.22;
  if (eye < d) { d = eye; gSkHp = 2.0; gSkTe = e / 0.22; }
  // fangs: folded along the palate when closed, swing down and forward as the jaw drops
  if (gape > 0.02) {
    vec3 fb = vec3(1.85, -0.05, 0.22);
    vec3 fd = normalize(mix(vec3(-1.0, -0.12, 0.0), vec3(0.45, -1.0, 0.0), smoothstep(0.1, 0.75, gape)));
    float fg = sdRoundCone(a, fb, fb + fd * 0.85, 0.075, 0.012);
    if (fg < d) { d = fg; gSkHp = 4.0; }
  }
  // the forked tongue flicks out in quick pairs
  if (fl > 0.02) {
    float tl = 0.4 + 1.7 * fl;
    vec3 t0 = vec3(1.9, -0.13, 0.0), m = t0 + vec3(tl, -0.05 * fl, 0.0);
    float tg = sdCapsule(h, t0, m, 0.055);
    tg = min(tg, sdCapsule(a, m, m + vec3(0.5 * fl, 0.06, 0.25 * fl), 0.035));
    if (tg < d) { d = tg; gSkHp = 3.0; }
  }
  return d * R * 0.85;
}

// the cobra hood: a broad ribbed oval round the neck, centre c (r relative to it), T along the neck
float skHood(vec3 r, vec3 T, vec3 U, float R, float hood) {
  vec3 S = cross(T, U);
  vec3 h = vec3(dot(r, T), dot(r, U), dot(r, S)) / R;
  gSkTh = h;
  vec3 hq = h - vec3(0.25, 0.3, 0.0);   // set toward the back; the neck's belly stands proud in front
  float wd = mix(0.5, 1.75, hood);
  // a flat oval plate (an extruded ellipse: well-behaved distance, unlike a thin ellipsoid)
  vec2 ax = vec2(1.9 * (0.75 + 0.25 * hood), wd);
  float e2 = length(hq.xz / ax);
  float d2 = (e2 - 1.0) * min(ax.x, ax.y);
  vec2 w = vec2(d2 + 0.08, abs(hq.y) - 0.2 * (1.0 - 0.45 * sat(e2 * e2)) + 0.08);
  float d = min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - 0.08;
  // ribs fanning out from the spine
  float rib = abs(sin(atan(abs(hq.z), hq.x + 1.4) * 9.0));
  d -= 0.04 * hood * smoothstep(0.3, 1.0, rib) * smoothstep(0.3, 1.0, abs(hq.z));
  return d * R * 0.8;
}

// a chain of round cones through gSkP[0..n-1] (dorsal refs gSkU), s0..s1 along the body, x0..x1 metres,
// with the head at the last point and (hood > 0) a hood at fraction hf along the chain
float skChain(vec3 q, int n, float s0, float s1, float x0, float x1, float R, float gape, float hood, float hf, float seed) {
  float d = 1e9; int bi = 0;
  float fn = float(n - 1);
  for (int i = 0; i < 9; i++) {
    if (i >= n - 1) break;
    float dd = sdRoundCone(q, gSkP[i], gSkP[i + 1], R * skRad(mix(s0, s1, float(i) / fn)), R * skRad(mix(s0, s1, float(i + 1) / fn)));
    if (dd < d) { d = dd; bi = i; }
  }
  vec3 a = gSkP[bi], ba = gSkP[bi + 1] - a;
  float hh = sat(dot(q - a, ba) / dot(ba, ba));
  float f = (float(bi) + hh) / fn;
  vec3 T = normalize(ba), U = mix(gSkU[bi], gSkU[bi + 1], hh);
  U = normalize(U - T * dot(U, T));
  vec3 r = q - a - ba * hh;
  float ang = atan(dot(r, cross(T, U)), dot(r, U));
  float s = mix(s0, s1, f), x = mix(x0, x1, f);
  if (d < R * 0.3) d += R * 0.025 * (1.0 - skScaleGroove(x / R, ang, skRad(s))) * step(-0.3, cos(ang));
  gSkT = vec4(s, ang, 0.0, x); gSkTR = R;
  vec3 e = gSkP[n - 1], Te = normalize(e - gSkP[n - 2]);
  vec3 Ue = normalize(gSkU[n - 1] - Te * dot(gSkU[n - 1], Te));
  float hd = skHead(q - e, Te, Ue, R, gape, seed);
  if (hd < d) gSkT = vec4(1.0, 0.0, gSkHp, x1);
  float res = smin(d, hd, R * 0.3);
  if (hood > 0.01) {
    float fh = hf * fn; int ih = min(int(fh), n - 2); float th = fh - float(ih);
    vec3 hc = mix(gSkP[ih], gSkP[ih + 1], th), hT = normalize(gSkP[ih + 1] - gSkP[ih]);
    vec3 hU = mix(gSkU[ih], gSkU[ih + 1], th); hU = normalize(hU - hT * dot(hU, hT));
    float hdd = skHood(q - hc, hT, hU, R, hood);
    if (hdd < res) gSkT = vec4(s, ang, 6.0, x);
    res = smin(res, hdd, R * 0.35);
  }
  return res;
}
// fill the chain with a cubic Bezier a, b, c, e (n points). Nn = normal of its plane (dorsal = T x Nn),
// or vec3(0) to take dorsal from world up
void skCubic(vec3 a, vec3 b, vec3 c, vec3 e, int n, vec3 Nn, int o) {
  for (int i = 0; i < 10; i++) {
    if (i >= n) break;
    float t = float(i) / float(n - 1), u = 1.0 - t;
    gSkP[o + i] = u * u * u * a + 3.0 * u * u * t * b + 3.0 * u * t * t * c + t * t * t * e;
    vec3 T = normalize(3.0 * u * u * (b - a) + 6.0 * u * t * (c - b) + 3.0 * t * t * (e - c) + 1e-5);
    gSkU[o + i] = dot(Nn, Nn) > 0.25 ? normalize(cross(T, Nn)) : normalize(vec3(0, 1, 0) - T * T.y + vec3(0.0, 1e-4, 0.0));
  }
}
vec3 skLocal(vec3 p, vec3 base, float yaw) {
  vec3 q = p - base;
  vec2 dir = vec2(cos(yaw), sin(yaw));
  return vec3(dot(q.xz, dir), q.y, dot(q.xz, vec2(-dir.y, dir.x)));
}

// ---------------- the analytic slithering snake ----------------
float sdSnake(vec3 q, float L, float R, float amp, float k, float ph, float lift, float lp, float gape, float hood) {
  float x = clamp(q.x, 0.0, L), s = x / L;
  float env = amp * mix(1.0, 0.3, s) * (1.0 - smoothstep(0.72, 0.96, s));
  float zo = env * sin(k * x - ph), dz = env * k * cos(k * x - ph);
  float s0 = clamp(1.0 - 0.8 / max(lp, 1.0), 0.0, 0.92);
  float u = sat((s - s0) / (1.0 - s0));
  float rr = skRad(s);
  float yo = lift * u * u * (3.0 - 2.0 * u) + R * rr, dy = lift * 6.0 * u * (1.0 - u) / ((1.0 - s0) * L);
  vec2 r = vec2((q.y - yo) / sqrt(1.0 + dy * dy), (q.z - zo) / sqrt(1.0 + dz * dz));
  float body = length(vec3(q.x - x, r)) - R * rr;
  float ang = atan(r.y, r.x);
  if (body < R * 0.3) body += R * 0.025 * (1.0 - skScaleGroove(x / R, ang, rr)) * step(-0.3, cos(ang));
  gSkT = vec4(s, ang, 0.0, x); gSkTR = R;
  vec3 c = vec3(L, lift + R * 0.55, 0.0);
  float hd = skHead(q - c, vec3(1, 0, 0), vec3(0, 1, 0), R, gape, L);
  if (hd < body) gSkT = vec4(1.0, 0.0, gSkHp, L);
  float d = smin(body, hd, R * 0.3);
  if (hood > 0.01) {
    float sh = 1.0 - 2.6 * R / L;
    float uh = sat((sh - s0) / (1.0 - s0));
    float dyh = lift * 6.0 * uh * (1.0 - uh) / ((1.0 - s0) * L);
    vec3 hc = vec3(sh * L, lift * uh * uh * (3.0 - 2.0 * uh) + R * skRad(sh), 0.0);
    vec3 hT = normalize(vec3(1.0, dyh, 0.0)), hU = vec3(-hT.y, hT.x, 0.0);
    float hdd = skHood(q - hc, hT, hU, R, hood);
    if (hdd < d) gSkT = vec4(sh, ang, 6.0, sh * L);
    d = smin(d, hdd, R * 0.35);
  }
  return d * 0.8;
}
float snakeAt(vec3 p, vec3 base, float yaw, float L, float R, float amp, float k, float ph, float lift, float lp, float gape, float hood) {
  vec3 q = skLocal(p, base, yaw);
  float hb = sdCapsule(q, vec3(0, lift * 0.5, 0), vec3(L, lift * 0.5, 0), amp + R * (3.0 + 2.0 * hood) + lift * 0.5 + R * 2.5 * gape);
  if (hb > max(R * 2.0, 0.3)) return hb;
  return sdSnake(q, L, R, amp, k, ph, lift, lp, gape, hood);
}

// ground body for the posed snakes: tail at x = 0 to x = Lg (s 0..sg), wiggling, straight at its end
float skGround(vec3 q, float Lg, float sg, float R, float amp, float ph) {
  float x = clamp(q.x, 0.0, Lg), f = x / Lg, s = f * sg;
  float k = SK_TAU * 1.4 / Lg;
  float env = amp * mix(1.0, 0.5, f) * (1.0 - smoothstep(0.55, 1.0, f));
  float zo = env * sin(k * (x - Lg) - ph), dz = env * k * cos(k * (x - Lg) - ph);
  float rr = skRad(s);
  vec2 r = vec2(q.y - R * rr, (q.z - zo) / sqrt(1.0 + dz * dz));
  float d = length(vec3(q.x - x, r)) - R * rr;
  float ang = atan(r.y, r.x);
  if (d < R * 0.3) d += R * 0.025 * (1.0 - skScaleGroove(x / R, ang, rr)) * step(-0.3, cos(ang));
  gSkT = vec4(s, ang, 0.0, x); gSkTR = R;
  return d;
}

// ---------------- poses ----------------
float snakeRear(vec3 p, vec3 base, float yaw, float L, float R, float h, float ph, float gape, float hood) {
  vec3 q = skLocal(p, base, yaw);
  float Lg = max(L - 1.45 * h, 0.35 * L), sg = Lg / L;
  float hb = max(sdBox(q - vec3(Lg * 0.5 + h * 0.3, h * 0.5 + R, 0.0), vec3(Lg * 0.5 + h * 0.3 + R * 3.5, h * 0.5 + R * 2.5, R * (2.5 + 2.0 * hood) + R * 1.5)), 0.0);
  if (hb > max(R * 2.0, 0.3)) return hb;
  float g = skGround(q, Lg, sg, R, R * 1.6, ph);
  vec4 gt = gSkT;
  vec3 e0 = vec3(Lg, R * skRad(sg), 0.0);
  float sw = 0.04 * h * sin(uTime * 1.3 + ph);
  skCubic(e0, e0 + vec3(0.45 * h, 0.04 * h, 0.0), e0 + vec3(0.02 * h + sw, 1.0 * h, 0.0), e0 + vec3(0.42 * h + sw, 1.0 * h, 0.0), 8, vec3(0, 0, -1), 0);
  float c = skChain(q, 8, sg, 1.0, Lg, L, R, gape, hood, 0.62, L + base.x);
  if (g < c) gSkT = gt;
  return smin(g, c, R * 0.3) * 0.85;
}
float snakeStrike(vec3 p, vec3 base, float yaw, float L, float R, float k, float ph) {
  vec3 q = skLocal(p, base, yaw);
  float Ln = 0.42 * L, Lg = L - Ln, sg = Lg / L;
  float hb = max(sdBox(q - vec3(Lg * 0.5 + Ln * 0.5, Ln * 0.3, 0.0), vec3(L * 0.5 + Ln * 0.2 + R * 3.0, Ln * 0.3 + R * 3.0, Ln * 0.4 + R * 3.0)), 0.0);
  if (hb > max(R * 2.0, 0.3)) return hb;
  float g = skGround(q, Lg, sg, R, R * 1.6, ph);
  vec4 gt = gSkT;
  vec3 e0 = vec3(Lg, R * skRad(sg), 0.0);
  float kk = k * k * (3.0 - 2.0 * k);
  vec3 b = mix(vec3(0.1, 0.25, 0.38), vec3(0.35, 0.22, 0.0), kk) * Ln;
  vec3 c = mix(vec3(-0.2, 0.48, -0.32), vec3(0.68, 0.3, 0.0), kk) * Ln;
  vec3 e = mix(vec3(0.15, 0.5, 0.0), vec3(1.0, 0.22, 0.0), kk) * Ln;
  skCubic(e0, e0 + b, e0 + c, e0 + e, 8, vec3(0), 0);
  float gape = smoothstep(0.3, 0.85, k);
  float d = skChain(q, 8, sg, 1.0, Lg, L, R, gape, 0.0, 0.0, L + base.z);
  if (g < d) gSkT = gt;
  return smin(g, d, R * 0.3) * 0.85;
}
float snakeCoil(vec3 p, vec3 base, float yaw, float R, float turns, float ph) {
  vec3 q = skLocal(p, base, yaw);
  float b = R * 2.0 / SK_TAU, rin = R * 1.7, Phi = SK_TAU * turns, rout = rin + b * Phi, rise = 0.55 * R;
  float top = rise * turns + R * 2.0;
  float hb = max(length(q.xz) - rout - R * 3.0, q.y - top - R * 4.0);
  if (hb > max(R * 2.0, 0.3)) return hb;
  float arcC = Phi * (rin + b * Phi * 0.5);
  // the neck and head: from the inner end, up over the pile, the head resting on top looking out
  float pe = Phi;
  vec3 e0 = vec3(rin * cos(pe), R + rise * turns, rin * sin(pe));
  vec3 T0 = normalize(vec3(-rin * sin(pe) - b * cos(pe), 0.0, rin * cos(pe) - b * sin(pe)));
  float ah = pe + 2.4 + 0.15 * sin(uTime * 0.7 + ph);
  vec3 eh = vec3((rin + 1.2 * R) * cos(ah), R * 2.0 + rise * turns + R * 0.6, (rin + 1.2 * R) * sin(ah));
  vec3 cc = e0 + T0 * R * 2.5 + vec3(0.0, R * 2.6, 0.0);
  float nl = length(eh - e0) * 1.25 + R * 2.0;
  float Lt = arcC + nl, sC = arcC / Lt;
  skCubic(e0, cc, eh - normalize(vec3(eh.x, 0.0, eh.z)) * R * 1.5 + vec3(0.0, R * 0.4, 0.0), eh, 6, vec3(0), 0);
  float nk = skChain(q, 6, sC, 1.0, arcC, Lt, R, 0.0, 0.0, 0.0, ph);
  vec4 nt = gSkT;
  // the coil: phi = 0 at the outer tail, spiralling inward (radius falls) and upward
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
float snakeWrap(vec3 p, vec3 base, float Rp, float R, float H, float y0, float y1, float a0, float neck, float gape, float hood) {
  vec3 q = p - base;
  float Rc = Rp + R * 0.92;
  float hb = max(length(q.xz) - Rc - R * 2.0 - neck * 0.7, max(y0 - R * 2.0 - q.y, q.y - y1 - neck - R * 4.0));
  if (hb > max(R * 2.0, 0.3)) return hb;
  float thMax = (y1 - y0) / H * SK_TAU;
  float arcH = thMax * sqrt(Rc * Rc + pow(H / SK_TAU, 2.0));
  float nl = neck * 1.7, Lt = arcH + nl, sC = arcH / Lt;
  // the neck: off the top of the helix, straight up, then out, the head level and looking outward
  float ta = thMax + a0;
  vec3 rv = vec3(cos(ta), 0.0, sin(ta));
  vec3 Th = normalize(vec3(-Rc * sin(ta), H / SK_TAU, Rc * cos(ta)));
  vec3 e0 = vec3(Rc * cos(ta), y1, Rc * sin(ta));
  vec3 eh = e0 + vec3(0.0, neck, 0.0) + rv * neck * 0.55;
  skCubic(e0, e0 + Th * neck * 0.3, e0 + vec3(0.0, neck, 0.0) + rv * neck * 0.05, eh, 7, normalize(cross(vec3(0, 1, 0), rv)), 0);
  float nk = skChain(q, 7, sC, 1.0, arcH, Lt, R, gape, hood, 0.55, a0 + Rp);
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
// the pour path: along the ledge top (sigma < 0), round the edge, down the face, round onto the floor
vec3 skPourAt(float sg, float hE, float R) {
  float Rb = 2.0 * R, V = max(hE - 2.0 * R - Rb, 0.0), A = 3.14159265 * R, B = 1.5707963 * Rb;
  if (sg < 0.0) return vec3(-R + sg, hE + R, 0.0);
  if (sg < A) { float th = 1.5707963 - sg / (2.0 * R); return vec3(-R, hE - R, 0.0) + 2.0 * R * vec3(cos(th), sin(th), 0.0); }
  sg -= A;
  if (sg < V) return vec3(R, hE - R - sg, 0.0);
  sg -= V;
  if (sg < B) { float th = 3.14159265 + sg / Rb; return vec3(R + Rb, R + Rb, 0.0) + Rb * vec3(cos(th), sin(th), 0.0); }
  sg -= B;
  return vec3(R + Rb + sg, R, 0.0);
}
float snakePour(vec3 p, vec3 edge, float yaw, float L, float R, float hEdge, float flow, float gape) {
  vec3 q = skLocal(p, edge, yaw);
  float x0 = flow - L - R * 4.0, x1 = max(flow, 0.0) + R * 6.0;
  float hb = sdBox(q - vec3((x0 + x1) * 0.5, hEdge * 0.5 + R, 0.0), vec3((x1 - x0) * 0.5, hEdge * 0.5 + R * 3.0, R * 3.0));
  if (hb > max(R * 2.0, 0.3)) return hb;
  for (int i = 0; i < 10; i++) {
    float sg = flow - L + L * float(i) / 9.0;
    vec3 P = skPourAt(sg, hEdge, R);
    // a slither on the ledge, gone where it bends over
    P.z += 1.2 * R * sin(sg * 9.0 / L * 3.14159 - uTime * 3.0) * smoothstep(0.0, -4.0 * R, sg) * (1.0 - float(i) / 12.0);
    gSkP[i] = P;
  }
  for (int i = 0; i < 10; i++) {
    vec3 T = normalize(gSkP[min(i + 1, 9)] - gSkP[max(i - 1, 0)]);
    gSkU[i] = normalize(cross(T, vec3(0, 0, -1)));
  }
  return skChain(q, 10, 0.0, 1.0, 0.0, L, R, gape, 0.0, 0.0, L + flow) * 0.85;
}

// ---------------- material ----------------
Mat snakeMat(vec3 p, vec3 n, float iron) {
  float part = gSk.z, R = gSkR;
  if (part > 2.5 && part < 3.5) { Mat m = M(vec3(0.16, 0.01, 0.06), 0.3, 0.0); m.clear = 1.0; m.emit = vec3(0.25, 0.0, 0.1) * (1.0 - iron); return m; }
  if (part > 3.5 && part < 4.5) { Mat m = CHROME(); m.alb = vec3(0.92, 0.93, 0.95); return m; }
  if (part > 4.5 && part < 5.5) { Mat m = M(vec3(0.05, 0.015, 0.05), 0.35, 0.0); m.clear = 1.0; m.emit = gSkEye * 0.012 * (1.0 - iron); return m; }
  if (part > 1.5 && part < 2.5) {
    // eye: black glass dome, an acid iris ring and a bright vertical slit
    vec3 e = gSkE;
    Mat m = M(vec3(0.015), 0.03, 0.0); m.clear = 1.0;
    float face = smoothstep(0.2, 0.55, e.z);
    float slit = smoothstep(0.13, 0.05, abs(e.x)) * smoothstep(0.85, 0.6, abs(e.y)) * face;
    float iris = smoothstep(0.9, 0.5, length(e.xy)) * face;
    m.emit = gSkEye * (slit * 2.0 + iris * 0.07) * mix(1.0, 0.45, iron);
    return m;
  }
  float x = gSk.w / max(R, 1e-4), ang = gSk.y, s = gSk.x;
  Mat m;
  if (part > 0.5 && part < 1.5) {
    // head plates: black chrome with machined seams
    vec3 h = gSkE;
    m = M(vec3(0.075, 0.078, 0.085), 0.09, 1.0);
    float seam = 0.0;
    seam = max(seam, smoothstep(0.03, 0.01, abs(h.z)) * step(0.15, h.y) * step(h.x, 1.9));
    seam = max(seam, smoothstep(0.03, 0.01, abs(h.x - 0.45)) * step(0.15, h.y));
    seam = max(seam, smoothstep(0.03, 0.01, abs(h.x - 1.62)) * step(0.15, h.y));
    seam = max(seam, smoothstep(0.035, 0.012, abs(length((h.xz - vec2(1.05, sign(h.z) * 0.55)) / vec2(0.55, 0.24)) - 1.0)) * step(0.15, h.y));
    seam = max(seam, smoothstep(0.03, 0.01, abs(h.y + 0.09)) * step(0.6, abs(h.z) / max(0.3, 1.0)));
    m.alb *= 1.0 - 0.75 * seam; m.rough = mix(m.rough, 0.55, seam);
  } else {
    float rr = skRad(s);
    float c = cos(ang);
    float hood = part > 5.5 ? 1.0 : 0.0;
    vec3 hq = gSkH;
    bool back = hq.y > 0.3;
    if (hood > 0.5) { x = hq.x * 1.6; ang = back ? hq.z * 0.9 : 3.14159; c = back ? 1.0 : -1.0; rr = 1.0; }
    // dorsal: black gunmetal scales over a faint cable braid
    float gr = skScaleGroove(x, ang, rr);
    float braid = 0.5 + 0.5 * sin(x * 20.0 + ang * 6.0);
    m = M(vec3(0.05, 0.052, 0.058) * (0.85 + 0.25 * braid), 0.26, 0.75);
    // the viper's dorsal diamond chain, outlined in dull silver
    float dm = abs(ang) / 0.95 + abs(fract(x / 2.8) - 0.5) * 2.0;
    m.alb = mix(m.alb, vec3(0.085, 0.088, 0.095), step(dm, 1.0));
    m.alb = mix(m.alb, vec3(0.3, 0.31, 0.33), smoothstep(0.13, 0.03, abs(dm - 1.0)) * (1.0 - hood));
    m.alb *= 1.0 - 0.6 * gr; m.rough = mix(m.rough, 0.6, gr); m.metal = mix(m.metal, 0.3, gr);
    // belly scutes: wide pale-silver plates with dark seams
    float belly = smoothstep(-0.3, -0.62, c);
    float bs = smoothstep(0.1, 0.0, abs(fract(x / 0.42) - 0.5) - 0.42);
    m.alb = mix(m.alb, vec3(0.55, 0.57, 0.61) * (1.0 - 0.7 * bs), belly);
    m.rough = mix(m.rough, 0.3 + 0.3 * bs, belly); m.metal = mix(m.metal, 0.35, belly);
    // spine pinstripe with acid pulses running head to tail
    float stripe = smoothstep(0.1, 0.035, abs(ang)) * (1.0 - hood) * smoothstep(0.98, 0.9, s);
    float f = fract(s * 6.0 + uTime * 0.45);
    float pl = smoothstep(0.0, 0.05, f) * smoothstep(0.22, 0.05, f);
    m.emit = vec3(0.3, 1.8, 0.35) * stripe * (0.35 + 2.2 * pl * pl) * gSkPulse * (1.0 - iron);
    if (hood > 0.5 && hq.y > 0.42) {
      // the spectacle on the back of the hood, made of two camera irises (one each side of the
      // spine): concentric rings and aperture blades, cold white
      vec2 ip = vec2(hq.x - 0.35, abs(hq.z) - 0.92) / 0.62;
      float rho = length(ip);
      float ia = atan(ip.y, ip.x);
      float ring = smoothstep(0.08, 0.03, abs(rho - 1.1)) + smoothstep(0.06, 0.02, abs(rho - 0.8));
      float blade = smoothstep(0.05, 0.0, abs(fract(ia / SK_TAU * 7.0 + rho * 0.9) - 0.5) - 0.44) * step(0.26, rho) * step(rho, 0.74);
      float pupil = smoothstep(0.24, 0.2, rho);
      m.alb = mix(m.alb, vec3(0.01), pupil);
      m.emit += vec3(2.4, 2.55, 3.0) * (ring + blade + 0.12 * smoothstep(0.75, 0.25, rho) * (1.0 - pupil)) * gSkIris * (1.0 - 0.7 * iron);
    }
  }
  if (iron > 0.0) {
    Mat w = M(vec3(0.42, 0.43, 0.45), 0.3, 1.0);
    m.alb = mix(m.alb, w.alb * (0.8 + 0.6 * m.alb.g), iron);
    m.rough = mix(m.rough, w.rough, iron); m.metal = mix(m.metal, 1.0, iron);
  }
  return m;
}
`;
