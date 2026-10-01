// 24 · "But brood of vipers / If you won't bend"  (v4 REWORK: rigid snakes, frozen glass faces, the people arrive)
// After the reed's mercy, the refusal, cold and still. Three steel control pylons stand in a wet
// concrete hall, joined by steel access rails. Round each one a snake is wound tight and gone rigid as
// steel (snakeWrap, iron): its head rears off the top, jaws a little open, fangs out, tongue frozen
// mid-flick. Behind them, three contour faces on the black wall, frozen magenta and defiant. A cold
// glint runs down the steel on "vipers" and again on "bend".
// The people arrive: through line 1 a crowd of ten walks in from both frame edges, warm-lit, and
// stops below the pylons. On "bend" the three nearest the pylons throw cables up: three thin cables
// arc up over the pylon tops and catch (s25 pulls them down). Slow push that settles and holds,
// framed low so the crowd's heads and shoulders fill the bottom of the frame.
import { ease, grade, rgb, orbit, linesAt, clamp01, spring } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { FIGURE_GLSL, POSES, mixPose, walk } from '/song/lib/x-v4-figure.js';
import { SNAKE_GLSL } from '/song/lib/x-v4-snake.js';
import { HEAD_GLSL } from '/song/lib/x-v4-head.js';
import { XF_GLSL } from '/song/lib/x-f.js';
import { HALL24_GLSL, hall24Uniforms, PEOPLE_N, PYL, PHT, PR, pylWorld } from '/song/lib/x-v4s-s24-bend.js';

// the same people, in the same places, that s25 opens on (its pullers and two watchers)
// the crowd: final spot (x, z), kind, arrival time offset (s after line 1's last word ends), and
// which pylon they throw a cable over (-1 none)
const CROWD = [
  { x: -2.05, z: 2.15, kind: 2, arr: -0.55, thr: 0 },
  { x: 0.62, z: 1.75, kind: 0, arr: -0.45, thr: 1 },
  { x: 2.1, z: 2.2, kind: 1, arr: -0.5, thr: 2 },
  { x: -2.0, z: 3.25, kind: 0, arr: -0.2, thr: -1 },
  { x: -1.6, z: 4.55, kind: 0, arr: 0.25, thr: -1 },
  { x: 0.95, z: 2.85, kind: 2, arr: 0.0, thr: -1 },
  { x: 2.05, z: 3.3, kind: 2, arr: 0.1, thr: -1 },
  { x: 1.75, z: 4.6, kind: 0, arr: 0.3, thr: -1 },
  { x: -3.25, z: 2.7, kind: 1, arr: -0.1, thr: -1 },
  { x: 3.35, z: 2.6, kind: 0, arr: 0.2, thr: -1 },
];
const SPEED = 1.55;

