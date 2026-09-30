// 19 · "Silver in your palms / Blood on the floor" (v2)
// The white clean room of s18 and what its two industrial robot arms (graphite, tool-head clamps,
// no hands) hold up: a wide silver tray. Silver coins, hex credit tokens and square procurement
// chips pour from above into the tray, heap there and overflow off its front lip onto the white
// epoxy floor. On "Blood" the overflow that hits the floor turns red: a red signal flash that
// darkens into glossy blood, pooling under the lip and running away across the floor. From there
// one continuous push follows the spill, low under the tray, toward a doorway of warm light in
// the back wall (s20 opens on that door).
import { ease, grade, rgb, linesAt, clamp, spring } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { E_GLSL } from '/song/lib/x-e.js';

export const lines19 = (P) => linesAt(P.from - 1.0, 'Silver in your palms', 'Blood on the floor');
const DOOR = [0.55, -3.4];     // doorway centre x, back wall z
const RUN0 = [0.3, -0.62];     // where the spill starts running (under the tray's front lip)

const TY = 1.0, TZ = -1.05;     // the tray's floor height and centre z
const STREAMS = [-0.36, 0.0, 0.36];

export default (P) => {
  const t0 = P.from;
  const [L1, L2] = lines19(P);
  const tBlood = L2.words[0].start;
  const camera = (t) => {
    const u = t - t0;
    // A: square on to the tray, a slow push; B from "Blood": one continuous move down and
    // forward, under the tray, following the spill to the door (still moving at the cut)
    const A = { pos: [-0.2 - 0.03 * u, 1.95 - 0.02 * u, 2.1 - 0.12 * u], target: [-0.55, 0.95, -1.05] };
    const aEnd = { pos: [-0.2 - 0.03 * (tBlood - t0), 1.95 - 0.02 * (tBlood - t0), 2.1 - 0.12 * (tBlood - t0)], target: A.target };
    const F = { pos: [0.35, 0.6, -1.8] };
    const xk = clamp((t - (tBlood + 0.05)) / (P.to - tBlood + 1.2), 0, 1);
    const k = 1 - Math.pow(1 - xk, 2.4);
    if (t < tBlood + 0.05) return { pos: A.pos, target: A.target, fov: 40, roll: 0 };
    const m = (a, b) => a.map((v, i) => v + (b[i] - v) * k);
    // the camera's aim follows the head of the running spill
    const rl = runL(t);
    const head = [RUN0[0] + (DOOR[0] - RUN0[0]) * rl, 0.05, RUN0[1] + (DOOR[1] - RUN0[1]) * rl - 0.5];
    const kk = ease.inOut3((t - tBlood) / 0.7);
    const tg = aEnd.target.map((v, i) => v + (head[i] - v) * kk);
    return { pos: m(aEnd.pos, F.pos), target: tg, fov: 40 + 4 * k, roll: 0.02 * Math.sin(k * 3.1) };
  };
  const runL = (t) => { const x = t - tBlood; return x <= 0.1 ? 0 : Math.min(1, ease.inOut3((x - 0.1) / (P.to - tBlood)) * 1.02); };
  return {
    name: 's19-silver', from: P.from, to: P.to,
    frag: STUDIO_GLSL + E_GLSL + /* glsl */ `
uniform float uRun, uHeap, uFloorHeap, uPool, uRunL, uRed, uSig;
const float TY = ${TY.toFixed(3)}, TZ = ${TZ.toFixed(3)};
const vec2 DOOR = vec2(${DOOR.join(', ')});
const vec2 RUN0 = vec2(${RUN0.join(', ')});
const float CT = 0.7;
const vec3 STREAMS_X = vec3(${STREAMS.join(', ')});
// the tray: a shallow silver pan, 1.3 x 0.56, its floor at TY
float tray(vec3 p) {
  vec3 q = p - vec3(0, TY, TZ);
  float outer = sdRoundBox(q - vec3(0, 0.02, 0), vec3(0.65, 0.05, 0.28), 0.015);
  float inner = sdRoundBox(q - vec3(0, 0.07, 0), vec3(0.62, 0.05, 0.25), 0.01);
  return max(outer, -inner);
}
// an industrial arm on a floor base, side = -1 / 1: column, shoulder, upper arm, forearm, and a
// clamp tool head gripping the tray's end
float arm(vec3 p, float side, out float joint) {
  vec3 q = vec3(p.x * side, p.y, p.z - TZ);
  float b = sdBox(q - vec3(0.95, 0.9, 0.0), vec3(0.45, 1.0, 0.35));
  joint = 0.0;
  if (b > 0.3) return b;
  vec3 sh = vec3(1.1, 0.55, 0.0), el = vec3(1.02, 1.32, -0.08), wr = vec3(0.78, 1.12, 0.0);
  float d = sdCyl(q - vec3(1.1, 0.07, 0), 0.2, 0.07) - 0.01;
  d = min(d, sdCapsule(q, vec3(1.1, 0.1, 0), sh, 0.075));
  d = min(d, sdCapsule(q, sh, el, 0.065));
  d = min(d, sdCapsule(q, el, wr, 0.055));
  float j = min(min(length(q - sh), length(q - el)), length(q - wr)) - 0.09;
  joint = step(j, 0.001);
  d = min(d, j);
  // tool head: a block with two jaws closing on the tray rim
  d = min(d, sdRoundBox(q - vec3(0.7, TY + 0.05, 0), vec3(0.06, 0.06, 0.14), 0.01));
  d = min(d, sdRoundBox(vec3(q.x - 0.64, abs(q.y - TY - 0.035) - 0.045, q.z), vec3(0.04, 0.012, 0.12), 0.004));
  return d;
}
float piece(vec3 q, float i, float s) { return credit(q / s, i) * s; }
float stream(vec3 p, vec3 pc, float seed) {
  vec3 r = p - vec3(pc.x, 0, pc.z);
  float bnd = max(length(r.xz) - 0.13, pc.y - 0.03 - p.y);
  if (bnd > 0.03) return bnd;
  float d = 1e3;
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    float ph = uRun + fk * CT / 3.0 + seed * 0.21;
    float age = mod(ph, CT), cyc = floor(ph / CT);
    float y = 3.4 - 7.2 * age * age;
    if (y < pc.y + 0.03) continue;
    vec2 h = hash22(vec2(fk + seed * 7.0, cyc)) - 0.5;
    vec3 q = p - vec3(pc.x + h.x * 0.05, y, pc.z + h.y * 0.05);
    if (dot(q, q) > 0.01) { d = min(d, length(q) - 0.06); continue; }
    q = tumble(age * (8.0 + 5.0 * h.x) + fk, age * 5.0 + seed) * q;
    d = min(d, piece(q, fk + cyc + seed, 0.36));
  }
  return d;
}
// once the tray is full, a piece at a time slides off the front lip and falls to the floor
float spill(vec3 p, vec3 pc, float seed) {
  if (uHeap < 9.5) return 1e3;
  float ph = uRun * 1.3 + seed * 0.37;
  float age = fract(ph) * 0.5;
  float y = max(TY + 0.12 - 4.9 * age * age, 0.012);
  vec3 c = vec3(pc.x + 0.1 * sin(seed * 5.0), y, TZ + 0.3 + 0.35 * age);
  vec3 q = p - c;
  if (dot(q, q) > 0.01) return length(q) - 0.06;
  q = tumble(age * 11.0 + seed, age * 6.0) * q;
  return piece(q, seed + floor(ph), 0.36);
}
float mapObj(vec3 p, out int id) {
  id = 1;
  // the back wall with its doorway, and the warm light box beyond it
  float wall = max(p.z - DOOR.y, -(p.z - DOOR.y + 0.3));
  wall = max(wall, -sdBox(p - vec3(DOOR.x, 1.05, DOOR.y), vec3(0.42, 1.05, 0.5)));
  float d = wall;
  float lb = sdBox(p - vec3(DOOR.x, 1.3, DOOR.y - 0.9), vec3(1.2, 1.6, 0.05));
  if (lb < d) { d = lb; id = 2; }
  // the tray and the two arms holding it up
  float tr = tray(p);
  if (tr < d) { d = tr; id = 3; }
  float ja, jb;
  float ar = min(arm(p, 1.0, ja), arm(p, -1.0, jb));
  if (ar < d) { d = ar; id = 6; }
  // what heaps in the tray: coins, hex tokens and square procurement chips lying at angles
  if (uHeap > 0.0 && abs(p.x) < 0.66 && abs(p.z - TZ) < 0.3 && p.y < TY + 0.2 && p.y > TY - 0.05) {
    for (int k = 0; k < 10; k++) {
      float fk = float(k);
      if (fk >= uHeap) break;
      vec2 h = hash22(vec2(fk, 4.0)) - 0.5;
      vec3 c = vec3(h.x * 1.05, TY + 0.045 + 0.012 * floor(fk / 4.0), TZ + h.y * 0.38);
      vec3 q = tumble(0.25 * h.x, fk * 2.3) * (p - c);
      float pc = mod(fk, 3.0) < 0.5 ? sdRoundBox(q, vec3(0.03, 0.004, 0.03), 0.002) : piece(q, fk, 0.36);
      if (pc < d) { d = pc; id = mod(fk, 3.0) < 0.5 ? 7 : 4; }
    }
  }
  // the streams into the tray
  vec3 pa3 = vec3(STREAMS_X.x, TY, TZ), pb3 = vec3(STREAMS_X.y, TY, TZ - 0.05), pc3 = vec3(STREAMS_X.z, TY, TZ + 0.05);
  float s = min(min(stream(p, pa3, 1.0), stream(p, pb3, 2.0)), stream(p, pc3, 3.0));
  s = min(s, min(min(spill(p, pa3, 1.0), spill(p, pb3, 2.0)), spill(p, pc3, 3.0)));
  if (s < d) { d = s; id = 4; }
  // the overflow on the floor under the front lip
  if (uFloorHeap > 0.0 && p.y < 0.2 && abs(p.z - TZ - 0.5) < 0.5 && abs(p.x) < 1.2) {
    for (int k = 0; k < 9; k++) {
      float fk = float(k);
      if (fk >= uFloorHeap) break;
      float hx = mod(fk, 3.0) - 1.0;
      vec2 h = hash22(vec2(fk * 3.1, 7.0)) - 0.5;
      vec3 c = vec3(hx * 0.36 + h.x * 0.25, 0.012 + 0.01 * floor(fk / 3.0), TZ + 0.5 + h.y * 0.25);
      vec3 q = tumble(0.3 * h.x, fk * 1.7) * (p - c);
      float pc = piece(q, fk, 0.36);
      if (pc < d) { d = pc; id = 4; }
    }
  }
  // the blood: a thin glossy sheet pooling under the lip, then running for the door
  if (uPool > 0.001) {
    float pool = 1e3;
    for (int k = 0; k < 3; k++) {
      vec2 c = vec2((float(k) - 1.0) * 0.36, TZ + 0.5);
      pool = min(pool, length((p.xz - c) / vec2(1.3, 1.0)) - uPool * (0.5 + 0.1 * fbm(p.xz * 5.0 + float(k), 3)));
    }
    vec2 e = RUN0 + (DOOR - RUN0) * uRunL;
    vec2 pa = p.xz - RUN0, ba = e - RUN0;
    float hh = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0);
    float run = length(pa - ba * hh) - (0.13 + 0.07 * fbm(p.xz * 4.0, 3)) * smoothstep(0.0, 0.05, uRunL);
    pool = smin(pool, run, 0.15);
    float sheet = max(pool * 0.8, abs(p.y - 0.004) - 0.003);
    if (sheet < d) { d = sheet; id = 5; }
  }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 1) { Mat m = M(vec3(0.82, 0.83, 0.84), 0.4, 0.0); m.alb *= 0.9 + 0.1 * vnoise(p.xy * vec2(1.0, 4.0)); return m; }
  if (id == 2) { Mat m = M(vec3(0.0), 1.0, 0.0); m.emit = vec3(4.4, 3.0, 1.7); return m; }
  if (id == 3) { Mat m = SILVER(); m.rough = 0.08 + 0.06 * vnoise(p * 50.0); return m; }
  if (id == 6) {
    // graphite industrial paint, a green status ring at each joint
    Mat m = M(vec3(0.07, 0.075, 0.08), 0.4, 0.2); m.clear = 0.5;
    float ja, jb; float d1 = arm(p, 1.0, ja), d2 = arm(p, -1.0, jb);
    float jn = d1 < d2 ? ja : jb;
    if (jn > 0.5) { m.alb = vec3(0.6, 0.62, 0.65); m.metal = 1.0; m.rough = 0.2; m.emit = vec3(0.3, 1.2, 0.15) * smoothstep(0.012, 0.0, abs(fract(p.y * 30.0) - 0.5) - 0.44); }
    return m;
  }
  if (id == 7) { Mat m = M(vec3(0.05, 0.07, 0.06), 0.3, 0.0); vec2 g = fract(p.xz * 180.0); if (max(g.x, g.y) > 0.8) m = SILVER(); return m; }
  if (id == 4) {
    Mat m = creditMat(p);
    // pieces lying in the blood take its colour on their undersides
    if (p.y < 0.03) m.alb = mix(m.alb, vec3(0.5, 0.05, 0.06), uRed * smoothstep(0.03, 0.0, p.y) * 0.8);
    return m;
  }
  // blood: a red signal glow first, darkening into glossy blood
  Mat m = M(vec3(0.42, 0.015, 0.03), 0.06, 1.0);
  m.emit = vec3(1.6, 0.04, 0.2) * uSig * (0.4 + 0.6 * smoothstep(0.3, 0.7, fbm(p.xz * 9.0 - uTime * 2.0, 3)));
  return m;
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('222, 228, 230', 1.0), uCycB: rgb('200, 208, 212', 0.85),
      uFloorCol: rgb('214, 218, 220', 0.8), uFloorRough: 0.14, uFloorGrain: 0.6, uGrime: 0.1,
      uHaze: 0.015, uHazeCol: rgb('220, 230, 235', 0.4),
      uKeyDir: [0.1, 1.0, 0.25], uKeyCol: [3.0, 3.1, 3.3], uKeySize: 0.5,
      uRimA: [1.6, 1.7, 1.8], uRimB: [1.6, 1.7, 1.8],
      uP1: [DOOR[0], 1.2, DOOR[1] + 0.4], uP1c: [2.4, 1.6, 0.8],
      uRun: 0, uHeap: 0, uFloorHeap: 0, uPool: 0, uRunL: 0, uRed: 0, uSig: 0,
    },
    camera,
    textPlane() { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      u.uRun.value = t - t0 + 3.0;
      // the tray fills through the first line, then overflows onto the floor
      u.uHeap.value = Math.min(10, Math.floor(Math.max(0, t - t0 - 0.3) / 0.3));
      u.uFloorHeap.value = Math.min(9, Math.floor(Math.max(0, t - (t0 + 1.9)) / 0.3));
      // on "Blood" the overflow on the floor turns red: signal flash, then blood spreading and running
      const x = t - tBlood;
      u.uPool.value = x <= 0 ? 0 : 1 - Math.exp(-x * 2.2) * (1 + x * 2.2);
      u.uRunL.value = runL(t);
      u.uRed.value = clamp(x / 0.4, 0, 1);
      u.uSig.value = x <= 0 ? 0 : Math.exp(-x * 1.3);
      // the room cools and dims a little as it spreads; the door's warmth grows
      const k = ease.inOut3(x / 2.0);
      u.uKeyCol.value = [3.0 - 0.6 * k, 3.1 - 0.7 * k, 3.3 - 0.6 * k];
      u.uP1c.value = [2.4 + 2.0 * k, 1.6 + 1.2 * k, 0.8 + 0.5 * k];
    },
    post(t) { return grade(t, { exposure: 1.0, vignette: 0.32 }); },
  };
};
