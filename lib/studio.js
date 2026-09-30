// The studio: every object in the film is shot like a luxury product film. A lacquered floor that
// reflects, an endless backdrop (a cyc) in the scene's colour, one key softbox with soft shadows and
// two coloured strip lights that draw rims and long highlights on metal. Scenes supply the objects:
//   float mapObj(vec3 p, out int id);           signed distance to the scene's objects
//   Mat material(int id, vec3 p, vec3 n);       what each object is made of
// and, when they #define FIRE, float fireDen(vec3 p) for a volume of flame (0..1 density).
// studio(ro, rd, depth) returns linear colour. Floor is y = 0.

export const STUDIO_UNIFORMS = {
  uCycA: [0.62, 0.55, 0.47],     // backdrop at the horizon (linear)
  uCycB: [0.42, 0.36, 0.30],     // backdrop overhead
  uFloorCol: [0.05, 0.04, 0.035],
  uFloorRough: 0.12,
  uFloorGrain: 1.0,
  uKeyDir: [-0.35, 0.8, 0.5],
  uKeyCol: [3.2, 3.0, 2.8],
  uKeySize: 0.35,
  uRimA: [1.6, 0.55, 0.25],      // left strip
  uRimB: [0.6, 0.75, 1.3],       // right strip
  uFogFar: 40,
  uP1: [0, -100, 0], uP1c: [0, 0, 0],   // two point lights (fire, lamps, screens)
  uP2: [0, -100, 0], uP2c: [0, 0, 0],
  uExpo: 1.0,
  uHaze: 0.0,                    // haze density per metre (0.02 to 0.12 for a smoky hall)
  uHazeCol: [0.05, 0.06, 0.05],  // colour the haze glows with (linear)
  uGrime: 0.0,                   // 0 lacquer .. 1 wet, dirty concrete with puddles
};

