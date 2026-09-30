// The film's running motif: one gold chalice, built once so it looks the same in every scene.
// Picture modules only. Include CUP_GLSL after STUDIO_GLSL. The cup stands with its foot at the
// local origin (p is in the cup's frame, y up) and is CUP_H tall; the rim is at CUP_RIM_Y.
//   float chalice(vec3 p)                 the gold body: foot, stem with a knop, bowl (a shell)
//   float cupLiquid(vec3 p, float level)  what fills the bowl up to height `level` (flat surface)
//   float cupInside(vec3 p)               < 0 inside the bowl's cavity
//   Mat cupGold(vec3 p, vec3 n)           the gold: polished, a fine engraved band, a beaded knop
//   Mat cupTi(vec3 p, vec3 n)             the film's cup: brushed titanium, gold lip and gold engraved band
// Scale the whole cup by passing p / s and multiplying the distance by s.
export const CUP_GLSL = /* glsl */ `
const float CUP_H = 1.04;
const float CUP_RIM_Y = 1.02;
const float CUP_RIM_R = 0.335;
const vec2 CUP_BC = vec2(0.0, 1.02);     // bowl ellipse centre (r, y)
const vec2 CUP_BR = vec2(0.34, 0.40);    // bowl ellipse radii
const float CUP_TH = 0.014;              // wall thickness
float cupEll(vec2 q) { vec2 d = (q - CUP_BC) / CUP_BR; return (length(d) - 1.0) * min(CUP_BR.x, CUP_BR.y) * (0.85 + 0.15 * length(d)); }
float chalice(vec3 p) {
  float bb = length(p - vec3(0, 0.55, 0)) - 0.72;
  if (bb > 0.1) return bb;
  vec2 q = revo(p);
  // foot: a flared, slightly domed disc with a lip
  float foot = sdSeg(q, vec2(0.0, 0.03), vec2(0.30, 0.03)) - 0.028;
  foot = smin(foot, sdSeg(q, vec2(0.0, 0.07), vec2(0.24, 0.045)) - 0.03, 0.05);
  foot = smin(foot, sdSeg(q, vec2(0.02, 0.1), vec2(0.06, 0.2)) - 0.035, 0.06);
  // stem, slightly waisted
  float stem = sdSeg(q, vec2(0.0, 0.15), vec2(0.0, 0.64)) - (0.03 + 0.012 * abs(q.y - 0.4) * 4.0 * step(q.y, 0.64));
  // the knop: a flattened sphere with a ring above and below
  float knop = (length(vec2(q.x / 0.085, (q.y - 0.38) / 0.055)) - 1.0) * 0.05;
  knop = min(knop, length(q - vec2(0.05, 0.45)) - 0.014);
  knop = min(knop, length(q - vec2(0.05, 0.31)) - 0.014);
  // bowl: an egg-shaped shell cut at the rim, with a rolled lip
  float e = cupEll(q);
  float bowl = max(abs(e + CUP_TH) - CUP_TH, q.y - CUP_RIM_Y);
  bowl = min(bowl, length(q - vec2(CUP_RIM_R, CUP_RIM_Y)) - CUP_TH * 1.35);
  // the collar where the stem meets the bowl
  float collar = sdSeg(q, vec2(0.0, 0.64), vec2(0.07, 0.66)) - 0.022;
  float d = min(min(foot, stem), knop);
  d = smin(d, collar, 0.03);
  d = smin(d, bowl, 0.035);
  return d;
}
float cupInside(vec3 p) { vec2 q = revo(p); return max(cupEll(q) + CUP_TH * 2.0, q.y - CUP_RIM_Y); }
float cupLiquid(vec3 p, float level) { vec2 q = revo(p); return max(cupEll(q) + CUP_TH * 1.9, q.y - level); }
Mat cupGold(vec3 p, vec3 n) {
  Mat m = GOLD();
  vec2 q = revo(p);
  float a = atan(p.z, p.x);
  // hammered, hand-polished surface
  m.rough = 0.11 + 0.07 * vnoise(p * 70.0);
  // an engraved band round the bowl: a running vine of fine grooves, a little rougher and darker
  float band = smoothstep(0.012, 0.0, abs(q.y - 0.86) - 0.05) * step(0.25, q.x);
  float vine = smoothstep(0.35, 0.05, abs(sin(a * 12.0 + sin(q.y * 60.0) * 1.2) - (q.y - 0.86) * 12.0));
  float lines = smoothstep(0.004, 0.0, abs(abs(q.y - 0.86) - 0.052));
  float g = max(band * vine, lines);
  m.alb *= 1.0 - 0.35 * g;
  m.rough += 0.22 * g;
  // the knop beaded with small facets
  float kn = smoothstep(0.1, 0.0, abs(q.y - 0.38)) * step(q.y, 0.5) * step(0.2, q.y);
  m.rough += 0.06 * kn * step(0.0, sin(a * 16.0));
  return m;
}
// brushed titanium with a gold lip and a gold engraved band (the film's cup)
Mat cupTi(vec3 p, vec3 n) {
  vec2 q = revo(p);
  float a = atan(p.z, p.x);
  float lip = smoothstep(CUP_RIM_Y - 0.035, CUP_RIM_Y - 0.03, q.y);
  float band = smoothstep(0.006, 0.0, abs(q.y - 0.86) - 0.05) * step(0.25, q.x);
  float knopBand = smoothstep(0.012, 0.0, abs(q.y - 0.38) - 0.03) * step(q.x, 0.1);
  if (lip + band + knopBand > 0.5) {
    Mat g = cupGold(p, n);
    return g;
  }
  Mat m = M(vec3(0.62, 0.63, 0.66), 0.22, 1.0);
  // circumferential brushing: streaks round the axis, rough varying along height
  float br = vnoise(vec2(q.y * 900.0, a * 2.0)) * 0.6 + vnoise(vec2(q.y * 2400.0, 0.5)) * 0.4;
  m.rough = 0.16 + 0.14 * br;
  m.alb *= 0.9 + 0.12 * br;
  return m;
}
`;