export function rig24(P) {
  const [L1, L2] = linesAt(P.from - 0.6, 'But brood of vipers', 'If you won');
  const tV = L1.words[L1.words.length - 1].start, tB = L2.words[L2.words.length - 1].start;
  const tEnd1 = L1.words[L1.words.length - 1].end;
  const camera = (t) => {
    const u = t - P.from;
    const k = ease.inOut3(u / 3.4);
    const hit = spring(t, tB - 0.02, 0.3, 0.35);
    return orbit(t, { target: [0.0, 2.0, -0.6], yaw: -0.16 + 0.1 * k, pitch: 0.15 + 0.02 * k, dist: 8.7 - 0.55 * k - 0.12 * hit, fov: 44, drift: 0.004 });
  };
  // where person i is and how they stand at time t
  const person = (i, t) => {
    const c = CROWD[i];
    const side = c.x < 0 ? -1 : 1;
    const tArr = tEnd1 + c.arr;
    // decelerate over the last 0.45 s: remaining distance r(t)
    const T = 0.45;
    const dt = tArr - t;
    const r = dt <= 0 ? 0 : dt >= T ? SPEED * (dt - T / 2) : (SPEED * dt * dt) / (2 * T);
    const x = c.x + side * r;
    const moving = dt > 0;
    const walkYaw = side < 0 ? Math.PI / 2 : -Math.PI / 2;
    let face = side < 0 ? Math.PI : -Math.PI;
    let pose;
    if (c.thr >= 0) {
      const top = pylWorld(c.thr, 0, [0, PHT, 0]);
      const tgt = Math.atan2(top[0] - c.x, top[2] - c.z);
      face = tgt + (side < 0 && tgt < 0 ? 2 * Math.PI : 0) + (side > 0 && tgt > 0 ? -2 * Math.PI : 0);
    }
    const turn = ease.inOut3(clamp01((t - tArr + 0.15) / 0.5));
    const yaw = moving ? walkYaw + (face - walkYaw) * (0.25 + 0.25 * clamp01(1 - dt / 1.2)) : walkYaw + (face - walkYaw) * (0.5 + 0.5 * turn);
    const phase = (r / 0.72) * Math.PI + i * 1.3;
    const stride = clamp01(dt / 0.35);
    pose = mixPose(POSES.stand, walk(phase, 1), stride);
    if (c.thr >= 0) {
      // wind up, release on "bend", then take the cable's weight
      const cock = { A: [-0.12, -0.08, -0.3, 0], B: [0.4, 0.4, 2.9, 1.9], C: [0.6, 0.12, 0, 0] };
      const rel = { A: [-0.2, -0.12, -0.45, 0], B: [0.6, 0.3, 2.35, 0.15], C: [0.85, 0.15, 0, 0] };
      const hold = { A: [0.06, -0.22, -0.3, 0.05], B: [1.3, 0.35, 1.45, 0.3], C: [0.7, 0.3, 0, 0.1] };
      const k1 = ease.inOut3(clamp01((t - (tB - 0.4)) / 0.3));
      const k2 = ease.out3(clamp01((t - (tB - 0.08)) / 0.12));
      const k3 = ease.inOut3(clamp01((t - (tB + 0.35)) / 0.5));
      if (k1 > 0) pose = mixPose(pose, cock, k1);
      if (k2 > 0) pose = mixPose(pose, rel, k2);
      if (k3 > 0) pose = mixPose(pose, hold, k3);
    }
    return { x, z: c.z, yaw, kind: c.kind, pose };
  };
  // the throw: the cable's tip leaves the hand at "bend" and catches over the top 0.3 s later
  const tThrow = tB - 0.04, tCatch = tB + 0.28;
  const flight = (t, k) => clamp01((t - tThrow - 0.03 * k) / (tCatch - tThrow));
  const glintAt = (t) => Math.max(ease.inOut3((t - tV) / 0.7) * (t < tV + 0.7 ? 1 : 0), ease.inOut3((t - tB) / 0.7) * (t < tB + 0.7 ? 1 : 0));
  return { camera, person, flight, tThrow, tCatch, glintAt, tB, tV };
}

