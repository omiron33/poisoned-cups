// 25 · "The stones will speak My will" (v4 REBUILD: the overthrow, held to 150 s)
// s24's hall exactly: three steel control pylons with their rigid iron snakes, the frozen magenta
// face wall, and the cables the people threw, running from the pylon tops down into the crowd.
// Low behind the crowd, the nearest pullers big in the foreground with their backs to us, warm-rimmed.
//   "The"     the people lean back on the cables.
//   "stones"  the cables snap taut; white-hot cracks open round each pylon's base and up its steel,
//             dust bursts from the bases.
//   "will"    the left pylon tips and falls to the left, a rigid rotation about its base edge.
//   "speak"   it smashes on the floor in three pieces (its snake breaks with it); a ring of dust and
//             white light rolls across the wet floor and the crowd's rims flare.
//   "My"      the centre pylon falls backward through the face wall; the wall breaks open and warm
//             gold-white light pours through the gap (the same light as "I" in s08, s16, s23).
//   "will"    the right pylon falls to the right and smashes; through the held note dust and warm
//             light fill the hall and the people stand in it. Mid-key until 149.5, then white.
// Camera: held steps, one per word (each word lands while the camera holds), a slow rise over the
// crowd's heads through the held "will". The words hold fixed screen rows above the action.
import { grade, rgb, linesFrom, clamp01, ease, mix } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { FIGURE_GLSL, POSES, mixPose } from '/song/lib/x-v4-figure.js';
import { SNAKE_GLSL } from '/song/lib/x-v4-snake.js';
import { HEAD_GLSL } from '/song/lib/x-v4-head.js';
import { XF_GLSL } from '/song/lib/x-f.js';
import { HALL24_GLSL, hall24Uniforms, PEOPLE_N, PYL, PHT, PR, PLH, pylWorld } from '/song/lib/x-v4s-s24-bend.js';

const [L] = linesFrom('The stones will speak');
const WALLZ_FRONT = -2.52;

// the people: [x, z, kind, rope (0 left, 1 centre, 2 right, -1 none)]; the pullers on each rope are
// listed tail-first (nearest the pylon first)
const PEO = [
  [-2.05, 2.15, 2, 0], [-2.0, 3.25, 0, 0], [-1.6, 4.55, 0, 0],
  [0.62, 1.75, 0, 1], [0.95, 2.85, 2, 1],
  [2.1, 2.2, 1, 2], [2.05, 3.3, 2, 2], [1.75, 4.6, 0, 2],
  [-3.25, 2.7, 1, -1], [3.35, 2.6, 0, -1], [-0.85, 1.35, 4, -1], [-3.05, 3.9, 2, -1],
];
const ROPES = [[0, 1, 2], [3, 4], [5, 6, 7]];

// camera keys: held steps outward and up, one per word
const K = [
  { pos: [0.3, 1.72, 7.9], tg: [0.0, 2.85, -1.0], fov: 46 },
  { pos: [0.15, 1.7, 7.65], tg: [0.0, 2.8, -1.0], fov: 46 },
  { pos: [-0.25, 1.72, 7.55], tg: [-0.45, 2.75, -1.0], fov: 46 },
  { pos: [0.0, 1.78, 7.8], tg: [-0.1, 2.75, -1.0], fov: 46 },
  { pos: [0.0, 1.82, 7.6], tg: [0.0, 2.7, -1.2], fov: 46 },
  { pos: [0.0, 2.75, 8.4], tg: [0.0, 2.25, -1.5], fov: 46 },
];

