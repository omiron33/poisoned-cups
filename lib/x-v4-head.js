// v4 machine face (docs/V4-DIRECTION.md 4.2). Replaces neonFace / faceScreen / conciergeFace / the
// LED face wall. Two forms of the same face:
//
//   float sdHead(vec3 q, float jaw, float tilt)
//       A sculpted mannequin head and neck (ellipsoids + smin): cranium, brow, soft eye sockets with
//       blank glass eyes, nose wedge, cheekbones, lips, chin. Facing +z, chin at y = 0, crown at
//       y = 1, neck down to y = -0.45 (flat cut there). Scale per scene: sdHead(q / s, ...) * s.
//       jaw 0..1 opens the jaw (hinge near the ear) to about 25 degrees; the open mouth is a laugh:
//       the cavity bends into a crescent with lifted corners and the cheeks rise and squint the eyes.
//       tilt (radians) pitches the head on the neck: + throws it back (chin up), - bows it.
//   Mat headMat(vec3 q, vec3 n, float live)
//   Mat headMatT(vec3 q, vec3 n, float live, float jaw, float tilt)   (use this when jaw/tilt != 0)
//       Black obsidian glass with a depth-contour scan: ~30 thin cold-white iso-lines of the head's
//       depth across the face, bending over brow, nose and lips; a brighter band sweeps down every
//       2.4 s. Eyes are blank glass. The open mouth is a dark void. live 1 = scanning (cold white),
//       live 0 = caught: the scan freezes across the eyes and the lines turn hot magenta.
//       q is the same head-frame point you passed to sdHead (unscaled).
//   vec3 faceScan(vec2 uv, float yaw, float mouth, float smile, float live, vec3 ink)
//       The same face in 2D for screens. uv -1..1, the face filling the unit square (crown near
//       y = 0.9, chin near y = -0.85). An analytic face height field drawn as fine topographic
//       contour lines plus ~70 depth-displaced scan lines per face height (constant line width, no
//       cells), soft shading and the sweeping scan band. yaw (radians, about +-0.6 max) turns it;
//       mouth 0..1 opens it; smile 0..1 lifts the corners, raises the cheeks and squints the eyes by
//       deforming the field (never a drawn curve). live 0 freezes it magenta (ink is ignored then).
//       Returns emission (black where there is no face); multiply by your screen brightness.
//
// Include after STUDIO_GLSL (needs Mat, M, smin, sdEllipsoid, sdRoundCone, sdCapsule, hash, uTime).
// The block is include-guarded, so HEAD_GLSL may appear twice (x-v4-hall.js already includes it).
//
// JS: laughPose(t, t0, t1, opts) -> { jaw, tilt, shake } for heads laughing between t0 and t1
// (jaw chatter at ~5 Hz under an envelope, head thrown back); pass jaw/tilt as uniforms.