export default (P) => {
  const R = rig24(P);
  return {
    name: 's24-bend', from: P.from, to: P.to,
    frag: STUDIO_GLSL + FIGURE_GLSL + SNAKE_GLSL + HEAD_GLSL + XF_GLSL + HALL24_GLSL + /* glsl */ `
uniform vec4 uFly;      // flight 0..1 per cable (xyz), w: settle 0..1 (arc relaxes to a hang)
uniform vec4 uEnd[3];   // where each cable catches (world), w = 1 drawn
vec3 gHand[3];
float cable(vec3 p, int k) {
  if (uEnd[k].w < 0.5) return 1e9;
  float u = k == 0 ? uFly.x : (k == 1 ? uFly.y : uFly.z);
  if (u <= 0.0) return 1e9;
  vec3 a = gHand[k], c = uEnd[k].xyz;
  vec3 b = mix(a, c, 0.5) + vec3(0.0, mix(1.7, -0.12, uFly.w), 0.0);
  return cableBez(p, a, b, c, u, 0.024);
}
float mapObj(vec3 p, out int id) {
  id = 9;
  float d = wallSD(p);
  for (int k = 0; k < 3; k++) {
    float v = pylon(p, k);
    if (v < d) { d = v; id = 2 + k; }
  }
  if (p.z > 0.6) {
    int who;
    float f = people(p, who);
    if (f < d) { d = f; id = 40 + who; }
  } else d = min(d, 0.6 - p.z + 0.05);
  for (int k = 0; k < 3; k++) {
    float c = cable(p, k);
    if (c < d) { d = c; id = 20; }
  }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  int i2; mapObj(p, i2);
  if (id == 9) return wallMat(p, n);
  if (id >= 2 && id <= 4) { int k = id - 2; pylon(p, k); return pylonMat(k, gPyQ, n, p); }
  if (id == 20) { Mat m = M(vec3(0.55, 0.56, 0.6), 0.35, 1.0); m.emit = vec3(0.12, 0.1, 0.08); return m; }
  return peopleMat(id - 40, p, n, normalize(vec3(0.35, 0.55, 1.0)), vec3(1.25, 0.72, 0.42), vec3(1.1, 0.55, 0.28));
}
vec3 shade(vec2 fc) {
  for (int k = 0; k < 3; k++) {
    int i = k;
    vec3 h = personHand(uPA[i], uPB[i], uPC[i], uPos[i].w, -1.0);
    gHand[k] = vec3(uPos[i].x, 0.0, uPos[i].y) + pfRy(h, uPos[i].z);
  }
  gSkFlick = 0.8;
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      ...hall24Uniforms(),
      uCycA: rgb('44, 36, 64', 1.1), uCycB: rgb('12, 10, 20', 1.0),
      uFloorCol: rgb('92, 94, 100', 0.85), uFloorRough: 0.1, uGrime: 0.9,
      uKeyDir: [-0.5, 0.8, 0.5], uKeyCol: [2.4, 2.6, 3.0], uKeySize: 0.3, uExpo: 1.15,
      uRimA: [1.8, 1.0, 2.6], uRimB: [1.6, 1.9, 2.2],
      uHaze: 0.03, uHazeCol: [0.04, 0.035, 0.06],
      uFly: [0, 0, 0, 0], uEnd: new Array(12).fill(0),
    },
    camera: R.camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      const pos = u.uPos.value, A = u.uPA.value, B = u.uPB.value, C = u.uPC.value;
      for (let i = 0; i < PEOPLE_N; i++) {
        if (i >= 10) { pos[i * 4 + 3] = -1; continue; }
        const s = R.person(i, t);
        pos.splice(i * 4, 4, s.x, s.z, s.yaw, s.kind);
        A.splice(i * 4, 4, ...s.pose.A); B.splice(i * 4, 4, ...s.pose.B); C.splice(i * 4, 4, ...s.pose.C);
      }
      const fl = [0, 1, 2].map((k) => R.flight(t, k));
      const settle = ease.inOut3(clamp01((t - R.tCatch) / 0.35));
      u.uFly.value = [...fl, settle];
      const E = u.uEnd.value;
      for (let k = 0; k < 3; k++) {
        // the catch point: the front of the pylon's neck, toward the thrower
        const c = R.person(k, t);
        const P0 = PYL[k];
        const dx = c.x - P0[0], dz = c.z - P0[2], l = Math.hypot(dx, dz);
        const w = pylWorld(k, 0, [(dx / l) * (PR + 0.03), PHT - 0.12, (dz / l) * (PR + 0.03)]);
        E.splice(k * 4, 4, ...w, 1);
      }
      u.uLoop.value = fl.map((f) => (f >= 1 ? 1 : 0));
      u.uFace.value = 1;
      // the glint: a hard cold point light that runs down past the steel
      const g = R.glintAt(t);
      const on = g > 0 && g < 1 ? Math.sin(g * Math.PI) : 0;
      u.uP1.value = [-2.2 + 4.4 * g, 3.6 - 2.2 * g, 1.3]; u.uP1c.value = [12 * on, 13 * on, 16 * on];
      // a warm low lamp behind the camera on the people's backs
      u.uP2.value = [0.0, 2.4, 6.0]; u.uP2c.value = [9.0, 5.6, 3.2];
    },
    post(t) { return grade(t, { exposure: 1.0 }); },
  };
};
