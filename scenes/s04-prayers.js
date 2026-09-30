// 04 · "Soft-spoke prayers / Cut like sharpened stones"   (v2)
// A voice assistant's waveform floats in the dark: sixteen soft capsules of lavender-white light
// breathing low, gentle sine waves over a wet black floor. On "Cut" it spikes and extrudes: every
// capsule becomes two razor-thin obsidian blades (some of them glassy vector slivers with hot
// magenta edges) that slash out toward the lens and hang there turning, lit by a cold tube. On
// "stones" the blades draw back together into one jagged mass of points, a stone made of knives,
// that turns slowly in the dark.
import { ease, grade, rgb, linesFrom, spring, clamp } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';

const [L1, L2] = linesFrom('Soft-spoke prayers', 'Cut like sharpened stones');
export const NB = 16, SP = 0.14, NS = NB * 2;
const hsh = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const barX = (i) => (i - (NB - 1) / 2) * SP;
const env = (i) => { const x = barX(i); return Math.exp(-x * x * 1.3); };
export const barH = (i, u) => 0.035 + 0.13 * env(i) * Math.abs(Math.sin(i * 0.7 - u * 2.6) * (0.6 + 0.4 * Math.sin(u * 1.1 + i * 0.3)));
export const prayerTimes = () => {
  const stones = L2.words[L2.words.length - 1];
  return { tA: L1.words[0].start + 0.43, tCut: L2.words[0].start, tS: stones.start - 0.1 };
};
const norm = (a) => { const l = Math.hypot(...a) || 1; return a.map((v) => v / l); };

// shard k (bar i = k >> 1, side j = k & 1): centre, length, axis, roll at time t
export function shardState(k, t) {
  const { tCut, tS } = prayerTimes();
  const i = k >> 1, j = k & 1;
  const h = [hsh(k * 3.1 + 1), hsh(k * 5.7 + 2), hsh(k * 7.3 + 3)];
  const u = Math.max(0, t - tCut);
  const dir = norm([(h[0] - 0.5) * 0.9 + (j - 0.5) * 0.5, (h[1] - 0.4) * 1.1, 0.55 + h[2]]);
  const s = (0.5 + 1.0 * h[2]) * (1 - Math.exp(-u * 3.4));
  let c = [barX(i) + dir[0] * s, 1.0 + dir[1] * s + 0.03 * Math.sin(u * 1.4 + i), dir[2] * s];
  let ax = norm([dir[0], dir[1] + 0.2 * Math.sin(u * 0.9 + i), dir[2]]);
  let roll = u * (0.6 + h[1]) + h[0] * 6;
  // the gather: every blade points out from one centre, a stone made of knives, turning
  const g = ease.inOut3((t - tS) / 0.8);
  if (g > 0) {
    const th = Math.acos(1 - 2 * hsh(k * 11.1 + 5)), ph = k * 2.399963 + (t - tS) * 0.5;
    const d = [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)];
    const L = 0.2;
    const cc = [d[0] * L * 0.55, 1.05 + d[1] * L * 0.55, d[2] * L * 0.55];
    c = c.map((v, n) => v + (cc[n] - v) * g);
    ax = norm(ax.map((v, n) => v + (d[n] - v) * g));
    roll = roll * (1 - g) + g * (h[0] * 6);
  }
  const grow = t < tCut ? 0 : 0.55 + 0.45 * clamp((t - tCut) / 0.12, 0, 1);
  const len = (0.15 + 0.08 * hsh(k * 13.7)) * grow;
  return { c, len, ax, roll };
}
export const clusterC = [0, 1.05, 0];