export const HEAD_GLSL = /* glsl */ `
#ifndef V4_HEAD
#define V4_HEAD
const vec3 HEAD_ICE = vec3(0.72, 0.84, 1.0);
const vec3 HEAD_MAG = vec3(1.0, 0.1, 0.45);
const vec3 HEAD_PIVOT = vec3(0.0, 0.2, -0.08);
const vec3 HEAD_HINGE = vec3(0.0, 0.42, -0.04);
// head frame -> tilted frame (the skull's own frame)
vec3 headTilt(vec3 q, float tilt) {
  vec3 h = q - HEAD_PIVOT;
  h.yz = rot(-tilt) * h.yz;
  return h + HEAD_PIVOT;
}
// the open mouth: an ellipsoid cavity that grows with the jaw and bends into a laugh crescent
float headMouth(vec3 h, float jaw) {
  vec3 m = h - vec3(0.0, 0.262 - 0.07 * jaw, 0.25);
  m.y -= 4.5 * jaw * m.x * m.x;                 // corners lift
  m.y += 0.6 * jaw * max(m.y, 0.0);             // flatter top lip line, round bottom
  return sdEllipsoid(m, vec3(0.09 + 0.05 * jaw, 0.006 + 0.078 * jaw, 0.13));
}
float sdHead(vec3 q, float jaw, float tilt) {
  float bd = length(q - vec3(0.0, 0.3, 0.0)) - 0.95;
  if (bd > 0.05) return bd;
  float neck = sdCapsule(q, vec3(0.0, -0.6, -0.05), vec3(0.0, 0.27, -0.11), 0.145);
  neck = max(neck, -0.45 - q.y);
  vec3 h = headTilt(q, tilt);
  vec3 hs = vec3(abs(h.x), h.yz);
  float lg = jaw;   // laugh weight
  // skull
  float d = sdEllipsoid(h - vec3(0.0, 0.625, -0.08), vec3(0.325, 0.37, 0.415));
  d = smin(d, sdEllipsoid(h - vec3(0.0, 0.46, 0.07), vec3(0.29, 0.28, 0.3)), 0.1);
  d = smin(d, sdEllipsoid(h - vec3(0.0, 0.6, 0.255), vec3(0.25, 0.055, 0.08)), 0.06);           // brow
  d = smin(d, sdEllipsoid(hs - vec3(0.17, 0.425 + 0.03 * lg, 0.205 + 0.01 * lg), vec3(0.1, 0.07 + 0.01 * lg, 0.09)), 0.07); // cheekbones
  // jaw, hinged near the ear
  vec3 j = h - HEAD_HINGE;
  j.yz = rot(0.4 * jaw) * j.yz;
  j += HEAD_HINGE + vec3(0.0, 0.0, -0.07) * jaw;   // the condyle glides forward as it opens
  vec3 js = vec3(abs(j.x), j.yz);
  float jw = sdEllipsoid(j - vec3(0.0, 0.22, 0.06), vec3(0.255, 0.17, 0.235));
  jw = smin(jw, sdEllipsoid(js - vec3(0.19, 0.2, -0.02), vec3(0.08, 0.12, 0.12)), 0.08);           // jaw angles
  jw = smin(jw, sdEllipsoid(j - vec3(0.0, 0.075, 0.2), vec3(0.11, 0.075, 0.09)), 0.07);            // chin
  jw = smin(jw, sdEllipsoid(j - vec3(0.0, 0.232, 0.29), vec3(0.075, 0.024, 0.04)), 0.025);         // lower lip
  d = smin(d, jw, 0.06);
  // cheeks: soft tissue hinged half way, so the sides stay closed while the mouth opens
  vec3 c = h - HEAD_HINGE;
  c.yz = rot(0.2 * jaw) * c.yz;
  c += HEAD_HINGE;
  d = smin(d, sdEllipsoid(vec3(abs(c.x), c.yz) - vec3(0.2, 0.27, 0.07), vec3(0.085, 0.14, 0.15)), 0.06 + 0.03 * jaw);
  d = smin(d, sdEllipsoid(h - vec3(0.0, 0.29, 0.305), vec3(0.08, 0.026, 0.042)), 0.025);           // upper lip
  // nose wedge
  float nose = sdRoundCone(h, vec3(0.0, 0.535, 0.29), vec3(0.0, 0.385, 0.395), 0.022, 0.034);
  nose = smin(nose, sdEllipsoid(hs - vec3(0.032, 0.365, 0.345), vec3(0.034, 0.026, 0.03)), 0.03);
  d = smin(d, nose, 0.035);
  // eye sockets, then blank glass eyes (squinted by the raised cheeks when laughing)
  d = smax(d, -sdEllipsoid(hs - vec3(0.112, 0.52 - 0.004 * lg, 0.33), vec3(0.072, 0.046 - 0.012 * lg, 0.07)), 0.035);
  d = min(d, length(hs - vec3(0.112, 0.517, 0.245)) - 0.058);
  // the open mouth
  if (jaw > 0.01) d = smax(d, -headMouth(h, jaw), 0.015);
  return smin(d, neck, 0.08);
}
Mat headMatT(vec3 q, vec3 n, float live, float jaw, float tilt) {
  vec3 h = headTilt(q, tilt);
  vec3 hs = vec3(abs(h.x), h.yz);
  Mat m = M(vec3(0.011, 0.011, 0.014), 0.05, 0.0);
  m.clear = 1.0;
  float lv = sat(live);
  vec3 ink = mix(HEAD_MAG * 1.3, HEAD_ICE, lv);
  // blank glass eyes: deeper, glossier, no lines
  float eye = length(hs - vec3(0.112, 0.517, 0.245)) - 0.058;
  if (eye < 0.004) { m.alb = vec3(0.004, 0.005, 0.007); m.rough = 0.02; m.emit = ink * 0.01; return m; }
  // inside the open mouth: a dark void
  vec3 j = h - HEAD_HINGE;
  j.yz = rot(0.4 * jaw) * j.yz;
  j += HEAD_HINGE + vec3(0.0, 0.0, -0.07) * jaw;
  if (jaw > 0.01 && headMouth(h, jaw) < 0.03 && h.y < 0.285 && j.y > 0.235) {
    m.alb = vec3(0.002); m.rough = 0.4; m.clear = 0.0;
    m.emit = ink * 0.05 * smoothstep(0.12, 0.3, h.z);   // a faint cold hollow: reads as an opening from any side
    return m;
  }
  // the head's own normal (q frame), so the iso-lines keep a constant width on the surface
  const vec2 e = vec2(0.002, 0.0);
  vec3 hn = normalize(vec3(sdHead(q + e.xyy, jaw, tilt) - sdHead(q - e.xyy, jaw, tilt),
                           sdHead(q + e.yxy, jaw, tilt) - sdHead(q - e.yxy, jaw, tilt),
                           sdHead(q + e.yyx, jaw, tilt) - sdHead(q - e.yyx, jaw, tilt)));
  vec3 gz = vec3(0.0, -sin(tilt), cos(tilt));          // d(h.z)/dq
  float slope = sqrt(max(1.0 - pow(dot(gz, hn), 2.0), 0.0));
  // depth-contour scan: iso-lines of the head's depth
  float tt = mix(1.1, uTime, step(0.5, lv));
  const float SP = 0.0145;
  float f = h.z / SP;
  float dist = abs(fract(f + 0.5) - 0.5) * SP / max(slope, 0.04);
  float line = smoothstep(0.0022, 0.0007, dist);
  // the band sweeping down the head every 2.4 s (frozen across the eyes when caught)
  float by = mix(0.52, 1.15 - fract(tt / 2.4) * 1.75, lv);
  float band = exp(-pow((h.y - by) / 0.03, 2.0));
  float halo = exp(-pow((h.y - by) / 0.15, 2.0));
  // the scan lives on the face: it fades round the back of the skull and down the neck
  float front = smoothstep(-0.12, 0.16, h.z) * mix(0.25, 1.0, smoothstep(0.0, 0.12, j.y));
  float k = line * (0.4 + 3.0 * band + 0.6 * halo) * mix(1.5, 1.0, lv);
  m.emit = ink * (k * front * 0.8 + band * front * 0.05);
  return m;
}
Mat headMat(vec3 q, vec3 n, float live) { return headMatT(q, n, live, 0.0, 0.0); }

// ---- the 2D contour-scan face ----
float fsG(vec2 p, vec2 c, vec2 s) { vec2 d = (p - c) / s; return exp(-dot(d, d)); }
// face height field: ~0 outside the head, up to ~0.75 at the nose tip
float fsField(vec2 p, float mouth, float smile) {
  vec2 q = p;
  // the jaw drops with the mouth: lower face sampled higher
  q.y += 0.13 * mouth * smoothstep(-0.32, -0.75, p.y);
  // head outline: a tall ellipse narrowing to the jaw and chin
  float w = 0.64 - 0.2 * smoothstep(-0.05, -0.85, q.y) + 0.02 * smoothstep(0.2, 0.6, q.y);
  vec2 hp = vec2(q.x / w, (q.y - 0.02) / (q.y > 0.0 ? 0.9 : 0.88));
  float r2 = dot(hp, hp);
  float inside = smoothstep(1.0, 0.94, r2);
  float h = sqrt(max(0.0, 1.0 - r2)) * 0.5;
  vec2 a = vec2(abs(q.x), q.y);
  float s = smile;
  // brow ridge and forehead
  h += 0.07 * fsG(a, vec2(0.22, 0.25), vec2(0.22, 0.07));
  h += 0.04 * fsG(q, vec2(0.0, 0.5), vec2(0.4, 0.3));
  // eye sockets and blank eyeballs (squinted by the smile)
  float ey = 0.11 + 0.02 * s;
  h -= 0.13 * fsG(a, vec2(0.23, ey), vec2(0.15, 0.095 * (1.0 - 0.35 * s)));
  h += 0.07 * fsG(a, vec2(0.23, ey - 0.005), vec2(0.085, 0.055 * (1.0 - 0.45 * s)));
  // nose: bridge ridge, tip, wings
  h += 0.15 * exp(-pow(q.x / (0.055 + 0.08 * sat(0.12 - q.y)), 2.0)) * smoothstep(0.2, 0.02, q.y) * smoothstep(-0.3, -0.12, q.y);
  h += 0.09 * fsG(q, vec2(0.0, -0.19), vec2(0.085, 0.07));
  h += 0.045 * fsG(a, vec2(0.085, -0.22), vec2(0.06, 0.045));
  // cheekbones rise and swell with the smile
  h += (0.07 + 0.05 * s) * fsG(a, vec2(0.33 - 0.02 * s, -0.08 + 0.09 * s), vec2(0.16, 0.12));
  // nasolabial folds deepen with the smile
  vec2 fl = a - vec2(0.17 + 0.03 * s, -0.33);
  h -= 0.035 * s * exp(-pow((fl.x + 0.35 * fl.y) / 0.03, 2.0)) * exp(-pow(fl.y / 0.12, 2.0));
  // mouth: the field bends so the corners lift (no drawn curve)
  vec2 m = q - vec2(0.0, -0.44);
  m.y -= (1.4 * s + 0.6 * s * mouth) * m.x * m.x;
  h += 0.05 * fsG(m, vec2(0.0, 0.035), vec2(0.17 + 0.03 * s, 0.035));
  h += 0.055 * fsG(m, vec2(0.0, -0.045 - 0.13 * mouth), vec2(0.15 + 0.03 * s, 0.04));
  float my = m.y + 0.06 * mouth;
  my += 0.5 * max(my, 0.0);
  float e = length(vec2(m.x / (0.13 + 0.06 * s + 0.03 * mouth), my / (0.012 + 0.085 * mouth)));
  h -= 0.3 * mouth * smoothstep(1.0, 0.45, e);
  // chin
  h += 0.06 * fsG(q, vec2(0.0, -0.74), vec2(0.15, 0.08));
  return h * inside;
}
vec3 faceScan(vec2 uv, float yaw, float mouth, float smile, float live, vec3 ink) {
  if (abs(uv.x) > 1.05 || abs(uv.y) > 1.05) return vec3(0.0);
  float lv = sat(live);
  vec3 col = mix(HEAD_MAG * 1.3, ink, lv);
  float tt = mix(1.1, uTime, step(0.5, lv));
  // turn the face: solve x for the screen position with two fixed-point steps
  float cy = cos(yaw), sy = sin(yaw);
  vec2 p = vec2(uv.x / cy, uv.y);
  float h = fsField(p, mouth, smile);
  p.x = (uv.x - 0.55 * h * sy) / cy; h = fsField(p, mouth, smile);
  p.x = (uv.x - 0.55 * h * sy) / cy; h = fsField(p, mouth, smile);
  if (h <= 0.0005) return vec3(0.0);
  const float E = 0.006;
  float hx = (fsField(p + vec2(E, 0.0), mouth, smile) - h) / E;
  float hy = (fsField(p + vec2(0.0, E), mouth, smile) - h) / E;
  vec2 g = vec2(hx, hy);
  // topographic contours of the height
  float fA = h / 0.022;
  float dA = abs(fract(fA + 0.5) - 0.5) * 0.022 / max(length(g), 0.05);
  float lineA = smoothstep(0.005, 0.0016, dA) * mix(0.35, 1.0, smoothstep(4.0, 1.5, length(g)));
  // depth-displaced scan lines (~70 per face height)
  float N = 40.0;
  float fB = (p.y - 0.3 * h) * N;
  float gB = N * length(vec2(-0.3 * hx, 1.0 - 0.3 * hy));
  float dB = abs(fract(fB + 0.5) - 0.5) / gB;
  float lineB = smoothstep(0.0036, 0.001, dB);
  // soft shading from above-left
  vec3 nn = normalize(vec3(-g * 0.9, 1.0));
  float dif = sat(dot(nn, normalize(vec3(-0.45, 0.55, 0.7))));
  float edge = smoothstep(0.0, 0.05, h);
  // the sweeping scan band (frozen across the eyes when caught)
  float by = mix(0.11, 1.0 - fract(tt / 2.3) * 2.1, lv);
  float band = exp(-pow((uv.y - by) / 0.035, 2.0));
  float halo = exp(-pow((uv.y - by) / 0.18, 2.0));
  float eyes = fsG(vec2(abs(p.x), p.y), vec2(0.23, 0.105 + 0.02 * smile), vec2(0.07, 0.045));
  float cav = smoothstep(-0.05, -0.15, h - fsField(p, 0.0, smile)) * mouth;   // inside the open mouth
  float lit = 0.12 + 0.88 * dif * dif;
  float lines = (lineA * 0.75 + lineB * 0.32) * lit * (1.0 - 0.75 * eyes) * (1.0 - cav);
  float v = lines * (0.45 + 2.2 * band + 0.5 * halo) + 0.05 * lit * edge * (1.0 - cav) + 0.1 * band * edge * (1.0 - cav);
  return col * v * edge * mix(1.35, 1.0, lv);
}
#endif
`;

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sm = (x) => x * x * (3 - 2 * x);
// A laugh between t0 and t1: the jaw chatters at `rate` Hz under an envelope that opens in 0.15 s and
// closes over the last 0.3 s; the head throws back by `back` radians and shakes with the laugh.
export function laughPose(t, t0, t1, { rate = 5, back = 0.28, open = 0.55 } = {}) {
  if (t <= t0 || t >= t1 + 0.4) return { jaw: 0, tilt: 0, shake: 0 };
  const env = sm(clamp((t - t0) / 0.15, 0, 1)) * (1 - sm(clamp((t - t1 + 0.3) / 0.7, 0, 1)));
  const ch = 0.5 + 0.5 * Math.sin((t - t0) * rate * 2 * Math.PI - Math.PI / 2);
  return {
    jaw: env * (open + (1 - open) * ch),
    tilt: env * back * (0.85 + 0.15 * ch),
    shake: env * 0.02 * Math.sin((t - t0) * rate * 2 * Math.PI),
  };
}
