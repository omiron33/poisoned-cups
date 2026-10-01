// 09 · "You strain a gnat / Let the camel through" (v4 REBUILD)
// Outside: a rainy night crossing in the AI city. Wet asphalt with mirror puddles and white zebra
// bars, a sodium streetlamp, a pedestrian signal showing a red standing figure, six camera poles
// along the far kerb (sleek white heads, small red status rings). A young man in a hoodie with a
// backpack steps off the kerb against the red. On "strain" all six heads whip to him (spring
// overshoot) and a gnat-sized enforcement drone drops to his face with a red scan line; on "a gnat"
// the scan locks and he freezes mid-step, shoulders up; then his shoulders drop and his head goes
// down as the fine lands. Inside: on "Let" a whip pan right to the main lanes (also red). A black
// autonomous convoy hauler (two rounded cargo domes, the camel's humps; escort drones each side; a
// thin acid-green exemption strip down its flank) comes at the lens; every camera head turns away
// from it, slowly, together; its nose crosses the stop line on "camel", it is dead centre over the
// crossing on "through", and its black flank fills the frame for the hand-off to s10.
//
// World: the road runs along x; the man crosses along +z at x = 0 from the far kerb (z < -5.1) to
// the near kerb (z > 4.2). The convoy drives toward -x in the near lane (z = 1.6).
import { ease, grade, rgb, spring, linesFrom, clamp01 } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { FIGURE_GLSL, POSES, mixPose, walk } from '/song/lib/x-v4-figure.js';
import { XF_GLSL } from '/song/lib/x-f.js';

const [L1, L2] = linesFrom('You strain a gnat', 'Let the camel through');
const setV = (u, k, a) => { const v = u[k].value; if (v && v.set) v.set(...a); else u[k].value = a; };

export const KERB_FAR = -5.1, KERB_NEAR = 4.2, KERB_H = 0.12;
export const POLE_Z = -5.55, POLE_H = 3.4;
export const POLES = [-3.6, -1.9, 2.2, 4.2, 6.1, 8.0];
export const LANE_Z = 1.6, HAUL_HL = 12.5, STOP_X = 3.0;
const CAM_POS = [-5.6, 0.85, 7.2];
const SLUMP = { A: [0.16, 0.02, 0.62, 0.0], B: [0.08, 0.35, 0.08, 0.35], C: [0.35, 0.12, 0, -0.1] };
const wrapPI = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const lerpAng = (a, b, k) => a + wrapPI(b - a) * k;
// a smooth curve through [t, v] keys (cubic Hermite, finite-difference tangents: no stops between keys)
function hermite(t, k) {
  if (t <= k[0][0]) return k[0][1];
  if (t >= k[k.length - 1][0]) return k[k.length - 1][1];
  let i = 0; while (t > k[i + 1][0]) i++;
  const m = (j) => (j <= 0 || j >= k.length - 1) ? 0 : (k[j + 1][1] - k[j - 1][1]) / (k[j + 1][0] - k[j - 1][0]);
  const [t0, v0] = k[i], [t1, v1] = k[i + 1], h = t1 - t0, x = (t - t0) / h;
  const h00 = 2 * x ** 3 - 3 * x ** 2 + 1, h10 = x ** 3 - 2 * x ** 2 + x, h01 = -2 * x ** 3 + 3 * x ** 2, h11 = x ** 3 - x ** 2;
  return h00 * v0 + h10 * h * m(i) + h01 * v1 + h11 * h * m(i + 1);
}