export const prayersCamera = () => {
  const { tA, tCut, tS } = prayerTimes();
  const pose3 = (t) => {
    const u = t - tCut;
    const sh = Math.exp(-u * 7) * Math.sin(u * 60) * 0.02;
    return { pos: [0.25 - 0.03 * u, 0.8 + sh, 3.2 - 0.1 * u], target: [0, 1.12, 0.6], fov: 40, roll: 0.035 + sh };
  };
  const pose4 = (t) => {
    const u = t - tS, a = 0.5 + 0.12 * u;
    const dist = 1.55 - 0.04 * u;
    return { pos: [Math.sin(a) * dist, 1.25 + 0.02 * u, Math.cos(a) * dist], target: [0.0, 1.03, 0], fov: 36, roll: -0.02 };
  };
  return (t) => {
    const d = 0.006 * (Math.sin(t * 0.8) + 0.5 * Math.sin(t * 2.3));
    if (t < tA) {
      const k = ease.out3((t - (tA - 1.2)) / 1.2);
      return { pos: [0.05 + d, 1.04, 0.62 - 0.08 * k], target: [0, 1.0, 0], fov: 32, roll: 0.02 * k };
    }
    if (t < tCut) {
      const u = t - tA, k = spring(t, tA, 0.5, 0.2);
      const y = -0.5 + 0.04 * u;
      const dist = 3.0 - 0.45 * k - 0.06 * u;
      return { pos: [Math.sin(y) * dist + d, 1.15 + 0.03 * u, Math.cos(y) * dist], target: [0.05, 1.0, 0], fov: 34, roll: -0.03 };
    }
    if (t < tS) return pose3(t);
    const k = ease.inOut3((t - tS) / 0.9);
    const a = pose3(t), b = pose4(t);
    const m = (x, y) => x.map((v, n) => v + (y[n] - v) * k);
    return { pos: m(a.pos, b.pos), target: m(a.target, b.target), fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k };
  };
};

