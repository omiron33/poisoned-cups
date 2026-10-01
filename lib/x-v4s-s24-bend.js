// Scene helpers shared by s24-bend and s25-stones (v4): the control hall, the people, the cables.
// Picture modules only. Include order: STUDIO_GLSL + FIGURE_GLSL + SNAKE_GLSL + HEAD_GLSL + XF_GLSL
// + HALL24_GLSL + the scene's code.
//
// The set (world metres): three steel control pylons (radius PR, height PHT) on plinths at PYL(k),
// each with a rigid iron snake (snakeWrap) wound round it and its head reared off the top; half-rails
// joining them (each half belongs to one pylon, so a fallen pylon takes its halves with it); a black
// wall at z = WALLZ carrying three frozen magenta contour faces (faceScan, live 0); a cracked floor
// disc round each base.
//
// Uniforms (hall24Uniforms()):
//   uTh        pylon tilt (rad): k 0 falls to the left, 1 backward (into the wall), 2 to the right
//   uSh        shatter 0..1 (the fallen pylon in three pieces, sliding apart on the floor)
//   uCrk       white-hot crack light round the base (0 off)
//   uLoop      a cable loop caught round the pylon's neck (0 none, 1 there)
//   uHole      0..1 the wall's breach behind the centre pylon (warm light beyond)
//   uHoleCol   the light beyond the breach
//   uFace      face wall brightness
// People: uPos[N] = (x, z, yaw, kind), uPA/uPB/uPC[N] the poses (person frame: facing +z; yaw pi
// faces the pylons). N = PEOPLE_N (12; unused slots: kind < 0).
// Cables are the scene's own (they hang off the people's hands, computed per pixel in GLSL):
//   float cableBez(p, a, b, c, u, r)  a quadratic Bezier a -> c (control b) drawn from a to fraction u.
export const PEOPLE_N = 12;
export const PYL = [[-1.75, 0, 0.0], [0.0, 0, -0.7], [1.75, 0, 0.0]];
export const PR = 0.22, PHT = 3.2, PLH = 0.36, WALLZ = -2.6;

// JS twin of the GLSL pylon transform: local (upright, origin at the base centre) -> world
export function pylWorld(k, th, l) {
  const c = Math.cos(th), s = Math.sin(th);
  const P = PYL[k];
  if (k === 0) { const x = l[0] + PLH, y = l[1]; return [P[0] - PLH + x * c - y * s, x * s + y * c, P[2] + l[2]]; }
  if (k === 2) { const x = l[0] - PLH, y = l[1]; return [P[0] + PLH + x * c + y * s, -x * s + y * c, P[2] + l[2]]; }
  const y = l[1], z = l[2] + PLH; return [P[0] + l[0], y * c + z * s, P[2] - PLH - y * s + z * c];
}

const f3 = (a) => `vec3(${a.map((x) => x.toFixed(3)).join(', ')})`;

// a fresh set per scene (the arrays are written in place by update())
export const hall24Uniforms = () => ({
  uTh: [0, 0, 0], uSh: [0, 0, 0], uCrk: [0, 0, 0], uLoop: [0, 0, 0],
  uHole: 0, uHoleCol: [0, 0, 0], uFace: 1,
  uPos: new Array(PEOPLE_N * 4).fill(0).map((v, i) => (i % 4 === 3 ? -1 : 0)),
  uPA: new Array(PEOPLE_N * 4).fill(0), uPB: new Array(PEOPLE_N * 4).fill(0), uPC: new Array(PEOPLE_N * 4).fill(0),
});