export function rig(P) {
  const ws = L.words;               // The stones will speak My will
  const on = ws.map((w) => w.start);
  const seg = [
    [on[1] + 0.14, on[2] - 0.02, 0, 1],
    [on[2] + 0.14, on[3] - 0.02, 1, 2],
    [on[3] + 0.14, on[4] - 0.02, 2, 3],
    [on[4] + 0.15, on[5] - 0.02, 3, 4],
    [on[5] + 0.16, P.to, 4, 5],
  ];
  // impacts: left floor, centre wall, right floor
  const tFallL = on[2], tHitL = on[3];
  const tFallC = on[4], tWall = on[4] + 0.3, tDownC = on[4] + 0.6;
  const tFallR = on[5], tHitR = on[5] + 0.6;
  const shake = (t) => {
    let s = 0;
    for (const [t0, a] of [[tHitL, 0.05], [tWall, 0.035], [tHitR, 0.05]]) if (t > t0) s += a * Math.exp(-(t - t0) * 9) * Math.sin((t - t0) * 70);
    return s;
  };
  const lerpK = (a, b, k) => ({ pos: mix(a.pos, b.pos, k), tg: mix(a.tg, b.tg, k), fov: mix(a.fov, b.fov, k) });
  const camera = (t) => {
    let c = K[0];
    for (const [t0, t1, a, b] of seg) {
      if (t < t0) break;
      const last = b === 5;
      const k = last ? ((x) => x * x * (3 - 2 * x))(clamp01((t - t0) / (t1 - t0))) : ease.inOut3(clamp01((t - t0) / (t1 - t0)));
      c = lerpK(K[a], K[b], k);
    }
    const s = shake(t);
    return { pos: [c.pos[0] + s * 0.4, c.pos[1] + s, c.pos[2]], target: c.tg, fov: c.fov, roll: s * 0.1 };
  };
  const fall = (t, t0, t1, th1) => (t <= t0 ? 0 : th1 * Math.min(1, ((t - t0) / (t1 - t0)) ** 2));
  const th = (t) => [
    fall(t, tFallL, tHitL, Math.PI / 2 - 0.06) + (t > on[1] && t < tFallL ? 0.012 * Math.sin((t - on[1]) * 40) * Math.exp(-(t - on[1]) * 4) : 0),
    fall(t, tFallC, tDownC, 1.42),
    fall(t, tFallR, tHitR, Math.PI / 2 - 0.06),
  ];
  const sh = (t) => [ease.out3(clamp01((t - tHitL) / 0.8)), ease.out3(clamp01((t - tDownC) / 0.8)) * 0.6, ease.out3(clamp01((t - tHitR) / 0.8))];
  const all = (t) => ease.inOut3(clamp01((t - on[5]) / 2.6));
  return { camera, ws, on, th, sh, all, tHitL, tWall, tHitR, tDownC };
}

