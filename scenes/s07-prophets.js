// 07 · "You honor prophets / That your fathers tried to kill"   (v4 REWORK: picture rebuilt)
// A memorial atrium in a tech campus at night. Five holographic glass busts (lib/x-v4-head.js:
// obsidian glass with the contour scan) float a hand's width above black glass plinths, each
// projected by a thin cold beam visible in the haze, a slowly turning silver vector laurel ring
// behind each head, small cold candle pucks at the plinths' feet, a wet black floor reflecting it.
// Outside (43.55-45.77): reverent; the busts turn very slowly; on "prophets" the laurels brighten
// one by one. Inside, from "That": on each of That / your / fathers / tried / to one more bust
// fails: its beam turns red, its scan freezes magenta and smears (datamosh), its laurel snaps into
// a red targeting ring closing on the head. On "kill" every bust shatters at once: the heads burst
// into glass shards that hang for a beat, then fall; red light spills across the wet floor toward
// the lens as the camera tilts down to it.
import { ease, grade, rgb, linesFrom, spring, clamp01 } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { HEAD_GLSL } from '/song/lib/x-v4-head.js';

const [L1, L2] = linesFrom('You honor prophets', 'That your fathers tried to kill');
export const prophetTimes = () => ({ tB: L2.words[0].start, tT: L2.words[L2.words.length - 3].start, tK: L2.words[L2.words.length - 1].start });

// the row: five busts along x at z = 0, bust 0 farthest (left), bust 4 nearest the camera (right)
export const BX0 = -2.2, BSP = 0.95, PLH = 0.95, HS = 0.48, HLIFT = 0.1;
export const bustX = (i) => BX0 + i * BSP;
// head chin height above the floor (the head floats HLIFT over the plinth top, bobbing a little)
export const chinY = (i, t) => PLH + HLIFT + 0.12 * HS + 0.012 * Math.sin(t * 1.1 + i * 1.7);
// which bust fails on which word (far to near)
export const FAIL_ORDER = [0, 1, 2, 3, 4];

const mixv = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
export const prophetsCamera = (t0, to) => {
  const { tB, tK } = prophetTimes();
  return (t) => {
    const d = 0.005 * (Math.sin(t * 0.8) + 0.5 * Math.sin(t * 2.2));
    const u = t - t0, v = Math.max(0, t - tB), w = Math.max(0, t - tK);
    // settle-in on the cut, then a slow lateral dolly along the row
    const s = ease.out3(u / 0.6);
    const A = { pos: [1.95 - 0.1 * u + 0.2 * (1 - s), 1.4 + 0.06 * (1 - s), 3.05 + 0.35 * (1 - s)], target: [-0.15 - 0.07 * u, 1.14, -0.3], fov: 42 };
    // a small snap-in on "That"
    const B = { pos: [1.75 - 0.06 * v, 1.36, 2.7 - 0.03 * v], target: [0.15 - 0.05 * v, 1.16, -0.3], fov: 40 };
    // a spring punch on "kill"
    const C = { pos: [1.55, 1.34, 2.45], target: [0.05, 1.16, -0.3], fov: 37 };
    // then tilt down to the floor, the red running toward the lens
    const D = { pos: [1.5 - 0.04 * w, 1.2 - 0.06 * w, 2.6 + 0.04 * w], target: [-0.1, 0.0, 1.1], fov: 46 };
    const m1 = spring(t, tB, 0.5, 0.2), m2 = spring(t, tK, 0.35, 0.3);
    const m3 = ease.inOut3((t - (tK + 0.5)) / Math.max(0.6, to - (tK + 0.5) + 0.15));
    let pos = mixv(mixv(mixv(A.pos, B.pos, m1), C.pos, m2), D.pos, m3);
    const target = mixv(mixv(mixv(A.target, B.target, m1), C.target, m2), D.target, m3);
    const fov = ((A.fov * (1 - m1) + B.fov * m1) * (1 - m2) + C.fov * m2) * (1 - m3) + D.fov * m3;
    pos = [pos[0] + d, pos[1] + d * 0.5, pos[2]];
    return { pos, target, fov, roll: 0.008 * Math.sin(u * 0.5) };
  };
};