export function gnatRig(P) {
  const w = (l, re) => l.words.find((x) => re.test(x.w));
  const tYou = L1.words[0].start, tStrain = w(L1, /strain/i).start, tA = L1.words[2].start;
  const gnat = w(L1, /gnat/i), tLet = L2.words[0].start, tCamel = w(L2, /camel/i).start, tThr = w(L2, /through/i).start;
  // the man: walking along +z from the far kerb, decelerating into the freeze
  const z0 = KERB_FAR - 0.5, v0 = 1.15;
  const vel = (t) => v0 * (1 - ease.inOut3((t - (tStrain + 0.25)) / Math.max(0.2, tA + 0.12 - (tStrain + 0.25))));
  const zTab = [];
  { let z = z0; for (let i = 0; i <= 2400; i++) { const t = P.from - 0.5 + i / 240; zTab.push(z); z += vel(t) / 240; } }
  const manZ = (t) => { const i = Math.max(0, Math.min(zTab.length - 1, Math.round((t - (P.from - 0.5)) * 240))); return zTab[i]; };
  const manPose = (t) => {
    const z = manZ(t);
    let p = walk(((z - z0) / 0.68) * Math.PI + 0.6, 1);
    p = mixPose(p, POSES.frozen, ease.out3((t - tA) / 0.22));
    p = mixPose(p, SLUMP, ease.inOut3((t - (gnat.end + 0.05)) / 1.3));
    return p;
  };
  const manY = (t) => KERB_H * clamp01((KERB_FAR + 0.05 - manZ(t)) / 0.3);
  const head = (t) => [0, manY(t) + 1.62, manZ(t) + 0.05];
  // the hauler's centre x: nose (x - HL) on the stop line on "camel", centre over the crossing on "through"
  const vH = (STOP_X + HAUL_HL) / (tThr - tCamel);
  const hx = (t) => vH * (tThr - t);
  // the drone: drops in on "strain" to hover in front of his face
  const drone = (t) => {
    const h = head(t);
    const k = spring(t, tStrain - 0.05, 0.45, 0.35);
    return [h[0] - 0.24, h[1] + 0.08 + (1 - k) * 2.6, h[2] + 0.48];
  };
  // the camera heads: idle on the road, whip to the man on "strain", turn away from the convoy
  const aims = (t) => {
    const out = [];
    const kWhip = spring(t, tStrain - 0.03, 0.42, 0.45);
    const kAway = ease.inOut3((t - (tLet + 0.3)) / 0.75);
    const h = head(t);
    POLES.forEach((x, i) => {
      const hp = [x, POLE_H - 0.2, POLE_Z + 0.5];
      const d = [h[0] - hp[0], h[1] - hp[1], h[2] - hp[2]];
      const yMan = Math.atan2(d[0], d[2]), pMan = Math.atan2(-d[1], Math.hypot(d[0], d[2]));
      const yIdle = 0.35 + 0.08 * Math.sin(i * 1.7 + t * 0.6), pIdle = 0.42;
      let y = lerpAng(yIdle, yMan, kWhip), p = pIdle + (pMan - pIdle) * Math.min(kWhip, 1.2);
      // away: face the pavement behind them, eyes down
      y = lerpAng(y, Math.PI + 0.25 * (i % 2 ? 1 : -1) * 0.4, kAway);
      p = p + (0.55 - p) * kAway;
      out.push([y, p]);
    });
    return out;
  };
  // the camera: a low medium shot across the street with a slow push, a whip pan right on "Let"
  // (6-frame ease in, spring settle) to the main lanes, then it follows the hauler past the lens
  const camera = (t) => {
    const u = t - P.from;
    const h = head(t);
    const push = ease.inOut3((t - (gnat.end - 0.1)) / 2.0);
    const tA_ = [h[0] * 0.6 + 0.35, 1.25 + 0.05 * push, h[2] * 0.85 - 0.3];
    const fovA = 22.5 - 0.35 * u - 3.2 * push;
    // B: down the road at the incoming convoy, then a continuous pan with it past the lens
    const ax = hermite(t, [[tLet - 0.2, 15], [tLet + 0.3, 13], [tCamel, 7.5], [tThr, -1.5], [P.to, -10.6]]);
    const tB = [ax, 1.75 - 0.25 * clamp01((t - tThr) / 0.9), ax > 8 ? -1.5 + (14 - ax) * 0.3 : LANE_Z];
    const fovB = hermite(t, [[tLet, 46], [tCamel, 46], [tThr, 48], [P.to - 0.25, 24], [P.to, 23]]);
    const dir = (tg, pos) => { const d = [tg[0] - pos[0], tg[1] - pos[1], tg[2] - pos[2]]; return [Math.atan2(d[0], d[2]), Math.atan2(d[1], Math.hypot(d[0], d[2])), Math.hypot(...d)]; };
    const back = ease.inOut3((t - (tLet + 0.15)) / 1.4);
    const pos = [CAM_POS[0] + 0.12 * u, CAM_POS[1] + 0.02 * Math.sin(t * 1.3) + 0.15 * back, CAM_POS[2] - 0.1 * u + 2.6 * back];
    const [ya, pa] = dir(tA_, pos), [yb, pb] = dir(tB, pos);
    // whip: an ease-in over the first 6 frames multiplied into an underdamped spring
    const t0 = tLet - 0.06;
    const kw = t < t0 ? 0 : spring(t, t0, 0.4, 0.22) * ease.inOut3((t - t0) / 0.1);
    const yaw = lerpAng(ya, yb, kw), pitch = pa + (pb - pa) * kw;
    const fov = fovA + (fovB - fovA) * clamp01(kw);
    // a kick as the nose crosses the stop line
    const kick = t > tCamel ? 0.006 * Math.exp(-(t - tCamel) * 8) * Math.sin((t - tCamel) * 55) : 0;
    const drift = 0.004 * (Math.sin(t * 0.7) + 0.5 * Math.sin(t * 1.9 + 1.3));
    const yy = yaw + drift, pp = pitch + drift * 0.5 + kick;
    return { pos, target: [pos[0] + Math.sin(yy) * Math.cos(pp) * 10, pos[1] + Math.sin(pp) * 10, pos[2] + Math.cos(yy) * Math.cos(pp) * 10], fov, roll: drift * 0.2 + kick * 0.5 };
  };
  return { tYou, tStrain, tA, gnat, tLet, tCamel, tThr, manZ, manY, manPose, head, hx, drone, aims, camera };
}

