// 17 · 'You say "we see" / So your darkness stays'   (v4 REBUILD: the eye)
// Outside: s08's sensor eye built out as a launch product. A building-sized eye on a white ceramic
// tower stands over a wet night plaza: two concentric rings of camera lenses round a black glass
// pupil and a cold aperture iris; thin cold beams sweep the plaza. Below, a crowd stands looking up,
// backs to the camera, rimmed warm by the plaza lights. On "we" the lens rings rotate and the iris
// dilates; on "see" it snaps into focus and a cold scan sweeps across the crowd.
// Inside: on "So" the camera dives straight into the pupil (6-frame ease in, a fast push through the
// lens, a glass ripple). Inside there is nothing: a vast dark with faint haze; the plaza light behind
// shrinks to a ring and goes out on "darkness". On "stays", far ahead, one matte black cube hangs in
// the dark, lit only at its edges by the words' light. True black for the last 12 frames.
import { grade, rgb, linesAt, clamp01, ease, mix, spring } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { FIGURE_GLSL, POSES } from '/song/lib/x-v4-figure.js';

// the eye: centre, the direction it faces (down toward the plaza), radius
export const EYE = { c: [7.5, 13.5, -34], r: 6 };
const fz = (() => { const d = [-0.12, -0.28, 1]; const l = Math.hypot(...d); return d.map((v) => v / l); })();
export const EYE_FWD = fz;
export const CUBE = { c: [0, 3.6, -30], s: 1.25 };   // inside space (its own frame)

// the crowd: a 9 x 5 grid, backs to the camera, facing the eye (-z); hashed offsets in JS so the
// lyric layer can pin tracking boxes on the same heads
const H = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
export const CROWD = { nx: 9, nz: 5, cx: 0.92, cz: 1.15, x0: -3.68, z0: 0.0 };
export const PEOPLE = (() => {
  const out = [];
  for (let iz = 0; iz < CROWD.nz; iz++) for (let ix = 0; ix < CROWD.nx; ix++) {
    const k = iz * CROWD.nx + ix;
    const x = CROWD.x0 + ix * CROWD.cx + (H(k + 1) - 0.5) * 0.3;
    const z = CROWD.z0 - iz * CROWD.cz + (H(k + 7) - 0.5) * 0.35;
    const yaw = (H(k + 13) - 0.5) * 0.5 + Math.atan2(x - EYE.c[0], -(z - EYE.c[2])) * 0.4;
    const h = H(k + 29);
    const kind = h < 0.38 ? 0 : h < 0.62 ? 1 : h < 0.8 ? 4 : h < 0.92 ? 2 : 3;
    const sc = 0.92 + 0.14 * H(k + 41);
    out.push({ x, z, yaw, kind, sc, seed: k + 1 });
  }
  return out;
})();

