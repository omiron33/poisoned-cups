// 01 · "They say freedom's in da body, but da spirit's enslaved,"
// A heavy gold chain pours from above onto a cream lacquer floor and coils, link on link, into a
// neat pile: the thing they wear as freedom is the thing that holds them. Low camera, slow push.
import { keys, ease, grade, rgb, orbit } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';

export default (P) => {
  const t0 = P.from;
  const camera = (t) => {
    const u = t - t0;
    return orbit(t, { target: [0, 0.42, 0], yaw: 0.55 - 0.05 * u, pitch: 0.2 + 0.006 * u, dist: 3.2 - 0.06 * u, fov: 32 });
  };
  return {
    name: 'x-weapons', from: P.from, to: P.to,
    frag: STUDIO_GLSL + /* glsl */ `
uniform float uFed;      // metres of chain that have landed
const float LR = 0.075, LL = 0.05, LW = 0.022;     // link radius, half straight length, wire
const float PITCH = 2.0 * (LL + LR) - 2.2 * LW;
const float CR = 0.34;                              // coil radius
const float CH = 0.085;                             // coil rise per turn
float linkAt(vec3 p, vec3 c, vec3 tg, float parity) {
  vec3 up = vec3(0, 1, 0);
  vec3 bx = normalize(tg), by = normalize(cross(bx, abs(bx.y) > 0.95 ? vec3(1, 0, 0) : up)), bz = cross(bx, by);
  vec3 q = p - c; q = vec3(dot(q, bx), dot(q, by), dot(q, bz));
  return sdLink(parity < 0.5 ? q : q.xzy, LL, LR, LW);
}
// position and tangent of chain arc position s (s < uFed: in the coil; above: in the falling run)
void chainAt(float s, out vec3 c, out vec3 tg) {
  if (s < uFed) {
    float ph = s / CR;
    c = vec3(CR * cos(ph), LW * 1.6 + CH * ph / 6.2831, CR * sin(ph));
    tg = vec3(-sin(ph), CH / (6.2831 * CR), cos(ph));
  } else {
    float ph = uFed / CR;
    vec3 top = vec3(CR * cos(ph), LW * 1.6 + CH * ph / 6.2831, CR * sin(ph));
    float h = s - uFed;
    // the falling run bends from the coil's tangent into a straight drop
    float k = smoothstep(0.0, 0.25, h);
    c = top + vec3(-sin(ph), 0, cos(ph)) * 0.12 * (1.0 - exp(-h * 6.0)) + vec3(0, h, 0);
    tg = normalize(mix(vec3(-sin(ph), 0.3, cos(ph)), vec3(0, 1, 0), k));
  }
}
float mapObj(vec3 p, out int id) {
  id = 1;
  float d = 1e9;
  // candidates in the falling run: nearest link by height
  float ph = uFed / CR;
  float topY = LW * 1.6 + CH * ph / 6.2831;
  float sFall = uFed + max(0.0, p.y - topY);
  float iF = floor(sFall / PITCH);
  for (int k = -1; k <= 1; k++) {
    float i = iF + float(k);
    float s = i * PITCH;
    if (s < uFed - PITCH) continue;
    vec3 c, tg; chainAt(s, c, tg);
    d = min(d, linkAt(p, c, tg, mod(i, 2.0)));
  }
  // candidates in the coil: for each turn layer near p's height, the link nearest p's angle
  float a = atan(p.z, p.x); if (a < 0.0) a += 6.2831;
  float layer = floor((p.y - LW * 1.6) / CH - a / 6.2831 + 0.5);
  for (int L = -1; L <= 1; L++) {
    float phi = a + 6.2831 * (layer + float(L));
    if (phi < -0.3) continue;
    float s = phi * CR;
    if (s > uFed + PITCH) continue;
    float i0 = floor(s / PITCH + 0.5);
    for (int k = -1; k <= 1; k++) {
      float i = i0 + float(k);
      float si = i * PITCH;
      if (si < 0.0 || si > uFed) continue;
      vec3 c, tg; chainAt(si, c, tg);
      d = min(d, linkAt(p, c, tg, mod(i, 2.0)));
    }
  }
  // bound the whole thing so rays far away skip the chain quickly
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  Mat m = GOLD();
  m.rough = 0.13 + 0.08 * vnoise(p * 80.0);
  return m;
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('236, 222, 200', 0.55), uCycB: rgb('214, 196, 172', 0.42),
      uFloorCol: rgb('226, 212, 190', 0.55), uFloorRough: 0.18,
      uKeyDir: [-0.45, 0.85, 0.35], uKeyCol: [3.4, 3.2, 3.0], uKeySize: 0.4,
      uRimA: [1.8, 0.7, 0.3], uRimB: [1.2, 1.1, 1.0],
      uFed: 0,
    },
    camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      // the chain falls at a steady 0.9 m/s from the scene's start, landing and coiling
      u.uFed.value = Math.max(0, 0.9 * (t - t0 + 1.2));
    },
    post(t) { return grade(t, { exposure: 1.0 }); },
  };
};
