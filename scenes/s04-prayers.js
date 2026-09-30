// 04 · "Soft-spoke prayers / Cut like sharpened stones"
// The fan hub's white disc becomes one chrome bead, and we pull back: a voice assistant's
// waveform of polished chrome beads hangs in the wet hall, breathing soft sine waves. On "Cut" the
// beads shatter: every bead is two obsidian blades that fly at the lens and hang there, turning,
// edges lit by the tube and the sodium lamp. A beat before the cut, one blade flies into a server
// rack at the back of the hall and strikes a spray of sparks.
import { keys, ease, grade, rgb, linesFrom, spring, nextBeat } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';

const [L1, L2] = linesFrom('Soft-spoke prayers', 'Cut like sharpened stones');
const beadY = (i, u) => { const x = (i - 10) * 0.12; const env = Math.exp(-x * x * 1.1); return 1.0 + 0.2 * env * Math.sin(i * 0.55 - u * 3.2) * (0.6 + 0.4 * Math.sin(u * 1.3)); };
export const beadPosJS = (i, u) => [(i - 10) * 0.12, beadY(i, u), 0];
export const prayerTimes = (to) => { const tEnd = nextBeat(to - 1.45); return { tA: L1.words[0].start + 0.43, tCut: L2.words[0].start, tEnd, tImp: tEnd + 0.22 }; };
export const prayersCamera = (t0, to) => {
  const { tA, tCut, tEnd, tImp } = prayerTimes(to);
  return (t) => {
    const d = 0.006 * (Math.sin(t * 0.8) + 0.5 * Math.sin(t * 2.3));
    if (t < tA) {
      const k = ease.out3((t - t0) / (tA - t0));
      const y = beadY(10, t - t0);
      return { pos: [0.03 + d, y + 0.02, 0.36 - 0.06 * k], target: [0, y, 0], fov: 30, roll: 0.02 * k };
    }
    if (t < tCut) {
      const u = t - tA, k = ease.out5(u / 0.5);
      const y = -0.62 + 0.05 * u;
      const dist = 2.9 - 0.4 * k - 0.05 * u;
      return { pos: [Math.sin(y) * dist + d, 1.2 + 0.05 * u, Math.cos(y) * dist], target: [0.05, 1.0, 0], fov: 34, roll: -0.03 };
    }
    if (t >= tEnd) {
      const u = t - tEnd, v = Math.max(0, t - tImp);
      const sh = t > tImp ? Math.exp(-v * 9) * Math.sin(v * 70) * 0.015 : 0;
      return { pos: [0.62 - 0.05 * u + d, 1.3 + sh, -0.25 - 0.08 * u], target: [0.05, 1.15, -1.3], fov: 34, roll: -0.05 + sh };
    }
    const u = t - tCut;
    const sh = Math.exp(-u * 7) * Math.sin(u * 60) * 0.02;
    return { pos: [0.25 - 0.03 * u + d, 0.78 + sh, 3.3 - 0.1 * u], target: [0, 1.12, 0.6], fov: 40, roll: 0.035 + sh };
  };
};