export function rig(P) {
  const [L1, L2] = linesAt(P.from - 0.6, 'You say', 'So your darkness');
  const we = L1.words.find((w) => /we/i.test(w.w)), see = L1.words[L1.words.length - 1];
  const so = L2.words[0], dark = L2.words.find((w) => /darkness/i.test(w.w)), stays = L2.words[L2.words.length - 1];
  const tWe = we.start, tSee = see.start, tSo = so.start, tDark = dark.start, tStays = stays.start;
  const tIn = tSo + 0.34;                  // the camera passes the pupil glass
  const tBlack = P.to - 12 / 60;
  const pupil = EYE.c.map((v, i) => v + EYE_FWD[i] * (EYE.r * 0.575));
  const outside = (t) => {
    const u = t - P.from;
    const rise = ease.inOut3(u / (tSee - P.from + 0.1));
    const snap = spring(t, tSee, 0.45, 0.3);
    const d = 0.02 * Math.sin(t * 0.8) + 0.012 * Math.sin(t * 1.9);
    const pos = [0.35 + d, 1.6 + 0.7 * rise + 0.1 * snap, 2.7 - 0.6 * rise - 0.2 * snap];
    const target = [1.2 + 0.4 * rise, 6.2 + 1.2 * rise, -30];
    return { pos, target, fov: 54 - 3 * snap, roll: 0.01 * Math.sin(t * 0.6) };
  };
  const camera = (t) => {
    if (t < tSo) return outside(t);
    if (t < tIn) {
      // the dive: a 6-frame ease in, then fast and straight through the central lens
      const a = outside(tSo);
      const x = (t - tSo) / (tIn - tSo);
      // log-distance push (the eye grows at a steady rate), eased in over the first 6 frames
      const xe = (t - tSo) < 0.1 ? 0.5 * ((t - tSo) / 0.1) ** 2 * (0.1 / (tIn - tSo)) : x - 0.05 / (tIn - tSo);
      const d0 = Math.hypot(...a.pos.map((v, i) => v - pupil[i])), d1 = 0.06;
      const dk = d0 * Math.pow(d1 / d0, Math.max(0, xe) / (1 - 0.05 / (tIn - tSo)));
            const tk = ease.out3(x / 0.35);
      const dir = a.pos.map((v, i) => v - pupil[i]).map((v) => v / d0);
      const ax = dir.map((v, i) => mix(v, EYE_FWD[i], tk));
      const al = Math.hypot(...ax);
      // aim a little above the pupil so it sits just below the centre, under "So your"
      const pos = pupil.map((v, i) => v + ax[i] / al * dk);
      const aim = pupil.map((v, i) => v - ax[i] / al * 2 + (i === 1 ? 0.2 * dk * 0.45 + 0.0 : 0));
      const aimF = aim.map((v, i) => pos[i] + (v - pos[i]) * 1);
      return { pos, target: a.target.map((v, i) => mix(v, aimF[i], tk)), fov: 51 - 8 * x, roll: 0 };
    }
    // inside: the push's speed dies on a spring, then a slow drift toward the cube
    const s = t - tIn;
    const z = -2.4 * (1 - Math.exp(-s * 5)) - 0.35 * s;
    return { pos: [0.02 * Math.sin(t * 0.7), 0.6 + 0.02 * Math.sin(t * 0.9), z], target: [0, 1.4, -30], fov: 42, roll: 0.006 * Math.sin(t * 0.5) };
  };
  return { L1, L2, tWe, tSee, tSo, tIn, tDark, tStays, tBlack, camera };
}