export default (P) => {
  const t0 = P.from;
  const { tB, tK } = prophetTimes();
  const failT = L2.words.slice(0, 5).map((w) => w.start);       // That your fathers tried to
  const laurT = [L1.words[2].start, ...[1, 2, 3, 4].map((k) => L1.words[2].start + 0.13 * k)];   // "prophets", one by one
  return {
    name: 's07-prophets', from: P.from, to: P.to,
    frag: STUDIO_GLSL + HEAD_GLSL + /* glsl */ `
uniform vec4 uFailA, uLaurA, uSnapA;
uniform float uFail4, uLaur4, uSnap4, uShat, uDrop, uRun, uKillGlow;
const float BX0 = ${BX0.toFixed(3)}, BSP = ${BSP.toFixed(3)}, PLH = ${PLH.toFixed(3)}, HS = ${HS.toFixed(3)}, HLIFT = ${HLIFT.toFixed(3)};
float bget(vec4 a, float b, float i) { return i < 0.5 ? a.x : i < 1.5 ? a.y : i < 2.5 ? a.z : i < 3.5 ? a.w : b; }
float failOf(float i) { return bget(uFailA, uFail4, i); }
float laurOf(float i) { return bget(uLaurA, uLaur4, i); }
float snapOf(float i) { return bget(uSnapA, uSnap4, i); }
float bustIdx(vec3 p) { return clamp(floor((p.x - BX0) / BSP + 0.5), 0.0, 4.0); }
float bustX(float i) { return BX0 + i * BSP; }
float chinY(float i) { return PLH + HLIFT + 0.12 * HS + 0.012 * sin(uTime * 1.1 + i * 1.7); }
float bustYaw(float i) { return 0.42 + 0.22 * sin(uTime * 0.22 + i * 2.1); }   // turning very slowly, toward the lens
// head frame for bust i (unscaled head units)
vec3 bustQ(vec3 p, float i) {
  vec3 q = p - vec3(bustX(i), chinY(i), 0.0);
  q.xz = rot(-bustYaw(i)) * q.xz;
  return q / HS;
}
// shattered head: cell fracture in head units. Cells of size S fly apart by (1 + uShat) and spin,
// all pieces of a head drop together by uDrop
const float SC = 0.2;
float sdShards(vec3 q, float i, out vec3 qp) {
  vec3 qq = q + vec3(0.0, uDrop, 0.0);
  float cs = SC * (1.0 + uShat);
  vec3 c = floor((qq - vec3(0.0, 0.5, 0.0)) / cs);
  vec3 ce = (c + 0.5) * cs + vec3(0.0, 0.5, 0.0), co = (c + 0.5) * SC + vec3(0.0, 0.5, 0.0);
  vec3 l = qq - ce;
  vec3 h = hash33(c + i * 7.1);
  float sp = uShat * 2.2;
  l.xy = rot((h.x - 0.5) * sp) * l.xy;
  l.yz = rot((h.y - 0.5) * sp) * l.yz;
  qp = co + l;
  float d = max(max(sdHead(qp, 0.0, 0.0), -(qp.y + 0.2)), sdBox(l, vec3(SC * 0.5 - 0.004)));
  return d * 0.55;
}
float gShardIdx = 0.0;
// the laurel: a ring of leaf blades behind the head, turning slowly about the vertical. 'snap' turns
// it into a red targeting ring that shrinks onto the head
float sdLaurel(vec3 p, float i) {
  float sn = snapOf(i);
  float sk = clamp(sn, 0.0, 1.0);
  // on the snap the ring swings to face the lens and centres on the head
  vec3 c = vec3(bustX(i), chinY(i) + 0.55 * HS, -0.45 * HS * (1.0 - sk));
  vec3 q = p - c;
  float b = length(q) - HS;
  if (b > 0.1) return b;
  float face = atan(uCamPos.x - c.x, uCamPos.z - c.z);
  q.xz = rot(mix(uTime * 0.25 + i * 1.3, -face, sk)) * q.xz;     // turning slowly
  float r = mix(0.75, 0.57, sn) * HS;
  float ang = atan(q.y, q.x);
  float rr = length(q.xy);
  float ring = length(vec2(rr - r, q.z)) - mix(0.004, 0.006, sn);
  // leaves: polar repetition, 20 blades, alternately tilted; they fold away on the snap
  float N = 20.0;
  float a = (fract(ang / 6.2831853 * N + 0.5) - 0.5) * 6.2831853 / N;
  vec2 lp = vec2(rr - r, a * rr);
  float side = mod(floor(ang / 6.2831853 * N + 0.5), 2.0) * 2.0 - 1.0;
  lp = rot(0.6 * side) * lp;
  float leaf = length(vec3(lp.x / (0.078 * HS), lp.y / (0.03 * HS), q.z / 0.005)) - 1.0;
  leaf *= 0.005;
  leaf += sn * 0.05;
  // the reticle ticks: four short bars pointing at the head on the snap
  float tk = 1e9;
  if (sn > 0.01) {
    vec2 aq = abs(q.xy);
    vec2 t1 = vec2(max(aq.x, aq.y), min(aq.x, aq.y));
    tk = sdBox(vec3(t1.x - r + 0.045, t1.y, q.z), vec3(0.045 * sn, 0.005, 0.005));
  }
  return min(min(ring, leaf), tk);
}
float sdPlinth(vec3 p, float i) {
  vec3 q = p - vec3(bustX(i), PLH * 0.5, 0.0);
  float d = sdRoundBox(q, vec3(0.2, PLH * 0.5, 0.2), 0.008);
  // candle pucks at the foot: three small cold discs on the floor in front
  vec3 cq = p - vec3(bustX(i), 0.0, 0.34);
  cq.x = cq.x - clamp(floor(cq.x / 0.11 + 0.5), -1.0, 1.0) * 0.11;
  float puck = sdCyl(cq - vec3(0.0, 0.018, 0.0), 0.028, 0.018);
  return min(d, puck);
}
float mapObj(vec3 p, out int id) {
  id = 1;
  float i = bustIdx(p);
  float d = sdPlinth(p, i);
  // the head: whole, or in shards after "kill"
  vec3 q = bustQ(p, i);
  float hb = length(q - vec3(0.0, 0.35, 0.0)) * HS - (0.9 + 1.2 * uShat) * HS;
  if (uDrop < 6.0) {
    float h;
    if (hb > 0.1) h = hb;
    else if (uShat > 0.001) { vec3 qp; h = sdShards(q, i, qp) * HS; }
    else h = max(sdHead(q, 0.0, 0.0), -(q.y + 0.2)) * HS;   // the neck cut short: the head floats
    if (h < d) { d = h; id = 2; }
  }
  float l = sdLaurel(p, i);
  if (l < d) { d = l; id = 3; }
  // never step past the cell edge (the neighbour was not evaluated)
  return min(d, max(BSP * 0.5 - abs(p.x - bustX(i)), 0.0) + 0.04);
}
Mat material(int id, vec3 p, vec3 n) {
  float i = bustIdx(p);
  float f = failOf(i);
  if (id == 1) {
    // black glass plinths; the pucks a soft cold glow
    Mat m = M(vec3(0.012, 0.012, 0.016), 0.06, 0.0); m.clear = 1.0;
    if (p.y < 0.04 && p.z > 0.25) { m = M(vec3(0.6), 0.4, 0.0); m.emit = mix(vec3(1.3, 1.45, 1.8), vec3(1.6, 0.08, 0.2), f) * (0.9 + 0.1 * sin(uTime * 9.0 + p.x * 40.0)); }
    // hairline edges so the black glass reads against the dark
    vec3 eq = abs(p - vec3(bustX(i), PLH * 0.5, 0.0)) - vec3(0.2, PLH * 0.5, 0.2);
    float ed = min(min(length(eq.xz), length(eq.xy)), length(eq.yz));
    if (p.y > 0.04) m.emit += mix(vec3(0.35, 0.4, 0.55), vec3(0.8, 0.04, 0.1), f) * 0.6 * smoothstep(0.006, 0.0, ed);
    // the top rim catches the beam
    m.emit += mix(vec3(0.5, 0.58, 0.75), vec3(0.9, 0.04, 0.1), f) * 0.5 * smoothstep(0.012, 0.0, abs(p.y - PLH)) ;
    return m;
  }
  if (id == 2) {
    vec3 q = bustQ(p, i);
    // a failed bust: the scan freezes magenta and smears along x in bands (datamosh)
    float band = floor(q.y * 14.0);
    float sm = f * (hash11(band + i * 9.0 + floor(uTime * 6.0)) - 0.5) * 0.14 * (1.0 - uShat);
    vec3 qs = q + vec3(sm, 0.0, 0.0);
    Mat m;
    if (uShat > 0.001) { vec3 qp; sdShards(q, i, qp); m = headMat(qp, n, 0.0); m.emit += vec3(1.4, 0.1, 0.3) * 0.5 * pow(1.0 - sat(abs(dot(n, normalize(uCamPos - p)))), 3.0); }
    else m = headMat(qs, n, 1.0 - f);
    m.emit *= mix(2.3, 1.5, f);
    return m;
  }
  if (id == 3) {
    float sn = snapOf(i);
    Mat m = SILVER(); m.rough = 0.25;
    vec3 silver = vec3(0.75, 0.8, 0.95) * (0.25 + 1.6 * laurOf(i));
    m.emit = mix(silver, vec3(2.4, 0.1, 0.25), sn);
    m.emit *= 1.0 - uShat;
    return m;
  }
  return M(vec3(0.5), 0.5, 0.0);
}
// the projector beams: thin cold cones from the ceiling onto each head, seen in the haze
vec3 beams(vec3 ro, vec3 rd, float depth) {
  vec3 acc = vec3(0.0);
  for (int k = 0; k < 5; k++) {
    float i = float(k);
    vec3 a = vec3(bustX(i), 3.6, -0.05), b = vec3(bustX(i), chinY(i) + 1.02 * HS, 0.0);
    // closest approach between the ray and the (vertical) beam axis
    vec3 ba = b - a, oa = ro - a;
    float bb = dot(ba, ba), bd = dot(ba, rd), bo = dot(ba, oa), dd = dot(rd, oa);
    float den = bb - bd * bd;
    float s = clamp((bo - bd * dd) / max(den, 1e-5), 0.0, 1.0);     // along the beam
    float tr = max(dot(a + ba * s - ro, rd), 0.0);                 // along the ray
    vec3 x = ro + rd * tr - (a + ba * s);
    float w = 0.012 + 0.06 * s;                                    // widens toward the head
    float g = exp(-dot(x, x) / (w * w)) * step(tr, depth) * smoothstep(0.15, 0.6, s);
    float f = failOf(i);
    vec3 c = mix(vec3(0.55, 0.65, 0.9), vec3(1.6, 0.06, 0.16), f);
    acc += c * g * 0.55 * (0.6 + 0.4 * s) * (1.0 - 0.6 * uShat);
  }
  return acc;
}
// the red spill: light running over the wet floor from under each plinth toward the lens
float spill(vec2 xz) {
  float front = 0.25 + 3.8 * (1.0 - exp(-uRun));
  if (xz.y > front + 0.3) return 0.0;
  float s = 0.0;
  for (int k = 0; k < 5; k++) {
    float i = float(k);
    float z = xz.y - 0.15;
    float w = 0.07 + 0.12 * max(z, 0.0);
    float cx = bustX(i) + 0.12 * sin(z * 2.5 + i * 2.0) + 0.12 * max(z, 0.0) * (i - 2.0) / 2.0;
    s += exp(-pow((xz.x - cx) / w, 2.0)) * smoothstep(-0.25, 0.05, z);
  }
  s = min(s, 1.0) * (0.65 + 0.35 * vnoise(vec2(xz.x * 9.0, xz.y * 2.0 - uTime * 2.0)));
  float edge = smoothstep(front + 0.3, front - 0.05, xz.y) * smoothstep(-0.35, 0.1, xz.y);
  float row = smoothstep(BX0 - 0.6, BX0, xz.x) * smoothstep(BX0 + 4.0 * BSP + 0.6, BX0 + 4.0 * BSP, xz.x);
  return (s + 0.12 * row) * edge;
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  vec3 col = studio(ro, rd, depth);
  float tf = rd.y < -1e-4 ? -ro.y / rd.y : 1e9;
  if (uKillGlow > 0.0 && depth > tf - 0.01 && tf < 1e8) col += vec3(2.0, 0.05, 0.14) * 0.55 * spill((ro + rd * tf).xz) * uKillGlow;
  return col + beams(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('28, 30, 44', 1.0), uCycB: rgb('8, 8, 14', 1.0),
      uFloorCol: rgb('40, 40, 48', 1.0), uFloorRough: 0.05, uGrime: 0.55,
      uKeyDir: [-0.2, 0.9, 0.35], uKeyCol: [1.4, 1.55, 1.9], uKeySize: 0.2,
      uRimA: [1.6, 1.8, 2.2], uRimB: [1.1, 1.3, 1.9],
      uP1: [0, 2.8, 1.6], uP1c: [0.5, 0.55, 0.8],
      uP2: [0, 0.15, 1.2], uP2c: [0, 0, 0],
      uHaze: 0.07, uHazeCol: [0.045, 0.05, 0.075],
      uFogFar: 22,
      uFailA: [0, 0, 0, 0], uFail4: 0, uLaurA: [0, 0, 0, 0], uLaur4: 0, uSnapA: [0, 0, 0, 0], uSnap4: 0,
      uShat: 0, uDrop: 0, uRun: 0, uKillGlow: 0,
    },
    camera: prophetsCamera(t0, P.to),
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      const fail = [0, 0, 0, 0, 0], snap = [0, 0, 0, 0, 0], laur = [0, 0, 0, 0, 0];
      FAIL_ORDER.forEach((b, k) => {
        const x = t - failT[k];
        fail[b] = x < 0 ? 0 : Math.min(1, x / 0.06);               // the beam and scan flip in 4 frames
        snap[b] = x < 0 ? 0 : spring(t, failT[k], 0.3, 0.25);       // the laurel snaps shut on a spring
        laur[b] = clamp01((t - laurT[b]) / 0.12);
      });
      setV(u, 'uFailA', fail.slice(0, 4)); u.uFail4.value = fail[4];
      setV(u, 'uSnapA', snap.slice(0, 4)); u.uSnap4.value = snap[4];
      setV(u, 'uLaurA', laur.slice(0, 4)); u.uLaur4.value = laur[4];
      // "kill": burst in 0.12 s, hang for a beat (a slow drift), then fall
      const x = t - tK;
      u.uShat.value = x < 0 ? 0 : 0.4 * ease.out3(x / 0.12) + 0.1 * Math.min(1, x / 0.6);
      const fall = Math.max(0, x - 0.4);
      u.uDrop.value = 0.5 * 9.8 * fall * fall / HS;               // head units
      u.uRun.value = Math.max(0, x - 0.15) * 0.9;
      u.uKillGlow.value = clamp01(x / 0.2);
      // red light on the floor after the kill, a red top light as the beams fail
      const r = clamp01(u.uRun.value * 2);
      setV(u, 'uP2', [-0.3, 1.8, 1.4]);
      setV(u, 'uP2c', [1.2 * r, 0.03 * r, 0.1 * r]);
      const nf = fail.reduce((a, b) => a + b, 0) / 5;
      setV(u, 'uP1c', [0.5 + 0.6 * nf, 0.55 * (1 - nf) + 0.03, 0.8 * (1 - nf) + 0.08]);
    },
    post(t) { return grade(t, { exposure: 1.08, bloom: 0.08 }); },
  };
};
const setV = (u, k, a) => { const v = u[k].value; if (v && v.set) v.set(...a); else u[k].value = a; };
