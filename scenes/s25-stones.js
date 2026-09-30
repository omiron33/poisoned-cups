// 25 · "The stones will speak My will" (the climax, held to 150 s)
// Back in the dark wet data hall of s24: the three rigid steel vipers stand coiled, and round them
// lie six rough chunks of the fallen empire's broken concrete, fracture faces raw. Each chunk rises
// on its word; the word is cut into its face and burns white-hot from inside: light breaks out of the
// fractures round it, scorches the face, and throws warm-white light over the steel and the haze.
// The stones speak instead of the vipers. A camera snap on "My". On the held "will" every stone
// blazes and rises, and the light floods upward (s26 pours it into the chalice).
import { grade, rgb, orbit, linesFrom, spring, clamp01, ease, mix } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { VIPER_GLSL } from '/song/lib/x-viper.js';

const [L] = linesFrom('The stones will speak');
// stone rest positions (x, z) in an arc in front of the vipers
const XZ = [[-1.1, 0.55], [-0.66, 0.72], [-0.22, 0.8], [0.22, 0.8], [0.66, 0.72], [1.1, 0.55]];

export function rig(P) {
  const t0 = P.from;
  const ws = L.words;               // The stones will speak My will
  const tMy = ws[4].start, tWill = ws[5].start;
  const rise = (t) => ease.inOut3((t - (tWill + 0.5)) / (P.to - tWill - 0.5));
  const camera = (t) => {
    const u = t - t0;
    const snap = ease.out5((t - tMy) / 0.22);
    const up = rise(t);
    return orbit(t, {
      target: mix(mix([0.0, 0.45, 0.2], [0.05, 0.55, 0.3], snap), [0.1, 1.05, 0.3], up),
      yaw: mix(-0.3 + 0.04 * u, 0.02 + 0.03 * u, snap),
      pitch: mix(mix(0.2, 0.1, snap), -0.02, up),
      dist: mix(3.6 - 0.1 * u, 3.5 - 0.08 * u, snap) + 0.4 * up,
      fov: 36, drift: 0.005,
    });
  };
  const lift = (t, i) => {
    const w = ws[i];
    const s = spring(t, w.start - 0.1, 0.5, 0.25);
    return 0.32 * s + 0.08 * clamp01((t - w.start) / 3) + 0.75 * ease.in2(rise(t)) * (1 + 0.05 * Math.sin(i * 1.7));
  };
  const glow = (t, i) => {
    const w = ws[i];
    if (t < w.start - 0.03) return 0;
    const u = t - w.start;
    return 0.8 + 1.4 * Math.exp(-u * 4) + 1.2 * clamp01((t - tWill) / 2.0) + 1.5 * rise(t);
  };
  const pos = (t, i) => [XZ[i][0], 0.17 + lift(t, i), XZ[i][1]];
  return { camera, lift, glow, rise, pos, tWill, ws };
}