export default (P) => {
  const R = gnatRig(P);
  const v4 = (a) => `vec3(${a.map((x) => x.toFixed(3)).join(', ')})`;
  return {
    name: 's09-gnat', from: P.from, to: P.to,
    frag: STUDIO_GLSL + FIGURE_GLSL + XF_GLSL + /* glsl */ `
uniform vec4 uA, uB, uC, uMan, uDrone, uScan, uYaw0, uYaw1, uPit0, uPit1;
uniform float uHx, uRain, uSpray;
const float KF = ${KERB_FAR.toFixed(3)}, KN = ${KERB_NEAR.toFixed(3)}, KH = ${KERB_H.toFixed(3)};
const float PZ = ${POLE_Z.toFixed(3)}, PH = ${POLE_H.toFixed(3)};
const float LZ = ${LANE_Z.toFixed(3)}, HL = ${HAUL_HL.toFixed(3)}, SX = ${STOP_X.toFixed(3)};
float PX(int i) { ${POLES.map((x, i) => `if (i == ${i}) return ${x.toFixed(3)};`).join(' ')} return 0.0; }
float YAW(int i) { return i < 4 ? uYaw0[i] : uYaw1[i - 4]; }
float PIT(int i) { return i < 4 ? uPit0[i] : uPit1[i - 4]; }
// a world point into a head's frame: forward +z along (yaw, pitch down)
vec3 headLocal(vec3 q, float y, float p) {
  vec3 a = vec3(q.x * cos(y) - q.z * sin(y), q.y, q.x * sin(y) + q.z * cos(y));
  return vec3(a.x, a.y * cos(p) + a.z * sin(p), a.z * cos(p) - a.y * sin(p));
}
float sdCamHead(vec3 l) {
  float d = sdCapsule(l * vec3(1.0, 1.25, 1.0), vec3(0, 0, -0.17), vec3(0, 0, 0.13), 0.115) / 1.25;
  d = max(d, -(sdCyl((l - vec3(0, 0, 0.255)).xzy, 0.062, 0.03)));          // lens recess
  return d;
}
// street furniture: kerbs, zebra bars, stop line, camera poles, the sodium lamp, the signals
float sdStreet(vec3 p, out int id) {
  id = 10;
  float d = sdBox(p - vec3(0, KH * 0.5, KF - 8.0), vec3(80.0, KH * 0.5, 8.0));                 // far pavement
  d = min(d, sdBox(p - vec3(0, KH * 0.5, KN + 8.0), vec3(80.0, KH * 0.5, 8.0)));                // near pavement
  // zebra bars (long along x, spaced along z, on the crossing x in [-2, 2]), stop line, centre dashes:
  // all thin paint on the road, behind one conservative bound
  if (p.y - 0.006 < d) {
    if (sdBox(p - vec3(0, 0, (KF + KN) * 0.5), vec3(2.1, 0.01, (KN - KF) * 0.5)) < d) {
      float zz = p.z - KF - 0.55;
      float c = clamp(floor(zz / 0.9 + 0.5), 0.0, 9.0);
      float bar = sdBox(vec3(p.x, p.y, zz - c * 0.9), vec3(2.0, 0.004, 0.24));
      if (bar < d) { d = bar; id = 11; }
    }
    float sl = sdBox(p - vec3(SX, 0.0, (0.05 + KN) * 0.5), vec3(0.2, 0.004, (KN - 0.05) * 0.5));
    float cl = abs(p.x) > 2.6 ? sdBox(vec3(mod(p.x, 3.0) - 1.5, p.y, p.z), vec3(0.9, 0.004, 0.06)) : max(abs(p.x) - 2.6, sdBox(p, vec3(80.0, 0.004, 0.06)));
    float m = min(sl, cl);
    if (m < d) { d = m; id = 11; }
  }
  // camera poles on the far kerb
  if (sdBox(p - vec3(2.2, PH * 0.5, PZ + 0.3), vec3(6.8, PH * 0.5 + 0.5, 0.9)) < d) {
    for (int i = 0; i < 6; i++) {
      float x = PX(i);
      if (abs(p.x - x) - 0.7 > d) continue;
      vec3 q = p - vec3(x, 0, PZ);
      float pole = sdCapsule(q, vec3(0, 0, 0), vec3(0, PH, 0), 0.055);
      pole = min(pole, sdCapsule(q, vec3(0, PH, 0), vec3(0, PH, 0.5), 0.04));
      if (pole < d) { d = pole; id = 12; }
      vec3 hq = q - vec3(0, PH - 0.2, 0.5);
      float mount = sdCapsule(hq, vec3(0, 0.0, 0), vec3(0, 0.18, 0), 0.03);
      if (mount < d) { d = mount; id = 12; }
      float hd = sdCamHead(headLocal(hq, YAW(i), PIT(i)));
      if (hd < d) { d = hd; id = 20 + i; }
    }
  }
  // the sodium streetlamp (pole on the far kerb, head over the road)
  {
    vec3 q = p - vec3(-2.9, 0, PZ - 0.1);
    float lp = sdCapsule(q, vec3(0), vec3(0, 6.1, 0), 0.07);
    lp = min(lp, sdCapsule(q, vec3(0, 6.1, 0), vec3(1.2, 6.25, 2.0), 0.05));
    float lh = sdRoundBox(q - vec3(1.4, 6.2, 2.35), vec3(0.22, 0.06, 0.38), 0.05);
    if (lp < d) { d = lp; id = 12; }
    if (lh < d) { d = lh; id = 13; }
  }
  // the pedestrian signal on the far kerb, facing the camera's side (+z)
  {
    vec3 q = p - vec3(1.15, 0, PZ + 0.05);
    float sp = sdCapsule(q, vec3(0), vec3(0, 2.3, 0), 0.05);
    float bx = sdRoundBox(q - vec3(0, 2.62, 0.02), vec3(0.2, 0.3, 0.1), 0.03);
    if (sp < d) { d = sp; id = 12; }
    if (bx < d) { d = bx; id = 14; }
  }
  // traffic pylons at the stop line: a red band all round near the top (seen from any side)
  {
    vec3 q = vec3(p.x - SX - 0.6, p.y, p.z < 0.0 ? p.z - PZ : p.z - (KN + 0.35));
    float py = sdCapsule(q, vec3(0), vec3(0, 3.9, 0), 0.13);
    if (py < d) { d = py; id = 15; }
  }
  return d;
}
// city blocks behind both pavements (two cells per side so nothing is overstepped)
float sdCity(vec3 p, out int id) {
  id = 30;
  float side = p.z < 0.0 ? -1.0 : 1.0;
  float zc = side * 16.0;
  float d = 1e9;
  float c0 = floor(p.x / 8.0);
  for (int k = 0; k < 2; k++) {
    float c = c0 + float(k);
    float h = hash12(vec2(c, side));
    float ht = 9.0 + 26.0 * h * h;
    vec3 q = p - vec3(c * 8.0 + 4.0, ht * 0.5, zc + side * 2.0 * hash12(vec2(c, side + 4.0)));
    d = min(d, sdBox(q, vec3(3.6, ht * 0.5, 5.0)));
  }
  return d;
}
// the convoy hauler: nose at -x. Long armoured chassis, a wedge cab, two rounded cargo domes
float sdHauler(vec3 p) {
  vec3 q = p - vec3(uHx, 0, LZ);
  float bb = sdBox(q - vec3(0, 2.1, 0), vec3(HL + 0.4, 2.3, 1.75));
  if (bb > 0.4) return bb;
  float d = sdRoundBox(q - vec3(0.4, 1.15, 0), vec3(HL - 0.4, 0.75, 1.5), 0.18);
  // cab: a sloped black wedge at the nose
  vec3 cq = q - vec3(-HL + 2.1, 1.9, 0);
  float cab = sdRoundBox(cq, vec3(2.0, 1.3, 1.48), 0.25);
  cab = smax(cab, dot(cq, normalize(vec3(-1.0, 0.55, 0))) - 1.15, 0.2);
  d = min(d, cab);
  // the two humps
  d = smin(d, sdEllipsoid(q - vec3(-1.8, 1.95, 0), vec3(3.0, 1.85, 1.42)), 0.35);
  d = smin(d, sdEllipsoid(q - vec3(5.6, 1.95, 0), vec3(3.0, 1.85, 1.42)), 0.35);
  // armoured skirts with a few panel grooves
  d += 0.006 * step(0.5, fract(q.x * 0.6)) * step(q.y, 1.7);
  return d;
}
float sdEscort(vec3 p, out float which) {
  float d = 1e9; which = 0.0;
  for (int i = 0; i < 4; i++) {
    float fx = i < 2 ? -HL + 1.5 : 2.0;
    float sz = (i % 2 == 0) ? -1.0 : 1.0;
    vec3 c = vec3(uHx + fx + 0.4 * sin(uTime * 3.0 + float(i)), 3.7 + 0.15 * sin(uTime * 4.1 + float(i) * 2.0), LZ + sz * 2.7);
    float e = sdDrone((p - c) / 2.4, uTime * 40.0 + float(i)) * 2.4;
    if (e < d) { d = e; which = float(i); }
  }
  return d;
}
float sdGnat(vec3 p) {
  vec3 q = p - uDrone.xyz;
  if (length(q) > 0.3) return length(q) - 0.25;
  q.xz = rot(0.5) * q.xz;
  float d = sdEllipsoid(q, vec3(0.075, 0.024, 0.042));
  vec3 a = vec3(abs(q.x), q.y, abs(q.z));
  d = min(d, sdCapsule(a, vec3(0.03, 0.0, 0.015), vec3(0.075, 0.01, 0.055), 0.005));
  d = min(d, sdTorus(a - vec3(0.075, 0.014, 0.055), vec2(0.03, 0.003)));
  return d;
}
float mapObj(vec3 p, out int id) {
  float d = sdStreet(p, id);
  int cid; float c = sdCity(p, cid);
  if (c < d) { d = c; id = cid; }
  float m = sdPerson3(p - uMan.xyz, uA, uB, uC, 1.0);
  if (m < d) { d = m; id = 1; }
  float g = sdGnat(p);
  if (g < d) { d = g; id = 2; }
  float h = sdHauler(p);
  if (h < d) { d = h; id = 40; }
  float wh; float e = sdEscort(p, wh);
  if (e < d) { d = e; id = 41; }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  vec3 v = normalize(uCamPos - p);
  if (id == 1) {
    vec3 q = p - uMan.xyz;
    Mat m = personMat(q, n, v, uA, uB, uC, 1.0, 2.0);
    // a muted olive hoodie, light enough to take the sodium key
    if (gPart == 4 || gPart == 0 || gPart == 3) m.alb *= 2.3;
    if (gPart == 2) m.emit += m.alb * vec3(1.0, 0.6, 0.35) * 0.12;
    // the red scan line across his face
    vec3 hc = uMan.xyz + personHead(uA, uB, uC, 1.0);
    if (uScan.z > 0.0 && length(p - hc) < 0.17 && dot(n, v) > 0.0) {
      float ln = exp(-pow((p.y - uScan.x) / 0.006, 2.0));
      m.emit += vec3(3.2, 0.12, 0.1) * ln * uScan.z;
    }
    return m;
  }
  if (id == 2) {
    Mat m = M(vec3(0.06, 0.06, 0.07), 0.2, 0.9); m.clear = 1.0;
    vec3 q = p - uDrone.xyz;
    m.emit = vec3(3.0, 0.1, 0.08) * smoothstep(0.016, 0.006, length(q - vec3(0.0, -0.016, 0.03))) * 3.0;
    m.emit += vec3(1.6, 1.7, 2.0) * smoothstep(0.004, 0.0, abs(q.y - 0.006)) * step(0.06, length(q.xz));
    return m;
  }
  if (id == 10) { Mat m = M(vec3(0.11, 0.11, 0.12), 0.9, 0.0); return dirty(m, p, 0.7); }
  if (id == 11) { Mat m = M(vec3(0.72, 0.72, 0.7), 0.5, 0.0); m.clear = 0.4; return dirty(m, p * 1.7, 0.45); }
  if (id == 12) { Mat m = M(vec3(0.2, 0.21, 0.23), 0.35, 0.9); return dirty(m, p * 2.0, 0.3); }
  if (id == 13) { Mat m = M(vec3(0.1), 0.4, 0.5); if (n.y < -0.4) m.emit = vec3(5.0, 2.2, 0.5) * 2.0; return m; }
  if (id == 14) {
    // the pedestrian signal: a black box; on its face a red standing figure
    Mat m = M(vec3(0.02), 0.3, 0.3);
    vec3 q = p - vec3(1.15, 2.62, PZ + 0.17);
    if (n.z > 0.6) {
      vec2 f = q.xy;
      float fig = length(f - vec2(0, 0.17)) - 0.04;
      fig = min(fig, sdBox(vec3(f - vec2(0, 0.04), 0), vec3(0.055, 0.085, 1.0)));
      fig = min(fig, sdBox(vec3(abs(f.x) - 0.025, f.y + 0.13, 0), vec3(0.018, 0.09, 1.0)));
      fig = min(fig, sdBox(vec3(abs(f.x) - 0.075, f.y - 0.04, 0), vec3(0.014, 0.075, 1.0)));
      m.emit = vec3(4.0, 0.16, 0.1) * (smoothstep(0.006, 0.0, fig) * 1.6 + 0.04);
    }
    return m;
  }
  if (id == 15) {
    Mat m = M(vec3(0.05, 0.05, 0.06), 0.3, 0.8);
    float band = step(abs(p.y - 3.45), 0.25);
    m.emit = vec3(4.5, 0.15, 0.1) * band * 1.4;
    return m;
  }
  if (id >= 20 && id < 26) {
    // the camera heads: white gloss shells, black glass lens, a small red status ring
    int i = id - 20;
    vec3 hq = p - vec3(PX(i), PH - 0.2, PZ + 0.5);
    vec3 l = headLocal(hq, YAW(i), PIT(i));
    Mat m = M(vec3(0.82, 0.84, 0.86), 0.22, 0.0); m.clear = 1.0;
    if (l.z > 0.2 && length(l.xy) < 0.08) { m = M(vec3(0.01), 0.05, 0.0); m.clear = 1.0; }
    float ring = abs(length(l.xy) - 0.075);
    if (l.z > 0.18) m.emit += vec3(4.0, 0.1, 0.12) * smoothstep(0.009, 0.003, ring) * 1.5;
    if (l.z > 0.2 && length(l.xy) < 0.03) m.emit += vec3(0.6, 0.02, 0.03);
    return m;
  }
  if (id == 30) {
    // dark towers with sparse lit window strips (cold white, a few acid green)
    Mat m = M(vec3(0.05, 0.05, 0.06), 0.4, 0.4);
    vec2 w = abs(n.z) > 0.5 ? vec2(p.x, p.y) : vec2(p.z, p.y);
    vec2 cell = floor(w / vec2(0.9, 0.75));
    float on = step(0.8, hash12(cell + floor(p.x / 8.0) * 7.0));
    float win = step(abs(fract(w.x / 0.9) - 0.5), 0.3) * step(abs(fract(w.y / 0.75) - 0.5), 0.14);
    float g = step(0.9, hash12(cell * 1.7 + 3.0));
    m.emit = mix(vec3(0.42, 0.5, 0.75), vec3(0.15, 0.85, 0.3), g) * win * on * (0.12 + 0.2 * hash12(cell + 9.0)) * step(1.0, p.y);
    return m;
  }
  if (id == 40) {
    // the hauler: black armour plate; a thin acid-green exemption strip down both flanks; a cold light bar at the nose
    vec3 q = p - vec3(uHx, 0, LZ);
    Mat m = M(vec3(0.1, 0.104, 0.115), 0.2 + 0.12 * vnoise(q * 3.0), 0.55);
    m.clear = 1.0;
    float flank = step(1.2, abs(q.z)) ;
    float strip = smoothstep(0.03, 0.012, abs(q.y - 1.32)) * flank * step(q.x, HL - 0.6) * step(-HL + 3.6, q.x);
    float pulse = 0.6 + 0.4 * smoothstep(0.85, 1.0, fract(q.x * 0.08 + uTime * 1.6));
    m.emit = vec3(0.35, 3.0, 0.7) * strip * pulse * 1.3;
    // cold light lines that draw the shape at night: the nose bar, the nose corners, the deck edges
    float bar = smoothstep(0.06, 0.03, abs(q.y - 0.95)) * step(q.x, -HL + 0.5) * step(abs(q.z), 1.35);
    float corner = smoothstep(0.05, 0.025, abs(abs(q.z) - 1.25)) * step(q.x, -HL + 0.6) * step(abs(q.y - 1.5), 0.55);
    float deck = smoothstep(0.03, 0.012, abs(q.y - 1.86)) * step(1.35, abs(q.z)) * step(-HL + 3.8, q.x);
    m.emit += vec3(2.6, 2.8, 3.2) * (bar * 1.6 + corner + deck * 0.5);
    // the humps: faint machined panel seams lit from within, so each dome reads as a dome
    if (q.y > 2.05) {
      float dx = min(abs(q.x + 1.8), abs(q.x - 5.6));
      float ribs = smoothstep(0.02, 0.006, abs(fract(dx / 0.8 + 0.5) - 0.5) * 0.8);
      float ring = smoothstep(0.02, 0.006, abs(abs(q.z) - 0.75));
      m.emit += vec3(0.9, 1.0, 1.25) * max(ribs, ring) * 0.3 * smoothstep(2.05, 2.4, q.y);
    }
    // a small green beacon on each hump
    m.emit += vec3(0.4, 3.0, 0.8) * smoothstep(0.12, 0.05, min(length(q - vec3(-1.8, 3.8, 0)), length(q - vec3(5.6, 3.8, 0))));
    return dirty(m, p * 0.8, 0.25);
  }
  if (id == 41) {
    Mat m = M(vec3(0.04), 0.3, 0.8);
    float wh; sdEscort(p, wh);
    m.emit = vec3(0.3, 2.6, 0.7) * step(n.y, -0.5) * 1.5;
    return m;
  }
  return M(vec3(0.1), 0.5, 0.0);
}
// the drone's scan beam: a thin red line from the drone to the scan point on his face
float beam(vec3 ro, vec3 rd, vec3 a, vec3 b, float tmax) {
  vec3 ba = b - a, oa = ro - a;
  float bb = dot(ba, ba), rb = dot(rd, ba);
  float den = bb - rb * rb;
  if (den < 1e-6) return 0.0;
  float s = clamp((dot(oa, ba) - rb * dot(oa, rd)) / den, 0.0, 1.0);
  float t = max(0.0, dot(a + ba * s - ro, rd));
  if (t > tmax) return 0.0;
  float dist = length(ro + rd * t - (a + ba * s));
  return exp(-dist / max(0.002, t * 0.0009));
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  vec3 col = studio(ro, rd, depth);
  if (uScan.z > 0.0) {
    vec3 hc = uMan.xyz + personHead(uA, uB, uC, 1.0);
    vec3 f = vec3(hc.x - 0.04, uScan.x, hc.z + 0.12);
    col += vec3(2.4, 0.08, 0.06) * beam(ro, rd, uDrone.xyz + vec3(0.0, -0.01, 0.0), f, depth) * 0.6 * uScan.z;
  }
  // spray off the wheels as the hauler crosses
  if (uSpray > 0.0) {
    float hz = 1.0 - exp(-min(depth, 12.0) * 0.06 * uSpray);
    col = mix(col, vec3(0.22, 0.2, 0.18), hz * smoothstep(0.1, -0.2, rd.y));
  }
  // rain: thin slanted streaks in screen space, catching the lamp
  vec2 r = fc / uRes.y;
  float sx = r.x * 160.0 + r.y * 14.0;
  float cx = floor(sx);
  float h = hash11(cx * 1.37 + 0.5);
  float yy = r.y * (2.0 + h) + uTime * (2.4 + 1.5 * h) + h * 20.0;
  float seg = fract(yy);
  float streak = smoothstep(0.0, 0.03, seg) * smoothstep(0.16, 0.05, seg) * step(0.7, h) * smoothstep(0.5, 0.1, abs(fract(sx) - 0.5));
  col += vec3(0.55, 0.5, 0.45) * streak * 0.07 * uRain;
  return col;
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('96, 68, 130', 0.95), uCycB: rgb('8, 6, 14', 0.7),
      uFloorCol: rgb('46, 44, 48', 0.75), uFloorRough: 0.12, uGrime: 1.0, uFogFar: 70,
      uKeyDir: [-0.58, 0.5, 0.66], uKeyCol: [3.4, 1.95, 0.85], uKeySize: 0.12,
      uRimA: [1.1, 1.2, 1.45], uRimB: [0.55, 0.4, 0.85],
      uHaze: 0.03, uHazeCol: [0.07, 0.05, 0.09],
      uA: [0, 0, 0, 0], uB: [0, 0, 0, 0], uC: [0, 0, 0, 0], uMan: [0, 0, -5.5, 0],
      uDrone: [0, -10, 0, 0], uScan: [0, 0, 0, 0],
      uYaw0: [0, 0, 0, 0], uYaw1: [0, 0, 0, 0], uPit0: [0, 0, 0, 0], uPit1: [0, 0, 0, 0],
      uHx: 60, uRain: 1, uSpray: 0,
    },
    camera: R.camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      const p = R.manPose(t);
      u.uA.value = p.A; u.uB.value = p.B; u.uC.value = p.C;
      u.uMan.value = [0, R.manY(t), R.manZ(t), 0];
      const d = R.drone(t);
      u.uDrone.value = [...d, 1];
      // scan: sweeps the face from "strain", locks on the eyes from "a"
      const h = R.head(t);
      const lock = ease.out3((t - R.tA) / 0.15);
      const sweep = h[1] + 0.05 + 0.1 * Math.sin((t - R.tStrain) * 9.0);
      const scanY = sweep + (h[1] + 0.03 - sweep) * lock;
      const on = t > R.tStrain + 0.18 && t < R.tLet + 0.1 ? 1 : 0;
      u.uScan.value = [scanY, lock, on * (lock > 0.99 ? 1.0 : 0.75), 0];
      const a = R.aims(t);
      u.uYaw0.value = a.slice(0, 4).map((x) => x[0]); u.uYaw1.value = [a[4][0], a[5][0], 0, 0];
      u.uPit0.value = a.slice(0, 4).map((x) => x[1]); u.uPit1.value = [a[4][1], a[5][1], 0, 0];
      u.uHx.value = R.hx(t);
      u.uSpray.value = clamp01(1 - Math.abs(t - R.tThr - 0.3) / 0.8);
      u.uRain.value = 1 - 0.6 * clamp01((t - R.tThr) / 0.6);
      // the sodium pool under the lamp, and the red of the signals on the wet road
      setV(u, 'uP1', [-1.5, 5.8, -3.3]);
      setV(u, 'uP1c', [60, 27, 6]);
      // the convoy's own light thrown ahead of it on the wet road
      setV(u, 'uP2', [R.hx(t) - HAUL_HL - 2.5, 0.9, LANE_Z]);
      setV(u, 'uP2c', [14, 15, 17]);
    },
    post(t) { return grade(t, { exposure: 1.15, bloom: 0.1 }); },
  };
};
