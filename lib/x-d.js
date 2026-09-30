// v2 shared picture helpers for s06-empire and s22-fall (and the dashboards they share).
// Picture modules only. Include DASH_GLSL after STUDIO_GLSL and EMPIRE_GLSL (lib/x-empire.js):
// it re-skins the empire's slab towers as stacked dashboard screens (control stacks, trading
// terminals, policy dashboards) instead of white-and-gold enamel, wraps them in propaganda skins
// (graph lines and map grids), and adds a control-room LED wall of dashboards and a central core.
//
//   vec3 dashScreen(vec2 uv, float kind, float seed, float fail)  a 2D dashboard (uv 0..1):
//        kind 0 rising line graph, 1 bar chart, 2 map contours with a target, 3 ticker rows
//   Mat dashSlabMat(int id, vec3 p, vec3 n)   use in place of empireMat(): black chassis, a screen
//        face on the front, silver fins, skins by uSkin; a tower's screens die as it tilts (uLv.z)
//   float dashWall(vec3 p) / Mat dashWallMat(vec3 p)   the LED wall of dashboards behind (z = uWallZ)
//   float coreSDF(vec3 p) / Mat coreMat()               the central core column at uCoreAt
// Uniforms: uSkin (0..1 skins), uWallGlow, uWallFail (0..1 share of wall panels dead),
//   uWallZ, uCoreAt, uCore (0 cold and dim .. 1 warm and lit), uShard[8] (xyz, spin) screen shards.
export const DASH_UNIFORMS = {
  uSkin: 1, uWallGlow: 1, uWallFail: 0, uWallZ: -2.3, uCoreAt: [0, 0, -1.45], uCore: 0,
  uShard: new Array(32).fill(0).map((x, i) => (i % 4 === 1 ? -5 : 0)),
};

