// v2 shared cyber vocabulary for pictures: stylised neon faces on screens, LED walls, glitch
// tears and scanlines. Import CYBER_GLSL after STUDIO_GLSL. All deterministic in uTime.
export const CYBER_GLSL = /* glsl */ `
// stroke helpers in 2D
float sdSeg2(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = sat(dot(pa, ba) / dot(ba, ba)); return length(pa - ba * h); }
float sdArc2(vec2 p, vec2 c, float r, float a0, float a1) {
  vec2 q = p - c; float a = atan(q.y, q.x);
  float am = clamp(a, a0, a1);
  return length(q - r * vec2(cos(am), sin(am)));
}
float stroke(float d, float w) { return smoothstep(w, w * 0.4, d); }

// A stylised synthetic face drawn with a few neon strokes: head outline, brows, eyes, mouth.
// uv in -1..1 (face fills the unit square). smile -1 (frown) .. 1 (grin); blind 0..1 slides a
// glitch band over the eyes; seed varies proportions so faces differ. Returns a 0..1 line mask.
float neonFace(vec2 uv, float smile, float blind, float seed) {
  float w = 0.035;
  vec2 hs = vec2(0.62 + 0.06 * hash11(seed), 0.82 + 0.05 * hash11(seed + 3.1));
  float head = abs(length(uv / hs) - 1.0) * min(hs.x, hs.y);
  float m = stroke(head, w);
  float ey = 0.18 + 0.05 * hash11(seed + 7.0), ex = 0.26 + 0.04 * hash11(seed + 9.0);
  float eyes = min(sdSeg2(uv, vec2(-ex - 0.09, ey), vec2(-ex + 0.09, ey)), sdSeg2(uv, vec2(ex - 0.09, ey), vec2(ex + 0.09, ey)));
  float brows = min(sdSeg2(uv, vec2(-ex - 0.1, ey + 0.14), vec2(-ex + 0.08, ey + 0.17)), sdSeg2(uv, vec2(ex - 0.08, ey + 0.17), vec2(ex + 0.1, ey + 0.14)));
  float r = 0.32;
  float mouth = smile >= 0.0 ? sdArc2(uv, vec2(0.0, -0.18 + 0.2 * smile), r, -PI * 0.5 - 0.9 * smile, -PI * 0.5 + 0.9 * smile)
                             : sdArc2(uv, vec2(0.0, -0.58 - 0.2 * smile), r, PI * 0.5 + 0.9 * smile, PI * 0.5 - 0.9 * smile);
  if (abs(smile) < 0.05) mouth = sdSeg2(uv, vec2(-0.22, -0.4), vec2(0.22, -0.4));
  m = max(m, stroke(eyes, w * 1.2));
  m = max(m, stroke(brows, w * 0.8));
  m = max(m, stroke(mouth, w));
  // the blindfold: a solid band of noise across the eyes
  float bandY = abs(uv.y - ey) < 0.12 ? 1.0 : 0.0;
  float bx = uv.x + 1.2 - 2.4 * blind;
  if (bandY > 0.0 && bx < 0.0) m = max(m * 0.2, 0.6 + 0.4 * step(0.5, hash12(floor(uv * vec2(40.0, 6.0)) + floor(uTime * 24.0))));
  // scanlines
  return m * (0.75 + 0.25 * sin(uv.y * 160.0));
}

// An LED wall: square pixels on a dark panel, lit by a pattern (0..1) supplied per pixel centre.
// cell = pixels per unit; returns the pixel mask and the pixel centre.
float ledMask(vec2 uv, float cell, out vec2 centre) {
  vec2 g = uv * cell; centre = (floor(g) + 0.5) / cell;
  vec2 f = fract(g) - 0.5;
  return smoothstep(0.42, 0.3, max(abs(f.x), abs(f.y)));
}

// Glitch tear: shift fragCoord sideways in a few random horizontal bands while amt > 0.
vec2 glitchTear(vec2 fc, float amt) {
  if (amt <= 0.001) return fc;
  float t = floor(uTime * 30.0);
  float row = floor(fc.y / (uRes.y / 24.0));
  float h = hash12(vec2(row, t));
  float on = step(1.0 - 0.35 * amt, h);
  return fc + vec2(on * (hash12(vec2(row + 7.0, t)) - 0.5) * uRes.x * 0.12 * amt, 0.0);
}

// Scanlines for a screen surface: 0..1 multiplier.
float scanlines(float y, float density) { return 0.82 + 0.18 * sin(y * density); }
`;