export default (P) => {
  const R = rig(P);
  const ppl = PEOPLE.flatMap((p) => [p.x, p.z, p.yaw, p.kind + p.sc * 0.0 + 10 * p.seed]);
  const pscale = PEOPLE.map((p) => p.sc);
  return {
    name: 's17-we-see', from: P.from, to: P.to,
    frag: STUDIO_GLSL + FIGURE_GLSL + /* glsl */ `
uniform float uInside, uRingRot, uIris, uFocus, uScan, uBeam, uRipple, uSpill, uRing, uCube, uBlack;
uniform vec4 uPA, uPB, uPC;
uniform vec4 uPpl[${PEOPLE.length}];
uniform float uPsc[${PEOPLE.length}];
const vec3 EC = vec3(${EYE.c.join(', ')});
const vec3 EF = vec3(${EYE_FWD.map((v) => v.toFixed(5)).join(', ')});
const float ER = ${EYE.r.toFixed(2)};
// eye frame: z along EF
vec3 eyeQ(vec3 p) {
  vec3 z = EF, x = normalize(cross(vec3(0.0, 1.0, 0.0), z)), y = cross(z, x);
  vec3 d = p - EC;
  return vec3(dot(d, x), dot(d, y), dot(d, z));
}
int gEyePart = 0;
float sdEye(vec3 e) {
  float bd = length(e) - ER * 1.15;
  if (bd > 1.0) return bd;
  // white ceramic housing: a sphere cut flat at the front, with a thick rim
  float hs = max(length(e) - ER, e.z - ER * 0.45);
  float rim = sdTorus((e - vec3(0.0, 0.0, ER * 0.45)).xzy, vec2(ER * 0.86, ER * 0.1));
  float d = smin(hs, rim, 0.3);
  gEyePart = 0;
  // two rings of camera lenses (polar repetition), rotating
  float a = atan(e.y, e.x);
  for (int k = 0; k < 2; k++) {
    float N = k == 0 ? 18.0 : 12.0;
    float rr = (k == 0 ? 0.7 : 0.5) * ER;
    float lr = (k == 0 ? 0.085 : 0.075) * ER;
    float rotA = uRingRot * (k == 0 ? 1.0 : -1.4);
    float sec = 6.2831853 / N;
    float ai = floor((a - rotA) / sec + 0.5) * sec + rotA;
    vec2 c = rr * vec2(cos(ai), sin(ai));
    vec3 l = e - vec3(c, ER * 0.45);
    vec2 w = vec2(length(l.xy) - lr, abs(l.z - 0.1) - 0.35);
    float lens = min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - 0.04;
    if (lens < d) { d = lens; gEyePart = 1; }
  }
  // the iris disc and the black glass pupil
  float iris = max(length(e.xy) - ER * 0.36, abs(e.z - ER * 0.45 - 0.05) - 0.08);
  if (iris < d) { d = iris; gEyePart = 2; }
  float pup = length(e - vec3(0.0, 0.0, ER * 0.45 - ER * 0.05)) - ER * 0.17;
  if (pup < d) { d = pup; gEyePart = 3; }
  return d;
}
vec3 personQ(vec3 p, int k) {
  vec4 P = uPpl[k];
  vec3 q = p - vec3(P.x, 0.0, P.y);
  q.xz = -q.xz;                       // face -z (toward the eye)
  q.xz = rot(P.z) * q.xz;
  return q;
}
int gPk = 0;
float sdCrowdV(vec3 p) {
  float bx = max(abs(p.x - ${(CROWD.x0 + (CROWD.nx - 1) * CROWD.cx / 2).toFixed(3)}) - ${(CROWD.nx * CROWD.cx / 2 + 0.3).toFixed(3)}, max(p.z - 0.8, -(p.z + ${(CROWD.nz * CROWD.cz + 0.3).toFixed(3)})));
  bx = max(bx, p.y - 2.2);
  if (bx > 0.3) return bx;
  float ix = clamp(floor((p.x - ${CROWD.x0.toFixed(3)}) / ${CROWD.cx.toFixed(3)} + 0.5), 0.0, ${(CROWD.nx - 1).toFixed(1)});
  float iz = clamp(floor(-(p.z - ${CROWD.z0.toFixed(3)}) / ${CROWD.cz.toFixed(3)} + 0.5), 0.0, ${(CROWD.nz - 1).toFixed(1)});
  int k = int(iz) * ${CROWD.nx} + int(ix);
  gPk = k;
  float sc = uPsc[k];
  vec3 q = personQ(p, k);
  float sd = fract(uPpl[k].w / 10.0) * 10.0;
  float kind = floor(sd + 0.5);
  float hj = hash11(floor(uPpl[k].w / 10.0) * 3.1) - 0.5;
  vec4 A = uPA + vec4(0.0, 0.0, 0.25 * hj, 0.0);
  float d = sdPerson3(q / sc, A, uPB, uPC, kind) * sc;
  // never step past the cell edge
  vec2 c = vec2(${CROWD.x0.toFixed(3)} + ix * ${CROWD.cx.toFixed(3)}, ${CROWD.z0.toFixed(3)} - iz * ${CROWD.cz.toFixed(3)});
  vec2 e = vec2(${(CROWD.cx / 2).toFixed(3)}, ${(CROWD.cz / 2).toFixed(3)}) - abs(p.xz - c);
  return min(d, max(min(e.x, e.y), 0.0) + 0.05);
}
float mapObj(vec3 p, out int id) {
  id = 1;
  float d = sdCrowdV(p);
  int pk = gPk;
  // the tower
  vec3 tq = p - vec3(EC.x, 0.0, EC.z);
  float tw = sdCyl(tq - vec3(0.0, (EC.y - ER * 0.7) * 0.5, 0.0), 1.5 + 0.6 * smoothstep(3.0, 0.0, p.y), (EC.y - ER * 0.7) * 0.5);
  if (tw < d) { d = tw; id = 2; }
  float ey = sdEye(eyeQ(p));
  if (ey < d) { d = ey; id = 3; }
  if (id == 1) gPk = pk;
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 1) {
    int k = gPk;
    float sc = uPsc[k];
    vec3 q = personQ(p, k);
    vec3 nq = n; nq.xz = -nq.xz; nq.xz = rot(uPpl[k].z) * nq.xz;
    vec3 v = normalize(uCamPos - p); v.xz = -v.xz; v.xz = rot(uPpl[k].z) * v.xz;
    float sd = fract(uPpl[k].w / 10.0) * 10.0;
    float hj = hash11(floor(uPpl[k].w / 10.0) * 3.1) - 0.5;
    vec4 A = uPA + vec4(0.0, 0.0, 0.25 * hj, 0.0);
    Mat m = personMat(q / sc, nq, v, A, uPB, uPC, floor(sd + 0.5), floor(uPpl[k].w / 10.0));
    // the cold scan line sweeping across the crowd on "see"
    float sl = smoothstep(0.035, 0.0, abs(p.z - uScan)) * step(-6.5, uScan) * step(uScan, 1.5);
    m.emit += vec3(0.8, 1.0, 1.3) * sl * 2.5;
    return m;
  }
  if (id == 2) {
    Mat m = M(vec3(0.78, 0.79, 0.82), 0.3, 0.0); m.clear = 0.6;
    float seam = smoothstep(0.03, 0.0, abs(fract(p.y / 1.6) - 0.5) - 0.48);
    m.alb *= 1.0 - 0.5 * seam;
    m.emit = vec3(0.6, 0.8, 1.0) * smoothstep(0.03, 0.0, abs(fract(p.y / 1.6 + 0.25) - 0.5) - 0.485) * 0.4;
    return m;
  }
  vec3 e = eyeQ(p);
  sdEye(e);
  if (gEyePart == 0) { Mat m = M(vec3(0.82, 0.83, 0.86), 0.28, 0.0); m.clear = 0.8; return m; }
  if (gEyePart == 1) {
    // lens: black glass with a bright cold ring and a deep blue-black centre
    Mat m = M(vec3(0.01, 0.012, 0.016), 0.03, 0.0); m.clear = 1.0;
    float a = atan(e.y, e.x);
    float N = length(e.xy) > ER * 0.6 ? 18.0 : 12.0;
    float rr = length(e.xy) > ER * 0.6 ? 0.7 * ER : 0.5 * ER;
    float rotA = uRingRot * (N > 15.0 ? 1.0 : -1.4);
    float sec = 6.2831853 / N;
    float ai = floor((a - rotA) / sec + 0.5) * sec + rotA;
    float r = length(e.xy - rr * vec2(cos(ai), sin(ai))) / ((N > 15.0 ? 0.085 : 0.075) * ER);
    float ring = smoothstep(0.08, 0.0, abs(r - 0.82)) + 0.5 * smoothstep(0.06, 0.0, abs(r - 0.45));
    m.emit = vec3(1.4, 1.7, 2.2) * ring * (0.5 + 0.8 * uFocus) * step(0.0, n.z * 0.5 + 0.3);
    if (e.z < ER * 0.45 - 0.2) { m = M(vec3(0.7, 0.71, 0.74), 0.25, 0.6); }
    return m;
  }
  if (gEyePart == 2) {
    // the iris: aperture blades round the pupil, cold white lines; it dilates and focuses
    Mat m = M(vec3(0.02, 0.022, 0.03), 0.15, 0.4); m.clear = 1.0;
    float r = length(e.xy) / ER, a = atan(e.y, e.x);
    float blades = smoothstep(0.03, 0.0, abs(fract(a / 6.2831853 * 9.0 + r * (1.8 - uIris)) - 0.5) - 0.46);
    float rings = smoothstep(0.006, 0.0, abs(fract(r * 40.0) - 0.5) / 40.0 - 0.0) * 0.4;
    float blur = mix(0.4, 1.0, uFocus);
    m.emit = vec3(1.3, 1.6, 2.1) * (blades * blur + rings) * smoothstep(0.17, 0.2, r) * 0.9;
    return m;
  }
  // the pupil: black glass
  Mat m = M(vec3(0.003, 0.003, 0.005), 0.02, 0.0); m.clear = 1.0;
  return m;
}
// a ray against a box (inside space)
vec2 boxHit(vec3 ro, vec3 rd, vec3 b, out vec3 nrm) {
  vec3 m = 1.0 / rd, n = m * ro, k = abs(m) * b;
  vec3 t1 = -n - k, t2 = -n + k;
  float tN = max(max(t1.x, t1.y), t1.z), tF = min(min(t2.x, t2.y), t2.z);
  nrm = -sign(rd) * step(t1.yzx, t1.xyz) * step(t1.zxy, t1.xyz);
  return vec2(tN, tF);
}
vec3 inside(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  vec2 sp = (2.0 * fc - uRes) / uRes.y;
  // a vast dark with faint haze
  vec3 col = vec3(0.004, 0.005, 0.008) + vec3(0.006, 0.008, 0.014) * (0.5 + 0.5 * rd.y) * (0.7 + 0.3 * fbm(rd.xy * 3.0 + uTime * 0.05, 3));
  // the plaza light behind the camera, spilling on the haze: shrinks to a ring and goes out
  float rr = length(sp);
  col += vec3(0.5, 0.58, 0.75) * uSpill * (exp(-pow((rr - uRing) / 0.22, 2.0)) * 0.5 + smoothstep(uRing, uRing + 0.9, rr) * 0.35);
  // the black box, far ahead, lit only at its edges from below (the words' light)
  if (uCube > 0.001) {
    vec3 c = vec3(${CUBE.c.join(', ')});
    vec3 o = ro - c, d = rd;
    float ang = 0.6 + uTime * 0.08;
    o.xz = rot(ang) * o.xz; d.xz = rot(ang) * d.xz;
    o.yz = rot(0.35) * o.yz; d.yz = rot(0.35) * d.yz;
    vec3 nrm;
    vec2 h = boxHit(o, d, vec3(${CUBE.s.toFixed(2)}), nrm);
    if (h.x > 0.0 && h.x < h.y) {
      vec3 q = (o + d * h.x) / ${CUBE.s.toFixed(2)};
      vec3 aq = abs(q);
      // distance to the nearest edge on this face
      vec3 f = 1.0 - aq + abs(nrm) * 10.0;
      float ed = min(f.x, min(f.y, f.z));
      vec3 nw = nrm; nw.yz = rot(-0.35) * nw.yz; nw.xz = rot(-ang) * nw.xz;
      float below = 0.35 + 0.65 * smoothstep(0.4, -0.6, nw.y + q.y * 0.3);
      float edge = exp(-ed * 28.0) * below;
      col = vec3(0.003, 0.003, 0.004) + vec3(0.7, 0.8, 1.0) * edge * 0.55 * uCube + vec3(0.01, 0.012, 0.018) * uCube * below;
    }
  }
  return col;
}
vec3 shade(vec2 fc) {
  if (uBlack > 0.5) return vec3(0.0);
  // the glass ripple as the camera passes the pupil
  if (uRipple > 0.001) {
    vec2 sp = (2.0 * fc - uRes) / uRes.y;
    float r = length(sp);
    fc += normalize(sp + 1e-4) * sin(r * 26.0 - uRipple * 30.0) * uRipple * (1.0 - uRipple) * 0.06 * uRes.y;
  }
  if (uInside > 0.5) return inside(fc);
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  vec3 col = studio(ro, rd, depth);
  // thin cold beams from the lens rings sweeping the plaza
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float aa = fi * 2.1 + uRingRot * 1.0 + 0.4;
    vec3 a = eyeQ(EC) + vec3(0.0);
    vec3 x = normalize(cross(vec3(0.0, 1.0, 0.0), EF)), y = cross(EF, x);
    vec3 src = EC + (x * cos(aa) + y * sin(aa)) * ER * 0.7 + EF * ER * 0.5;
    vec3 tgt = vec3(-3.0 + 4.0 * sin(uTime * 0.7 + fi * 2.0), 0.0, -2.0 + 3.0 * cos(uTime * 0.5 + fi));
    vec3 bd = normalize(tgt - src);
    vec3 w = ro - src;
    float b = dot(rd, bd), dd = dot(rd, w), e2 = dot(bd, w);
    float den = 1.0 - b * b;
    float tr = (b * e2 - dd) / den, tb = (e2 - b * dd) / den;
    if (tr > 0.0 && tr < depth && tb > 0.0) {
      float dist = length(w + rd * tr - bd * tb);
      float wdt = 0.05 + 0.012 * tb;
      col += vec3(0.6, 0.72, 0.95) * exp(-pow(dist / wdt, 2.0)) * 0.22 * uBeam * smoothstep(0.0, 5.0, tb);
    }
  }
  // the scan line on the plaza floor
  if (rd.y < 0.0 && uScan > -6.5 && uScan < 1.5) {
    float tf = -ro.y / rd.y;
    if (tf <= depth + 0.01) {
      vec3 fp = ro + rd * tf;
      col += vec3(0.7, 0.85, 1.2) * smoothstep(0.05, 0.0, abs(fp.z - uScan)) * step(abs(fp.x - 0.0), 5.5) * 1.5;
    }
  }
  return col;
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('44, 40, 96', 1.2), uCycB: rgb('8, 8, 22', 1.0),
      uFloorCol: rgb('40, 40, 48', 0.9), uFloorRough: 0.25, uFloorGrain: 1.5, uFogFar: 70,
      uGrime: 0.8, uHaze: 0.025, uHazeCol: [0.05, 0.05, 0.09],
      uKeyDir: [0.25, 0.55, 0.8], uKeyCol: [1.6, 1.75, 2.1], uKeySize: 0.5,
      uRimA: [1.4, 0.5, 0.2], uRimB: [0.4, 0.6, 1.2],
      uP1: [-2.6, 2.8, -6.0], uP1c: [26, 13, 5],
      uP2: [3.4, 2.6, -5.0], uP2c: [22, 11, 4],
      uInside: 0, uRingRot: 0, uIris: 1, uFocus: 0.3, uScan: -10, uBeam: 1, uRipple: 0, uSpill: 0, uRing: 1.4, uCube: 0, uBlack: 0,
      uPA: POSES.lookup.A, uPB: POSES.lookup.B, uPC: POSES.lookup.C,
      uPpl: ppl, uPsc: pscale,
    },
    camera: R.camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      // "we": the lens rings rotate and the iris dilates; "see": it snaps into focus
      const turn = ease.inOut3((t - R.tWe + 0.05) / 0.35);
      u.uRingRot.value = 0.05 * Math.sin(t * 0.4) + 0.35 * turn + 0.1 * (spring(t, R.tSee, 0.4, 0.4) - (t >= R.tSee ? 1 : 0)) * 0;
      u.uIris.value = 1 + 0.45 * turn - 0.25 * spring(t, R.tSee, 0.35, 0.3);
      u.uFocus.value = 0.3 + 0.2 * turn + 0.5 * (t >= R.tSee ? spring(t, R.tSee, 0.3, 0.2) : 0);
      u.uScan.value = t >= R.tSee ? mix(-6.2, 1.2, ease.inOut3((t - R.tSee) / 0.6)) : -10;
      u.uBeam.value = 1;
      u.uInside.value = t >= R.tIn ? 1 : 0;
      const rp = (t - (R.tIn - 0.07)) / 0.3;
      u.uRipple.value = rp > 0 && rp < 1 ? rp : 0;
      // behind the camera the iris closes: the spill shrinks to a ring and goes out by "darkness"
      const close = ease.inOut3((t - R.tIn) / Math.max(0.2, R.tDark + 0.3 - R.tIn));
      u.uRing.value = 1.6 - 1.2 * close;
      u.uSpill.value = t < R.tIn ? 0 : (1 - close) * (1 - close);
      u.uCube.value = ease.inOut3((t - R.tStays + 0.05) / 0.5);
      u.uBlack.value = t >= R.tBlack ? 1 : 0;
    },
    post(t) { return grade(t, { exposure: 1.0, vignette: 0.45, ...(t >= R.tBlack ? { lift: [0, 0, 0], grain: 0, bloom: 0 } : {}) }); },
  };
};