export default (P) => {
  const R = rig(P);
  const on = R.on;
  // rope anchors: the cable loop on each pylon's neck, on the side facing its first puller
  const anchorLocal = ROPES.map((r, k) => {
    const p = PEO[r[0]], P0 = PYL[k];
    const dx = p[0] - P0[0], dz = p[1] - P0[2], l = Math.hypot(dx, dz);
    return [(dx / l) * (PR + 0.03), PHT - 0.12, (dz / l) * (PR + 0.03)];
  });
  const hold = { A: [0.06, -0.22, -0.3, 0.05], B: [1.3, 0.35, 1.45, 0.3], C: [0.7, 0.3, 0, 0.1] };
  const pull = { A: [0.1, -0.5, -0.15, 0.1], B: [1.2, 0.35, 1.3, 0.25], C: [0.8, 0.42, 0, 0.12] };
  const stagger = { A: [0.0, -0.12, -0.35, 0.0], B: [0.9, 0.5, 1.0, 0.6], C: [0.5, 0.15, 0, 0] };
  const watch = { A: [-0.06, -0.04, -0.4, 0.1], B: [0.25, 1.9, 0.3, 1.9], C: [0.2, 0.05, 0, 0.6] };
  const relaxAt = [R.tHitL, R.tWall, R.tHitR];
  const personAt = (i, t) => {
    const [x, z, kind, rope] = PEO[i];
    let pose, yaw;
    if (rope >= 0) {
      const a = pylWorld(rope, 0, anchorLocal[rope]);
      yaw = Math.atan2(a[0] - x, a[2] - z);
      pose = mixPose(hold, pull, ease.inOut3(clamp01((t - on[0] + 0.12) / 0.25)));
      // the cable goes: they stagger back and stand
      const k = ease.out3(clamp01((t - relaxAt[rope]) / 0.5));
      if (k > 0) pose = mixPose(pose, stagger, k);
    } else {
      yaw = Math.atan2(-x * 0.3, -1);
      pose = mixPose(POSES.lookup, watch, ease.inOut3(clamp01((t - R.tHitL) / 0.6)));
    }
    if (yaw > 0) yaw -= 2 * Math.PI;
    return { x, z, yaw: yaw + 2 * Math.PI, kind, pose };
  };
  return {
    name: 's25-stones', from: P.from, to: P.to,
    frag: STUDIO_GLSL + FIGURE_GLSL + SNAKE_GLSL + HEAD_GLSL + XF_GLSL + HALL24_GLSL + /* glsl */ `
uniform vec4 uAnc[3];         // rope anchors (world), w = tension 0 slack .. 1 taut
uniform vec4 uDust[6];        // dust puffs: centre, radius
uniform float uDa[6];         // and their amounts
uniform float uAll, uWhite, uPanT, uFlash;
uniform vec3 uRimW, uDustCol;
vec3 gH[8];
float ropes(vec3 p) {
  float d = 1e9;
  for (int k = 0; k < 3; k++) {
    int n = k == 1 ? 2 : 3;
    int i0 = k == 0 ? 0 : (k == 1 ? 3 : 5);
    vec3 a = uAnc[k].xyz;
    vec3 h0 = gH[i0];
    // slack: a sag in the long span, gone when taut
    vec3 m = mix(a, h0, 0.5) - vec3(0.0, 0.35 * (1.0 - uAnc[k].w), 0.0);
    d = min(d, min(sdCapsule(p, a, m, 0.024), sdCapsule(p, m, h0, 0.024)));
    vec3 pr = h0;
    for (int j = 1; j < 3; j++) {
      if (j >= n) break;
      vec3 h = gH[i0 + j];
      d = min(d, sdCapsule(p, pr, h, 0.024));
      pr = h;
    }
    // the tail end trails to the floor behind the last puller
    vec3 dir = normalize(vec3(pr.x - a.x, 0.0, pr.z - a.z));
    d = min(d, sdCapsule(p, pr, vec3(pr.x, 0.02, pr.z) + dir * 0.7, 0.022));
  }
  return d;
}
// falling wall panels from the breach
float panels(vec3 p) {
  if (uPanT <= 0.0) return 1e9;
  float d = 1e9;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    vec3 c0 = vec3((fi - 1.5) * 0.62, 2.9 - 0.3 * mod(fi, 2.0), WALLZ + 0.1);
    float t = uPanT * (0.85 + 0.2 * hash11(fi + 3.0));
    vec3 c = c0 + vec3((fi - 1.5) * 0.25 * t, -4.9 * t * t, 0.9 * t);
    if (c.y < 0.08) c.y = 0.08;
    vec3 q = p - c;
    float a = min(t * (2.0 + fi), 1.45);
    q.yz = rot(a) * q.yz;
    q.xy = rot(0.4 * (fi - 1.5) * t) * q.xy;
    d = min(d, sdBox(q, vec3(0.3, 0.27, 0.04)));
  }
  return d;
}
float mapObj(vec3 p, out int id) {
  id = 9;
  float d = wallSD(p);
  // the light beyond the breach
  float lb = abs(p.z - (WALLZ - 1.6));
  if (uHole > 0.0 && lb < d) { d = lb; id = 30; }
  for (int k = 0; k < 3; k++) {
    float v = pylon(p, k);
    if (v < d) { d = v; id = 2 + k; }
  }
  float pn = panels(p);
  if (pn < d) { d = pn; id = 31; }
  if (p.z > 0.6) {
    int who;
    float f = people(p, who);
    if (f < d) { d = f; id = 40 + who; }
  } else d = min(d, 0.6 - p.z + 0.05);
  float rp = ropes(p);
  if (rp < d) { d = rp; id = 20; }
  // the cracked floor discs round each base
  for (int k = 0; k < 3; k++) {
    vec3 q = p - pyl(k);
    float fd = sdCyl(q - vec3(0.0, 0.004, 0.0), 1.0, 0.006);
    if (fd < d) { d = fd; id = 10 + k; }
  }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  int i2; mapObj(p, i2);
  if (id == 9) return wallMat(p, n);
  if (id == 30) { Mat m = M(vec3(0.0), 1.0, 0.0); m.emit = uHoleCol * (1.2 + 0.3 * fbm(p.xy * 0.8, 3)); return m; }
  if (id == 31) { Mat m = wallMat(p, n); m.emit *= 0.0; m.emit = uHoleCol * 0.04; return m; }
  if (id >= 2 && id <= 4) { int k = id - 2; pylon(p, k); return pylonMat(k, gPyQ, n, p); }
  if (id >= 10 && id <= 12) {
    int k = id - 10;
    vec3 q = p - pyl(k);
    Mat m = M(vec3(0.12, 0.12, 0.13) * (0.6 + 0.6 * fbm(p * 5.0, 3)), 0.25, 0.0);
    float r = length(q.xz);
    float cr = fractureLines(q.xz, float(k) * 7.0 + 3.0, 4.0) * smoothstep(1.0, 0.3, r);
    m.alb *= 1.0 - 0.6 * cr;
    m.emit = vec3(3.2, 3.0, 2.7) * uCrk[k] * cr * 1.3;
    return m;
  }
  if (id == 20) { Mat m = M(vec3(0.55, 0.56, 0.6), 0.35, 1.0); m.emit = vec3(0.12, 0.1, 0.08) + uRimW * 0.04; return m; }
  return peopleMat(id - 40, p, n, normalize(vec3(0.3, 0.6, 1.0)), vec3(1.25, 0.72, 0.42), uRimW);
}
// analytic dust: soft ellipsoid puffs, lit by the light in the hall
vec3 dust(vec3 ro, vec3 rd, float depth) {
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 6; i++) {
    if (uDa[i] <= 0.0) continue;
    vec3 c = uDust[i].xyz; float r = uDust[i].w;
    vec3 sc = vec3(1.0, 2.2, 1.0);          // flattened: dust hugs the floor
    vec3 o = (ro - c) * sc, dd = rd * sc;
    float tc = clamp(-dot(o, dd) / dot(dd, dd), 0.0, depth);
    vec3 cp = o + dd * tc;
    float q = dot(cp, cp) / (r * r);
    float den = exp(-q) * (0.7 + 0.6 * vnoise(cp.xz * 3.0 + c.xz + float(i))) ;
    acc += uDustCol * den * uDa[i];
  }
  return acc;
}
vec3 shade(vec2 fc) {
  for (int i = 0; i < 8; i++) {
    vec3 h = mix(personHand(uPA[i], uPB[i], uPC[i], uPos[i].w, 1.0), personHand(uPA[i], uPB[i], uPC[i], uPos[i].w, -1.0), 0.5);
    gH[i] = vec3(uPos[i].x, 0.0, uPos[i].y) + pfRy(h, uPos[i].z);
  }
  gSkFlick = 0.8;
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  vec3 col = studio(ro, rd, depth);
  col += dust(ro, rd, depth);
  return mix(col, vec3(3.0, 2.9, 2.75), uWhite);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      ...hall24Uniforms(),
      uCycA: rgb('44, 36, 64', 1.1), uCycB: rgb('12, 10, 20', 1.0),
      uFloorCol: rgb('92, 94, 100', 0.85), uFloorRough: 0.1, uGrime: 0.9,
      uKeyDir: [-0.5, 0.8, 0.5], uKeyCol: [2.4, 2.6, 3.0], uKeySize: 0.3, uExpo: 1.15,
      uRimA: [1.8, 1.0, 2.6], uRimB: [1.6, 1.9, 2.2],
      uHaze: 0.03, uHazeCol: [0.04, 0.035, 0.06],
      uAnc: new Array(12).fill(0), uDust: new Array(24).fill(0), uDa: [0, 0, 0, 0, 0, 0],
      uAll: 0, uWhite: 0, uPanT: 0, uFlash: 0, uRimW: [1.1, 0.55, 0.28], uDustCol: [0.1, 0.1, 0.1],
    },
    camera: R.camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      const pos = u.uPos.value, A = u.uPA.value, B = u.uPB.value, C = u.uPC.value;
      for (let i = 0; i < PEOPLE_N; i++) {
        const s = personAt(i, t);
        pos.splice(i * 4, 4, s.x, s.z, s.yaw, s.kind);
        A.splice(i * 4, 4, ...s.pose.A); B.splice(i * 4, 4, ...s.pose.B); C.splice(i * 4, 4, ...s.pose.C);
      }
      const th = R.th(t), sh = R.sh(t), all = R.all(t);
      u.uTh.value = th; u.uSh.value = sh;
      u.uLoop.value = [1, 1, 1];
      // the cracks: a flare on "stones", then a steady burn; each fades a little once its pylon is down
      const crk = t < on[1] - 0.02 ? 0 : 0.9 + 1.6 * Math.exp(-(t - on[1]) * 3) + 0.8 * all;
      u.uCrk.value = [crk, crk, crk];
      const taut = ease.out3(clamp01((t - on[1] + 0.06) / 0.12));
      const anc = u.uAnc.value;
      for (let k = 0; k < 3; k++) anc.splice(k * 4, 4, ...pylWorld(k, th[k], anchorLocal[k]), Math.max(0.35 + 0.5 * clamp01((t - on[0]) / 0.24), taut));
      // the breach: opens as the centre pylon reaches the wall
      const hole = ease.out3(clamp01((t - R.tWall) / 0.3));
      u.uHole.value = hole;
      const warm = hole * (1 + 0.6 * all);
      u.uHoleCol.value = [3.4 * warm, 2.75 * warm, 1.85 * warm];
      u.uPanT.value = Math.max(0, t - R.tWall);
      u.uFace.value = 1 - 0.85 * all;
      // dust: base bursts on "stones", the impact rings, the light-filled haze at the end
      const D = u.uDust.value, Da = u.uDa.value;
      const puff = (i, c, r, a) => { D.splice(i * 4, 4, ...c, r); Da[i] = a; };
      const burst = (t0, dur) => (t < t0 ? 0 : Math.exp(-(t - t0) / dur) * ease.out3(clamp01((t - t0) / 0.08)));
      const grow = (t0, r0, v) => r0 + v * Math.sqrt(Math.max(0, t - t0));
      const hitL = pylWorld(0, Math.PI / 2 - 0.06, [0, PHT * 0.55, 0]);
      const hitR = pylWorld(2, Math.PI / 2 - 0.06, [0, PHT * 0.55, 0]);
      const bb = burst(on[1], 1.2);
      puff(0, [-1.75, 0.15, 0.2], grow(on[1], 0.35, 0.6), 0.35 * bb);
      puff(1, [0, 0.15, -0.5], grow(on[1], 0.35, 0.6), 0.3 * bb);
      puff(2, [1.75, 0.15, 0.2], grow(on[1], 0.35, 0.6), 0.35 * bb + 0.0);
      puff(3, [hitL[0], 0.1, hitL[2] + 0.3], grow(R.tHitL, 0.4, 2.6), 0.9 * burst(R.tHitL, 1.6) + 0.25 * all);
      puff(4, [hitR[0], 0.1, hitR[2] + 0.3], grow(R.tHitR, 0.4, 2.6), 0.9 * burst(R.tHitR, 1.6) + 0.25 * all);
      puff(5, [0, 0.4, -1.8], grow(R.tWall, 0.6, 2.4), 0.8 * burst(R.tWall, 1.8) + 0.45 * all);
      // dust colour: lit cold by the impacts, warm by the light through the breach
      const fl = Math.max(burst(R.tHitL, 0.35), burst(R.tHitR, 0.35));
      u.uDustCol.value = [0.09 + 0.12 * fl + 0.16 * warm, 0.09 + 0.12 * fl + 0.12 * warm, 0.1 + 0.13 * fl + 0.07 * warm];
      // the crowd's rims flare on each smash, then warm in the light
      const rf = 1 + 2.2 * fl + 1.2 * warm;
      u.uRimW.value = [1.1 * rf, 0.62 * rf, 0.34 * rf];
      // lights: P1 the white flash of each smash (and the pylon cracks' glow before), P2 the warm light
      // through the breach
      const crack = t < on[1] ? 0 : 1.5 * Math.exp(-(t - on[1]) * 2);
      if (fl > 0.02) { const h = R.tHitR <= t ? hitR : hitL; u.uP1.value = [h[0], 0.6, h[2] + 0.6]; u.uP1c.value = [14 * fl, 14 * fl, 15 * fl]; }
      else { u.uP1.value = [0, 0.5, 0.8]; u.uP1c.value = [6 * crack, 5.8 * crack, 5.4 * crack]; }
      u.uP2.value = [0.0, 1.8, WALLZ_FRONT + 0.5]; u.uP2c.value = [9 * warm, 7 * warm, 4.6 * warm];
      u.uHaze.value = 0.03 + 0.06 * all + 0.02 * hole;
      u.uHazeCol.value = [0.04 + 0.16 * all, 0.035 + 0.13 * all, 0.06 + 0.07 * all];
      u.uCycB.value = mix(rgb('12, 10, 20', 1.0), rgb('70, 54, 40', 0.6), all);
      u.uWhite.value = ease.inOut3(clamp01((t - (P.to - 0.32)) / 0.32));
    },
    post(t) { return grade(t, { exposure: 1.0, bloom: 0.12, threshold: 1.1, ca: 0.2 }); },
  };
};
