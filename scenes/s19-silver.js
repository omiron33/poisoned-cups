// 19 · "Silver in your palms / Blood on the floor"
// The white clean-room floor and the two raised white gloves from s18, spotless under cold
// fluorescent light. Silver coins and hexagonal tokens pour from above into their upturned palms
// and heap up there and on the floor; the lyric is set in dark ink in the upper third, over the grey wall above them.
// On "Blood" the gloves' fingertips run red and the red spreads out across the white floor. One
// continuous camera move closes in and rises a little to see the red spread.
import { keys, ease, grade, rgb, orbit, linesAt } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { GLOVE_GLSL } from '/song/lib/x-gloves.js';

export const FLOOR_TEXT = { c: [0, 0.002, 2.0], ax: [1, 0, 0], ay: [0, 0, -1], hs: [1.6, 0.9] };

export default (P) => {
  const t0 = P.from;
  const [L1, L2] = linesAt(P.from - 1.0, 'Silver in your palms', 'Blood on the floor');
  const tPalms = L1.words[L1.words.length - 1].start;
  const tBlood = L2.words[0].start;
  const shot = (t, a, b, from, dur = 0.14) => {
    const k = ease.out5((t - from) / dur);
    return Object.fromEntries(Object.keys(a).map((key) => [key, Array.isArray(a[key]) ? a[key].map((v, i) => v + (b[key][i] - v) * k) : a[key] + (b[key] - a[key]) * k]));
  };
  const camera = (t) => {
    const A = { target: [0, 0.42, 0.05], yaw: 0.3, pitch: 0.1, dist: 2.7, fov: 40 };
    const B = { target: [0, 0.36, 0.1], yaw: 0.05, pitch: 0.2, dist: 2.25, fov: 40 };
    const C = { target: [0, 0.26, 0.2], yaw: -0.14, pitch: 0.4, dist: 2.1, fov: 42 };
    const s = keys(t, [[t0, A], [tPalms + 0.3, B], [P.to + 0.3, C]].map(([tt, o]) => [tt, [...o.target, o.yaw, o.pitch, o.dist, o.fov]]));
    return orbit(t, { target: s.slice(0, 3), yaw: s[3], pitch: s[4], dist: s[5], fov: s[6], drift: 0.005 });
  };
  return {
    name: 's19-silver', from: P.from, to: P.to,
    frag: STUDIO_GLSL + GLOVE_GLSL + /* glsl */ `
uniform float uRun, uPool, uPalm, uRed;
const float GS = 1.6, GT = -0.7;
const vec3 PALM = vec3(0.3, 0.3, -0.12);   // world palm centre of the right glove (mirror for left)
vec3 gloveQ(vec3 p, float side) { vec3 q = (p - vec3(side * 0.3, 0.0, 0.0)) / GS; q.yz = rot(GT) * q.yz; return q; }
const float CT = 0.85;     // one coin's cycle in the stream (s)
float sdHexPrism(vec3 p, vec2 h) {
  const vec3 k = vec3(-0.8660254, 0.5, 0.57735);
  p = abs(p);
  p.xz -= 2.0 * min(dot(k.xy, p.xz), 0.0) * k.xy;
  vec2 d = vec2(length(p.xz - vec2(clamp(p.x, -k.z * h.x, k.z * h.x), h.x)) * sign(p.z - h.x), p.y - h.y);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}
// a coin (i even) or a hexagonal token (i odd), lying in its own xz plane, with a raised rim
float piece(vec3 q, float i) {
  if (mod(i, 2.0) < 0.5) {
    float rr = length(q.xz);
    float d = sdCyl(q, 0.1, 0.008 + 0.003 * smoothstep(0.083, 0.092, rr)) - 0.003;
    return d;
  }
  return sdHexPrism(q, vec2(0.085, 0.009)) - 0.003;
}
mat3 tumble(float a, float b) {
  float ca = cos(a), sa = sin(a), cb = cos(b), sb = sin(b);
  return mat3(cb, 0, -sb, 0, 1, 0, sb, 0, cb) * mat3(1, 0, 0, 0, ca, sa, 0, -sa, ca);
}
float mapObj(vec3 p, out int id) {
  id = 1;
  float d = 1e9;
  // the stream: 8 pieces falling in a column, each on its own cycle
  vec2 rq = p.xz;
  if (length(rq) < 0.9 && p.y < 3.9) {
    for (int k = 0; k < 8; k++) {
      float i = float(k);
      float age = mod(uRun + i * CT / 8.0, CT);
      float cyc = floor((uRun + i * CT / 8.0) / CT);
      float y = 3.3 - 4.9 * age * age;
      if (y < 0.05) continue;
      vec2 h = hash22(vec2(i, cyc)) - 0.5;
      float sd = mod(i, 2.0) < 0.5 ? 1.0 : -1.0;
      if (y < PALM.y + 0.06) continue;
      vec3 c = vec3(sd * PALM.x + h.x * 0.08, y, PALM.z + h.y * 0.08);
      vec3 q = p - c;
      if (dot(q, q) > 0.04) { d = min(d, length(q) - 0.13); continue; }
      q = tumble(age * (7.0 + 5.0 * h.x) + i, age * 4.0 + i) * q;
      d = min(d, piece(q, i + cyc));
    }
  } else d = max(length(rq) - 0.45, p.y - 3.6);
  // the gloves, raised, leaning back so their palms turn up; coins lying in each palm
  for (int s = 0; s < 2; s++) {
    float side = s == 0 ? 1.0 : -1.0;
    vec3 gq = gloveQ(p, side);
    float gb = gloveBound(gq) * GS;
    float gl = gb > 0.3 ? gb : glove(gq, vec3(0.15, 0.1, 0.15), side) * GS;
    if (gl < d) { d = gl; id = 3; }
    if (uPalm > 0.0) {
      vec3 pc = p - vec3(side * PALM.x, PALM.y, PALM.z);
      if (dot(pc, pc) < 0.25) {
        for (int k = 0; k < 3; k++) {
          float i = float(k);
          if (i >= uPalm) break;
          vec2 h = hash22(vec2(i + side * 5.0, 3.0)) - 0.5;
          // lying in the palm: in the glove's frame, face along the palm normal (+z)
          vec3 q = (gq - vec3(h.x * 0.03, 0.17 + 0.025 * i, 0.04 + 0.012 * i)) * GS;
          d = min(d, piece(tumble(h.y * 0.5, h.x * 6.0) * q.xzy, i + side));
        }
      } else d = min(d, length(pc) - 0.2);
    }
  }
  // the heap that spilled: overlapping pieces lying at angles on the floor in front
  vec3 hp = p - vec3(0, 0, 0.35);
  if (length(hp - vec3(0, 0.05, 0)) < 1.0) {
    for (int k = 0; k < 10; k++) {
      float i = float(k);
      vec2 h = hash22(vec2(i * 3.1, 7.0));
      float r = 0.3 * sqrt(h.x), a = h.y * 6.2831;
      float lay = floor(i / 4.0);
      vec3 c = vec3(r * cos(a), 0.016 + lay * 0.03 + 0.05 * (1.0 - r / 0.3) * lay, r * sin(a));
      vec3 q = tumble(0.25 * (h.x - 0.5) + 0.1 * lay, a) * (p - c);
      d = min(d, piece(q, i));
    }
  } else d = min(d, length(hp - vec3(0, 0.05, 0)) - 0.62);
  // the blood: a thin glossy sheet spreading from under the heap, its edge ragged
  if (uPool > 0.001) {
    vec2 e = (p.xz - vec2(0.0, -0.3)) / vec2(2.4, 1.3);
    float R = uPool * (0.9 + 0.12 * fbm(p.xz * 2.0 + 4.0, 3) + 0.04 * sin(atan(e.y, e.x) * 7.0));
    float edge = (length(e) - R) * 1.1;
    float sheet = max(edge, abs(p.y) - 0.005) * 0.8;
    if (sheet < d) { d = sheet; id = 2; }
  }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 2) { Mat m = M(vec3(0.3, 0.008, 0.015), 0.04, 0.0); m.clear = 1.0; return m; }
  if (id == 3) {
    float side = p.x > 0.0 ? 1.0 : -1.0;
    vec3 gq = gloveQ(p, side);
    Mat m = gloveMat(gq);
    // the red runs from the fingertips down into the palm and cuff
    float th = 0.44 - uRed * 0.36;
    float run = uRed > 0.0 ? smoothstep(th - 0.015, th + 0.015, gq.y + 0.03 * (vnoise(gq.xz * 80.0) - 0.5)) : 0.0;
    m.alb = mix(m.alb, vec3(0.3, 0.01, 0.02), run); m.rough = mix(m.rough, 0.15, run); m.sheen *= 1.0 - run;
    return m;
  }
  Mat m = SILVER();
  m.alb = vec3(0.8, 0.81, 0.83);
  m.rough = 0.05 + 0.08 * vnoise(p * 140.0);
  return m;
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('190, 198, 204', 0.7), uCycB: rgb('120, 130, 138', 0.5),
      uFloorCol: rgb('226, 230, 230', 0.8), uFloorRough: 0.1, uFloorGrain: 0.5,
      uKeyDir: [-0.2, 0.95, 0.3], uKeyCol: [3.2, 3.5, 3.7], uKeySize: 0.4,
      uRimA: [2.2, 2.4, 2.6], uRimB: [2.6, 1.0, 0.3],
      uP1: [0, 2.2, 1.2], uP1c: [1.0, 1.1, 1.2],
      uGrime: 0.2, uHaze: 0.025, uHazeCol: [0.5, 0.52, 0.54],
      uRun: 0, uPool: 0, uPalm: 0, uRed: 0,
    },
    camera,
    textPlane() { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      u.uRun.value = t - t0 + 3.0;
      // the blood wells up on "Blood" and keeps spreading to the end
      const x = t - (tBlood + 0.35);
      u.uPool.value = x <= 0 ? 0 : 1 - Math.exp(-x * 0.9) * (1 + x * 0.9);
      u.uPalm.value = t < tPalms ? 0 : 3;
      u.uRed.value = Math.max(0, Math.min(1, (t - tBlood + 0.05) / 1.2));
      // the light turns colder and a touch darker as it spreads
      const k = ease.inOut3(x / 2.0);
      u.uKeyCol.value = [3.2 - 0.5 * k, 3.5 - 0.7 * k, 3.7 - 0.7 * k];
    },
    post(t) { return grade(t, { exposure: 1.0, vignette: 0.38 }); },
  };
};