export const HALL24_GLSL = /* glsl */ `
#define NPEO ${PEOPLE_N}
uniform vec3 uTh, uSh, uCrk, uLoop;   // per pylon k = 0, 1, 2
uniform float uHole, uFace;
uniform vec3 uHoleCol;
uniform vec4 uPos[NPEO], uPA[NPEO], uPB[NPEO], uPC[NPEO];
const float PR = ${PR.toFixed(3)}, PHT = ${PHT.toFixed(3)}, PLH = ${PLH.toFixed(3)}, WALLZ = ${WALLZ.toFixed(3)};
vec3 pyl(int k) { return k == 0 ? ${f3(PYL[0])} : (k == 1 ? ${f3(PYL[1])} : ${f3(PYL[2])}); }
// world -> the pylon's upright local frame (origin at the base centre)
vec3 pylLocal(vec3 p, int k) {
  float th = uTh[k], c = cos(th), s = sin(th);
  vec3 P = pyl(k);
  if (k == 0) { vec3 q = p - (P - vec3(PLH, 0, 0)); return vec3(q.x * c + q.y * s - PLH, -q.x * s + q.y * c, q.z); }
  if (k == 2) { vec3 q = p - (P + vec3(PLH, 0, 0)); return vec3(q.x * c - q.y * s + PLH, q.x * s + q.y * c, q.z); }
  vec3 q = p - (P - vec3(0, 0, PLH)); return vec3(q.x, q.y * c - q.z * s, q.y * s + q.z * c - PLH);
}
// the half-rails each pylon carries (toward its neighbours' midpoints)
vec3 railDir(int k, float side) {
  vec3 a = pyl(k), b = pyl(k + int(side));
  return (b - a) * 0.5;
}
float gPyPart = 0.0;   // 0 steel, 1 snake, 2 rail, 3 cable loop, 4 plinth
float pylonUpright(vec3 q, int k) {
  float d = sdCyl(q - vec3(0.0, PHT * 0.5, 0.0), PR, PHT * 0.5);
  d = min(d, sdCyl(q - vec3(0.0, PHT + 0.05, 0.0), PR + 0.05, 0.05));
  d = min(d, sdCyl(q - vec3(0.0, 1.05, 0.0), PR + 0.03, 0.03));
  gPyPart = 0.0;
  float pl = sdRoundBox(q - vec3(0.0, 0.08, 0.0), vec3(PLH, 0.08, PLH), 0.012);
  if (pl < d) { d = pl; gPyPart = 4.0; }
  // half rails
  float r = 1e9;
  for (int j = 0; j < 2; j++) {
    float side = j == 0 ? -1.0 : 1.0;
    if ((k == 0 && side < 0.0) || (k == 2 && side > 0.0)) continue;
    vec3 h = railDir(k, side);
    r = min(r, sdCapsule(q, vec3(0.0, 1.75, 0.0), vec3(0.0, 1.75, 0.0) + h, 0.032));
    r = min(r, sdCapsule(q, vec3(0.0, 0.95, 0.0), vec3(0.0, 0.95, 0.0) + h, 0.026));
  }
  if (r < d) { d = r; gPyPart = 2.0; }
  // the cable loop caught round the neck
  if (uLoop[k] > 0.5) {
    float lp = sdTorus(q - vec3(0.0, PHT - 0.12, 0.0), vec2(PR + 0.03, 0.022));
    if (lp < d) { d = lp; gPyPart = 3.0; }
  }
  // the rigid snake wound round it, head reared off the top looking out toward the people (+z)
  float H = 0.78, y0 = 0.32, y1 = PHT - 0.28;
  float thMax = (y1 - y0) / H * 6.2831853;
  float out_ = k == 0 ? 2.0 : (k == 1 ? 1.85 : 1.15);
  float sn = snakeWrap(q, vec3(0.0), PR, 0.115, H, y0, y1, out_ - thMax, 0.78, 0.35, 0.0);
  if (sn < d) { d = sn; gPyPart = 1.0; keepSnake(); }
  return d;
}
// the pylon with its tilt and (once fallen) its three pieces
vec3 gPyQ;
float pylon(vec3 p, int k) {
  vec3 q = pylLocal(p, k);
  // bound: a capsule round the whole upright column
  float bb = sdCapsule(q, vec3(0.0, 0.0, 0.0), vec3(0.0, PHT + 0.6, 0.0), 1.15 + 0.6 * uSh[k]);
  if (bb > 0.3) { gPyQ = q; gPyPart = 0.0; return bb; }
  if (uSh[k] <= 0.0) { gPyQ = q; return pylonUpright(q, k); }
  // three pieces: cuts at 1.1 and 2.2; each slides along the axis, across the floor (local z, or x
  // for the centre one) and turns a little about the vertical
  float d = 1e9; vec3 bq = q; float bp = 0.0;
  for (int j = 0; j < 3; j++) {
    float fj = float(j);
    float a = fj * 1.1, b = j == 2 ? PHT + 1.2 : a + 1.1;
    float mid = (a + b) * 0.5;
    float s = uSh[k];
    vec3 off = vec3(0.0, (fj - 0.6) * 0.32 * s, 0.0);
    float side = (hash11(fj * 3.7 + float(k)) - 0.5) * 2.0;
    vec3 up = k == 1 ? vec3(0, 0, 1) : vec3(1, 0, 0);
    vec3 acr = k == 1 ? vec3(1, 0, 0) : vec3(0, 0, 1);
    off += acr * side * 0.35 * s;
    vec3 qj = q - off;
    // turn about the world vertical (the local 'up' once lying down) round the piece centre
    vec3 c = vec3(0.0, mid, 0.0);
    vec3 r = qj - c;
    float ang = side * 0.35 * s;
    if (k == 1) r.xy = rot(ang) * r.xy; else r.yz = rot(ang) * r.yz;
    qj = c + r;
    float dj = pylonUpright(qj, k);
    float pp = gPyPart;
    dj = max(dj, abs(qj.y - mid) - (b - a) * 0.5 + 0.015 * s);
    if (dj < d) { d = dj; bq = qj; bp = pp; }
  }
  gPyQ = bq; gPyPart = bp;
  return d;
}
// the wall: black panels with the three frozen faces; the breach behind the centre pylon
float wallSD(vec3 p) {
  float d = sdBox(p - vec3(0.0, 4.5, WALLZ), vec3(14.0, 4.5, 0.08));
  if (uHole > 0.0) {
    vec2 hs = vec2(1.0, 1.65) * uHole;
    vec2 hq = p.xy - vec2(0.0, 1.55);
    // a jagged breach
    float jag = 0.12 * (vnoise(hq * 5.0 + 3.0) - 0.5) * uHole;
    float hole = sdBox2(hq, hs) + jag;
    d = max(d, -hole);
  }
  return d;
}
// people
vec3 peoLocal(vec3 p, int i) { return pfRy(p - vec3(uPos[i].x, 0.0, uPos[i].y), -uPos[i].z); }
float people(vec3 p, out int who) {
  who = -1;
  float d = 1e9;
  for (int i = 0; i < NPEO; i++) {
    if (uPos[i].w < -0.5) continue;
    vec3 q = peoLocal(p, i);
    float b = length(q.xz) - 1.0;
    if (b > d) continue;
    float f = sdPerson3(q, uPA[i], uPB[i], uPC[i], uPos[i].w);
    if (f < d) { d = f; who = i; }
  }
  return d;
}
vec3 qbez(vec3 a, vec3 b, vec3 c, float t) { float u = 1.0 - t; return u * u * a + 2.0 * u * t * b + t * t * c; }
float cableBez(vec3 p, vec3 a, vec3 b, vec3 c, float u, float r) {
  // the sub-curve [0, u] (de Casteljau), in 7 straight pieces
  vec3 b2 = mix(a, b, u), c2 = qbez(a, b, c, u);
  vec3 lo = min(min(a, b2), c2) - r - 0.05, hi = max(max(a, b2), c2) + r + 0.05;
  vec3 e = max(lo - p, p - hi);
  float bb = max(e.x, max(e.y, e.z));
  if (bb > 0.1) return bb;
  float d = 1e9; vec3 pr = a;
  for (int i = 1; i <= 7; i++) { vec3 nx = qbez(a, b2, c2, float(i) / 7.0); d = min(d, sdCapsule(p, pr, nx, r)); pr = nx; }
  return d;
}
// materials
Mat pylonMat(int k, vec3 q, vec3 n, vec3 p) {
  if (gPyPart > 0.5 && gPyPart < 1.5) {
    Mat m = snakeMat(p, n, 1.0);
    // rigid iron: darker than the pylon steel so the coils read against it
    m.alb *= 0.55; m.rough = 0.26;
    return dirty(m, p, 0.25);
  }
  if (gPyPart > 1.5 && gPyPart < 2.5) { Mat m = M(vec3(0.62, 0.63, 0.66), 0.2, 1.0); return dirty(m, p, 0.3); }
  if (gPyPart > 2.5 && gPyPart < 3.5) { Mat m = M(vec3(0.03, 0.03, 0.035), 0.5, 0.0); return m; }
  float a = atan(q.z, q.x);
  Mat m = M(vec3(0.66, 0.67, 0.7), 0.18 + 0.12 * vnoise(vec2(a * 40.0, q.y * 2.0)), 1.0);
  if (gPyPart > 3.5) { m = M(vec3(0.16, 0.16, 0.17), 0.45, 0.4); }
  float front = smoothstep(0.0, 0.5, cos(a - 1.5708));
  if (gPyPart < 0.5) {
    if (k == 0) m.emit = vec3(0.3, 1.5, 0.45) * smoothstep(0.02, 0.0, abs(q.y - 2.3) - 0.035) * front;
    if (k == 1) { float sl = smoothstep(0.012, 0.0, abs(fract(q.y * 3.0) - 0.5) - 0.02) * front * step(0.3, q.y) * step(q.y, 2.9); m.alb *= 1.0 - 0.7 * sl; m.emit = vec3(1.3, 0.2, 0.8) * sl * 0.35; }
    if (k == 2) m.emit = vec3(1.2, 1.25, 1.4) * smoothstep(0.015, 0.0, abs(q.y - 1.95) - 0.012) * front;
    // the white-hot cracks climbing from the base
    if (uCrk[k] > 0.0) {
      float cr = fractureLines(vec2(a * PR * 1.3, q.y), float(k) * 3.0 + 1.0, 5.0) * smoothstep(1.4, 0.1, q.y);
      m.emit += vec3(3.2, 3.0, 2.7) * uCrk[k] * cr * 1.4;
    }
  } else if (gPyPart > 3.5 && uCrk[k] > 0.0) {
    float cr = fractureLines(q.xz * 1.0 + q.y, float(k) * 5.0 + 2.0, 6.0);
    m.emit += vec3(3.2, 3.0, 2.7) * uCrk[k] * cr * 1.6;
  }
  return dirty(m, p, 0.35);
}
Mat wallMat(vec3 p, vec3 n) {
  Mat m = M(vec3(0.03, 0.03, 0.035) * (0.7 + 0.6 * fbm(p * 3.0, 3)), 0.32, 0.0);
  // panel seams
  vec2 g = abs(fract(p.xy / vec2(1.1, 0.9)) - 0.5);
  m.alb *= 1.0 - 0.6 * smoothstep(0.485, 0.495, max(g.x, g.y));
  if (n.z > 0.7) {
    float i = clamp(floor(p.x / 1.65 + 0.5), -1.0, 1.0);
    vec2 uv = vec2((p.x - i * 1.65) / 0.72, (p.y - 4.3) / 0.86);
    if (abs(uv.x) < 1.0 && abs(uv.y) < 1.0) {
      m.alb = vec3(0.01); m.rough = 0.06; m.clear = 1.0;
      // three still, defiant contour faces, frozen magenta (live 0): chin up a touch, turned in
      vec3 e = faceScan(uv, -0.12 * i, 0.0, 0.0, 0.0, vec3(1.0));
      m.emit = e * 0.75 * uFace;
      // the frozen scan band held across the eyes
      m.emit *= 1.0 + 0.6 * smoothstep(0.04, 0.0, abs(uv.y - 0.12));
      // the screen frame
      float fr = smoothstep(0.985, 0.995, max(abs(uv.x), abs(uv.y)));
      m.emit += vec3(0.55, 0.08, 0.35) * fr * 0.6 * uFace;
    }
  }
  // the breach's broken edge glows with the light beyond
  if (uHole > 0.0) {
    vec2 hq = p.xy - vec2(0.0, 1.55);
    float hole = sdBox2(hq, vec2(1.0, 1.65) * uHole) + 0.12 * (vnoise(hq * 5.0 + 3.0) - 0.5) * uHole;
    m.emit += uHoleCol * 0.5 * smoothstep(0.25, 0.0, hole);
  }
  return dirty(m, p, 0.5);
}
// a person: matte fabric plus a warm fake key from the camera side and a warm rim, so a back-lit
// crowd never goes to a black cut-out
Mat peopleMat(int i, vec3 p, vec3 n, vec3 warmDir, vec3 warmCol, vec3 rimCol) {
  vec3 q = peoLocal(p, i);
  float yaw = uPos[i].z;
  vec3 v = normalize(uCamPos - p);
  Mat m = personMat(q, pfRy(n, -yaw), pfRy(v, -yaw), uPA[i], uPB[i], uPC[i], uPos[i].w, float(i) * 3.1 + 1.0);
  if (gPart != 2) m.alb *= 1.3;
  float nl = sat(dot(n, warmDir));
  float nv = sat(dot(n, v));
  // the hi-vis stays toxic lime (never gold): no warm wash on the vest and hat
  bool vis = gPart == 4 && uPos[i].w > 1.5 && uPos[i].w < 2.5;
  m.emit += m.alb * (vis ? vec3(0.35, 0.5, 0.3) : warmCol) * (0.08 + 0.6 * nl);
  m.emit += rimCol * pow(1.0 - nv, 3.0) * (0.3 + 0.5 * sat(n.y + 0.6));
  if (gPart == 2) m.emit += m.alb * warmCol * 0.2;
  return m;
}
`;