export default (P) => {
  const t0 = P.from;
  const camera = prayersCamera(t0, P.to);
  const { tCut, tEnd, tImp } = prayerTimes(P.to);
  return {
    name: 's04-prayers', from: P.from, to: P.to,
    frag: STUDIO_GLSL + /* glsl */ `
uniform float uPh, uCut, uFly, uImp;   // uCut: seconds since the cut (negative before); uFly 0..1 the last blade's flight; uImp seconds since it struck
const float NB = 21.0, SP = 0.12;
vec3 beadPos(float i) {
  float x = (i - 10.0) * SP;
  float env = exp(-x * x * 1.1);
  return vec3(x, 1.0 + 0.2 * env * sin(i * 0.55 - uPh * 3.2) * (0.6 + 0.4 * sin(uPh * 1.3)), 0.0);
}
float beadR(float i) {
  float x = (i - 10.0) * SP;
  return 0.03 + 0.024 * exp(-x * x * 1.1) * (0.5 + 0.5 * sin(i * 0.9 - uPh * 5.0));
}
// shard j of bead i: centre, long axis, flight
void shard(float i, float j, out vec3 c, out mat3 R) {
  vec3 h = hash33(vec3(i, j, 7.0));
  vec3 dir = normalize(vec3((h.x - 0.5) * 0.5 + (j - 0.5) * 0.4, (h.y - 0.35) * 1.2, 0.6 + h.z));
  float u = max(uCut, 0.0);
  float s = (0.6 + 0.9 * h.z) * (1.0 - exp(-u * 3.2));
  c = beadPos(i) + dir * s;
  c.y += 0.04 * sin(uPh * 1.4 + i);
  // blade orientation: point along the flight, then turn slowly
  vec3 ax = normalize(dir + vec3(0, 0.2 * sin(u * 0.9 + i), 0));
  vec3 up = normalize(cross(ax, vec3(0.2 * (h.x - 0.5), 1, 0.3)));
  float sp = u * (0.6 + h.y) + h.x * 6.0;
  vec3 bz = cross(ax, up);
  vec3 by = up * cos(sp) + bz * sin(sp);
  R = mat3(ax, by, cross(ax, by));
}
float mapWave(vec3 p, out int id);
float sdBlade(vec3 q, vec3 r) { vec3 a = abs(q) / r; return (a.x + a.y + a.z - 1.0) * min(r.x, min(r.y, r.z)) * 0.8; }
float mapObj(vec3 p, out int id) {
  // two fluorescent tubes standing behind the waveform
  float tb = min(sdCapsule(p, vec3(-1.9, 0.1, -1.4), vec3(-1.9, 2.7, -1.4), 0.03), sdCapsule(p, vec3(1.9, 0.1, -1.4), vec3(1.9, 2.7, -1.4), 0.03));
  int bid;
  float ob = mapWave(p, bid);
  if (tb < ob) { id = 3; ob = tb; } else id = bid;
  // the server rack at the back of the hall
  if (uFly > 0.0) {
    float rack = sdBox(p - vec3(0, 1.0, -1.65), vec3(0.55, 1.0, 0.35));
    if (rack < ob) { id = 4; ob = rack; }
    // the last blade: flies in, buries its point in the rack face
    vec3 a = vec3(0.1, 1.05, 0.9), b = vec3(0.05, 1.15, -1.25);
    vec3 c = mix(a, b, uFly);
    vec3 ax = normalize(b - a);
    vec3 up = normalize(cross(ax, vec3(1, 0, 0)));
    mat3 R = mat3(ax, up, cross(ax, up));
    float bl = sdBlade(transpose(R) * (p - c + ax * 0.16), vec3(0.24, 0.06, 0.014));
    if (bl < ob) { id = 2; ob = bl; }
  }
  if (uImp > 0.0 && uImp < 0.7) {
    // sparks: short hot streaks thrown from the strike
    vec3 o = vec3(0.05, 1.15, -1.28);
    float sp = 1e9;
    for (int k = 0; k < 8; k++) {
      vec3 h = hash33(vec3(float(k), 3.0, 1.0)) - 0.5;
      vec3 dir = normalize(vec3(h.x * 2.0, h.y * 1.6 + 0.3, 0.6 + abs(h.z)));
      float r0 = uImp * (1.2 + h.z), r1 = max(0.0, r0 - 0.12);
      vec3 g = vec3(0, -1.5 * uImp * uImp, 0);
      sp = min(sp, sdCapsule(p, o + dir * r1 + g, o + dir * r0 + g, 0.004));
    }
    if (sp < ob) { id = 5; ob = sp; }
  }
  return ob;
}
float mapWave(vec3 p, out int id) {
  id = 1;
  float i0 = clamp(floor(p.x / SP + 10.0 + 0.5), 0.0, NB - 1.0);
  float d = 1e9;
  if (uCut < 0.0) {
    if (abs(p.y - 1.0) > 0.4 || abs(p.z) > 0.2 || abs(p.x) > 1.4) return max(max(abs(p.y - 1.0) - 0.35, abs(p.z) - 0.15), abs(p.x) - 1.35);
    for (int k = -1; k <= 1; k++) {
      float i = clamp(i0 + float(k), 0.0, NB - 1.0);
      d = min(d, length(p - beadPos(i)) - beadR(i));
    }
    return d;
  }
  id = 2;
  float grow = 0.55 + 0.45 * ease(uCut / 0.12);
  for (int k = -1; k <= 1; k++) {
    float i = clamp(i0 + float(k), 0.0, NB - 1.0);
    for (int j = 0; j < 2; j++) {
      vec3 c; mat3 R; shard(i, float(j), c, R);
      vec3 q = transpose(R) * (p - c);
      float L = (0.15 + 0.08 * hash11(i * 3.0 + float(j))) * grow;
      d = min(d, sdBlade(q, vec3(L, 0.045 * grow, 0.012)));
    }
  }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 3) { Mat m = M(vec3(0.9), 0.3, 0.0); m.emit = vec3(6.0, 6.6, 6.4); return m; }
  if (id == 1) { Mat m = CHROME(); m.rough = 0.04; return m; }
  if (id == 5) { Mat m = M(vec3(1.0), 0.5, 0.0); m.emit = vec3(9.0, 4.0, 1.2) * (1.0 - uImp / 0.7); return m; }
  if (id == 4) {
    float row = fract(p.y / 0.09);
    Mat m = M(mix(vec3(0.3, 0.3, 0.29), vec3(0.03), smoothstep(0.72, 0.78, row)), 0.45, 0.8);
    float rust = smoothstep(0.5, 0.8, fbm(p * 7.0, 3));
    m.alb = mix(m.alb, vec3(0.3, 0.11, 0.04), rust); m.metal *= 1.0 - rust;
    vec2 cell = floor(vec2(p.x / 0.07, p.y / 0.09));
    float led = step(0.8, hash12(cell)) * smoothstep(0.01, 0.004, length(vec2(fract(p.x / 0.07) - 0.5, row - 0.4) * vec2(0.07, 0.09)));
    m.emit = vec3(0.3, 1.0, 0.3) * led * 5.0;
    return dirty(m, p * 3.0, 0.7);
  }
  // obsidian: black glass, conchoidal ripples
  Mat m = M(vec3(0.015, 0.016, 0.018), 0.04 + 0.05 * vnoise(p * 140.0), 0.0);
  m.clear = 1.0;
  return m;
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`.replace('ease(uCut / 0.12)', 'smoothstep(0.0, 1.0, uCut / 0.12)'),
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('104, 118, 112', 1.0), uCycB: rgb('34, 40, 42', 1.0),
      uFloorCol: rgb('92, 96, 90', 1.0), uFloorRough: 0.08, uGrime: 0.85,
      uKeyDir: [0.2, 0.9, 0.4], uKeyCol: [3.8, 4.1, 4.2], uKeySize: 0.2,
      uRimA: [2.2, 2.4, 2.5], uRimB: [2.8, 1.25, 0.35],
      uP1: [0, 1.0, 0.6], uP1c: [0, 0, 0],
      uP2: [1.6, 1.6, 1.2], uP2c: [3.0, 1.4, 0.4],
      uHaze: 0.06, uHazeCol: [0.08, 0.1, 0.095],
      uFogFar: 24,
      uPh: 0, uCut: -1, uFly: 0, uImp: 0,
    },
    camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      u.uPh.value = t - t0;
      u.uCut.value = t < tCut ? -1 : t - tCut;
      // a green flash from the breaking waveform, gone in a third of a second
      const f = t < tCut ? 0 : Math.exp(-(t - tCut) * 9);
      u.uP1c.value = [0.6 * f * 8, 2.2 * f * 8, 0.6 * f * 8];
      u.uFly.value = t < tEnd ? 0 : Math.min(1, ease.in2((t - tEnd) / (tImp - tEnd)) + 1e-4);
      u.uImp.value = t < tImp ? 0 : t - tImp;
      if (t >= tImp) {
        const g = Math.exp(-(t - tImp) * 6);
        u.uP1.value = [0.05, 1.2, -1.15];
        u.uP1c.value = [5 * g, 2.2 * g, 0.6 * g];
      } else u.uP1.value = [0, 1.0, 0.6];
    },
    post(t) { return grade(t, { exposure: 1.05 }); },
  };
};