export const STUDIO_GLSL = /* glsl */ `
uniform vec3 uCycA, uCycB, uFloorCol, uKeyDir, uKeyCol, uRimA, uRimB, uP1, uP1c, uP2, uP2c;
uniform float uFloorRough, uFloorGrain, uKeySize, uFogFar, uExpo, uHaze, uGrime;
uniform vec3 uHazeCol;

struct Mat { vec3 alb; float rough; float metal; vec3 emit; float sheen; float trans; float clear; };
Mat M(vec3 a, float r, float m) { Mat x; x.alb = a; x.rough = r; x.metal = m; x.emit = vec3(0); x.sheen = 0.0; x.trans = 0.0; x.clear = 0.0; return x; }
Mat GOLD()    { return M(vec3(1.00, 0.71, 0.33), 0.16, 1.0); }
Mat ROSEGOLD(){ return M(vec3(0.98, 0.62, 0.50), 0.2, 1.0); }
Mat SILVER()  { return M(vec3(0.95, 0.94, 0.92), 0.14, 1.0); }
Mat CHROME()  { return M(vec3(0.98, 0.98, 0.99), 0.05, 1.0); }
Mat BRASS()   { return M(vec3(0.91, 0.70, 0.38), 0.26, 1.0); }
Mat LACQUER(vec3 c) { Mat m = M(c, 0.35, 0.0); m.clear = 1.0; return m; }
Mat SILK(vec3 c) { Mat m = M(c, 0.55, 0.0); m.sheen = 1.0; return m; }
Mat GLASS(vec3 tint) { Mat m = M(tint, 0.03, 0.0); m.trans = 1.0; m.clear = 1.0; return m; }

// grime: a 0..1 dirt mask (streaks run down, dirt collects low), and a way to dirty a material
float grimeMask(vec3 p) {
  float n = fbm(p * vec3(3.0, 0.8, 3.0), 4);
  float streak = fbm(vec2(p.x * 9.0 + p.z * 9.0, p.y * 0.6), 3);
  return sat(n * 1.2 - 0.35 + 0.35 * streak + 0.25 * exp(-p.y * 3.0));
}
Mat dirty(Mat m, vec3 p, float k) {
  float g = grimeMask(p) * k;
  m.alb = mix(m.alb, m.alb * vec3(0.32, 0.3, 0.26), g);
  m.rough = mix(m.rough, 0.85, g);
  m.clear *= 1.0 - g;
  return m;
}

float mapObj(vec3 p, out int id);
Mat material(int id, vec3 p, vec3 n);

// ---------------- shapes ----------------
float sdTorus(vec3 p, vec2 t) { vec2 q = vec2(length(p.xz) - t.x, p.y); return length(q) - t.y; }
// a chain link lying in the xy plane, long axis x: half length l, radius r, wire w
float sdLink(vec3 p, float l, float r, float w) { vec3 q = vec3(max(abs(p.x) - l, 0.0), p.y, p.z); return length(vec2(length(q.xy) - r, q.z)) - w; }
float sdCyl(vec3 p, float r, float h) { vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h); return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)); }
float sdRoundBox(vec3 p, vec3 b, float r) { vec3 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r; }
float sdSeg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = sat(dot(pa, ba) / dot(ba, ba)); return length(pa - ba * h); }
float sdPlaneY(vec3 p, float h) { return p.y - h; }
// a coin: face along y, radius r, half thickness h, a raised rim and a worn, noisy face
float sdCoin(vec3 p, float r, float h, float seed) {
  float rr = length(p.xz);
  float face = h * (0.72 + 0.28 * smoothstep(r * 0.86, r * 0.9, rr)) + 0.012 * h * (vnoise(p.xz * 60.0 / r + seed * 17.0) - 0.5);
  vec2 d = abs(vec2(rr, p.y)) - vec2(r, face);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - h * 0.05;
}
// a chain of n links along +x from the origin, alternating 90 degrees
float sdChain(vec3 p, float l, float r, float w, float n) {
  float pitch = 2.0 * (l + r) - 2.2 * w;
  float i = clamp(floor(p.x / pitch + 0.5), 0.0, n - 1.0);
  vec3 q = p - vec3(i * pitch, 0, 0);
  float a = sdLink(mod(i, 2.0) < 0.5 ? q : q.xzy, l, r, w);
  float j = clamp(i + (q.x > 0.0 ? 1.0 : -1.0), 0.0, n - 1.0);
  vec3 q2 = p - vec3(j * pitch, 0, 0);
  float b = sdLink(mod(j, 2.0) < 0.5 ? q2 : q2.xzy, l, r, w);
  return min(a, b);
}
// revolve a 2D profile distance (x = radius, y = height) round the y axis
vec2 revo(vec3 p) { return vec2(length(p.xz), p.y); }

// ---------------- light ----------------
vec3 keyDir() { return normalize(uKeyDir); }
float D_GGX(float nh, float a) { float a2 = a * a; float d = nh * nh * (a2 - 1.0) + 1.0; return a2 / (PI * d * d); }
float V_SmithJ(float nv, float nl, float a) { float k = a * 0.5; return 0.25 / ((nv * (1.0 - k) + k) * (nl * (1.0 - k) + k)); }
vec3 F_Schlick(vec3 f0, float vh) { return f0 + (1.0 - f0) * pow(1.0 - vh, 5.0); }

// the studio around everything: backdrop, the key softbox, two long strip lights
vec3 env(vec3 d) {
  float h = d.y;
  vec3 c = mix(uCycA, uCycB, smoothstep(0.0, 0.7, h));
  // below the horizon the lacquer floor, seen in reflections, is dark with the backdrop in it
  c = mix(c, uFloorCol * 1.5 + uCycA * 0.06, smoothstep(0.0, -0.08, h));
  // key softbox: a soft-edged rectangle round the key direction
  vec3 k = keyDir();
  vec3 ku = normalize(cross(k, vec3(0, 1, 0.001))), kv = cross(ku, k);
  float kd = dot(d, k);
  if (kd > 0.0) {
    vec2 q = vec2(dot(d, ku), dot(d, kv)) / kd;
    float box = smoothstep(uKeySize * 1.2, uKeySize * 0.9, abs(q.x)) * smoothstep(uKeySize * 0.8, uKeySize * 0.6, abs(q.y));
    c += uKeyCol * 1.8 * box;
  }
  // two vertical strips behind and to the sides
  float az = atan(d.x, -d.z);
  float band = smoothstep(-0.05, 0.1, h) * smoothstep(0.85, 0.5, h);
  c += uRimA * 2.4 * smoothstep(0.07, 0.03, abs(az + 2.1)) * band;
  c += uRimB * 2.4 * smoothstep(0.07, 0.03, abs(az - 2.1)) * band;
  return c;
}

vec3 calcNormal(vec3 p) {
  const vec2 e = vec2(1.0, -1.0) * 0.0006;
  int i;
  return normalize(e.xyy * mapObj(p + e.xyy, i) + e.yyx * mapObj(p + e.yyx, i) + e.yxy * mapObj(p + e.yxy, i) + e.xxx * mapObj(p + e.xxx, i));
}
float marchObj(vec3 ro, vec3 rd, float tmax, out int id) {
  float t = 0.01;
  for (int i = 0; i < 180; i++) {
    float d = mapObj(ro + rd * t, id);
    if (abs(d) < 0.0004 * t) return t;
    t += d * 0.85;
    if (t > tmax) break;
  }
  id = -1; return -1.0;
}
float softShadow(vec3 ro, vec3 rd, float k) {
  float res = 1.0, t = 0.02; int id;
  for (int i = 0; i < 48; i++) {
    float h = mapObj(ro + rd * t, id);
    res = min(res, k * h / t);
    t += clamp(h, 0.01, 0.3);
    if (res < 0.002 || t > 12.0) break;
  }
  return sat(res);
}
float calcAO(vec3 p, vec3 n) {
  float o = 0.0, s = 1.0; int id;
  for (int i = 1; i <= 5; i++) { float h = 0.03 * float(i); o += (h - mapObj(p + n * h, id)) * s; s *= 0.7; }
  return sat(1.0 - 2.5 * o);
}
// ground contact: how much the floor at p is covered by objects just above it
float floorAO(vec3 p) {
  float o = 0.0; int id;
  for (int i = 1; i <= 4; i++) { float h = 0.06 * float(i); o += sat((h - mapObj(p + vec3(0, h, 0), id)) / h); }
  return 0.35 + 0.65 * sat(1.0 - 0.3 * o);
}

vec3 pointLight(vec3 p, vec3 n, vec3 v, Mat m, vec3 lp, vec3 lc) {
  vec3 L = lp - p; float d2 = dot(L, L); L /= sqrt(d2);
  float nl = sat(dot(n, L));
  vec3 f0 = mix(vec3(0.04), m.alb, m.metal);
  vec3 h = normalize(L + v);
  float a = max(0.03, m.rough * m.rough);
  vec3 spec = F_Schlick(f0, sat(dot(v, h))) * D_GGX(sat(dot(n, h)), a) * V_SmithJ(sat(dot(n, v)), nl, a);
  vec3 diff = m.alb * (1.0 - m.metal) / PI;
  return (diff + spec) * lc * nl / (1.0 + d2);
}

// a lit surface point
vec3 shadeSurf(vec3 p, vec3 n, vec3 rd, Mat m, float ao) {
  vec3 v = -rd;
  float nv = max(dot(n, v), 1e-3);
  vec3 f0 = mix(vec3(0.04), m.alb, m.metal);
  float a = max(0.02, m.rough * m.rough);
  vec3 col = vec3(0);
  // key softbox, shadowed
  vec3 L = keyDir();
  float nl = sat(dot(n, L));
  if (nl > 0.0) {
    float sh = softShadow(p + n * 0.003, L, 10.0 / max(uKeySize, 0.05));
    vec3 h = normalize(L + v);
    vec3 spec = F_Schlick(f0, sat(dot(v, h))) * D_GGX(sat(dot(n, h)), max(a, uKeySize * 0.25)) * V_SmithJ(nv, nl, a);
    vec3 diff = m.alb * (1.0 - m.metal) / PI;
    col += (diff + spec) * uKeyCol * nl * sh;
  }
  // strip lights as rims from behind-left and behind-right
  vec3 la = normalize(vec3(-0.86, 0.25, -0.45)), lb = normalize(vec3(0.86, 0.25, -0.45));
  float ra = pow(1.0 - nv, 2.0) * sat(dot(n, la) + 0.3), rb = pow(1.0 - nv, 2.0) * sat(dot(n, lb) + 0.3);
  col += (uRimA * ra + uRimB * rb) * mix(m.alb * (1.0 - m.metal) * 0.6 + 0.04, m.alb, m.metal) * 0.9;
  // two point lights
  col += pointLight(p, n, v, m, uP1, uP1c) + pointLight(p, n, v, m, uP2, uP2c);
  // the room: diffuse from the backdrop, reflection of the studio
  vec3 amb = mix(uCycA, uCycB, 0.5 + 0.5 * n.y) * (0.5 + 0.5 * n.y) + uFloorCol * 0.4 * sat(-n.y);
  col += m.alb * (1.0 - m.metal) * amb * 0.55 * ao;
  vec3 r = reflect(rd, n);
  // rough reflections blur toward the normal, jittered per sub-frame so they average out
  vec3 jit = (hash33(p * 911.0 + uFrame * 0.37 + vec3(uJitter, 0.0)) - 0.5) * 2.0;
  r = normalize(r + jit * m.rough * m.rough * 1.2);
  vec3 F = F_Schlick(f0, nv);
  vec3 envc = env(r) * mix(1.0, ao, 0.7);
  col += envc * F * (m.metal > 0.5 ? 1.0 : mix(0.35, 1.0, m.clear)) * (1.0 - m.rough * 0.5);
  if (m.clear > 0.0 && m.metal < 0.5) col += env(reflect(rd, n)) * F_Schlick(vec3(0.04), nv) * m.clear * 0.8;
  if (m.sheen > 0.0) col += m.alb * pow(1.0 - nv, 4.0) * (uKeyCol * 0.25 + uRimA * 0.3 + uRimB * 0.3) * m.sheen;
  if (m.trans > 0.0) {
    vec3 tr = refract(rd, n, 0.72);
    col = mix(col, env(tr) * m.alb * 0.9, m.trans * (1.0 - F.x));
  }
  return col + m.emit;
}

#ifdef FIRE
float fireDen(vec3 p);
// blackbody-ish ramp for flame temperature 0..1
vec3 fireCol(float k) { return vec3(1.0, 0.35, 0.08) * k * 3.0 + vec3(1.0, 0.78, 0.35) * pow(k, 3.0) * 7.0; }
vec3 fireMarch(vec3 ro, vec3 rd, float tmax, inout float trans) {
  vec3 acc = vec3(0);
  float t0 = 0.05, dt = min(tmax, 16.0) / 72.0;
  float j = hash12(gl_FragCoord.xy + uFrame * 3.1 + uJitter * 50.0) * dt;
  for (int i = 0; i < 72; i++) {
    float t = t0 + j + float(i) * dt;
    if (t > tmax) break;
    float d = fireDen(ro + rd * t);
    if (d > 0.002) {
      acc += fireCol(d) * d * dt * 6.0 * trans;
      trans *= exp(-d * dt * 2.0);
    }
  }
  return acc;
}
#endif

vec3 studio(vec3 ro, vec3 rd, out float depth) {
  int id;
  float tf = rd.y < -1e-4 ? -ro.y / rd.y : 1e9;
  float t = marchObj(ro, rd, min(tf, 80.0), id);
  vec3 col;
  if (t > 0.0) {
    vec3 p = ro + rd * t, n = calcNormal(p);
    Mat m = material(id, p, n);
    col = shadeSurf(p, n, rd, m, calcAO(p, n));
    depth = t;
  } else if (tf < 1e8) {
    // the lacquer floor: fine grain, a soft contact shadow, a blurred mirror of the scene
    vec3 p = ro + rd * tf;
    depth = tf;
    float g = uFloorGrain * (fbm(p.xz * 3.0, 4) - 0.5);
    vec3 n = normalize(vec3(g * 0.02, 1.0, g * 0.015));
    // wet concrete: puddles stay mirror-glossy, the rest is rough and stained
    float puddle = smoothstep(0.52, 0.6, fbm(p.xz * 0.45 + 3.1, 4));
    float stain = fbm(p.xz * 1.3 + 7.7, 5);
    float fRough = mix(uFloorRough, mix(0.55, 0.03, puddle), uGrime);
    vec3 fCol = mix(uFloorCol, uFloorCol * (0.55 + 0.9 * stain), uGrime);
    n = normalize(mix(n, vec3(0, 1, 0), puddle * uGrime));
    float ao = floorAO(p);
    vec3 L = keyDir();
    float sh = softShadow(p + vec3(0, 0.002, 0), L, 10.0 / max(uKeySize, 0.05));
    col = fCol * (1.0 + 0.25 * g) * (uKeyCol * sat(L.y) * sh * 0.32 + mix(uCycA, uCycB, 0.5) * 0.35) * ao;
    Mat fm = M(fCol, fRough, 0.0);
    col += pointLight(p, n, -rd, fm, uP1, uP1c) + pointLight(p, n, -rd, fm, uP2, uP2c);
    vec3 r = reflect(rd, n);
    vec3 jit = (hash33(p * 733.0 + uFrame * 0.61 + vec3(uJitter, 1.0)) - 0.5) * 2.0;
    r = normalize(r + jit * fRough * fRough * 0.8);
    float fr = 0.04 + 0.96 * pow(1.0 - sat(-rd.y), 5.0);
    int rid;
    float rt = marchObj(p + vec3(0, 0.002, 0), r, 30.0, rid);
    vec3 rc;
    if (rt > 0.0) {
      vec3 rp = p + r * rt, rn = calcNormal(rp);
      Mat rm = material(rid, rp, rn);
      rc = shadeSurf(rp, rn, r, rm, 1.0);
    } else rc = env(r);
    // clamp what a rough reflection can pick up: thin bright emitters (tubes, sparks) otherwise
    // sparkle as fireflies that no number of sub-frames averages out
    float rl = max(rc.r, max(rc.g, rc.b));
    rc *= min(1.0, mix(16.0, 0.3, sat(fRough * 3.0)) / max(rl, 1e-4));
    col += rc * mix(fr, 1.0, 0.25) * (1.0 - fRough) * ao;
    // far floor melts into the backdrop: no visible horizon line
    col = mix(col, env(vec3(rd.x, 0.001, rd.z)), smoothstep(uFogFar * 0.35, uFogFar, tf));
  } else {
    col = env(rd);
    depth = 1e3;
  }
#ifdef FIRE
  float tr = 1.0;
  vec3 fc = fireMarch(ro, rd, min(depth, 30.0), tr);
  col = col * tr + fc;
#endif
  if (uHaze > 0.0) {
    float hz = 1.0 - exp(-min(depth, 60.0) * uHaze);
    // haze catches the key light: brighter looking toward it
    float kf = pow(sat(dot(rd, keyDir())), 6.0);
    col = mix(col, uHazeCol * (1.0 + 3.0 * kf), hz);
  }
  return col * uExpo;
}
`;