export default (P) => {
  const { camera, glow, rise, pos, ws } = rig(P);
  return {
    name: 's25-stones', from: P.from, to: P.to,
    frag: STUDIO_GLSL + VIPER_GLSL + /* glsl */ `
uniform vec3 uSC[6];
uniform float uGlow[6];
vec3 stoneQ(vec3 p, int i) {
  float fi = float(i);
  vec3 q = p - uSC[i];
  // face turned toward the camera's side of the arc, a slight tilt
  q.xz *= rot(-0.35 * (fi - 2.5) / 2.5 + 0.12 * (hash11(fi + 2.0) - 0.5));
  q.xy *= rot(0.12 * (hash11(fi + 4.0) - 0.5));
  return q;
}
// a rough chunk of broken concrete: a block with raw, noisy fracture faces at the back and sides
float stone(vec3 q, float fi) {
  vec3 b = vec3(0.2, 0.15, 0.13) + vec3(0.03, 0.03, 0.03) * vec3(hash11(fi + 1.0), hash11(fi + 3.0), hash11(fi + 5.0));
  float d = sdRoundBox(q, b, 0.012);
  float fr = 0.035 * fbm(q * 9.0 + fi * 3.1, 3);
  for (int k = 0; k < 4; k++) {
    vec3 nn = hash33(vec3(fi, float(k), 7.0)) - 0.5;
    nn.z = -abs(nn.z) - 0.15;                    // fractures on the back and sides; the face stays
    nn = normalize(nn);
    d = max(d, dot(q, nn) - 0.07 - 0.07 * hash11(fi * 3.0 + float(k)) + fr);
  }
  // a chipped top edge on the face
  d = max(d, dot(q, normalize(vec3(0.3 * (hash11(fi + 8.0) - 0.5), 1.0, 0.8))) - b.y * 0.95 + fr * 0.6);
  return d + 0.005 * (vnoise(q * 40.0) - 0.5);
}
float mapObj(vec3 p, out int id) {
  id = 3;
  float d = 1e9;
  for (int i = 0; i < 6; i++) {
    float bs = length(p - uSC[i]) - 0.34;
    if (bs > 0.04) { if (bs < d) { d = bs; id = 10 + i; } continue; }
    float s = stone(stoneQ(p, i), float(i));
    if (s < d) { d = s; id = 10 + i; }
  }
  // back row of racks, far behind in the hall
  float rk = sdRacks(p, -2.6, 0.64, 2.0, 0.04, 4.0);
  if (rk < d) { d = rk; id = 6; }
  float b = length(p - vec3(0.0, 0.6, -0.4)) - 1.4;
  if (b > 0.25) return min(d, b);
  // the three rigid vipers exactly as s24 leaves them
  gVipFlick = 0.8;
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    float R = 0.075;
    vec3 base = vec3(-0.75 + 0.75 * fk, 0.0, -0.25 - 0.3 * abs(fk - 1.0));
    vec3 q = p - base;
    float turns = 1.6;
    float cb = coilBody(q, R, turns);
    if (cb < d) { d = cb; id = 1; keepViper(); }
    float phiMax = 6.2831853 * turns, rs = R * (0.9 + 2.15 * turns);
    vec3 e = vec3(rs * cos(phiMax), 0.0, rs * sin(phiMax));
    vec3 nq = q - e;
    vec3 lq = vec3(nq.y + R * 0.3, nq.z, nq.x);
    gVipTail = 1.0;
    float v = sdViper(lq, 0.75 + 0.1 * fk, R, 0.1, 5.5, 0.8 + fk * 1.9, 0.55, 3.0, vec3(1, 0, 0));
    gVipTail = 0.16;
    if (v < d) { d = v; id = 1; keepViper(); }
  }
  gVipFlick = -1.0;
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 1) { Mat m = viperMat(1.0); m.alb *= 0.8; return dirty(m, p, 0.25); }
  if (id == 6) return rackMat(p, n, -2.6, uTime);
  int i = id - 10;
  float fi = float(i);
  vec3 q = stoneQ(p, i);
  float g = 0.0;
  for (int k = 0; k < 6; k++) if (k == i) g = uGlow[k];
  // raw concrete, aggregate flecks, grime
  float agg = smoothstep(0.62, 0.7, vnoise(q * 60.0));
  Mat m = M(vec3(0.33, 0.32, 0.3) * (0.7 + 0.45 * fbm(q * 14.0, 3)) + agg * 0.12, 0.88, 0.0);
  m = dirty(m, p + fi, 0.7);
  // the cut: on the face, a scorched plate where the word is burned in (the crisp word sits on it
  // in the lyric layer), and white-hot light breaking out through fractures radiating from it
  float face = smoothstep(0.09, 0.12, q.z);
  vec2 f = q.xy;
  // an irregular scorched patch where the word is burned in (no frame: charred, ragged edges)
  float pr = length(f * vec2(0.85, 2.1)) + 0.05 * (fbm(f * 18.0 + fi, 3) - 0.5);
  float plate = smoothstep(0.17, 0.12, pr) * face;
  // light breaking out through fractures that radiate from the word, reaching further as it burns
  float e = voronoiEdge(f * vec2(6.0, 8.0) + fi * 5.0).x;
  float gate = vnoise(f * 5.0 + fi * 9.0);
  float reach = 0.12 + 0.1 * g;
  float crack = smoothstep(0.045, 0.01, e) * smoothstep(reach + 0.06, reach - 0.04, pr - 0.1 + 0.08 * gate) * step(0.3, gate + 0.35 * smoothstep(0.25, 0.1, pr));
  float rim = smoothstep(0.03, 0.0, abs(pr - 0.155)) * face * (0.4 + 0.6 * vnoise(f * 30.0));
  m.alb = mix(m.alb, vec3(0.02, 0.018, 0.016), plate * sat(g));
  vec3 hot = vec3(3.4, 3.1, 2.6);
  m.emit = hot * g * (crack * (0.35 + 0.65 * face) + rim * 0.9) + hot * 0.05 * g * plate;
  return m;
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('66, 84, 86', 1.6), uCycB: rgb('18, 24, 28', 1.2),
      uFloorCol: rgb('100, 104, 100', 0.85), uFloorRough: 0.1, uGrime: 0.9,
      uKeyDir: [-0.5, 0.75, 0.45], uKeyCol: [2.2, 2.5, 2.7], uKeySize: 0.3, uExpo: 1.1,
      uRimA: [1.8, 2.0, 2.2], uRimB: [2.2, 1.1, 0.4],
      uHaze: 0.04, uHazeCol: [0.04, 0.05, 0.055],
      uSC: new Array(18).fill(0),
      uGlow: [0, 0, 0, 0, 0, 0],
    },
    camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      const C = [0, 1, 2, 3, 4, 5].map((i) => pos(t, i));
      const G = [0, 1, 2, 3, 4, 5].map((i) => glow(t, i));
      u.uSC.value = C.flat(); u.uGlow.value = G;
      // the burning faces light the steel and the haze: one light at the lit stones' centre of
      // mass, one at the newest word's stone
      const gs = G.reduce((a, b) => a + b, 0);
      const cm = gs > 0 ? [0, 1, 2].map((k) => C.reduce((a, c, i) => a + c[k] * G[i], 0) / gs) : [0, 0.4, 0.6];
      u.uP1.value = [cm[0], cm[1] + 0.1, cm[2] + 0.25];
      u.uP1c.value = [2.6, 2.4, 2.1].map((c) => c * gs * 0.22);
      let last = 0; ws.forEach((w, i) => { if (t >= w.start) last = i; });
      u.uP2.value = [C[last][0], C[last][1], C[last][2] + 0.3];
      u.uP2c.value = [2.6, 2.4, 2.1].map((c) => c * G[last] * 0.35);
      const r = rise(t);
      u.uHaze.value = 0.04 + 0.04 * r;
      u.uHazeCol.value = [0.04, 0.05, 0.055].map((c, k) => c + [0.08, 0.072, 0.06][k] * (gs / 14 + 0.7 * r));
      u.uCycB.value = mix(rgb('18, 24, 28', 1.2), rgb('226, 214, 192', 0.32), ease.inOut3(r));
    },
    post(t) { return grade(t, { exposure: 1.0, bloom: 0.1, threshold: 1.1 }); },
  };
};