export const DASH_GLSL = /* glsl */ `
uniform float uSkin, uWallGlow, uWallFail, uWallZ, uCore;
uniform vec3 uCoreAt;
uniform vec4 uShard[8];
const vec3 D_GREEN = vec3(0.3, 1.0, 0.42);
const vec3 D_MAG = vec3(1.0, 0.16, 0.6);
const vec3 D_WHITE = vec3(0.72, 0.78, 0.95);
const vec3 D_VIOLET = vec3(0.42, 0.22, 1.0);

vec3 dashScreen(vec2 uv, float kind, float seed, float fail) {
  vec3 c = vec3(0.004, 0.005, 0.012);
  vec2 g = abs(fract(uv * vec2(8.0, 4.0)) - 0.5);
  c += D_VIOLET * 0.06 * step(0.465, max(g.x, g.y));
  if (kind < 1.0) {
    float y = 0.18 + 0.6 * uv.x + 0.16 * (vnoise(vec2(uv.x * 7.0 + seed * 13.0, seed)) - 0.5) + 0.03 * sin(uv.x * 40.0 + uTime * 3.0 + seed);
    float d = abs(uv.y - y);
    c += D_GREEN * (smoothstep(0.05, 0.0, d) * 1.3 + 0.14 * step(uv.y, y));
  } else if (kind < 2.0) {
    float bx = floor(uv.x * 9.0);
    float h = 0.15 + 0.75 * hash12(vec2(bx, seed)) * (0.85 + 0.15 * sin(uTime * 3.0 + bx));
    c += mix(D_MAG, D_WHITE, step(0.8, hash12(vec2(bx, seed + 3.0)))) * step(uv.y, h) * step(0.22, fract(uv.x * 9.0)) * 0.85;
  } else if (kind < 3.0) {
    float f = fbm(uv * vec2(3.0, 1.6) + seed, 3);
    c += D_VIOLET * 0.9 * smoothstep(0.07, 0.0, 0.5 - abs(fract(f * 7.0) - 0.5));
    vec2 tg = vec2(0.2 + 0.6 * hash11(seed), 0.25 + 0.5 * hash11(seed + 1.7));
    float r = length((uv - tg) * vec2(2.0, 1.0));
    c += D_MAG * 1.4 * (smoothstep(0.03, 0.0, abs(r - 0.12)) + smoothstep(0.035, 0.0, r));
  } else {
    float sp = uTime * (1.5 + 2.0 * hash11(seed));
    vec2 q = vec2(uv.x * 26.0 + sp * (mod(floor(uv.y * 5.0), 2.0) * 2.0 - 1.0), uv.y * 5.0);
    float on = step(0.4, hash12(floor(q) + seed)) * step(0.3, fract(q.y)) * step(fract(q.y), 0.75) * step(0.18, fract(q.x));
    c += mix(D_WHITE, D_GREEN, step(0.7, hash12(vec2(floor(q.y), seed)))) * 0.75 * on;
  }
  // failing: the picture flickers, tears into static, then goes dark
  if (fail > 0.0) {
    float st = hash12(floor(uv * vec2(60.0, 20.0)) + floor(uTime * 24.0));
    c = mix(c, D_WHITE * 0.5 * step(0.7, st), sat(fail * 2.0) * (1.0 - sat(fail * 2.0 - 1.0)) * 0.7);
    c *= 1.0 - sat(fail * 1.3 - 0.2);
  }
  return c;
}

Mat dashSlabMat(int id, vec3 p, vec3 n) {
  if (id == 30) {
    Mat m = GLASS(vec3(0.6, 1.0, 0.75));
    m.emit = D_GREEN * 2.4 * uGlow;
    return m;
  }
  int k = id - 20;
  vec3 q = towerP(p, k);
  float i = floor(q.y / SH);
  float ly = q.y - (i + 0.5) * SH;
  float fail = smoothstep(0.08, 0.7, abs(uLv[k].z));
  // black anodised chassis, brushed silver edges where slabs meet
  Mat m = M(vec3(0.035, 0.036, 0.042), 0.18 + 0.1 * vnoise(q * vec3(300.0, 20.0, 20.0)), 0.6);
  m.clear = 0.8;
  float seam = smoothstep(SH * 0.36, SH * 0.42, abs(ly));
  if (seam > 0.5) { m = SILVER(); m.rough = 0.3; }
  // the tower's pose in world space decides which face we are on
  vec4 v = uLv[k];
  float c = cos(v.z), s = sin(v.z);
  vec3 ln = vec3(n.x * c + n.y * s, -n.x * s + n.y * c, n.z);
  float W = TW[k];
  if (ln.z > 0.7 && seam < 0.5) {
    // the screen: a dashboard spread over blocks of four slabs
    float blk = floor(q.y / (SH * 4.0));
    vec2 uv = vec2((q.x + W) / (2.0 * W), fract(q.y / (SH * 4.0)));
    float kind = floor(hash12(vec2(blk, float(k) * 7.0)) * 4.0);
    m = M(vec3(0.01), 0.06, 0.0); m.clear = 1.0;
    m.emit = dashScreen(uv, kind, blk * 3.1 + float(k) * 11.0, fail) * 1.35 * uGlow * (0.8 + 0.2 * sin(q.y * 900.0));
  }
  // propaganda skins: a graph line and a map grid wrapped round every face
  if (uSkin > 0.0) {
    float sx = q.x + q.z * 1.3 + float(k) * 0.7;
    float yl = 0.25 + 0.12 * float(k % 3) + 0.2 * sx + 0.06 * sin(sx * 11.0 + float(k));
    float line = smoothstep(0.006, 0.0, abs(q.y - yl));
    float yl2 = 0.6 + 0.1 * sin(sx * 7.0 + float(k) * 2.0) - 0.15 * sx;
    float line2 = smoothstep(0.004, 0.0, abs(q.y - yl2));
    vec2 gg = abs(fract(vec2(sx * 14.0, q.y * 14.0)) - 0.5);
    float grid = step(0.47, max(gg.x, gg.y)) * step(abs(ln.z), 0.7);
    m.emit += (D_GREEN * 2.0 * line + D_MAG * 1.6 * line2 + D_VIOLET * 0.25 * grid) * uSkin * (1.0 - fail);
  }
  return dirty(m, p * 1.3, 0.25);
}

// the control room's LED wall: a grid of dashboard panels on a black wall
float dashWall(vec3 p) { return sdBox(p - vec3(0.0, 1.5, uWallZ), vec3(5.0, 1.5, 0.04)); }
Mat dashWallMat(vec3 p) {
  Mat m = M(vec3(0.02, 0.02, 0.025), 0.3, 0.3);
  if (p.z < uWallZ + 0.03) return m;
  vec2 cell = vec2(0.92, 0.52);
  vec2 g = (p.xy - vec2(0.0, 0.12)) / cell;
  vec2 id = floor(g), f = fract(g);
  float bez = step(0.035, f.x) * step(f.x, 0.965) * step(0.06, f.y) * step(f.y, 0.94);
  if (bez < 0.5 || id.y < 0.0 || id.y > 4.0) return m;
  float h = hash12(id + 5.0);
  float dead = step(h, uWallFail);
  float kind = floor(hash12(id + 13.0) * 4.0);
  vec2 uv = (f - vec2(0.035, 0.06)) / vec2(0.93, 0.88);
  m = M(vec3(0.01), 0.08, 0.0); m.clear = 1.0;
  m.emit = dashScreen(uv, kind, h * 50.0, dead) * 0.55 * uWallGlow * (0.8 + 0.2 * sin(p.y * 700.0));
  return m;
}

// the central core: a column of light behind the towers; cold and dim until it warms
float coreSDF(vec3 p) { return sdCapsule(p, uCoreAt + vec3(0.0, 0.15, 0.0), uCoreAt + vec3(0.0, 1.9, 0.0), 0.11); }
Mat coreMat(vec3 p) {
  Mat m = M(vec3(0.06, 0.06, 0.07), 0.25, 0.0); m.clear = 1.0;
  float fl = 0.9 + 0.1 * sin(p.y * 40.0 - uTime * 6.0);
  m.emit = mix(D_VIOLET * 0.25, vec3(3.2, 2.5, 1.6), uCore) * fl;
  return m;
}

// screen shards thrown off falling towers: thin glowing slivers
float shardSDF(vec3 p, out int which) {
  float d = 1e9; which = -1;
  for (int i = 0; i < 8; i++) {
    vec3 c = uShard[i].xyz;
    if (c.y < -1.0) continue;
    vec3 q = p - c;
    if (length(q) > 0.2) { d = min(d, length(q) - 0.15); continue; }
    q.xz = rot(uShard[i].w) * q.xz;
    q.xy = rot(0.3 * sin(uShard[i].w)) * q.xy;
    float b = sdBox(q, vec3(0.1, 0.004, 0.035));
    if (b < d) { d = b; which = i; }
  }
  return d;
}
Mat shardMat(int i) {
  Mat m = M(vec3(0.02), 0.05, 0.0); m.clear = 1.0;
  m.emit = mix(D_GREEN, D_MAG, step(0.5, hash11(float(i) * 3.7))) * 1.4 * uGlow;
  return m;
}
`;