export default (P) => {
  const t0 = P.from;
  const { tCut, tS } = prayerTimes();
  return {
    name: 's04-prayers', from: P.from, to: P.to,
    frag: STUDIO_GLSL + /* glsl */ `
uniform float uPh, uCut, uGath;
uniform vec4 uSC[${NS}];   // shard centre, length
uniform vec4 uSA[${NS}];   // shard axis, roll
const float NB = ${NB.toFixed(1)}, SP = ${SP.toFixed(3)};
float barX(float i) { return (i - (NB - 1.0) * 0.5) * SP; }
float barH(float i) {
  float x = barX(i);
  float e = exp(-x * x * 1.3);
  return 0.035 + 0.13 * e * abs(sin(i * 0.7 - uPh * 2.6) * (0.6 + 0.4 * sin(uPh * 1.1 + i * 0.3)));
}
vec3 gQ; vec3 gR; float gK;
float sdBlade(vec3 q, vec3 r) { vec3 a = abs(q) / r; return (a.x + a.y + a.z - 1.0) * min(r.x, min(r.y, r.z)) * 0.8; }
mat3 shardBasis(vec3 ax, float roll) {
  vec3 up = normalize(cross(ax, normalize(vec3(0.2, 1.0, 0.3))));
  vec3 bz = cross(ax, up);
  vec3 by = up * cos(roll) + bz * sin(roll);
  return mat3(ax, by, cross(ax, by));
}
float mapObj(vec3 p, out int id) {
  id = 3;
  // two fluorescent tubes standing far behind
  float d = min(sdCapsule(p, vec3(-2.4, 0.1, -2.2), vec3(-2.4, 2.9, -2.2), 0.03), sdCapsule(p, vec3(2.4, 0.1, -2.2), vec3(2.4, 2.9, -2.2), 0.03));
  if (uCut < 0.0) {
    // the waveform: soft capsules of light
    if (abs(p.y - 1.0) < 0.35 && abs(p.z) < 0.2 && abs(p.x) < 1.3) {
      float i0 = clamp(floor(p.x / SP + (NB - 1.0) * 0.5 + 0.5), 0.0, NB - 1.0);
      for (int k = -1; k <= 1; k++) {
        float i = clamp(i0 + float(k), 0.0, NB - 1.0);
        float h = barH(i);
        float b = sdCapsule(p, vec3(barX(i), 1.0 - h, 0.0), vec3(barX(i), 1.0 + h, 0.0), 0.024);
        if (b < d) { d = b; id = 1; }
      }
    } else d = min(d, max(max(abs(p.y - 1.0) - 0.3, abs(p.z) - 0.15), abs(p.x) - 1.25));
    return d;
  }
  for (int k = 0; k < ${NS}; k++) {
    vec4 sc = uSC[k];
    float bb = length(p - sc.xyz) - sc.w - 0.02;
    if (bb > 0.03) { d = min(d, bb); continue; }
    vec4 sa = uSA[k];
    mat3 R = shardBasis(sa.xyz, sa.w);
    vec3 q = transpose(R) * (p - sc.xyz);
    vec3 r = vec3(sc.w, 0.045 * sc.w / 0.19, 0.011);
    float b = sdBlade(q, r);
    if (b < d) { d = b; id = 2; gQ = q; gR = r; gK = float(k); }
  }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 3) { Mat m = M(vec3(0.9), 0.3, 0.0); m.emit = vec3(5.0, 5.4, 6.0); return m; }
  if (id == 1) {
    // soft voice light: pale lavender glass, lit from within, brightest at the waist
    Mat m = GLASS(vec3(0.8, 0.75, 1.0));
    float i = floor(p.x / SP + (NB - 1.0) * 0.5 + 0.5);
    float h = barH(i);
    float w = 1.0 - smoothstep(0.0, h + 0.03, abs(p.y - 1.0));
    m.emit = vec3(0.75, 0.62, 1.25) * (0.5 + 1.6 * w);
    return m;
  }
  // obsidian: black glass, conchoidal ripples; every third blade a vector sliver with hot edges
  Mat m = M(vec3(0.015, 0.014, 0.02), 0.04 + 0.05 * vnoise(p * 140.0), 0.0);
  m.clear = 1.0;
  if (mod(gK, 3.0) < 0.5) {
    vec3 a = abs(gQ) / gR;
    float rim = smoothstep(0.22, 0.0, a.z);
    m.emit = vec3(2.6, 0.25, 1.3) * rim * (0.6 + 0.4 * uGath);
  }
  return m;
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('46, 32, 66', 1.0), uCycB: rgb('10, 8, 16', 1.0),
      uFloorCol: rgb('70, 64, 84', 1.0), uFloorRough: 0.06, uGrime: 0.8,
      uKeyDir: [0.2, 0.9, 0.4], uKeyCol: [3.2, 3.4, 3.8], uKeySize: 0.2,
      uRimA: [2.2, 2.4, 2.6], uRimB: [2.4, 0.3, 1.4],
      uP1: [0, 1.0, 0.6], uP1c: [0, 0, 0],
      uP2: [1.6, 1.6, 1.2], uP2c: [0.6, 1.8, 0.5],
      uHaze: 0.06, uHazeCol: [0.07, 0.05, 0.1],
      uFogFar: 24,
      uPh: 0, uCut: -1, uGath: 0,
      uSC: new Array(NS * 4).fill(0), uSA: new Array(NS * 4).fill(0),
    },
    camera: prayersCamera(),
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      u.uPh.value = t - t0;
      u.uCut.value = t < tCut ? -1 : t - tCut;
      u.uGath.value = ease.inOut3((t - tS) / 0.8);
      const sc = u.uSC.value, sa = u.uSA.value;
      for (let k = 0; k < NS; k++) {
        const s = shardState(k, t);
        sc[k * 4] = s.c[0]; sc[k * 4 + 1] = s.c[1]; sc[k * 4 + 2] = s.c[2]; sc[k * 4 + 3] = Math.max(0.001, s.len);
        sa[k * 4] = s.ax[0]; sa[k * 4 + 1] = s.ax[1]; sa[k * 4 + 2] = s.ax[2]; sa[k * 4 + 3] = s.roll;
      }
      // the soft light of the waveform, then a magenta flash as it breaks, then dark
      const soft = t < tCut ? 1 : Math.exp(-(t - tCut) * 5);
      const f = t < tCut ? 0 : Math.exp(-(t - tCut) * 9);
      u.uP1.value = [0, 1.0, 0.5];
      u.uP1c.value = [0.5 * soft + 6 * f, 0.4 * soft + 0.5 * f, 0.9 * soft + 3 * f];
      // on the stone a cold light rakes its points
      const g = u.uGath.value;
      u.uP2.value = [0.9, 1.9, 1.0];
      u.uP2c.value = [0.6 + 2.0 * g, 1.8 + 0.6 * g, 0.5 + 2.6 * g];
    },
    post(t) { return grade(t, { exposure: 1.05 }); },
  };
};
